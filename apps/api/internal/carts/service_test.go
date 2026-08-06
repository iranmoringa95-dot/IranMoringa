package carts

import (
	"testing"

	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/promotions"
)

func TestCartMergeLogic(t *testing.T) {
	catSvc := catalog.NewService()
	promoSvc := promotions.NewService()
	svc := NewService(catSvc, promoSvc)

	anonID := "guest-anon-123"
	userID := uuid.New()

	// 1. Get Guest Cart
	gCart := svc.GetOrCreateCart(&anonID, nil)
	if gCart.ID == uuid.Nil {
		t.Fatal("expected valid guest cart ID")
	}

	// 2. Merge Guest Cart to User
	uCart := svc.MergeGuestCartToUser(anonID, userID)
	if uCart.UserID == nil || *uCart.UserID != userID {
		t.Fatalf("expected user cart tied to user ID %s", userID)
	}
}
