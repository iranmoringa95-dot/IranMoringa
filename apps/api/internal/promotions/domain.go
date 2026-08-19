package promotions

import (
	"time"

	"github.com/google/uuid"
)

type DiscountType string

const (
	TypeFixedAmount DiscountType = "fixed_amount"
	TypePercentage  DiscountType = "percentage"
)

type StackingPolicy string

const (
	PolicyExclusive StackingPolicy = "exclusive"
	PolicyStackable StackingPolicy = "stackable"
	PolicyBestPrice StackingPolicy = "best_price"
)

type RedemptionStatus string

const (
	RedemptionReserved RedemptionStatus = "reserved"
	RedemptionConsumed RedemptionStatus = "consumed"
	RedemptionReleased RedemptionStatus = "released"
)

type Coupon struct {
	ID                    uuid.UUID      `json:"id"`
	Code                  string         `json:"code"`
	CodeNormalized        string         `json:"code_normalized"`
	DiscountType          DiscountType   `json:"discount_type"`
	ValueIRR              int64          `json:"value_irr"`              // For fixed_amount in IRR
	Percentage            int            `json:"percentage"`             // For percentage (e.g. 20 for 20%)
	MinOrderAmount        int64          `json:"min_order_amount"`       // Minimum order subtotal required
	MaxDiscount           int64          `json:"max_discount"`           // Max discount cap for percentage in IRR
	TotalUsageLimit       int            `json:"total_usage_limit"`      // 0 = unlimited
	UsedCount             int            `json:"used_count"`             // Count of consumed redemptions
	ReservedCount         int            `json:"reserved_count"`         // Count of active reservations
	UsageLimitPerUser     int            `json:"usage_limit_per_user"`   // 0 = unlimited
	ApplicableProductIDs  []uuid.UUID    `json:"applicable_product_ids"` // Empty = all products
	ApplicableCategoryIDs []uuid.UUID    `json:"applicable_category_ids"`// Empty = all categories
	IsFirstOrderOnly      bool           `json:"is_first_order_only"`
	StackingPolicy        StackingPolicy `json:"stacking_policy"`
	IsActive              bool           `json:"is_active"`
	StartsAt              time.Time      `json:"starts_at"`
	ExpiresAt             time.Time      `json:"expires_at"`
	CreatedAt             time.Time      `json:"created_at"`
}

type CouponRedemption struct {
	ID            uuid.UUID        `json:"id"`
	CouponID      uuid.UUID        `json:"coupon_id"`
	CouponCode    string           `json:"coupon_code"`
	UserID        *uuid.UUID       `json:"user_id,omitempty"`
	GuestIdentity string           `json:"guest_identity,omitempty"`
	OrderID       *uuid.UUID       `json:"order_id,omitempty"`
	AmountIRR     int64            `json:"amount_irr"`
	Status        RedemptionStatus `json:"status"`
	ReservedAt    time.Time        `json:"reserved_at"`
	ConsumedAt    *time.Time       `json:"consumed_at,omitempty"`
	ReleasedAt    *time.Time       `json:"released_at,omitempty"`
}

type EvaluationItem struct {
	ProductID    uuid.UUID `json:"product_id"`
	CategoryID   uuid.UUID `json:"category_id"`
	UnitPriceIRR int64     `json:"unit_price_irr"`
	Quantity     int       `json:"quantity"`
	SubtotalIRR  int64     `json:"subtotal_irr"`
}

type EvaluationRequest struct {
	UserID        *uuid.UUID       `json:"user_id,omitempty"`
	GuestIdentity string           `json:"guest_identity,omitempty"`
	Items         []EvaluationItem `json:"items"`
	SubtotalIRR   int64            `json:"subtotal_irr"`
	UserOrderCount int             `json:"user_order_count"` // Order count for first_order_only check
}

type DiscountBreakdown struct {
	CouponCode     string       `json:"coupon_code"`
	DiscountType   DiscountType `json:"discount_type"`
	SubtotalIRR    int64        `json:"subtotal_irr"`
	EligibleSubtotalIRR int64   `json:"eligible_subtotal_irr"`
	DiscountIRR    int64        `json:"discount_irr"`
	DiscountToman  int64        `json:"discount_toman"`
	FinalTotalIRR  int64        `json:"final_total_irr"`
	ReasonFA       string       `json:"reason_fa,omitempty"`
}
