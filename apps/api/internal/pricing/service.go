package pricing

type PriceBreakdown struct {
	SubtotalIRR     int64 `json:"subtotal_irr"`
	ItemDiscountIRR int64 `json:"item_discount_irr"`
	CartDiscountIRR int64 `json:"cart_discount_irr"`
	ShippingFeeIRR  int64 `json:"shipping_fee_irr"`
	GrandTotalIRR   int64 `json:"grand_total_irr"`
}

type CartLineItem struct {
	VariantID         string
	UnitPriceIRR      int64
	CompareAtPriceIRR *int64
	Quantity          int
}

func CalculateBreakdown(items []CartLineItem, cartDiscountIRR int64, shippingFeeIRR int64) PriceBreakdown {
	var subtotal int64 = 0
	var itemDiscount int64 = 0

	for _, item := range items {
		lineSubtotal := item.UnitPriceIRR * int64(item.Quantity)
		subtotal += lineSubtotal

		if item.CompareAtPriceIRR != nil && *item.CompareAtPriceIRR > item.UnitPriceIRR {
			unitDiscount := *item.CompareAtPriceIRR - item.UnitPriceIRR
			itemDiscount += unitDiscount * int64(item.Quantity)
		}
	}

	grandTotal := subtotal - cartDiscountIRR + shippingFeeIRR
	if grandTotal < 0 {
		grandTotal = 0
	}

	return PriceBreakdown{
		SubtotalIRR:     subtotal,
		ItemDiscountIRR: itemDiscount,
		CartDiscountIRR: cartDiscountIRR,
		ShippingFeeIRR:  shippingFeeIRR,
		GrandTotalIRR:   grandTotal,
	}
}
