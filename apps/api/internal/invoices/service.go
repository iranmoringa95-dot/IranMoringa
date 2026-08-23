package invoices

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

type Service struct {
	mu            sync.RWMutex
	invoices      map[uuid.UUID]*Invoice
	byNumber      map[string]*Invoice
	byOrderNum    map[string]*Invoice
	exportJobs    map[uuid.UUID]*ExportJob
	ordersSvc     *orders.Service
	seqCounter    uint64
	defaultSeller SellerSnapshot
}

func NewService(ordersSvc *orders.Service) *Service {
	return &Service{
		invoices:   make(map[uuid.UUID]*Invoice),
		byNumber:   make(map[string]*Invoice),
		byOrderNum: make(map[string]*Invoice),
		exportJobs: make(map[uuid.UUID]*ExportJob),
		ordersSvc:  ordersSvc,
		defaultSeller: SellerSnapshot{
			LegalTitle:   "فروشگاه اینترنتی سبزینه (MoringaLab)",
			NationalID:   "14012345678",
			EconomicCode: "411122334455",
			Phone:        "021-88889999",
			Province:     "تهران",
			City:         "تهران",
			Address:      "تهران، میدان ونک، خیابان ملاصدرا، پلاک ۱",
			PostalCode:   "1991234567",
		},
	}
}

// ─── Jalali Invoice Number Generator ─────────────────────────────────────────

func (s *Service) GenerateInvoiceNumber() string {
	seq := atomic.AddUint64(&s.seqCounter, 1)
	now := time.Now()
	jy, jm, jd := gregorianToJalali(now.Year(), int(now.Month()), now.Day())
	return fmt.Sprintf("INV-%04d%02d%02d-%05d", jy, jm, jd, seq)
}

func gregorianToJalali(gy, gm, gd int) (int, int, int) {
	gDaysInMonth := []int{0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334}
	gy2 := gy + 1
	if gm > 2 {
		gy2 = gy
	}

	days := 355666 + (365 * gy) + ((gy2 + 3) / 4) - ((gy2 + 99) / 100) + ((gy2 + 399) / 400) + gd + gDaysInMonth[gm-1]
	jy := -1595 + (33 * ((days - 1) / 12053))
	days = (days - 1) % 12053

	jy += 4 * (days / 1461)
	days %= 1461

	if days > 365 {
		jy += (days - 1) / 365
		days = (days - 1) % 365
	}

	jm := 0
	if days < 186 {
		jm = 1 + (days / 31)
		jd := 1 + (days % 31)
		return jy, jm, jd
	}
	days -= 186
	jm = 7 + (days / 30)
	jd := 1 + (days % 30)
	return jy, jm, jd
}

// ─── Issue Invoice ───────────────────────────────────────────────────────────

func (s *Service) IssueInvoice(orderNumber string) (*Invoice, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// If already issued for this order, return existing (Immutable)
	if existing, exists := s.byOrderNum[orderNumber]; exists {
		return existing, nil
	}

	ord, err := s.ordersSvc.GetOrderByNumber(orderNumber)
	if err != nil {
		return nil, fmt.Errorf("سفارش یافت نشد: %w", err)
	}

	now := time.Now()
	invID := uuid.New()
	invNum := s.GenerateInvoiceNumber()

	// Build Customer Snapshot
	custSnap := InvoiceCustomerSnapshot{
		RecipientName:  ord.Address.RecipientName,
		RecipientPhone: ord.Address.RecipientPhone,
		Province:       ord.Address.Province,
		City:           ord.Address.City,
		PostalAddress:  ord.Address.PostalAddress,
		PostalCode:     ord.Address.PostalCode,
	}

	// Build Items Snapshot
	itemsSnap := make([]InvoiceItemSnapshot, len(ord.Items))
	for i, item := range ord.Items {
		itemsSnap[i] = InvoiceItemSnapshot{
			ProductID:    item.ProductID,
			VariantID:    item.VariantID,
			ProductTitle: item.ProductTitle,
			VariantTitle: item.VariantTitle,
			SKU:          item.SKU,
			Quantity:     item.Quantity,
			UnitPriceIRR: item.UnitPriceIRR,
			SubtotalIRR:  item.SubtotalIRR,
		}
	}

	// Build Full Invoice Snapshot
	snapshot := InvoiceSnapshot{
		Seller:         s.defaultSeller,
		Customer:       custSnap,
		Items:          itemsSnap,
		SubtotalIRR:    ord.SubtotalIRR,
		DiscountIRR:    ord.DiscountIRR,
		ShippingFeeIRR: ord.ShippingFeeIRR,
		TaxIRR:         0,
		TotalIRR:       ord.TotalIRR,
		TotalToman:     ord.TotalIRR / 10,
	}

	// Hash calculation for audit integrity
	hashData := fmt.Sprintf("%s:%s:%d", invNum, ord.OrderNumber, ord.TotalIRR)
	hashSum := sha256.Sum256([]byte(hashData))
	hashHex := hex.EncodeToString(hashSum[:])

	inv := &Invoice{
		ID:            invID,
		OrderID:       ord.ID,
		OrderNumber:   ord.OrderNumber,
		InvoiceNumber: invNum,
		Status:        StatusIssued,
		IssuedAt:      now,
		Snapshot:      snapshot,
		SnapshotHash:  hashHex,
	}

	s.invoices[invID] = inv
	s.byNumber[invNum] = inv
	s.byOrderNum[ord.OrderNumber] = inv

	return inv, nil
}

