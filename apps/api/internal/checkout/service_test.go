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
	"moringalab/api/internal/shipping"
)

func TestCheckoutIdempotencyAndGuestOrderPlacement(t *testing.T) {
	catSvc := catalog.NewService()
	promoSvc := promotions.NewService()
	cartSvc := carts.NewService(catSvc, promoSvc)
	invSvc := inventory.NewService()
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)
	shipSvc := shipping.NewService(orderSvc, paySvc)

	svc := NewService(cartSvc, invSvc, orderSvc, paySvc, shipSvc)

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
		ShippingMethod: "post_pishtaz",
		IdempotencyKey: "chk-idempotent-key-001",
	}

	// 1. Submit Checkout -> Success
	resp1, err1 := svc.SubmitCheckout(req)
	if err1 != nil || resp1 == nil || resp1.Order == nil {
		t.Fatalf("unexpected error on first checkout submit: %v", err1)
	}

	if resp1.Order.ShippingMethod != "post_pishtaz" {
		t.Errorf("expected shipping method post_pishtaz, got %s", resp1.Order.ShippingMethod)
	}

	if resp1.Order.ShippingFeeIRR <= 0 {
		t.Errorf("expected positive shipping fee, got %d", resp1.Order.ShippingFeeIRR)
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

func TestCheckoutIsfahanCourierAndNonIsfahanRejection(t *testing.T) {
	catSvc := catalog.NewService()
	promoSvc := promotions.NewService()
	cartSvc := carts.NewService(catSvc, promoSvc)
	invSvc := inventory.NewService()
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)
	shipSvc := shipping.NewService(orderSvc, paySvc)

	svc := NewService(cartSvc, invSvc, orderSvc, paySvc, shipSvc)

	varID := uuid.New()
	prod := &catalog.Product{
		ID:          uuid.New(),
		Slug:        "checkout-moringa-oil",
		TitleFA:     "روغن مورینگا",
		ProductType: catalog.TypeSimple,
		Status:      catalog.StatusPublished,
		CreatedAt:   time.Now(),
		Variants: []catalog.ProductVariant{
			{
				ID:                  varID,
				SKU:                 "CHK-OIL",
				TitleFA:             "۵۰ میلی‌لیتر",
				PriceIRR:            850000,
				NetWeightGrams:      150,
				ShippingWeightGrams: 180,
			},
		},
	}
	_ = catSvc.AddProduct(prod)
	invSvc.SetStock(varID, 10)

	// Case A: Isfahan + Courier -> Valid
	cartIsf := cartSvc.GetOrCreateCart(nil, nil)
	_, _ = cartSvc.AddItem(cartIsf.ID, varID, 1)

	respIsf, errIsf := svc.SubmitCheckout(SubmitCheckoutRequest{
		CartID:         cartIsf.ID,
		RecipientName:  "علی اصفهانی",
		RecipientPhone: "09131112233",
		Province:       "اصفهان",
		City:           "اصفهان",
		PostalAddress:  "چهارباغ عباسی، کوچه کازرونی",
		PostalCode:     "8134567890",
		ShippingMethod: "courier_isfahan",
		IdempotencyKey: "chk-isf-courier-01",
	})
	if errIsf != nil || respIsf == nil || respIsf.Order == nil {
		t.Fatalf("expected successful courier checkout in isfahan, got %v", errIsf)
	}
	if respIsf.Order.ShippingMethod != "courier_isfahan" {
		t.Errorf("expected courier_isfahan, got %s", respIsf.Order.ShippingMethod)
	}

	// Case B: Tehran + Courier -> Rejection with ErrCourierOnlyInIsfahan
	cartTeh := cartSvc.GetOrCreateCart(nil, nil)
	_, _ = cartSvc.AddItem(cartTeh.ID, varID, 1)

	_, errTeh := svc.SubmitCheckout(SubmitCheckoutRequest{
		CartID:         cartTeh.ID,
		RecipientName:  "مهدی تهرانی",
		RecipientPhone: "09121112233",
		Province:       "تهران",
		City:           "تهران",
		PostalAddress:  "میدان آزادی",
		PostalCode:     "1456789012",
		ShippingMethod: "courier_isfahan", // Invalid for Tehran
		IdempotencyKey: "chk-teh-courier-01",
	})
	if errTeh != shipping.ErrCourierOnlyInIsfahan {
		t.Errorf("expected ErrCourierOnlyInIsfahan for tehran courier, got %v", errTeh)
	}
}
