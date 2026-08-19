package invoices

import (
	"time"

	"github.com/google/uuid"
)

// ─── Status Constants ────────────────────────────────────────────────────────

type InvoiceStatus string

const (
	StatusIssued InvoiceStatus = "issued"
	StatusVoided InvoiceStatus = "voided"
)

type ExportJobStatus string

const (
	ExportStatusPending   ExportJobStatus = "pending"
	ExportStatusCompleted ExportJobStatus = "completed"
	ExportStatusFailed    ExportJobStatus = "failed"
)

// ─── Snapshots ───────────────────────────────────────────────────────────────

type SellerSnapshot struct {
	LegalTitle   string `json:"legal_title"`
	NationalID   string `json:"national_id"`
	EconomicCode string `json:"economic_code"`
	Phone        string `json:"phone"`
	Province     string `json:"province"`
	City         string `json:"city"`
	Address      string `json:"address"`
	PostalCode   string `json:"postal_code"`
}

type InvoiceItemSnapshot struct {
	ProductID    uuid.UUID `json:"product_id"`
	VariantID    uuid.UUID `json:"variant_id"`
	ProductTitle string    `json:"product_title"`
	VariantTitle string    `json:"variant_title"`
	SKU          string    `json:"sku"`
	Quantity     int       `json:"quantity"`
	UnitPriceIRR int64     `json:"unit_price_irr"`
	SubtotalIRR  int64     `json:"subtotal_irr"`
}

type InvoiceCustomerSnapshot struct {
	RecipientName  string `json:"recipient_name"`
	RecipientPhone string `json:"recipient_phone"`
	Province       string `json:"province"`
	City           string `json:"city"`
	PostalAddress  string `json:"postal_address"`
	PostalCode     string `json:"postal_code"`
}

type InvoiceSnapshot struct {
	Seller         SellerSnapshot          `json:"seller"`
	Customer       InvoiceCustomerSnapshot `json:"customer"`
	Items          []InvoiceItemSnapshot   `json:"items"`
	SubtotalIRR    int64                   `json:"subtotal_irr"`
	DiscountIRR    int64                   `json:"discount_irr"`
	ShippingFeeIRR int64                   `json:"shipping_fee_irr"`
	TaxIRR         int64                   `json:"tax_irr"`
	TotalIRR       int64                   `json:"total_irr"`
	TotalToman     int64                   `json:"total_toman"`
}

// ─── Invoice Entity ──────────────────────────────────────────────────────────

type Invoice struct {
	ID            uuid.UUID       `json:"id"`
	OrderID       uuid.UUID       `json:"order_id"`
	OrderNumber   string          `json:"order_number"`
	InvoiceNumber string          `json:"invoice_number"`
	Status        InvoiceStatus   `json:"status"`
	VoidReason    string          `json:"void_reason,omitempty"`
	IssuedAt      time.Time       `json:"issued_at"`
	VoidedAt      *time.Time      `json:"voided_at,omitempty"`
	Snapshot      InvoiceSnapshot `json:"snapshot"`
	SnapshotHash  string          `json:"snapshot_hash"`
}

// ─── Export Job Entity ───────────────────────────────────────────────────────

type ExportFilters struct {
	Status      string `json:"status,omitempty"`
	SearchQuery string `json:"search_query,omitempty"`
	DateFrom    string `json:"date_from,omitempty"`
	DateTo      string `json:"date_to,omitempty"`
}

type ExportJob struct {
	ID          uuid.UUID       `json:"id"`
	Type        string          `json:"type"` // e.g. "orders_csv"
	Filters     ExportFilters   `json:"filters"`
	Status      ExportJobStatus `json:"status"`
	RequestedBy string          `json:"requested_by"`
	Content     string          `json:"-"` // Hidden from JSON status view
	Filename    string          `json:"filename"`
	ExpiresAt   time.Time       `json:"expires_at"`
	CreatedAt   time.Time       `json:"created_at"`
}
