package admin

import (
	"strings"

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

type CustomerSummary struct {
	ID              string   `json:"id"`
	FullName        string   `json:"full_name"`
	Phone           string   `json:"phone"`
	City            string   `json:"city"`
	Province        string   `json:"province"`
	PostalAddress   string   `json:"postal_address"`
	PostalCode      string   `json:"postal_code"`
	TotalOrders     int      `json:"total_orders"`
	TotalSpentIRR   int64    `json:"total_spent_irr"`
	TotalSpentToman int64    `json:"total_spent_toman"`
	Tier            string   `json:"tier"` // gold, silver, bronze
	LastOrderDate   string   `json:"last_order_date,omitempty"`
}

func (s *Service) GetDashboardStats() DashboardStats {
	allOrders := s.ordersService.GetAllOrders()
	var totalSalesIRR int64
	var pendingCount int

	for _, ord := range allOrders {
		if ord.Status != orders.StatusCancelled && ord.Status != orders.StatusRefunded {
			totalSalesIRR += ord.TotalIRR
		}
		if ord.Status == orders.StatusPendingPayment || ord.Status == orders.StatusProcessing {
			pendingCount++
		}
	}

	return DashboardStats{
		TotalSalesIRR:   totalSalesIRR,
		TotalSalesToman: totalSalesIRR / 10,
		TotalOrders:     len(allOrders),
		PendingOrders:   pendingCount,
		LowStockCount:   2,
	}
}

func (s *Service) ListCustomers(searchQuery string) []CustomerSummary {
	allOrders := s.ordersService.GetAllOrders()
	custMap := make(map[string]*CustomerSummary)

	// Pre-seed demo customers
	demoCustomers := []CustomerSummary{
		{
			ID:              "cust-1",
			FullName:        "علی رضایی",
			Phone:           "09121112233",
			City:            "تهران",
			Province:        "تهران",
			PostalAddress:   "خیابان ولیعصر، بالاتر از میدان ونک، کوچه شادمان، پلاک ۱۲",
			PostalCode:      "1987654321",
			TotalOrders:     4,
			TotalSpentIRR:   18500000,
			TotalSpentToman: 1850000,
			Tier:            "gold",
			LastOrderDate:   "1403/05/20",
		},
		{
			ID:              "cust-2",
			FullName:        "سارا احمدی",
			Phone:           "09351234567",
			City:            "اصفهان",
			Province:        "اصفهان",
			PostalAddress:   "خیابان چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲",
			PostalCode:      "8134567890",
			TotalOrders:     2,
			TotalSpentIRR:   7200000,
			TotalSpentToman: 720000,
			Tier:            "silver",
			LastOrderDate:   "1403/05/18",
		},
		{
			ID:              "cust-3",
			FullName:        "محمد حسینی",
			Phone:           "09187654321",
			City:            "شیراز",
			Province:        "فارس",
			PostalAddress:   "بلوار زند، روبروی دانشکده مهندسی، مجتمع پردیس",
			PostalCode:      "7145678901",
			TotalOrders:     1,
			TotalSpentIRR:   3500000,
			TotalSpentToman: 350000,
			Tier:            "bronze",
			LastOrderDate:   "1403/05/10",
		},
	}

	for _, d := range demoCustomers {
		copyItem := d
		custMap[d.Phone] = &copyItem
	}

	// Aggregate from real orders
	for _, ord := range allOrders {
		phone := ord.Address.RecipientPhone
		if phone == "" && ord.GuestPhone != nil {
			phone = *ord.GuestPhone
		}
		if phone == "" {
			continue
		}

		c, exists := custMap[phone]
		if !exists {
			c = &CustomerSummary{
				ID:            "cust-" + phone,
				FullName:      ord.Address.RecipientName,
				Phone:         phone,
				City:          ord.Address.City,
				Province:      ord.Address.Province,
				PostalAddress: ord.Address.PostalAddress,
				PostalCode:    ord.Address.PostalCode,
				Tier:          "bronze",
			}
			custMap[phone] = c
		}
		c.TotalOrders++
		c.TotalSpentIRR += ord.TotalIRR
		c.TotalSpentToman = c.TotalSpentIRR / 10
		if c.TotalSpentToman > 1500000 {
			c.Tier = "gold"
		} else if c.TotalSpentToman > 600000 {
			c.Tier = "silver"
		}
	}

	var results []CustomerSummary
	for _, c := range custMap {
		if searchQuery != "" {
			if !strings.Contains(c.FullName, searchQuery) && !strings.Contains(c.Phone, searchQuery) && !strings.Contains(c.City, searchQuery) {
				continue
			}
		}
		results = append(results, *c)
	}

	return results
}

func (s *Service) FulfillOrder(orderNumber string, newStatus orders.OrderStatus, trackingCode string) (*orders.Order, error) {
	ord, err := s.ordersService.GetOrderByNumber(orderNumber)
	if err != nil {
		return nil, err
	}

	err = s.ordersService.TransitionStatus(orders.TransitionRequest{
		OrderID:      ord.ID,
		NewStatus:    newStatus,
		ActorType:    orders.ActorAdmin,
		ActorID:      "admin-super",
		TrackingCode: trackingCode,
		Note:         "تغییر وضعیت سفارش به " + string(newStatus),
	})
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