// ─── Lookups & Actions ───────────────────────────────────────────────────────

func (s *Service) GetInvoiceByNumber(invoiceNumber string) (*Invoice, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	inv, exists := s.byNumber[invoiceNumber]
	if !exists {
		return nil, fmt.Errorf("فاکتور با شماره %s یافت نشد", invoiceNumber)
	}
	return inv, nil
}

func (s *Service) GetInvoiceByOrder(orderNumber string) (*Invoice, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	inv, exists := s.byOrderNum[orderNumber]
	if !exists {
		return nil, fmt.Errorf("فاکتوری برای سفارش %s صادر نشده است", orderNumber)
	}
	return inv, nil
}

func (s *Service) VoidInvoice(invoiceNumber string, reason string) (*Invoice, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	inv, exists := s.byNumber[invoiceNumber]
	if !exists {
		return nil, fmt.Errorf("فاکتور یافت نشد")
	}

	if inv.Status == StatusVoided {
		return inv, nil
	}

	now := time.Now()
	inv.Status = StatusVoided
	inv.VoidedAt = &now
	inv.VoidReason = reason

	return inv, nil
}

// ─── HTML Print Rendering (A4 & Thermal 80mm) ────────────────────────────────

func (s *Service) RenderInvoiceHTML(invoiceNumber string, format string) (string, error) {
	inv, err := s.GetInvoiceByNumber(invoiceNumber)
	if err != nil {
		return "", err
	}

	if format == "thermal" {
		return s.renderThermalHTML(inv), nil
	}
	return s.renderA4HTML(inv), nil
}

