package carts

import (
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/pricing"
)

type CartItem struct {
	ID                  uuid.UUID `json:"id"`
	CartID              uuid.UUID `json:"cart_id"`
	ProductID           uuid.UUID `json:"product_id"`
	VariantID           uuid.UUID `json:"variant_id"`
	ProductTitle        string    `json:"product_title"`
	VariantTitle        string    `json:"variant_title"`
	SKU                 string    `json:"sku"`
	UnitPriceIRR        int64     `json:"unit_price_irr"`
	CompareAtPriceIRR   *int64    `json:"compare_at_price_irr,omitempty"`
	Quantity            int       `json:"quantity"`
	LineSubtotalIRR     int64     `json:"line_subtotal_irr"`
	NetWeightGrams      int       `json:"net_weight_grams"`
	ShippingWeightGrams int       `json:"shipping_weight_grams"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type Cart struct {
	ID          uuid.UUID              `json:"id"`
	AnonymousID *string                `json:"anonymous_id,omitempty"`
	UserID      *uuid.UUID             `json:"user_id,omitempty"`
	CouponCode  *string                `json:"coupon_code,omitempty"`
	Items       []CartItem             `json:"items"`
	Breakdown   pricing.PriceBreakdown `json:"breakdown"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}
