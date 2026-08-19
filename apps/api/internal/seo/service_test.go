package seo

import (
	"strings"
	"testing"

	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
	"moringalab/api/internal/reviews"
)

func setupTestSEOService(t *testing.T) *Service {
	t.Helper()
	return NewService("https://moringalab.ir", nil, nil, nil)
}

// ─── Test 1: Canonical Base URL Resolution ───────────────────────────────────

func TestCanonicalBaseURLResolution(t *testing.T) {
	svc := setupTestSEOService(t)
	if svc.GetCanonicalBase() != "https://moringalab.ir" {
		t.Errorf("expected canonical base 'https://moringalab.ir', got '%s'", svc.GetCanonicalBase())
	}
}

// ─── Test 2: Redirect Loop Guard ─────────────────────────────────────────────

func TestAddRedirectRuleLoopGuard(t *testing.T) {
	svc := setupTestSEOService(t)

	// Attempting to redirect /shop/product-a to /shop/product-a -> MUST fail
	_, err := svc.AddRedirectRule(&RedirectRule{
		SourcePath: "/shop/product-a",
		TargetURL:  "/shop/product-a",
	})

	if err != ErrRedirectLoop {
		t.Errorf("expected ErrRedirectLoop, got %v", err)
	}
}

// ─── Test 3: Redirect Chain Resolution ───────────────────────────────────────

func TestAddRedirectRuleChainResolution(t *testing.T) {
	svc := setupTestSEOService(t)

	// Rule 1: /old-page -> /middle-page
	_, _ = svc.AddRedirectRule(&RedirectRule{
		SourcePath: "/middle-page",
		TargetURL:  "/final-page",
	})

	// Rule 2: /start-page -> /middle-page (which redirects to /final-page)
	rule2, err := svc.AddRedirectRule(&RedirectRule{
		SourcePath: "/start-page",
		TargetURL:  "/middle-page",
	})
	if err != nil {
		t.Fatalf("AddRedirectRule failed: %v", err)
	}

	// Chain Guard MUST resolve target directly to /final-page
	if rule2.TargetURL != "/final-page" {
		t.Errorf("expected target resolved to '/final-page', got '%s'", rule2.TargetURL)
	}
}

// ─── Test 4: Match Redirect Increments Hit Counter ───────────────────────────

func TestMatchRedirectIncrementsHitCounter(t *testing.T) {
	svc := setupTestSEOService(t)

	rule, _ := svc.AddRedirectRule(&RedirectRule{
		SourcePath: "/legacy-url",
		TargetURL:  "/new-url",
	})

	if rule.HitCount != 0 {
		t.Errorf("expected initial hit count 0, got %d", rule.HitCount)
	}

	matched, found := svc.MatchRedirect("/legacy-url")
	if !found {
		t.Fatalf("expected redirect rule to be matched")
	}

	if matched.HitCount != 1 {
		t.Errorf("expected hit count 1 after match, got %d", matched.HitCount)
	}
	if matched.LastHitAt == nil {
		t.Error("expected LastHitAt timestamp to be set")
	}
}

// ─── Test 5: 404 Event Recorder ──────────────────────────────────────────────

func TestRecord404Event(t *testing.T) {
	svc := setupTestSEOService(t)

	svc.Record404Event("/non-existent-page")
	svc.Record404Event("/non-existent-page")

	events := svc.List404Events()
	if len(events) != 1 {
		t.Fatalf("expected 1 unique 404 event, got %d", len(events))
	}
	if events[0].HitCount != 2 {
		t.Errorf("expected hit count 2 for repeated 404, got %d", events[0].HitCount)
	}
}

// ─── Test 6: Dynamic XML Sitemap Generator Format ───────────────────────────

