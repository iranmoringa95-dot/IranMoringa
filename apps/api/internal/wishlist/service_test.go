package wishlist

import (
	"testing"

	"github.com/google/uuid"
)

func TestWishlistToggle(t *testing.T) {
	svc := NewService()
	userID := uuid.New()
	prodID := uuid.New()

	// 1. Toggle adds product
	added := svc.ToggleWishlist(userID, prodID)
	if !added {
		t.Fatal("expected toggle to add product")
	}

	items := svc.GetWishlist(userID)
	if len(items) != 1 {
		t.Fatalf("expected 1 wishlist item, got %d", len(items))
	}

	// 2. Toggle again removes product
	removed := svc.ToggleWishlist(userID, prodID)
	if removed {
		t.Fatal("expected toggle to remove product")
	}

	itemsAfter := svc.GetWishlist(userID)
	if len(itemsAfter) != 0 {
		t.Fatalf("expected 0 wishlist items after removal, got %d", len(itemsAfter))
	}
}
