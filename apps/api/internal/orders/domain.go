package orders

import (
	"time"

	"github.com/google/uuid"
)

// ─── Order Status ────────────────────────────────────────────────────────────

type OrderStatus string

const (
	StatusPendingPayment  OrderStatus = "pending_payment"
	StatusPaid            OrderStatus = "paid"
	StatusProcessing      OrderStatus = "processing"
	StatusPacked          OrderStatus = "packed"
	StatusShipped         OrderStatus = "shipped"
	StatusDelivered       OrderStatus = "delivered"
	StatusCancelled       OrderStatus = "cancelled"
	StatusRefundRequested OrderStatus = "refund_requested"
	StatusRefunded        OrderStatus = "refunded"
)

// StatusLabelFA maps each order status to a Persian display string.
var StatusLabelFA = map[OrderStatus]string{
	StatusPendingPayment:  "در انتظار پرداخت",
	StatusPaid:            "پرداخت شده",
	StatusProcessing:      "در حال پردازش",
	StatusPacked:          "بسته‌بندی شده",
	StatusShipped:         "ارسال شده",
	StatusDelivered:       "تحویل داده شده",
	StatusCancelled:       "لغو شده",
	StatusRefundRequested: "درخواست بازگشت وجه",
	StatusRefunded:        "بازگشت وجه شده",
}

// ─── Actor Types ─────────────────────────────────────────────────────────────

type ActorType string

const (
	ActorAdmin    ActorType = "admin"
	ActorCustomer ActorType = "customer"
	ActorSystem   ActorType = "system"
)

// ─── Order Address Snapshot ──────────────────────────────────────────────────

type OrderAddressSnapshot struct {
	RecipientName  string `json:"recipient_name"`
	RecipientPhone string `json:"recipient_phone"`
	Province       string `json:"province"`
	City           string `json:"city"`
	PostalAddress  string `json:"postal_address"`
	PostalCode     string `json:"postal_code"`
}

// ─── Order Item Snapshot ─────────────────────────────────────────────────────

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
	WeightGrams  int       `json:"weight_grams"`
}

// ─── Order ───────────────────────────────────────────────────────────────────

type Order struct {
	ID             uuid.UUID            `json:"id"`
	OrderNumber    string               `json:"order_number"`
	CustomerID     *uuid.UUID           `json:"customer_id,omitempty"`
	GuestPhone     *string              `json:"guest_phone,omitempty"`
	Status         OrderStatus          `json:"status"`
	SubtotalIRR    int64                `json:"subtotal_irr"`
	DiscountIRR    int64                `json:"discount_irr"`
	ShippingFeeIRR int64                `json:"shipping_fee_irr"`
	TotalIRR       int64                `json:"total_irr"`
	ShippingMethod string               `json:"shipping_method"`
	TrackingCode   string               `json:"tracking_code,omitempty"`
	PaymentID      *uuid.UUID           `json:"payment_id,omitempty"`
	Notes          string               `json:"notes,omitempty"`
	IdempotencyKey string               `json:"idempotency_key"`
	Address        OrderAddressSnapshot `json:"address"`
	Items          []OrderItemSnapshot  `json:"items"`
	CreatedAt      time.Time            `json:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at"`
}

// ─── Order Timeline Event ────────────────────────────────────────────────────

type OrderTimelineEvent struct {
	ID        uuid.UUID   `json:"id"`
	OrderID   uuid.UUID   `json:"order_id"`
	EventType string      `json:"event_type"` // e.g. "status_change", "note_added"
	OldStatus OrderStatus `json:"old_status,omitempty"`
	NewStatus OrderStatus `json:"new_status,omitempty"`
	ActorType ActorType   `json:"actor_type"`
	ActorID   string      `json:"actor_id,omitempty"`
	Metadata  string      `json:"metadata,omitempty"` // JSON string for extra data
	Note      string      `json:"note,omitempty"`
	CreatedAt time.Time   `json:"created_at"`
}