func TestGenerateSitemapXMLFormatAndExclusions(t *testing.T) {
	svc := setupTestSEOService(t)

	xmlBytes, err := svc.GenerateSitemapXML()
	if err != nil {
		t.Fatalf("GenerateSitemapXML failed: %v", err)
	}

	xmlStr := string(xmlBytes)

	if !strings.Contains(xmlStr, "<urlset") {
		t.Error("expected sitemap XML to contain <urlset")
	}
	if !strings.Contains(xmlStr, "https://moringalab.ir/") {
		t.Error("expected sitemap XML to contain homepage URL")
	}
	if !strings.Contains(xmlStr, "https://moringalab.ir/shop") {
		t.Error("expected sitemap XML to contain shop URL")
	}
}

// ─── Test 7: Dynamic Robots.txt Generator ────────────────────────────────────

func TestGenerateRobotsTxt(t *testing.T) {
	svc := setupTestSEOService(t)

	robots := svc.GenerateRobotsTxt()

	if !strings.Contains(robots, "User-agent: *") {
		t.Error("expected robots.txt to contain User-agent: *")
	}
	if !strings.Contains(robots, "Disallow: /admin/") {
		t.Error("expected robots.txt to disallow /admin/")
	}
	if !strings.Contains(robots, "Sitemap: https://moringalab.ir/sitemap.xml") {
		t.Error("expected robots.txt to reference sitemap.xml")
	}
}

// ─── Test 8 & 9: JSON-LD Product Schema Builder ──────────────────────────────

func TestBuildProductJSONLDWithAndWithoutApprovedReviews(t *testing.T) {
	svc := setupTestSEOService(t)

	prod := &catalog.Product{
		ID:            uuid.New(),
		Slug:          "moringa-powder-100g",
		NameFA:        "پودر خالص مورینگا",
		DescriptionFA: "توضیحات پودر ارگانیک",
		SKU:           "MOR-POW-100",
		PriceIRR:      1500000,
	}

	// 1. Without reviews
	schemaNoReviews := svc.BuildProductJSONLD(prod, nil)
	if _, exists := schemaNoReviews["aggregateRating"]; exists {
		t.Error("expected aggregateRating to be omitted when review summary is nil")
	}

	// 2. With approved reviews
	summary := &reviews.ProductReviewSummary{
		AverageRating: 4.8,
		TotalReviews:  15,
	}
	schemaWithReviews := svc.BuildProductJSONLD(prod, summary)
	if agg, exists := schemaWithReviews["aggregateRating"]; !exists {
		t.Error("expected aggregateRating to be present when approved reviews exist")
	} else {
		ratingMap := agg.(map[string]interface{})
		if ratingMap["ratingValue"] != "4.8" || ratingMap["reviewCount"] != 15 {
			t.Errorf("unexpected aggregate rating values: %+v", ratingMap)
		}
	}
}

// ─── Test 10: JSON-LD Article Schema Builder ─────────────────────────────────

func TestBuildArticleJSONLDSchema(t *testing.T) {
	svc := setupTestSEOService(t)

	reviewerName := "دکتر حسینی"
	art := &content.Article{
		Slug:           "moringa-health-benefits",
		TitleFA:        "خواص دارویی مورینگا",
		SummaryFA:      "بررسی خواص مورینگا",
		AuthorNameFA:   "تحریریه سبزینه",
		ReviewerNameFA: &reviewerName,
	}

	schema := svc.BuildArticleJSONLD(art)

	if schema["headline"] != "خواص دارویی مورینگا" {
		t.Errorf("expected headline 'خواص دارویی مورینگا', got '%v'", schema["headline"])
	}
	if authorMap, ok := schema["author"].(map[string]interface{}); !ok || authorMap["name"] != "تحریریه سبزینه" {
		t.Errorf("unexpected author schema: %+v", schema["author"])
	}
	if reviewerMap, ok := schema["reviewedBy"].(map[string]interface{}); !ok || reviewerMap["name"] != "دکتر حسینی" {
		t.Errorf("unexpected reviewer schema: %+v", schema["reviewedBy"])
	}
}
