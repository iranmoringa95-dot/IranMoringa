package reports

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/inventory"
	"moringalab/api/internal/orders"
	"moringalab/api/internal/promotions"
)

var (
	ErrExportJobNotFound = errors.New("فایل گزارش یافت نشد یا انقضا یافته است")
	ErrInvalidDateRange  = errors.New("بازه زمانی انتخاب‌شده معتبر نیست")
)

type Service struct {
	mu           sync.RWMutex
	exportJobs   map[uuid.UUID]*ReportExportJob
	exportBlobs  map[uuid.UUID][]byte
	ordersSvc    *orders.Service
	inventorySvc *inventory.Service
	promotionsSvc *promotions.Service
}

func NewService(ordersSvc *orders.Service, inventorySvc *inventory.Service, promotionsSvc *promotions.Service) *Service {
	return &Service{
		exportJobs:    make(map[uuid.UUID]*ReportExportJob),
		exportBlobs:   make(map[uuid.UUID][]byte),
		ordersSvc:     ordersSvc,
		inventorySvc:  inventorySvc,
		promotionsSvc: promotionsSvc,
	}
}

// ─── CSV Formula Injection Defense ───────────────────────────────────────────

func NeutralizeFormulaInjection(val string) string {
	val = strings.TrimSpace(val)
	if len(val) == 0 {
		return val
	}
	firstChar := val[0]
	if firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r' {
		return "'" + val
	}
	return val
}

// ─── Executive Summary Metrics Calculator ─────────────────────────────────────

func (s *Service) GetExecutiveSummary(startDate, endDate time.Time) (*ExecutiveSummary, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var grossSales int64 = 0
	var discountTotal int64 = 0
	var shippingRevenue int64 = 0
	var refundedAmount int64 = 0
	totalOrdersCount := 0
	paidOrdersCount := 0
	cancelledOrdersCount := 0

	var allOrders []orders.Order
	if s.ordersSvc != nil {
		allOrders = s.ordersSvc.ListOrdersForAdmin("", "")
	}

	for _, ord := range allOrders {
		if !startDate.IsZero() && ord.CreatedAt.Before(startDate) {
			continue
		}
		if !endDate.IsZero() && ord.CreatedAt.After(endDate) {
			continue
		}

		totalOrdersCount++

		switch ord.Status {
		case orders.StatusPaid, orders.StatusProcessing, orders.StatusPacked, orders.StatusShipped, orders.StatusDelivered:
			paidOrdersCount++
			grossSales += ord.SubtotalIRR
			discountTotal += ord.DiscountIRR
			shippingRevenue += ord.ShippingFeeIRR
		case orders.StatusCancelled:
			cancelledOrdersCount++
		case orders.StatusRefunded:
			refundedAmount += ord.TotalIRR
		}
	}

	// Exact Integer IRR Net Revenue Formula
	netRevenue := grossSales - discountTotal - refundedAmount + shippingRevenue

	var aov int64 = 0
	if paidOrdersCount > 0 {
		aov = netRevenue / int64(paidOrdersCount)
	}

	successRate := 0.0
	if totalOrdersCount > 0 {
		successRate = (float64(paidOrdersCount) / float64(totalOrdersCount)) * 100.0
	}

	// Inventory Stock Alerts
	lowStockCount := 0
	outOfStockCount := 0
	if s.inventorySvc != nil {
		items := s.inventorySvc.GetStockLedgerSummary()
		for _, item := range items {
			if item.Available <= 0 {
				outOfStockCount++
			} else if item.Available <= 5 {
				lowStockCount++
			}
		}
	}

	return &ExecutiveSummary{
		GrossSalesIRR:        grossSales,
		DiscountTotalIRR:     discountTotal,
		ShippingRevenueIRR:   shippingRevenue,
		RefundedAmountIRR:    refundedAmount,
		NetRevenueIRR:        netRevenue,
		TotalOrders:          totalOrdersCount,
		PaidOrders:           paidOrdersCount,
		CancelledOrders:      cancelledOrdersCount,
		PaymentSuccessRate:   successRate,
		AverageOrderValueIRR: aov,
		LowStockCount:        lowStockCount,
		OutOfStockCount:      outOfStockCount,
		GeneratedAt:          time.Now(),
		CurrencyUnit:         "IRR",
	}, nil
}

// ─── Time-Series Sales Analytics ─────────────────────────────────────────────

func (s *Service) GetSalesTimeSeries(startDate, endDate time.Time) ([]TimeSeriesDataPoint, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.Local
	}

	dayMap := make(map[string]*TimeSeriesDataPoint)

	var allOrders []orders.Order
	if s.ordersSvc != nil {
		allOrders = s.ordersSvc.ListOrdersForAdmin("", "")
	}

	for _, ord := range allOrders {
		if ord.Status == orders.StatusPaid || ord.Status == orders.StatusProcessing || ord.Status == orders.StatusPacked || ord.Status == orders.StatusShipped || ord.Status == orders.StatusDelivered {
			dateStr := ord.CreatedAt.In(loc).Format("2006-01-02")
			dp, exists := dayMap[dateStr]
			if !exists {
				dp = &TimeSeriesDataPoint{Date: dateStr}
				dayMap[dateStr] = dp
			}
			dp.GrossSalesIRR += ord.SubtotalIRR
			dp.NetRevenueIRR += (ord.SubtotalIRR - ord.DiscountIRR + ord.ShippingFeeIRR)
			dp.PaidOrdersCount++
		}
	}

	result := make([]TimeSeriesDataPoint, 0, len(dayMap))
	for _, dp := range dayMap {
		result = append(result, *dp)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Date < result[j].Date
	})

	return result, nil
}

