package invoices

import (
	"strings"
	"sync"
	"testing"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

func setupTestServices(t *testing.T) (*Service, *orders.Service, *orders.Order) {
	t.Helper()
	ordersSvc := orders.NewService()
	invoicesSvc := NewService(ordersSvc)

	ord, err := ordersSvc.CreateOrder(&orders.Order{
		IdempotencyKey: uuid.New().String(),
		SubtotalIRR:    400000,
		ShippingFeeIRR: 30000,
		TotalIRR:       430000,
		Address: orders.OrderAddressSnapshot{
			RecipientName: "مریم رضایی",
			Province:      "اصفهان",
			City:          "اصفهان",
			PostalCode:    "8111122222",
			PostalAddress: "خیابان چهارباغ بالا، پلاک ۱۰",
		},
		Items: []orders.OrderItemSnapshot{
			{
				ID:           uuid.New(),
				ProductTitle: "روغن مورینگا",
				VariantTitle: "۵۰ میلی‌لیتر",
				SKU:          "MOR-OIL-50",
				Quantity:     1,
				UnitPriceIRR: 400000,
				SubtotalIRR:  400000,
			},
		},
	})
	if err != nil {
		t.Fatalf("CreateOrder failed: %v", err)
	}

	return invoicesSvc, ordersSvc, ord
}

// ─── Test 1: Jalali Invoice Number Format ─────────────────────────────────────

func TestIssueInvoiceAtomicNumberAndJalaliFormat(t *testing.T) {
	invoicesSvc, _, ord := setupTestServices(t)

	inv, err := invoicesSvc.IssueInvoice(ord.OrderNumber)
	if err != nil {
		t.Fatalf("IssueInvoice failed: %v", err)
	}

	if !strings.HasPrefix(inv.InvoiceNumber, "INV-") {
		t.Errorf("expected invoice number to start with INV-, got %s", inv.InvoiceNumber)
	}

	parts := strings.Split(inv.InvoiceNumber, "-")
	if len(parts) != 3 {
		t.Fatalf("expected 3 parts in invoice number, got %d: %s", len(parts), inv.InvoiceNumber)
	}
	if len(parts[1]) != 8 {
		t.Errorf("expected 8-digit date part, got %s", parts[1])
	}
	if len(parts[2]) != 5 {
		t.Errorf("expected 5-digit sequence part, got %s", parts[2])
	}
}

// ─── Test 2: Duplicate Issue Returns Existing (Immutable) ────────────────────

func TestDuplicateIssueInvoiceReturnsExisting(t *testing.T) {
	invoicesSvc, _, ord := setupTestServices(t)

	inv1, err := invoicesSvc.IssueInvoice(ord.OrderNumber)
	if err != nil {
		t.Fatalf("First IssueInvoice failed: %v", err)
	}

	inv2, err := invoicesSvc.IssueInvoice(ord.OrderNumber)
	if err != nil {
		t.Fatalf("Second IssueInvoice failed: %v", err)
	}

	if inv1.ID != inv2.ID || inv1.InvoiceNumber != inv2.InvoiceNumber {
		t.Errorf("expected identical invoice for duplicate issue call, got %s vs %s", inv1.ID, inv2.ID)
	}
}

// ─── Test 3: Immutable Snapshot ──────────────────────────────────────────────

func TestIssueInvoiceImmutableSnapshot(t *testing.T) {
	invoicesSvc, _, ord := setupTestServices(t)

	inv, err := invoicesSvc.IssueInvoice(ord.OrderNumber)
	if err != nil {
		t.Fatalf("IssueInvoice failed: %v", err)
	}

	if inv.Snapshot.TotalIRR != 430000 {
		t.Errorf("expected total IRR 430000, got %d", inv.Snapshot.TotalIRR)
	}
	if inv.Snapshot.TotalToman != 43000 {
		t.Errorf("expected total Toman 43000, got %d", inv.Snapshot.TotalToman)
	}
	if inv.Snapshot.Customer.RecipientName != "مریم رضایی" {
		t.Errorf("expected customer name مریم رضایی, got %s", inv.Snapshot.Customer.RecipientName)
	}
}

// ─── Test 4: Void Invoice Lifecycle ─────────────────────────────────────────

func TestVoidInvoiceLifecycle(t *testing.T) {
	invoicesSvc, _, ord := setupTestServices(t)

	inv, err := invoicesSvc.IssueInvoice(ord.OrderNumber)
	if err != nil {
		t.Fatalf("IssueInvoice failed: %v", err)
	}

	voided, err := invoicesSvc.VoidInvoice(inv.InvoiceNumber, "خطا در محاسبات مالی مشتری")
	if err != nil {
		t.Fatalf("VoidInvoice failed: %v", err)
	}

	if voided.Status != StatusVoided {
		t.Errorf("expected status voided, got %s", voided.Status)
	}
	if voided.VoidReason != "خطا در محاسبات مالی مشتری" {
		t.Errorf("expected reason recorded, got %s", voided.VoidReason)
	}
	if voided.VoidedAt == nil {
		t.Error("expected VoidedAt timestamp to be set")
	}
}

// ─── Test 5: CSV Formula Injection Defense ───────────────────────────────────

func TestNeutralizeFormulaInjection(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"=1+1", "'=1+1"},
		{"+12345", "'+12345"},
		{"-500", "'-500"},
		{"@SUM(A1:A10)", "'@SUM(A1:A10)"},
		{"مریم رضایی", "مریم رضایی"},
		{"MOR-14050515-00001", "MOR-14050515-00001"},
	}

	for _, tc := range tests {
		actual := NeutralizeFormulaInjection(tc.input)
		if actual != tc.expected {
			t.Errorf("input '%s': expected '%s', got '%s'", tc.input, tc.expected, actual)
		}
	}
}

