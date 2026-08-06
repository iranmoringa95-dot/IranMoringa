package pricing

import (
	"testing"
)

func TestCalculateBreakdown(t *testing.T) {
	comparePrice := int64(500000)

	items := []CartLineItem{
		{
			VariantID:         "v1",
			UnitPriceIRR:      400000,
			CompareAtPriceIRR: &comparePrice, // 100,000 IRR discount per unit
			Quantity:          2,
		},
	}

	breakdown := CalculateBreakdown(items, 50000, 30000) // Cart discount 50,000 IRR, Shipping 30,000 IRR

	if breakdown.SubtotalIRR != 800000 {
		t.Errorf("expected Subtotal 800,000, got %d", breakdown.SubtotalIRR)
	}
	if breakdown.ItemDiscountIRR != 200000 {
		t.Errorf("expected ItemDiscount 200,000, got %d", breakdown.ItemDiscountIRR)
	}
	if breakdown.CartDiscountIRR != 50000 {
		t.Errorf("expected CartDiscount 50,000, got %d", breakdown.CartDiscountIRR)
	}
	if breakdown.GrandTotalIRR != 780000 {
		t.Errorf("expected GrandTotal 780,000, got %d", breakdown.GrandTotalIRR)
	}
}
