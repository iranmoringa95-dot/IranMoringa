package carts

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/promotions"
)

func TestGuestCartCreationAndMerging(t *testing.T) {
	catSvc := catalog.NewService()
	promoSvc := promotions.NewService()
	svc := NewService(catSvc, promoSvc)

	// Seed product
	prodID := uuid.New()
	varID := uuid.New()
	prod := &catalog.Product{
		ID:          prodID,
		Slug:        "moringa-powder-test",
		TitleFA:     "پودر مورینگا",
		ProductType: catalog.TypeSimple,
		Status:      catalog.StatusPublished,
		CreatedAt:   time.Now(),
		Variants: []catalog.ProductVariant{
			{
				ID:                  varID,
				SKU:                 "MOR-TST",
				TitleFA:             "اصلی",
				PriceIRR:            500000,
				NetWeightGrams:      100,
				ShippingWeightGrams: 150,
			},
		},
	}
	_ = catSvc.AddProduct(prod)

	// 1. Create Guest Cart & Add Item
	guestToken := "guest-session-token-99"
	guestCart := svc.GetOrCreateCart(&guestToken, nil)
	if guestCart == nil || guestCart.AnonymousID == nil {
		t.Fatalf("expected guest cart creation")
	}

	_, errAdd := svc.AddItem(guestCart.ID, varID, 2)
	if errAdd != nil {
		t.Fatalf("unexpected error adding item to guest cart: %v", errAdd)
	}

	// 2. Merge Guest Cart into Logged-in User Cart
	userID := uuid.New()
	userCart := svc.MergeGuestCartToUser(guestToken, userID)
	if userCart == nil || userCart.UserID == nil || *userCart.UserID != userID {
		t.Fatalf("expected merged user cart bound to userID")
	}

	if len(userCart.Items) != 1 || userCart.Items[0].Quantity != 2 {
		t.Errorf("expected 1 item with quantity 2 in merged user cart, got %d items", len(userCart.Items))
	}

	if userCart.Breakdown.SubtotalIRR != 1000000 {
		t.Errorf("expected subtotal 1,000,000 IRR (100,000 Toman), got %d", userCart.Breakdown.SubtotalIRR)
	}
}
