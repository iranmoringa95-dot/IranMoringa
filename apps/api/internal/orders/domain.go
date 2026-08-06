package orders

import (
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	StatusPendingPayment OrderStatus = "pending_payment"
	StatusPaid           OrderStatus = "paid"
	StatusProcessing     OrderStatus = "processing"
	StatusPacked         OrderStatus = "packed"
	StatusShipped        OrderStatus = "shipped"
	StatusDelivered      OrderStatus = "delivered"
	StatusCancelled      OrderStatus = "cancelled"
	StatusRefundRequested OrderStatus = "refund_requested"
	StatusRefunded       OrderStatus = "refunded"
)

type OrderAddressSnapshot struct {
	RecipientName  string `json:"recipient_name"`
	RecipientPhone string `json:"recipient_phone"`
	Province       string `json:"province"`
	City           string `json:"city"`
	PostalAddress  string `json:"postal_address"`
	PostalCode     string `json:"postal_code"`
}

type OrderItemSnapshot struct {
	ID           uuid.UUID `json:"id"`
	ProductID    uuid.UUID `json:"product_id"`
	VariantID    uuid.UUID `json:"variant_id"`
	ProductTitle string    `json:"product_title"`
	VariantTitle string    `json:"variant_title"`
	SKU          string    `json:"sku"`
	UnitPriceIRR int64     `json:"unit_price_irr"`
	Quantity     int       `json:"quantity"`
	SubtotalIRR  int64     `json:"subtotal_irr"`
}

type Order struct {
	ID             uuid.UUID            `json:"id"`
	OrderNumber    string               `json:"order_number"` // Human-readable (e.g. ML-1405-000123)
	CustomerID     *uuid.UUID           `json:"customer_id,omitempty"`
	GuestPhone     *string              `json:"guest_phone,omitempty"`
	Status         OrderStatus          `json:"status"`
	SubtotalIRR    int64                `json:"subtotal_irr"`
	DiscountIRR    int64                `json:"discount_irr"`
	ShippingFeeIRR int64                `json:"shipping_fee_irr"`
	TotalIRR       int64                `json:"total_irr"`
	IdempotencyKey string               `json:"idempotency_key"`
	Address        OrderAddressSnapshot `json:"address"`
	Items          []OrderItemSnapshot  `json:"items"`
	CreatedAt      time.Time            `json:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at"`
}