func (s *Service) renderA4HTML(inv *Invoice) string {
	var itemsHTML strings.Builder
	for i, item := range inv.Snapshot.Items {
		itemsHTML.WriteString(fmt.Sprintf(`
			<tr style="border-bottom: 1px solid #e2e8f0;">
				<td style="padding: 10px; text-align: center;">%d</td>
				<td style="padding: 10px;">
					<strong>%s</strong>
					<br><span style="font-size: 11px; color: #64748b;">%s (کد: %s)</span>
				</td>
				<td style="padding: 10px; text-align: center;">%d</td>
				<td style="padding: 10px; text-align: left;">%s</td>
				<td style="padding: 10px; text-align: left; font-weight: bold;">%s</td>
			</tr>`,
			i+1,
			item.ProductTitle,
			item.VariantTitle,
			item.SKU,
			item.Quantity,
			formatToman(item.UnitPriceIRR),
			formatToman(item.SubtotalIRR),
		))
	}

	voidBanner := ""
	if inv.Status == StatusVoided {
		voidBanner = `<div style="background: #fee2e2; border: 2px solid #ef4444; color: #991b1b; padding: 12px; text-align: center; font-weight: bold; border-radius: 8px; margin-bottom: 20px;">
			⚠️ این فاکتور باطل شده است (Voided). علت: ` + inv.VoidReason + `
		</div>`
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
	<meta charset="UTF-8">
	<title>فاکتور رسمی %s - سبزینه</title>
	<style>
		body { font-family: Tahoma, Vazir, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; }
		.invoice-box { max-width: 800px; margin: auto; background: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
		.header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
		.table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
		.table th { background: #f1f5f9; padding: 10px; font-weight: bold; text-align: right; border-bottom: 2px solid #cbd5e1; }
		.totals { width: 300px; margin-left: 0; margin-right: auto; text-align: left; font-size: 13px; line-height: 2; }
		@media print { body { background: none; padding: 0; } .invoice-box { border: none; box-shadow: none; width: 100%%; } }
	</style>
</head>
<body>
	<div class="invoice-box">
		%s
		<div class="header">
			<div>
				<h1 style="margin:0; color:#047857; font-size:22px;">فاکتور فروش کالا و خدمات</h1>
				<p style="margin:4px 0; color:#64748b;">فروشگاه اینترنتی سبزینه (MoringaLab)</p>
			</div>
			<div style="text-align:left;">
				<p style="margin:2px 0;"><strong>شماره فاکتور:</strong> <span style="font-family:monospace;">%s</span></p>
				<p style="margin:2px 0;"><strong>شماره سفارش:</strong> <span style="font-family:monospace;">%s</span></p>
				<p style="margin:2px 0;"><strong>تاریخ صدور:</strong> %s</p>
			</div>
		</div>

		<!-- Seller & Customer Details -->
		<table style="width:100%%; margin-bottom:20px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; padding:10px;">
			<tr>
				<td style="width:50%%; vertical-align:top; padding:8px;">
					<h3 style="margin:0 0 6px 0; color:#047857;">مشخصات فروشنده:</h3>
					<p style="margin:2px 0;">نام شخص حقوقی: %s</p>
					<p style="margin:2px 0;">شناسه ملی: %s | کد اقتصادی: %s</p>
					<p style="margin:2px 0;">نشانی: %s</p>
					<p style="margin:2px 0;">تلفن: %s</p>
				</td>
				<td style="width:50%%; vertical-align:top; padding:8px; border-right:1px solid #e2e8f0;">
					<h3 style="margin:0 0 6px 0; color:#047857;">مشخصات خریدار:</h3>
					<p style="margin:2px 0;">تحویل‌گیرنده: %s</p>
					<p style="margin:2px 0;">شماره تماس: %s</p>
					<p style="margin:2px 0;">استان و شهر: %s، %s</p>
					<p style="margin:2px 0;">نشانی: %s</p>
					<p style="margin:2px 0;">کد پستی: %s</p>
				</td>
			</tr>
		</table>

		<!-- Items Table -->
		<table class="table">
			<thead>
				<tr>
					<th style="text-align:center;">ردیف</th>
					<th>شرح کالا / خدمات</th>
					<th style="text-align:center;">تعداد</th>
					<th style="text-align:left;">قیمت واحد (تومان)</th>
					<th style="text-align:left;">جمع کل (تومان)</th>
				</tr>
			</thead>
			<tbody>
				%s
			</tbody>
		</table>

		<!-- Financial Summary -->
		<div class="totals">
			<div style="display:flex; justify-between;"><span>جمع اقلام:</span> <span>%s تومان</span></div>
			<div style="display:flex; justify-between; color:#059669;"><span>تخفیف:</span> <span>−%s تومان</span></div>
			<div style="display:flex; justify-between;"><span>هزینه ارسال:</span> <span>%s تومان</span></div>
			<hr style="border:none; border-top:1px solid #cbd5e1; margin:8px 0;">
			<div style="display:flex; justify-between; font-size:15px; font-weight:bold; color:#047857;">
				<span>مبلغ قابل پرداخت:</span> <span>%s تومان</span>
			</div>
		</div>
	</div>
</body>
</html>`,
		inv.InvoiceNumber,
		voidBanner,
		inv.InvoiceNumber,
		inv.OrderNumber,
		inv.IssuedAt.Format("2006/01/02"),
		inv.Snapshot.Seller.LegalTitle,
		inv.Snapshot.Seller.NationalID,
		inv.Snapshot.Seller.EconomicCode,
		inv.Snapshot.Seller.Address,
		inv.Snapshot.Seller.Phone,
		inv.Snapshot.Customer.RecipientName,
		inv.Snapshot.Customer.RecipientPhone,
		inv.Snapshot.Customer.Province,
		inv.Snapshot.Customer.City,
		inv.Snapshot.Customer.PostalAddress,
		inv.Snapshot.Customer.PostalCode,
		itemsHTML.String(),
		formatToman(inv.Snapshot.SubtotalIRR),
		formatToman(inv.Snapshot.DiscountIRR),
		formatToman(inv.Snapshot.ShippingFeeIRR),
		formatToman(inv.Snapshot.TotalIRR),
	)
}

func (s *Service) renderThermalHTML(inv *Invoice) string {
	var itemsHTML strings.Builder
	for _, item := range inv.Snapshot.Items {
		itemsHTML.WriteString(fmt.Sprintf(`
			<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
				<span>%s x%d</span>
				<span>%s تومان</span>
			</div>`,
			item.ProductTitle, item.Quantity, formatToman(item.SubtotalIRR)))
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
	<meta charset="UTF-8">
	<title>رسید انبار %s</title>
	<style>
		body { font-family: Tahoma, sans-serif; width: 80mm; margin: 0 auto; padding: 10px; font-size: 11px; background: #fff; }
		.divider { border-top: 1px dashed #000; margin: 8px 0; }
		@media print { body { width: 80mm; padding: 0; } }
	</style>
</head>
<body>
	<div style="text-align:center; font-weight:bold; font-size:14px;">فروشگاه سبزینه</div>
	<div style="text-align:center; font-size:10px;">فیش تحویل انبار</div>
	<div class="divider"></div>
	<div><strong>شماره سفارش:</strong> %s</div>
	<div><strong>تحویل‌گیرنده:</strong> %s</div>
	<div><strong>تلفن:</strong> %s</div>
	<div><strong>شهر:</strong> %s</div>
	<div class="divider"></div>
	%s
	<div class="divider"></div>
	<div style="display:flex; justify-content:space-between; font-weight:bold; font-size:12px;">
		<span>مبلغ کل:</span>
		<span>%s تومان</span>
	</div>
</body>
</html>`,
		inv.OrderNumber,
		inv.OrderNumber,
		inv.Snapshot.Customer.RecipientName,
		inv.Snapshot.Customer.RecipientPhone,
		inv.Snapshot.Customer.City,
		itemsHTML.String(),
		formatToman(inv.Snapshot.TotalIRR),
	)
}

func formatToman(irr int64) string {
	toman := irr / 10
	return fmt.Sprintf("%d", toman)
}

// ─── CSV Export Engine & Formula Injection Neutralizer ───────────────────────

// NeutralizeFormulaInjection neutralizes CSV formula injection vulnerabilities.
// If a string field starts with '=', '+', '-', '@', '\t', or '\r', it prepends a single quote (').
func NeutralizeFormulaInjection(val string) string {
	if len(val) == 0 {
		return val
	}
	firstChar := val[0]
	if firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r' {
		return "'" + val
	}
	return val
}

func (s *Service) CreateExportJob(requestedBy string, filters ExportFilters) (*ExportJob, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	jobID := uuid.New()
	now := time.Now()

	// Query orders from order service
	orderList := s.ordersSvc.ListOrders(orders.ListFilter{
		Status:      orders.OrderStatus(filters.Status),
		SearchQuery: filters.SearchQuery,
		Page:        1,
		PageSize:    1000,
	})

	var csvBuilder strings.Builder

	// Prepend UTF-8 BOM Header (\xEF\xBB\xBF) so Excel opens Persian text cleanly
	csvBuilder.WriteString("\xEF\xBB\xBF")

	// Write CSV Header
	csvBuilder.WriteString("شماره سفارش,تاریخ,تحویل‌گیرنده,شهر,وضعیت,جمع اقلام (تومان),تخفیف (تومان),هزینه ارسال (تومان),مبلغ نهایی (تومان)\n")

	// Write rows with CSV formula injection neutralization
	for _, ord := range orderList.Orders {
		orderNum := NeutralizeFormulaInjection(ord.OrderNumber)
		dateStr := ord.CreatedAt.Format("2006-01-02")
		recipient := NeutralizeFormulaInjection(ord.Address.RecipientName)
		city := NeutralizeFormulaInjection(ord.Address.City)
		statusStr := string(ord.Status)

		subtotalToman := ord.SubtotalIRR / 10
		discountToman := ord.DiscountIRR / 10
		shippingToman := ord.ShippingFeeIRR / 10
		totalToman := ord.TotalIRR / 10

		csvBuilder.WriteString(fmt.Sprintf("%s,%s,%s,%s,%s,%d,%d,%d,%d\n",
			orderNum, dateStr, recipient, city, statusStr, subtotalToman, discountToman, shippingToman, totalToman))
	}

	job := &ExportJob{
		ID:          jobID,
		Type:        "orders_csv",
		Filters:     filters,
		Status:      ExportStatusCompleted,
		RequestedBy: requestedBy,
		Content:     csvBuilder.String(),
		Filename:    fmt.Sprintf("orders-export-%s.csv", now.Format("20060102-150405")),
		ExpiresAt:   now.Add(24 * time.Hour),
		CreatedAt:   now,
	}

	s.exportJobs[jobID] = job
	return job, nil
}

func (s *Service) GetExportJob(jobID uuid.UUID) (*ExportJob, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	job, exists := s.exportJobs[jobID]
	if !exists {
		return nil, fmt.Errorf("فایل خروجی یافت نشد یا منقضی شده است")
	}
	return job, nil
}
