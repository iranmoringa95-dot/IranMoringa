package shipping

import (
	"testing"

	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
)

func TestShippingQuotesAndCityRestrictions(t *testing.T) {
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)
	svc := NewService(orderSvc, paySvc)

	// 1. Calculate quotes for Isfahan (Other city -> No Tehran Courier)
	quotesIsf := svc.CalculateQuotes("اصفهان", "اصفهان", 10000000, 500)
	if len(quotesIsf) != 2 {
		t.Errorf("expected 2 shipping options for Isfahan, got %d", len(quotesIsf))
	}

	// 2. Calculate quotes for Tehran (Tehran -> Includes Express Courier)
	quotesTeh := svc.CalculateQuotes("تهران", "تهران", 10000000, 500)
	if len(quotesTeh) != 3 {
		t.Errorf("expected 3 shipping options for Tehran, got %d", len(quotesTeh))
	}

	// 3. Free Shipping Threshold Check (Subtotal >= 15,000,000 IRR)
	quotesFree := svc.CalculateQuotes("اصفهان", "اصفهان", 15000000, 500)
	pishtazFree := false
	for _, q := range quotesFree {
		if q.Code == "post_pishtaz" && q.FeeIRR == 0 && q.IsFree {
			pishtazFree = true
		}
	}
	if !pishtazFree {
		t.Errorf("expected free Post Pishtaz shipping for subtotal >= 15,000,000 IRR")
	}
}
