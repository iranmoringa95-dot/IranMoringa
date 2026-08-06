package checkout

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/carts"
	"moringalab/api/internal/catalog"
	"moringalab/api/internal/inventory"
	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
	"moringalab/api/internal/promotions"
)

func TestCheckoutIdempotencyAndGuestOrderPlacement(t *testing.T) {
	catSvc := catalog.NewService()
	promoSvc := promotions.NewService()
	cartSvc := carts.NewService(catSvc, promoSvc)
	invSvc := inventory.NewService()
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)

	svc := NewService(cartSvc, invSvc, orderSvc, paySvc)

	// Seed catalog product & stock
	varID := uuid.New()
	prod := &catalog.Product{
		ID:          uuid.New(),
		Slug:        "checkout-moringa-leaf",
		TitleFA:     "برگ خشک مورینگا",
		ProductType: catalog.TypeSimple,
		Status:      catalog.StatusPublished,
		CreatedAt:   time.Now(),
		Variants: []catalog.ProductVariant{
			{
				ID:                  varID,
				SKU:                 "CHK-LEAF",
				TitleFA:             "اصلی",
				PriceIRR:            600000,
				NetWeightGrams:      200,
				ShippingWeightGrams: 250,
			},
		},
	}
	_ = catSvc.AddProduct(prod)
	invSvc.SetStock(varID, 10)

	// Add item to cart
	cart := cartSvc.GetOrCreateCart(nil, nil)
	_, _ = cartSvc.AddItem(cart.ID, varID, 1)

	req := SubmitCheckoutRequest{
		CartID:         cart.ID,
		RecipientName:  "رضا رضایی",
		RecipientPhone: "09121112233",
		Province:       "تهران",
		City:           "تهران",
		PostalAddress:  "خیابان ولیعصر پلاک ۵",
		PostalCode:     "1234567890",
		IdempotencyKey: "chk-idempotent-key-001",
	}

	// 1. Submit Checkout -> Success
	resp1, err1 := svc.SubmitCheckout(req)
	if err1 != nil || resp1 == nil || resp1.Order == nil {
		t.Fatalf("unexpected error on first checkout submit: %v", err1)
	}

	// 2. Submit Checkout with SAME Idempotency Key -> Deduplicated (Returns identical Order ID)
	resp2, err2 := svc.SubmitCheckout(req)
	if err2 != nil || resp2 == nil {
		t.Fatalf("unexpected error on duplicate checkout submit: %v", err2)
	}

	if resp1.Order.ID != resp2.Order.ID {
		t.Errorf("expected duplicate checkout with same idempotency key to return same order ID")
	}

	if resp1.Order.OrderNumber != resp2.Order.OrderNumber {
		t.Errorf("expected duplicate checkout to return same order number")
	}
}
