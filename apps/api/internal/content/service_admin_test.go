package content_test

import (
	"os"
	"testing"

	"github.com/google/uuid"
	"moringalab/api/db/seeds"
	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
)

func TestArticleWorkflowAndMedicalClaimScan(t *testing.T) {
	svc := content.NewService()

	// 1. Forbidden Medical Claim Scan
	if !content.ScanForbiddenMedicalClaims("این قطره درمان قطعی تمام بیماری‌هاست") {
		t.Fatal("expected ScanForbiddenMedicalClaims to flag 'درمان قطعی'")
	}
	if content.ScanForbiddenMedicalClaims("مورینگا گیاهی با عطر مطبوع و کاربرد عمومی است") {
		t.Fatal("expected ScanForbiddenMedicalClaims to pass clean educational text")
	}

	// 2. Create Article with Forbidden Claim
	art, err := svc.CreateArticle(&content.Article{
		TitleFA:   "روش درمان قطعی با گیاه مورینگا",
		Slug:      "forbidden-claim-test",
		SummaryFA: "خلاصه مقاله آزمایشی با ادعای غیرمجاز درمانی",
		ContentFA: "متن مقاله شامل ادعای غیرمجاز درمان قطعی بیماری است.",
	})
	if err != nil {
		t.Fatalf("unexpected error creating article: %v", err)
	}

	if !art.ForbiddenClaimFlagged {
		t.Fatal("expected article ForbiddenClaimFlagged to be true")
	}

	// Try publishing article with forbidden claim -> Should return ErrForbiddenClaim
	_, err = svc.PublishArticle(art.ID)
	if err == nil || err.Error() != content.ErrForbiddenClaim.Error() {
		t.Fatalf("expected ErrForbiddenClaim on publish, got %v", err)
	}
}

func TestArticleRevisionHistoryAndRestore(t *testing.T) {
	svc := content.NewService()

	art, err := svc.CreateArticle(&content.Article{
		TitleFA:   "عنوان نسخه ۱",
		Slug:      "revision-test-slug",
		SummaryFA: "خلاصه نسخه ۱",
		ContentFA: "متن اصلی مقاله در نسخه ۱",
	})
	if err != nil {
		t.Fatalf("failed to create article: %v", err)
	}

	// Update Article -> Version 2
	art.TitleFA = "عنوان نسخه ۲"
	art.ContentFA = "متن اصلاح‌شده مقاله در نسخه ۲"
	updated, err := svc.UpdateArticle(art)
	if err != nil {
		t.Fatalf("failed updating article: %v", err)
	}
	if updated.Version != 2 {
		t.Fatalf("expected version 2 after update, got %d", updated.Version)
	}

	// Verify revision history has 2 entries
	revs, err := svc.ListArticleRevisions(art.ID)
	if err != nil {
		t.Fatalf("failed listing revisions: %v", err)
	}
	if len(revs) != 2 {
		t.Fatalf("expected 2 revisions, got %d", len(revs))
	}

	// Restore Version 1
	v1RevID := revs[0].ID
	restored, err := svc.RestoreArticleRevision(art.ID, v1RevID)
	if err != nil {
		t.Fatalf("failed restoring revision: %v", err)
	}
	if restored.TitleFA != "عنوان نسخه ۱" {
		t.Fatalf("expected restored title 'عنوان نسخه ۱', got '%s'", restored.TitleFA)
	}
}

func TestSeedDemoArticlesIdempotencyAndProductionGuard(t *testing.T) {
	// 1. Production Guard Test
	t.Run("Production Guard Aborts Article Seeding", func(t *testing.T) {
		os.Setenv("APP_ENV", "production")
		defer os.Unsetenv("APP_ENV")

		catSvc := catalog.NewService()
		contentSvc := content.NewService()
		err := seeds.PopulateSeedData(catSvc, contentSvc)
		if err == nil {
			t.Fatal("expected seed runner to fail in production, but it passed")
		}
	})

	// 2. Idempotent Article Seeding Test
	t.Run("Idempotency Execution Yields Exactly 10 Published Articles", func(t *testing.T) {
		os.Setenv("APP_ENV", "development")
		defer os.Unsetenv("APP_ENV")

		catSvc := catalog.NewService()
		contentSvc := content.NewService()

		// Run 1
		if err := seeds.PopulateSeedData(catSvc, contentSvc); err != nil {
			t.Fatalf("first seed run failed: %v", err)
		}

		articles := contentSvc.ListArticles()
		if len(articles) != 10 {
			t.Fatalf("expected 10 published seed articles on 1st run, got %d", len(articles))
		}

		// Verify every seed article has required fields
		for _, a := range articles {
			if a.Status != content.StatusPublished {
				t.Fatalf("article %s should be published, got %s", a.Slug, a.Status)
			}
			if a.DisclaimersFA == "" {
				t.Fatalf("article %s must have health disclaimer text", a.Slug)
			}
			if len(a.ContentFA) < 200 {
				t.Fatalf("article %s content is too short: %d chars", a.Slug, len(a.ContentFA))
			}
		}

		// Run 2 (Re-seed)
		if err := seeds.PopulateSeedData(catSvc, contentSvc); err != nil {
			t.Fatalf("second seed run failed: %v", err)
		}

		articles2 := contentSvc.ListArticles()
		if len(articles2) != 10 {
			t.Fatalf("re-seeding produced duplicates! expected 10 articles, got %d", len(articles2))
		}
	})
}
