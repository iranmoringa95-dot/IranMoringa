package content

import (
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"moringalab/api/db/seeds"
)

func setupTestContentService(t *testing.T) *Service {
	t.Helper()
	return NewService()
}

// ─── Test 1: Forbidden Medical Claims Scanner ─────────────────────────────────

func TestForbiddenMedicalClaimsScanner(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"این گیاه داروی درمان قطعی دیابت است", true},
		{"خواص آنتی‌اکسیدانی و تقویت سیستم ایمنی", false},
		{"علاج قطعی تمام بیماری‌های پوستی", true},
		{"پیشگیری قطعی از ابتلا به زکام", true},
		{"مصرف مورینگا به بهبود هضم کمک می‌کند", false},
	}

	for _, tc := range tests {
		actual := ScanForbiddenMedicalClaims(tc.input)
		if actual != tc.expected {
			t.Errorf("input '%s': expected flagged=%v, got %v", tc.input, tc.expected, actual)
		}
	}
}

// ─── Test 2 & 3 & 4 & 5: Publication Gate Verification ───────────────────────

func TestPublicationGateRequiresApprovedStatus(t *testing.T) {
	svc := setupTestContentService(t)

	// 1. Create Draft Article
	art, err := svc.CreateArticle(&Article{
		TitleFA:   "مقاله تست ۱",
		Slug:      "test-article-1",
		SummaryFA: "خلاصه تست",
		ContentFA: "متن مقاله تست",
	})
	if err != nil {
		t.Fatalf("CreateArticle failed: %v", err)
	}

	// Direct Publish from Draft -> MUST Fail with ErrUnapprovedPublish
	_, err = svc.PublishArticle(art.ID)
	if err != ErrUnapprovedPublish {
		t.Errorf("expected ErrUnapprovedPublish, got %v", err)
	}
}

func TestPublicationGateRequiresMedicalReviewerAndSources(t *testing.T) {
	svc := setupTestContentService(t)

	// Create Draft Article
	art, _ := svc.CreateArticle(&Article{
		TitleFA:   "مقاله تست ۲",
		Slug:      "test-article-2",
		SummaryFA: "خلاصه تست",
		ContentFA: "متن مقاله تست",
	})

	// Move to InReview -> Approve (without Reviewer ID or Sources set)
	_, _ = svc.SubmitForReview(art.ID)

	// Approve manually without reviewer ID or sources
	svc.mu.Lock()
	art.Status = StatusApproved
	svc.mu.Unlock()

	// Gate 2 Check: Missing Reviewer
	_, err := svc.PublishArticle(art.ID)
	if err != ErrMissingReviewer {
		t.Errorf("expected ErrMissingReviewer, got %v", err)
	}

	// Set Reviewer
	rID := uuid.New()
	art.ReviewerID = &rID

	// Gate 3 Check: Missing Scientific Sources
	_, err = svc.PublishArticle(art.ID)
	if err != ErrMissingSources {
		t.Errorf("expected ErrMissingSources, got %v", err)
	}

	// Add Source
	art.Sources = []ScientificSource{
		{ID: uuid.New(), Title: "Nature Article", Year: 2024},
	}

	// Now Publish MUST Succeed!
	published, err := svc.PublishArticle(art.ID)
	if err != nil {
		t.Fatalf("PublishArticle failed: %v", err)
	}
	if published.Status != StatusPublished {
		t.Errorf("expected status published, got %s", published.Status)
	}
}

func TestPublicationGateBlocksForbiddenClaim(t *testing.T) {
	svc := setupTestContentService(t)

	// Article containing forbidden claim "درمان قطعی"
	art, _ := svc.CreateArticle(&Article{
		TitleFA:   "درمان قطعی سرطان با گیاه مورینگا",
		Slug:      "test-forbidden-claim",
		SummaryFA: "ادعای غیرمجاز",
		ContentFA: "متن شامل درمان قطعی",
		Sources: []ScientificSource{
			{ID: uuid.New(), Title: "Source 1"},
		},
	})

	if !art.ForbiddenClaimFlagged {
		t.Error("expected ForbiddenClaimFlagged to be true")
	}

	rID := uuid.New()
	_, _ = svc.ReviewArticle(art.ID, rID, "دکتر تاییدکننده", true, "")

	// Publish MUST Fail with ErrForbiddenClaim
	_, err := svc.PublishArticle(art.ID)
	if err != ErrForbiddenClaim {
		t.Errorf("expected ErrForbiddenClaim, got %v", err)
	}
}

// ─── Test 6: Editorial Workflow Transitions ──────────────────────────────────

func TestEditorialWorkflowStateTransitions(t *testing.T) {
	svc := setupTestContentService(t)

	// Draft
	art, _ := svc.CreateArticle(&Article{TitleFA: "تست روال", Slug: "workflow-test"})
	if art.Status != StatusDraft {
		t.Errorf("expected status draft, got %s", art.Status)
	}

	// Submit for review -> InReview
	inReview, err := svc.SubmitForReview(art.ID)
	if err != nil || inReview.Status != StatusInReview {
		t.Fatalf("SubmitForReview failed: %v", err)
	}

	// Review (Reject) -> ChangesRequested
	rID := uuid.New()
	rejected, err := svc.ReviewArticle(art.ID, rID, "دکتر علی", false, "اصلاح منابع")
	if err != nil || rejected.Status != StatusChangesRequested {
		t.Fatalf("ReviewArticle reject failed: %v", err)
	}

	// Resubmit -> InReview -> Approve
	_, _ = svc.SubmitForReview(art.ID)
	approved, err := svc.ReviewArticle(art.ID, rID, "دکتر علی", true, "")
	if err != nil || approved.Status != StatusApproved {
		t.Fatalf("ReviewArticle approve failed: %v", err)
	}
}

