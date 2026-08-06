package shipping

import (
	"testing"

	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
)

func TestShippingFeeAndTrackingLookup(t *testing.T) {
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)
	svc := NewService(orderSvc, paySvc)

	// 1. Calculate shipping fee
	feeTehran := svc.CalculateShippingFee("تهران", 500)
	if feeTehran != 300000 {
		t.Errorf("expected 300,000 IRR for Tehran base, got %d", feeTehran)
	}

	feeProvince := svc.CalculateShippingFee("اصفهان", 500)
	if feeProvince != 400000 {
		t.Errorf("expected 400,000 IRR for other province, got %d", feeProvince)
	}

	// 2. Create Order & Lookup Tracking
	ord, _ := orderSvc.CreateOrder(&orders.Order{
		SubtotalIRR: 500000,
		Address: orders.OrderAddressSnapshot{
			RecipientName: "علی محمدی",
			City:          "تهران",
		},
	})

	res, err := svc.LookupTracking(ord.OrderNumber)
	if err != nil {
		t.Fatalf("expected tracking result, got err: %v", err)
	}
	if res.OrderNumber != ord.OrderNumber {
		t.Errorf("expected order number %s, got %s", ord.OrderNumber, res.OrderNumber)
	}
	if len(res.Timeline) == 0 {
		t.Fatal("expected non-empty timeline steps")
	}
}