// ─── Test 6: UTF-8 BOM Header in Export ─────────────────────────────────────

func TestUTF8BOMHeaderInExport(t *testing.T) {
	invoicesSvc, _, ord := setupTestServices(t)
	_, _ = invoicesSvc.IssueInvoice(ord.OrderNumber)

	job, err := invoicesSvc.CreateExportJob("test-admin", ExportFilters{})
	if err != nil {
		t.Fatalf("CreateExportJob failed: %v", err)
	}

	if !strings.HasPrefix(job.Content, "\xEF\xBB\xBF") {
		t.Error("expected CSV content to start with UTF-8 BOM header \\xEF\\xBB\\xBF")
	}

	if !strings.Contains(job.Content, "شماره سفارش,تاریخ,تحویل‌گیرنده") {
		t.Error("expected CSV header row in Persian")
	}
}

// ─── Test 7: A4 Print HTML Rendering ─────────────────────────────────────────

func TestRenderInvoiceHTMLA4(t *testing.T) {
	invoicesSvc, _, ord := setupTestServices(t)
	inv, _ := invoicesSvc.IssueInvoice(ord.OrderNumber)

	html, err := invoicesSvc.RenderInvoiceHTML(inv.InvoiceNumber, "a4")
	if err != nil {
		t.Fatalf("RenderInvoiceHTML(a4) failed: %v", err)
	}

	if !strings.Contains(html, "فاکتور فروش کالا و خدمات") {
		t.Error("expected A4 HTML to contain invoice title")
	}
	if !strings.Contains(html, inv.InvoiceNumber) {
		t.Error("expected A4 HTML to contain invoice number")
	}
	if !strings.Contains(html, "مریم رضایی") {
		t.Error("expected A4 HTML to contain customer name")
	}
}

// ─── Test 8: Thermal 80mm Print HTML Rendering ──────────────────────────────

func TestRenderInvoiceHTMLThermal(t *testing.T) {
	invoicesSvc, _, ord := setupTestServices(t)
	inv, _ := invoicesSvc.IssueInvoice(ord.OrderNumber)

	html, err := invoicesSvc.RenderInvoiceHTML(inv.InvoiceNumber, "thermal")
	if err != nil {
		t.Fatalf("RenderInvoiceHTML(thermal) failed: %v", err)
	}

	if !strings.Contains(html, "فیش تحویل انبار") {
		t.Error("expected thermal HTML to contain receipt title")
	}
	if !strings.Contains(html, "80mm") {
		t.Error("expected thermal HTML to set width to 80mm")
	}
}

// ─── Test 9: Concurrent Invoice Sequence Generator ──────────────────────────

func TestConcurrentInvoiceIssuing(t *testing.T) {
	invoicesSvc, ordersSvc, _ := setupTestServices(t)

	var wg sync.WaitGroup
	count := 20
	invoiceNums := make(chan string, count)

	for i := 0; i < count; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ord, _ := ordersSvc.CreateOrder(&orders.Order{
				IdempotencyKey: uuid.New().String(),
				TotalIRR:       100000,
			})
			inv, err := invoicesSvc.IssueInvoice(ord.OrderNumber)
			if err == nil {
				invoiceNums <- inv.InvoiceNumber
			}
		}()
	}

	wg.Wait()
	close(invoiceNums)

	seen := make(map[string]bool)
	for num := range invoiceNums {
		if seen[num] {
			t.Errorf("duplicate invoice number generated in concurrent execution: %s", num)
		}
		seen[num] = true
	}

	if len(seen) != count {
		t.Errorf("expected %d unique invoice numbers, got %d", count, len(seen))
	}
}
