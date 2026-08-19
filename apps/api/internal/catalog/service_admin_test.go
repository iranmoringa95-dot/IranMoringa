package catalog_test

import (
	"os"
	"testing"

	"github.com/google/uuid"
	"moringalab/api/db/seeds"
	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
)

func TestProductDomainValidationInvariants(t *testing.T) {
	svc := catalog.NewService()

	// 1. Negative Price Error
	_, err := svc.AdminCreateProduct(catalog.CreateProductInput{
		TitleFA:             "محصول تست",
		Slug:                "test-prod-1",
		SKU:                 "SKU-001",
		PriceIRR:            -1000,
		NetWeightGrams:      100,
		ShippingWeightGrams: 150,
	})
	if err == nil || err.Error() != catalog.ErrNegativePrice.Error() {
		t.Fatalf("expected ErrNegativePrice, got %v", err)
	}

	// 2. Compare-at price <= PriceIRR error
	invalidCompare := int64(1000)
	_, err = svc.AdminCreateProduct(catalog.CreateProductInput{
		TitleFA:             "محصول تست",
		Slug:                "test-prod-2",
		SKU:                 "SKU-002",
		PriceIRR:            2000,
		CompareAtPriceIRR:   &invalidCompare,
		NetWeightGrams:      100,
		ShippingWeightGrams: 150,
	})
	if err == nil || err.Error() != catalog.ErrInvalidCompareAtPrice.Error() {
		t.Fatalf("expected ErrInvalidCompareAtPrice, got %v", err)
	}

	// 3. Weight invariant: Shipping weight < Net weight error
	_, err = svc.AdminCreateProduct(catalog.CreateProductInput{
		TitleFA:             "محصول تست",
		Slug:                "test-prod-3",
		SKU:                 "SKU-003",
		PriceIRR:            2000,
		NetWeightGrams:      200,
		ShippingWeightGrams: 100,
	})
	if err == nil || err.Error() != catalog.ErrShippingWeightTooSmall.Error() {
		t.Fatalf("expected ErrShippingWeightTooSmall, got %v", err)
	}
}

func TestSKUAndSlugUniqueness(t *testing.T) {
	svc := catalog.NewService()

	p1, err := svc.AdminCreateProduct(catalog.CreateProductInput{
		TitleFA:             "محصول اول",
		Slug:                "unique-slug",
		SKU:                 "SKU-UNIQUE",
		PriceIRR:            10000,
		NetWeightGrams:      100,
		ShippingWeightGrams: 120,
	})
	if err != nil {
		t.Fatalf("unexpected error creating product: %v", err)
	}
	if p1.Status != catalog.StatusDraft {
		t.Fatalf("new product status should be draft, got %s", p1.Status)
	}

	// Duplicate Slug
	_, err = svc.AdminCreateProduct(catalog.CreateProductInput{
		TitleFA:             "محصول دوم",
		Slug:                "unique-slug",
		SKU:                 "SKU-OTHER",
		PriceIRR:            10000,
		NetWeightGrams:      100,
		ShippingWeightGrams: 120,
	})
	if err == nil || err.Error() != catalog.ErrSlugExists.Error() {
		t.Fatalf("expected ErrSlugExists, got %v", err)
	}

	// Duplicate SKU
	_, err = svc.AdminCreateProduct(catalog.CreateProductInput{
		TitleFA:             "محصول سوم",
		Slug:                "other-slug",
		SKU:                 "SKU-UNIQUE",
		PriceIRR:            10000,
		NetWeightGrams:      100,
		ShippingWeightGrams: 120,
	})
	if err == nil || err.Error() != catalog.ErrSKUExists.Error() {
		t.Fatalf("expected ErrSKUExists, got %v", err)
	}
}

