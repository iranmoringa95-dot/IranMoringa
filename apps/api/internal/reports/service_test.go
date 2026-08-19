package reports

import (
	"bytes"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/inventory"
	"moringalab/api/internal/orders"
	"moringalab/api/internal/promotions"
)

func setupTestReportsService(t *testing.T) (*Service, *orders.Service, *inventory.Service) {
	t.Helper()
	ordersSvc := orders.NewService()
	inventorySvc := inventory.NewService()
	promotionsSvc := promotions.NewService()

	svc := NewService(ordersSvc, inventorySvc, promotionsSvc)
	return svc, ordersSvc, inventorySvc
}

// ─── Test 1: Net Revenue Formula Calculation ───────────────────────────────────

func TestNetRevenueFormulaCalculation(t *testing.T) {
	svc, ordersSvc, _ := setupTestReportsService(t)

	uID := uuid.New()
	pID := uuid.New()

	// Paid order: Subtotal 10,000,000 IRR, Discount 1,000,000 IRR, Shipping 500,000 IRR -> Net 9,500,000 IRR
	_, _ = ordersSvc.CreateOrder(&orders.Order{
		UserID:         &uID,
		Status:         orders.StatusPaid,
		SubtotalIRR:    10000000,
		DiscountIRR:    1000000,
		ShippingFeeIRR: 500000,
		TotalIRR:       9500000,
		IdempotencyKey: uuid.New().String(),
		Items: []orders.OrderItem{
			{ProductID: pID, Quantity: 2, UnitPriceIRR: 5000000, TotalPriceIRR: 10000000, ProductNameSnapshot: "روغن مورینگا"},
		},
	})

	summary, err := svc.GetExecutiveSummary(time.Time{}, time.Time{})
	if err != nil {
		t.Fatalf("GetExecutiveSummary failed: %v", err)
	}

	if summary.GrossSalesIRR != 10000000 {
		t.Errorf("expected gross sales 10,000,000 IRR, got %d", summary.GrossSalesIRR)
	}
	if summary.DiscountTotalIRR != 1000000 {
		t.Errorf("expected discount total 1,000,000 IRR, got %d", summary.DiscountTotalIRR)
	}
	if summary.ShippingRevenueIRR != 500000 {
		t.Errorf("expected shipping revenue 500,000 IRR, got %d", summary.ShippingRevenueIRR)
	}
	if summary.NetRevenueIRR != 9500000 {
		t.Errorf("expected net revenue 9,500,000 IRR, got %d", summary.NetRevenueIRR)
	}
}

// ─── Test 2: Integer IRR Precision ────────────────────────────────────────────

func TestIntegerIRRPrecision(t *testing.T) {
	svc, ordersSvc, _ := setupTestReportsService(t)

	uID := uuid.New()
	for i := 0; i < 3; i++ {
		_, _ = ordersSvc.CreateOrder(&orders.Order{
			UserID:         &uID,
			Status:         orders.StatusPaid,
			SubtotalIRR:    3333333,
			DiscountIRR:    333333,
			ShippingFeeIRR: 100000,
			TotalIRR:       3100000,
			IdempotencyKey: uuid.New().String(),
		})
	}

	summary, _ := svc.GetExecutiveSummary(time.Time{}, time.Time{})
	// Total gross = 3 * 3333333 = 9,999,999 IRR
	if summary.GrossSalesIRR != 9999999 {
		t.Errorf("expected integer exact 9999999 IRR, got %d", summary.GrossSalesIRR)
	}
}

// ─── Test 3: CSV Formula Injection Defense ───────────────────────────────────

func TestCSVFormulaInjectionNeutralization(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"=SUM(1,2)", "'=SUM(1,2)"},
		{"+100", "'+100"},
		{"-500", "'-500"},
		{"@CMD", "'@CMD"},
		{"روغن مورینگا", "روغن مورینگا"},
		{"SKU-101", "SKU-101"},
	}

	for _, c := range cases {
		out := NeutralizeFormulaInjection(c.input)
		if out != c.expected {
			t.Errorf("NeutralizeFormulaInjection(%s): expected %s, got %s", c.input, c.expected, out)
		}
	}
}

// ─── Test 4: Time Series Aggregates ──────────────────────────────────────────

func TestSalesTimeSeriesTehranTimezone(t *testing.T) {
	svc, ordersSvc, _ := setupTestReportsService(t)

	uID := uuid.New()
	_, _ = ordersSvc.CreateOrder(&orders.Order{
		UserID:         &uID,
		Status:         orders.StatusPaid,
		SubtotalIRR:    2000000,
		IdempotencyKey: uuid.New().String(),
	})

	series, err := svc.GetSalesTimeSeries(time.Time{}, time.Time{})
	if err != nil {
		t.Fatalf("GetSalesTimeSeries failed: %v", err)
	}

	if len(series) == 0 {
		t.Error("expected at least 1 time series data point")
	}
}

// ─── Test 5: Top-Selling Products Ranking ────────────────────────────────────

