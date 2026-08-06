package payments

import (
	"time"

	"github.com/google/uuid"
)

type PaymentStatus string

const (
	PaymentStatusCreated   PaymentStatus = "created"
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusSucceeded PaymentStatus = "succeeded"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusCancelled PaymentStatus = "cancelled"
)

type Payment struct {
	ID           uuid.UUID     `json:"id"`
	OrderID      uuid.UUID     `json:"order_id"`
	OrderNumber  string        `json:"order_number"`
	AmountIRR    int64         `json:"amount_irr"`
	Status       PaymentStatus `json:"status"`
	GatewayName  string        `json:"gateway_name"`
	ReferenceID  *string       `json:"reference_id,omitempty"`
	TrackingCode *string       `json:"tracking_code,omitempty"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}
