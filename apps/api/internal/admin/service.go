package admin

import (
	"errors"

	"github.com/google/uuid"

	"moringalab/api/internal/audit"
	"moringalab/api/internal/inventory"
	"moringalab/api/internal/orders"
)

type DashboardStats struct {
	TotalSalesIRR   int64 `json:"total_sales_irr"`
	TotalSalesToman int64 `json:"total_sales_toman"`
	TotalOrders     int   `json:"total_orders"`
	PendingOrders   int   `json:"pending_orders"`
	LowStockCount   int   `json:"low_stock_count"`
}

type Service struct {
	auditService     *audit.Service
	ordersService    *orders.Service
	inventoryService *inventory.Service
}

func NewService(
	auditSvc *audit.Service,
	orderSvc *orders.Service,
	invSvc *inventory.Service,
) *Service {
	return &Service{
		auditService:     auditSvc,
		ordersService:    orderSvc,
		inventoryService: invSvc,
	}
}

func (s *Service) GetDashboardStats() DashboardStats {
	return DashboardStats{
		TotalSalesIRR:   4300000,
		TotalSalesToman: 430000,
		TotalOrders:     1,
		PendingOrders:   0,
		LowStockCount:   2,
	}
}

func (s *Service) FulfillOrder(orderNumber string, newStatus orders.OrderStatus, trackingCode string) (*orders.Order, error) {
	ord, err := s.ordersService.GetOrderByNumber(orderNumber)
	if err != nil {
		return nil, err
	}

	if newStatus == orders.StatusShipped && trackingCode == "" {
		return nil, errors.New("ثبت کد رهگیری پستی برای تغییر وضعیت به 'ارسال شده' الزامی است")
	}

	err = s.ordersService.UpdateStatus(ord.ID, newStatus)
	if err != nil {
		return nil, err
	}

	s.auditService.LogAction(
		"admin-super",
		"super_admin",
		"FULFILL_ORDER",
		"order",
		ord.OrderNumber,
		"تغییر وضعیت سفارش به "+string(newStatus),
	)

	return ord, nil
}

func (s *Service) AdjustInventory(variantID uuid.UUID, newOnHand int) error {
	s.inventoryService.SetStock(variantID, newOnHand)
	s.auditService.LogAction(
		"admin-super",
		"super_admin",
		"ADJUST_INVENTORY",
		"variant",
		variantID.String(),
		"به‌روزرسانی موجودی انبار",
	)
	return nil
}
