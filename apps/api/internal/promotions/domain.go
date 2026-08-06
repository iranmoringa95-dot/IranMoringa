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

type Coupon struct {
	ID             uuid.UUID    `json:"id"`
	Code           string       `json:"code"`
	DiscountType   DiscountType `json:"discount_type"`
	ValueIRR       int64        `json:"value_irr"`      // For fixed_amount in IRR
	Percentage     int          `json:"percentage"`     // For percentage (e.g. 20 for 20%)
	MinOrderAmount int64        `json:"min_order_amount"`
	MaxDiscount    int64        `json:"max_discount"`   // Max discount cap for percentage in IRR
	TotalUsageLimit int         `json:"total_usage_limit"`
	UsedCount      int          `json:"used_count"`
	IsActive       bool         `json:"is_active"`
	StartsAt       time.Time    `json:"starts_at"`
	ExpiresAt      time.Time    `json:"expires_at"`
}