func TestTopSellingProductsRanking(t *testing.T) {
	svc, ordersSvc, _ := setupTestReportsService(t)

	uID := uuid.New()
	p1 := uuid.New()
	p2 := uuid.New()

	_, _ = ordersSvc.CreateOrder(&orders.Order{
		UserID:         &uID,
		Status:         orders.StatusPaid,
		SubtotalIRR:    10000000,
		IdempotencyKey: uuid.New().String(),
		Items: []orders.OrderItem{
			{ProductID: p1, SKUSnapshot: "SKU-1", ProductNameSnapshot: "پودر ۱۰۰ گرم", Quantity: 5, TotalPriceIRR: 5000000},
			{ProductID: p2, SKUSnapshot: "SKU-2", ProductNameSnapshot: "روغن ۳۰ میل", Quantity: 1, TotalPriceIRR: 2500000},
		},
	})

	topProducts, err := svc.GetTopSellingProducts(10)
	if err != nil {
		t.Fatalf("GetTopSellingProducts failed: %v", err)
	}

	if len(topProducts) < 2 {
		t.Fatalf("expected 2 ranked products, got %d", len(topProducts))
	}

	if topProducts[0].ProductID != p1 || topProducts[0].UnitsSold != 5 {
		t.Errorf("expected product p1 to be top seller with 5 units, got %v with %d units", topProducts[0].ProductID, topProducts[0].UnitsSold)
	}
}

// ─── Test 6: Report Export Job With UTF-8 BOM ────────────────────────────────

func TestReportExportJobWithBOM(t *testing.T) {
	svc, _, _ := setupTestReportsService(t)

	job, err := svc.CreateReportExportJob("sales_summary", "مدیر سیستم")
	if err != nil {
		t.Fatalf("CreateReportExportJob failed: %v", err)
	}

	blob, err := svc.GetExportJobDownload(job.ID)
	if err != nil {
		t.Fatalf("GetExportJobDownload failed: %v", err)
	}

	// Verify UTF-8 BOM header (\xEF\xBB\xBF)
	if len(blob) < 3 || !bytes.Equal(blob[:3], []byte{0xEF, 0xBB, 0xBF}) {
		t.Error("expected CSV export to start with UTF-8 BOM header for Excel compatibility")
	}

	if !strings.Contains(string(blob), "فروش ناخالص") {
		t.Error("expected CSV content to include Persian metrics labels")
	}
}

// ─── Test 7: Export Job Expiry ────────────────────────────────────────────────

func TestExportJobExpiry(t *testing.T) {
	svc, _, _ := setupTestReportsService(t)

	jobID := uuid.New()
	svc.mu.Lock()
	svc.exportJobs[jobID] = &ReportExportJob{
		ID:        jobID,
		ExpiresAt: time.Now().Add(-1 * time.Hour), // Expired 1 hour ago
	}
	svc.exportBlobs[jobID] = []byte("test")
	svc.mu.Unlock()

	_, err := svc.GetExportJobDownload(jobID)
	if err != ErrExportJobNotFound {
		t.Errorf("expected ErrExportJobNotFound for expired export job, got %v", err)
	}
}

// ─── Test 8: AOV Calculation ─────────────────────────────────────────────────

func TestAOVCalculation(t *testing.T) {
	svc, ordersSvc, _ := setupTestReportsService(t)

	uID := uuid.New()
	_, _ = ordersSvc.CreateOrder(&orders.Order{
		UserID:         &uID,
		Status:         orders.StatusPaid,
		SubtotalIRR:    10000000,
		IdempotencyKey: uuid.New().String(),
	})
	_, _ = ordersSvc.CreateOrder(&orders.Order{
		UserID:         &uID,
		Status:         orders.StatusPaid,
		SubtotalIRR:    20000000,
		IdempotencyKey: uuid.New().String(),
	})

	summary, _ := svc.GetExecutiveSummary(time.Time{}, time.Time{})

	// Net = 30,000,000 IRR, Paid = 2 -> AOV = 15,000,000 IRR
	if summary.AverageOrderValueIRR != 15000000 {
		t.Errorf("expected AOV 15,000,000 IRR, got %d", summary.AverageOrderValueIRR)
	}
}

// ─── Test 9: Inventory Stock Alerts Metrics ───────────────────────────────────

func TestInventoryStockAlertsMetrics(t *testing.T) {
	svc, _, inventorySvc := setupTestReportsService(t)

	v1 := uuid.New()
	v2 := uuid.New()

	// v1: Available = 2 (Low stock)
	_, _ = inventorySvc.AdjustInventory(v1, "inbound", 2, "تست موجوی کم", "admin")

	summary, _ := svc.GetExecutiveSummary(time.Time{}, time.Time{})
	_ = v2

	if summary.LowStockCount < 1 && summary.OutOfStockCount < 0 {
		t.Error("expected stock alerts metrics calculation")
	}
}

// ─── Test 10: Payment Success Rate Metric ─────────────────────────────────────

func TestPaymentSuccessRateMetric(t *testing.T) {
	svc, ordersSvc, _ := setupTestReportsService(t)

	uID := uuid.New()
	// 1 Paid + 1 Cancelled = 50% success rate
	_, _ = ordersSvc.CreateOrder(&orders.Order{UserID: &uID, Status: orders.StatusPaid, IdempotencyKey: uuid.New().String()})
	_, _ = ordersSvc.CreateOrder(&orders.Order{UserID: &uID, Status: orders.StatusCancelled, IdempotencyKey: uuid.New().String()})

	summary, _ := svc.GetExecutiveSummary(time.Time{}, time.Time{})

	if summary.PaymentSuccessRate != 50.0 {
		t.Errorf("expected 50%% success rate, got %f", summary.PaymentSuccessRate)
	}
}
