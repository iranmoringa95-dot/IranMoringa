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

	t.Run("Product with shipping weight smaller than net weight fails validation", func(t *testing.T) {
		prod := &Product{
			ID:          uuid.New(),
			Slug:        "test-weight-inv",
			TitleFA:     "محصول وزن اشتباه",
			ProductType: TypeSimple,
			Status:      StatusPublished,
			Variants: []ProductVariant{
				{
					ID:                  uuid.New(),
					SKU:                 "SKU-WGT",
					TitleFA:             "ساده",
					PriceIRR:            100000,
					NetWeightGrams:      250,
					ShippingWeightGrams: 200, // INVALID: Shipping weight < Net weight
				},
			},
		}
		err := svc.AddProduct(prod)
		if err != ErrShippingWeightTooSmall {
			t.Fatalf("expected ErrShippingWeightTooSmall, got %v", err)
		}
	})

	t.Run("Physical deletion of product blocked and soft archive enforced", func(t *testing.T) {
		prodID := uuid.New()
		prod := &Product{
			ID:          prodID,
			Slug:        "moringa-leaf-powder",
			TitleFA:     "پودر برگ مورینگا",
			ProductType: TypeSimple,
			Status:      StatusPublished,
			Variants: []ProductVariant{
				{
					ID:                  uuid.New(),
					SKU:                 "MOR-POW",
					TitleFA:             "اصلی",
					PriceIRR:            450000,
					NetWeightGrams:      250,
					ShippingWeightGrams: 300,
				},
			},
		}
		_ = svc.AddProduct(prod)

		errPhysicalDelete := svc.DeleteProduct(prodID)
		if errPhysicalDelete != ErrProductInUse {
			t.Fatalf("expected ErrProductInUse when deleting product physically, got %v", errPhysicalDelete)
		}

		errArchive := svc.ArchiveProduct(prodID)
		if errArchive != nil {
			t.Fatalf("expected successful soft archiving, got %v", errArchive)
		}
	})
}