// ─── Test 7 & 8: Revision Snapshots and Restore ─────────────────────────────

func TestRevisionHistoryCreationOnUpdateAndRestore(t *testing.T) {
	svc := setupTestContentService(t)

	art, _ := svc.CreateArticle(&Article{
		TitleFA:   "عنوان نسخه ۱",
		Slug:      "revision-test",
		ContentFA: "متن نسخه ۱",
	})

	// Update to v2
	art.TitleFA = "عنوان نسخه ۲"
	art.ContentFA = "متن نسخه ۲"
	updated, err := svc.UpdateArticle(art)
	if err != nil {
		t.Fatalf("UpdateArticle failed: %v", err)
	}
	if updated.Version != 2 {
		t.Errorf("expected version 2, got %d", updated.Version)
	}

	// Check revisions history
	revs, err := svc.ListArticleRevisions(art.ID)
	if err != nil || len(revs) != 2 {
		t.Fatalf("expected 2 revisions, got %d (err: %v)", len(revs), err)
	}

	// Restore v1
	v1RevisionID := revs[0].ID
	restored, err := svc.RestoreArticleRevision(art.ID, v1RevisionID)
	if err != nil {
		t.Fatalf("RestoreArticleRevision failed: %v", err)
	}

	if restored.TitleFA != "عنوان نسخه ۱" {
		t.Errorf("expected title 'عنوان نسخه ۱', got '%s'", restored.TitleFA)
	}
	if restored.Version != 3 {
		t.Errorf("expected version bumped to 3 after restore, got %d", restored.Version)
	}
}

// ─── Test 9: Public Query Only Returns Published ──────────────────────────────

func TestPublicArticleQueryOnlyReturnsPublished(t *testing.T) {
	svc := setupTestContentService(t)

	// Create unpublished draft
	draft, _ := svc.CreateArticle(&Article{TitleFA: "پیش‌نویس", Slug: "draft-article"})

	// Public query by slug MUST fail
	_, err := svc.GetArticleBySlug(draft.Slug)
	if err != ErrArticleNotFound {
		t.Errorf("expected ErrArticleNotFound for draft article, got %v", err)
	}

	// Public article list MUST exclude draft
	pubList := svc.ListArticles()
	for _, a := range pubList {
		if a.ID == draft.ID {
			t.Error("expected public article list to exclude draft article")
		}
	}
}

// ─── Test 10: FAQ Management ──────────────────────────────────────────────────

func TestFAQManagement(t *testing.T) {
	svc := setupTestContentService(t)

	faqID := uuid.New()
	svc.AddFAQ(&FAQ{
		ID:          faqID,
		ContextType: "general",
		QuestionFA:  "ساعات پاسخگویی پشتیبانی چه زمانی است؟",
		AnswerFA:    "از شنبه تا چهارشنبه ۹ تا ۱۷.",
		SortOrder:   2,
	})

	faqs := svc.ListFAQs()
	found := false
	for _, f := range faqs {
		if f.ID == faqID {
			found = true
			if !strings.Contains(f.QuestionFA, "پاسخگویی") {
				t.Errorf("unexpected question text: %s", f.QuestionFA)
			}
		}
	}
	if !found {
		t.Error("expected FAQ to be present in ListFAQs")
	}
}

// ─── Test 11: Demo Articles Seed Idempotency & Production Guard ─────────────

func TestSeedDemoArticlesIdempotencyAndProductionGuard(t *testing.T) {
	svc := setupTestContentService(t)

	// Test 1: Production Guard
	t.Setenv("APP_ENV", "production")
	err := seeds.PopulateDemoArticlesSeed(svc)
	if err == nil || !strings.Contains(err.Error(), "strictly prohibited in production") {
		t.Fatalf("expected production guard error, got: %v", err)
	}

	// Test 2: Development Seeding (1st run)
	t.Setenv("APP_ENV", "development")
	err = seeds.PopulateDemoArticlesSeed(svc)
	if err != nil {
		t.Fatalf("PopulateDemoArticlesSeed failed on 1st run: %v", err)
	}

	publishedArticles := svc.ListArticles()
	if len(publishedArticles) != 10 {
		t.Fatalf("expected exactly 10 published demo articles on 1st run, got %d", len(publishedArticles))
	}

	// Verify required article slugs
	expectedSlugs := []string{
		"what-is-moringa",
		"moringa-powder-vs-dried-leaves",
		"how-to-store-moringa-powder",
		"how-to-prepare-moringa-tea",
		"moringa-buying-guide",
		"moringa-seeds-guide",
		"moringa-oil-storage-guide",
		"read-moringa-product-labels",
		"net-weight-vs-shipping-weight",
		"moringa-order-faq",
	}

	for _, slug := range expectedSlugs {
		art, err := svc.GetArticleBySlug(slug)
		if err != nil {
			t.Errorf("expected seed article slug '%s' to exist and be published", slug)
			continue
		}
		if art.Status != StatusPublished {
			t.Errorf("article '%s' status expected published, got %s", slug, art.Status)
		}
		if art.TitleFA == "" || art.SummaryFA == "" || art.ContentFA == "" {
			t.Errorf("article '%s' missing required Persian fields", slug)
		}
	}

	// Test 3: Idempotency (2nd run)
	err = seeds.PopulateDemoArticlesSeed(svc)
	if err != nil {
		t.Fatalf("PopulateDemoArticlesSeed failed on 2nd run: %v", err)
	}

	pubAfter2ndRun := svc.ListArticles()
	if len(pubAfter2ndRun) != 10 {
		t.Fatalf("expected exactly 10 published demo articles on 2nd run, got %d", len(pubAfter2ndRun))
	}
}
