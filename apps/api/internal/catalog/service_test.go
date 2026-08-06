package catalog

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestCategoryCyclePrevention(t *testing.T) {
	svc := NewService()

	catA := &Category{ID: uuid.New(), NameFA: "دسته الف", Slug: "cat-a"}
	catB := &Category{ID: uuid.New(), ParentID: &catA.ID, NameFA: "دسته ب", Slug: "cat-b"}
	catC := &Category{ID: uuid.New(), ParentID: &catB.ID, NameFA: "دسته ج", Slug: "cat-c"}

	_ = svc.AddCategory(catA)
	_ = svc.AddCategory(catB)
	_ = svc.AddCategory(catC)

	// Attempting to make A a child of C -> Creates Cycle (C -> B -> A -> C)
	errCycle := svc.DetectCategoryCycle(catA.ID, catC.ID)
	if errCycle != ErrCategoryCycle {
		t.Fatalf("expected ErrCategoryCycle, got %v", errCycle)
	}

	// Self-parenting check
	errSelf := svc.DetectCategoryCycle(catA.ID, catA.ID)
	if errSelf != ErrCategoryCycle {
		t.Fatalf("expected ErrCategoryCycle for self-parenting, got %v", errSelf)
	}
}

func TestProductDomainInvariants(t *testing.T) {
	svc := NewService()

	t.Run("Product without variants fails validation", func(t *testing.T) {
		prod := &Product{
			ID:          uuid.New(),
			Slug:        "test-prod",
			TitleFA:     "محصول تست",
			ProductType: TypeSimple,
			Status:      StatusPublished,
			Variants:    []ProductVariant{},
		}
		err := svc.AddProduct(prod)
		if err != ErrNoVariant {
			t.Fatalf("expected ErrNoVariant, got %v", err)
		}
	})

	t.Run("Product with negative price fails validation", func(t *testing.T) {
		prod := &Product{
			ID:          uuid.New(),
			Slug:        "test-negative",
			TitleFA:     "محصول قیمت منفی",
			ProductType: TypeSimple,
			Status:      StatusPublished,
			Variants: []ProductVariant{
				{
					ID:       uuid.New(),
					SKU:      "SKU-NEG",
					TitleFA:  "ساده",
					PriceIRR: -1000,
				},
			},
		}
		err := svc.AddProduct(prod)
		if err != ErrNegativePrice {
			t.Fatalf("expected ErrNegativePrice, got %v", err)
		}
	})

	t.Run("Product with invalid compare_at_price fails validation", func(t *testing.T) {
		comparePrice := int64(400000)
		prod := &Product{
			ID:          uuid.New(),
			Slug:        "test-compare",
			TitleFA:     "محصول تخفیف غلط",
			ProductType: TypeSimple,
			Status:      StatusPublished,
			Variants: []ProductVariant{
				{
					ID:                uuid.New(),
					SKU:               "SKU-COMP",
					TitleFA:           "ساده",
					PriceIRR:          500000, // Price is 500,000 IRR
					CompareAtPriceIRR: &comparePrice, // Compare at price is lower (400,000 IRR) - INVALID!
				},
			},
		}
		err := svc.AddProduct(prod)
		if err != ErrInvalidCompareAtPrice {
			t.Fatalf("expected ErrInvalidCompareAtPrice, got %v", err)
		}
	})

	t.Run("Valid product adds successfully and is searchable", func(t *testing.T) {
		comparePrice := int64(600000)
		prod := &Product{
			ID:          uuid.New(),
			Slug:        "moringa-powder-100g",
			TitleFA:     "پودر مورینگا ۱۰۰ گرمی",
			ProductType: TypeSimple,
			Status:      StatusPublished,
			CreatedAt:   time.Now(),
			Variants: []ProductVariant{
				{
					ID:                uuid.New(),
					SKU:               "MOR-POW-100",
					TitleFA:           "بسته‌بندی ۱۰۰ گرمی",
					PriceIRR:          450000,
					CompareAtPriceIRR: &comparePrice,
					NetWeightGrams:    100,
				},
			},
		}
		if err := svc.AddProduct(prod); err != nil {
			t.Fatalf("AddProduct failed for valid product: %v", err)
		}

		res, count := svc.SearchProducts(ProductFilter{Query: "مورینگا"})
		if count != 1 || len(res) != 1 {
			t.Fatalf("expected 1 search result, got %d", count)
		}
		if res[0].Slug != "moringa-powder-100g" {
			t.Errorf("expected slug moringa-powder-100g, got %s", res[0].Slug)
		}
	})
}