// ─── Top-Selling Products Analytics ─────────────────────────────────────────

func (s *Service) GetTopSellingProducts(limit int) ([]ProductPerformanceItem, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	prodMap := make(map[uuid.UUID]*ProductPerformanceItem)

	var allOrders []orders.Order
	if s.ordersSvc != nil {
		allOrders = s.ordersSvc.ListOrdersForAdmin("", "")
	}

	for _, ord := range allOrders {
		if ord.Status == orders.StatusPaid || ord.Status == orders.StatusProcessing || ord.Status == orders.StatusPacked || ord.Status == orders.StatusShipped || ord.Status == orders.StatusDelivered {
			for _, item := range ord.Items {
				pItem, exists := prodMap[item.ProductID]
				if !exists {
					pItem = &ProductPerformanceItem{
						ProductID:     item.ProductID,
						SKU:           item.SKUSnapshot,
						ProductNameFA: item.ProductNameSnapshot,
					}
					prodMap[item.ProductID] = pItem
				}
				pItem.UnitsSold += item.Quantity
				pItem.GrossSalesIRR += (item.UnitPriceIRR * int64(item.Quantity))
				pItem.NetRevenueIRR += (item.TotalPriceIRR)
			}
		}
	}

	result := make([]ProductPerformanceItem, 0, len(prodMap))
	for _, item := range prodMap {
		result = append(result, *item)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].UnitsSold > result[j].UnitsSold
	})

	if limit > 0 && len(result) > limit {
		result = result[:limit]
	}

	return result, nil
}

// ─── Async Report CSV Export Engine ──────────────────────────────────────────

func (s *Service) CreateReportExportJob(reportType, requestedBy string) (*ReportExportJob, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var buf bytes.Buffer
	// UTF-8 BOM Header for Excel Persian rendering
	buf.Write([]byte{0xEF, 0xBB, 0xBF})

	w := csv.NewWriter(&buf)
	rowCount := 0

	if reportType == "products_performance" {
		w.Write([]string{"شناسه محصول", "SKU", "نام محصول", "تعداد فروخته‌شده", "فروش ناخالص (ریال)", "درآمد خالص (ریال)"})
		rowCount++

		items, _ := s.GetTopSellingProducts(100)
		for _, item := range items {
			w.Write([]string{
				NeutralizeFormulaInjection(item.ProductID.String()),
				NeutralizeFormulaInjection(item.SKU),
				NeutralizeFormulaInjection(item.ProductNameFA),
				fmt.Sprintf("%d", item.UnitsSold),
				fmt.Sprintf("%d", item.GrossSalesIRR),
				fmt.Sprintf("%d", item.NetRevenueIRR),
			})
			rowCount++
		}
	} else {
		// Default: Sales Summary Export
		w.Write([]string{"شاخص مالی", "مقدار (ریال / تعداد)", "واحد"})
		summary, _ := s.GetExecutiveSummary(time.Time{}, time.Time{})

		w.Write([]string{"فروش ناخالص (Gross Sales)", fmt.Sprintf("%d", summary.GrossSalesIRR), "ریال"})
		w.Write([]string{"مجموع تخفیفات (Discount)", fmt.Sprintf("%d", summary.DiscountTotalIRR), "ریال"})
		w.Write([]string{"درآمد ارسال (Shipping)", fmt.Sprintf("%d", summary.ShippingRevenueIRR), "ریال"})
		w.Write([]string{"مبلغ مرجوعی (Refund)", fmt.Sprintf("%d", summary.RefundedAmountIRR), "ریال"})
		w.Write([]string{"درآمد خالص (Net Revenue)", fmt.Sprintf("%d", summary.NetRevenueIRR), "ریال"})
		w.Write([]string{"تعداد سفارشات پرداخت‌شده", fmt.Sprintf("%d", summary.PaidOrders), "عدد"})
		w.Write([]string{"میانگین ارزش سفارش (AOV)", fmt.Sprintf("%d", summary.AverageOrderValueIRR), "ریال"})
		rowCount += 8
	}

	w.Flush()

	jobID := uuid.New()
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)

	job := &ReportExportJob{
		ID:          jobID,
		ReportType:  reportType,
		RequestedBy: NeutralizeFormulaInjection(requestedBy),
		RowCount:    rowCount,
		Status:      "completed",
		DownloadURL: fmt.Sprintf("/api/v1/admin/reports/exports/%s/download", jobID.String()),
		ExpiresAt:   expiresAt,
		CreatedAt:   now,
	}

	s.exportJobs[jobID] = job
	s.exportBlobs[jobID] = buf.Bytes()

	return job, nil
}

func (s *Service) GetExportJobDownload(jobID uuid.UUID) ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	job, exists := s.exportJobs[jobID]
	if !exists || time.Now().After(job.ExpiresAt) {
		return nil, ErrExportJobNotFound
	}

	blob, exists := s.exportBlobs[jobID]
	if !exists {
		return nil, ErrExportJobNotFound
	}

	return blob, nil
}
