package reports

import (
	"time"

	"github.com/google/uuid"
)

type ExecutiveSummary struct {
	GrossSalesIRR        int64     `json:"gross_sales_irr"`
	DiscountTotalIRR     int64     `json:"discount_total_irr"`
	ShippingRevenueIRR   int64     `json:"shipping_revenue_irr"`
	RefundedAmountIRR    int64     `json:"refunded_amount_irr"`
	NetRevenueIRR        int64     `json:"net_revenue_irr"`
	TotalOrders          int       `json:"total_orders"`
	PaidOrders           int       `json:"paid_orders"`
	CancelledOrders      int       `json:"cancelled_orders"`
	PaymentSuccessRate   float64   `json:"payment_success_rate"`
	AverageOrderValueIRR int64     `json:"average_order_value_irr"`
	LowStockCount        int       `json:"low_stock_count"`
	OutOfStockCount      int       `json:"out_of_stock_count"`
	GeneratedAt          time.Time `json:"generated_at"`
	CurrencyUnit         string    `json:"currency_unit"` // Always "IRR"
}

type TimeSeriesDataPoint struct {
	Date            string `json:"date"` // YYYY-MM-DD
	GrossSalesIRR   int64  `json:"gross_sales_irr"`
	NetRevenueIRR   int64  `json:"net_revenue_irr"`
	PaidOrdersCount int    `json:"paid_orders_count"`
}

type ProductPerformanceItem struct {
	ProductID     uuid.UUID `json:"product_id"`
	SKU           string    `json:"sku"`
	ProductNameFA string    `json:"product_name_fa"`
	UnitsSold     int       `json:"units_sold"`
	GrossSalesIRR int64     `json:"gross_sales_irr"`
	NetRevenueIRR int64     `json:"net_revenue_irr"`
}

type ReportExportJob struct {
	ID          uuid.UUID `json:"id"`
	ReportType  string    `json:"report_type"` // "sales_summary", "products_performance"
	RequestedBy string    `json:"requested_by"`
	Filters     string    `json:"filters,omitempty"`
	RowCount    int       `json:"row_count"`
	Status      string    `json:"status"` // "completed", "failed"
	DownloadURL string    `json:"download_url"`
	ExpiresAt   time.Time `json:"expires_at"`
	CreatedAt   time.Time `json:"created_at"`
}