func TestPublishRequirementsCheck(t *testing.T) {
	svc := catalog.NewService()

	prod, err := svc.AdminCreateProduct(catalog.CreateProductInput{
		TitleFA:             "محصول بدون تصویر و دسته‌بندی",
		Slug:                "draft-no-media",
		SKU:                 "SKU-DRAFT",
		PriceIRR:            1500000,
		NetWeightGrams:      100,
		ShippingWeightGrams: 120,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Try publishing without category or media
	_, err = svc.AdminPublishProduct(prod.ID)
	if err == nil || err.Error() != catalog.ErrCannotPublishMissingCategory.Error() {
		t.Fatalf("expected ErrCannotPublishMissingCategory, got %v", err)
	}

	// Add Category
	cat := &catalog.Category{ID: uuid.New(), NameFA: "دسته‌بندی تست", Slug: "test-cat"}
	svc.AddCategory(cat)
	_, err = svc.AdminUpdateProduct(prod.ID, catalog.UpdateProductInput{
		CategoryIDs: []uuid.UUID{cat.ID},
	})
	if err != nil {
		t.Fatalf("failed to update category: %v", err)
	}

	// Try publishing without primary media
	_, err = svc.AdminPublishProduct(prod.ID)
	if err == nil || err.Error() != catalog.ErrCannotPublishMissingPrimaryMedia.Error() {
		t.Fatalf("expected ErrCannotPublishMissingPrimaryMedia, got %v", err)
	}

	// Add Media
	_, err = svc.AdminUpdateProduct(prod.ID, catalog.UpdateProductInput{
		Media: []catalog.ProductMediaInput{
			{URL: "/images/test.png", AltFA: "تست", IsPrimary: true, SortOrder: 1},
		},
	})
	if err != nil {
		t.Fatalf("failed to update media: %v", err)
	}

	// Now publish should succeed
	published, err := svc.AdminPublishProduct(prod.ID)
	if err != nil {
		t.Fatalf("failed to publish valid product: %v", err)
	}
	if published.Status != catalog.StatusPublished {
		t.Fatalf("expected status published, got %s", published.Status)
	}
}

func TestOptimisticConcurrencyVersionLock(t *testing.T) {
	svc := catalog.NewService()

	prod, err := svc.AdminCreateProduct(catalog.CreateProductInput{
		TitleFA:             "محصول نسخه هم‌زمان",
		Slug:                "concurrency-test",
		SKU:                 "SKU-CONCUR",
		PriceIRR:            500000,
		NetWeightGrams:      50,
		ShippingWeightGrams: 70,
	})
	if err != nil {
		t.Fatalf("failed creating product: %v", err)
	}

	// First update with matching version (1)
	newTitle := "محصول نسخه ۲"
	updated1, err := svc.AdminUpdateProduct(prod.ID, catalog.UpdateProductInput{
		Version: 1,
		TitleFA: &newTitle,
	})
	if err != nil {
		t.Fatalf("expected successful update, got %v", err)
	}
	if updated1.Version != 2 {
		t.Fatalf("expected version 2 after update, got %d", updated1.Version)
	}

	// Second update with stale version (1 instead of 2)
	staleTitle := "محصول قديمي"
	_, err = svc.AdminUpdateProduct(prod.ID, catalog.UpdateProductInput{
		Version: 1,
		TitleFA: &staleTitle,
	})
	if err == nil || err.Error() != catalog.ErrOptimisticLock.Error() {
		t.Fatalf("expected ErrOptimisticLock, got %v", err)
	}
}

func TestSeedDemoProductsIdempotencyAndProductionGuard(t *testing.T) {
	// 1. Production Guard Test
	t.Run("Production Environment Guard Rejection", func(t *testing.T) {
		os.Setenv("APP_ENV", "production")
		defer os.Unsetenv("APP_ENV")

		catSvc := catalog.NewService()
		contentSvc := content.NewService()
		err := seeds.PopulateSeedData(catSvc, contentSvc)
		if err == nil {
			t.Fatal("expected seed to fail in production environment, but it succeeded")
		}
	})

	// 2. Idempotent Seeding Test
	t.Run("Idempotency Execution Yields Exactly 10 Published Products", func(t *testing.T) {
		os.Setenv("APP_ENV", "development")
		defer os.Unsetenv("APP_ENV")

		catSvc := catalog.NewService()
		contentSvc := content.NewService()

		// First execution
		if err := seeds.PopulateSeedData(catSvc, contentSvc); err != nil {
			t.Fatalf("first seed run failed: %v", err)
		}

		prods, total := catSvc.AdminListProducts(catalog.AdminProductFilter{Limit: 50})
		if total != 10 {
			t.Fatalf("expected exactly 10 seed products after 1st run, got %d", total)
		}

		// Verify all 10 are published
		for _, p := range prods {
			if p.Status != catalog.StatusPublished {
				t.Fatalf("seed product %s should be published, got %s", p.Slug, p.Status)
			}
			if len(p.Variants) == 0 {
				t.Fatalf("seed product %s must have a default variant", p.Slug)
			}
			if p.Variants[0].PriceIRR <= 0 {
				t.Fatalf("seed product %s price must be positive integer IRR", p.Slug)
			}
		}

		// Second execution (re-seed)
		if err := seeds.PopulateSeedData(catSvc, contentSvc); err != nil {
			t.Fatalf("second seed run failed: %v", err)
		}

		prods2, total2 := catSvc.AdminListProducts(catalog.AdminProductFilter{Limit: 50})
		if total2 != 10 {
			t.Fatalf("re-seeding produced duplicates! expected 10 products, got %d", total2)
		}

		// Public API search should return exactly 10 products
		publicProds, publicTotal := catSvc.SearchProducts(catalog.ProductFilter{Limit: 50})
		if publicTotal != 10 {
			t.Fatalf("expected 10 public products, got %d", publicTotal)
		}
		if len(publicProds) != 10 {
			t.Fatalf("expected 10 items in list, got %d", len(publicProds))
		}
	})
}
