package checkout

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/carts"
	"moringalab/api/internal/inventory"
	"moringalab/api/internal/notifications"
	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
	"moringalab/api/internal/shipping"
)

type SubmitCheckoutRequest struct {
	CartID         uuid.UUID `json:"cart_id"`
	RecipientName  string    `json:"recipient_name"`
	RecipientPhone string    `json:"recipient_phone"`
	Province       string    `json:"province"`
	City           string    `json:"city"`
	PostalAddress  string    `json:"postal_address"`
	PostalCode     string    `json:"postal_code"`
	ShippingMethod string    `json:"shipping_method"`
	IdempotencyKey string    `json:"idempotency_key"`
}

type SubmitCheckoutResponse struct {
	Order   *orders.Order     `json:"order"`
	Payment *payments.Payment `json:"payment"`
}

type OrderPlacedNotifier interface {
	NotifyOrderPlaced(orderNumber string, totalIRR int64, recipientPhone string, recipientName string, orderStatus string) (*notifications.NotificationDelivery, error)
}

type Service struct {
	mu               sync.RWMutex
	cartService      *carts.Service
	inventoryService *inventory.Service
	orderService     *orders.Service
	paymentService   *payments.Service
	shippingService  *shipping.Service
	notifier         OrderPlacedNotifier
	seenOrders       map[string]*SubmitCheckoutResponse
}

func NewService(
	cartSvc *carts.Service,
	invSvc *inventory.Service,
	orderSvc *orders.Service,
	paySvc *payments.Service,
	shipSvc *shipping.Service,
) *Service {
	return &Service{
		cartService:      cartSvc,
		inventoryService: invSvc,
		orderService:     orderSvc,
		paymentService:   paySvc,
		shippingService:  shipSvc,
		seenOrders:       make(map[string]*SubmitCheckoutResponse),
	}
}

func (s *Service) SetNotifier(n OrderPlacedNotifier) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.notifier = n
}

func (s *Service) SubmitCheckout(req SubmitCheckoutRequest) (*SubmitCheckoutResponse, error) {
	s.mu.Lock()
	if req.IdempotencyKey != "" {
		if prev, exists := s.seenOrders[req.IdempotencyKey]; exists {
			s.mu.Unlock()
			return prev, nil
		}
	}
	s.mu.Unlock()

	// 1. Get cart by ID if provided, or active guest cart
	var cart *carts.Cart
	var err error
	if req.CartID != uuid.Nil {
		cart, err = s.cartService.GetCart(req.CartID)
		if err != nil {
			cart = s.cartService.GetOrCreateCart(nil, nil)
		}
	} else {
		cart = s.cartService.GetOrCreateCart(nil, nil)
	}

	if cart == nil || len(cart.Items) == 0 {
		return nil, errors.New("سبد خرید شما خالی است")
	}

	// 2. Determine and calculate shipping fee & validate method
	shippingMethod := req.ShippingMethod
	if shippingMethod == "" {
		shippingMethod = "post_pishtaz"
	}

	var shippingFeeIRR int64 = cart.Breakdown.ShippingFeeIRR
	if s.shippingService != nil {
		parcelItems := make([]shipping.ShippingParcelItem, len(cart.Items))
		for i, item := range cart.Items {
			w := item.ShippingWeightGrams
			if w <= 0 {
				w = item.NetWeightGrams
			}
			if w <= 0 {
				w = 200
			}
			parcelItems[i] = shipping.ShippingParcelItem{
				WeightGrams: w,
				LengthCM:    10,
				WidthCM:     10,
				HeightCM:    5,
				Quantity:    item.Quantity,
			}
		}

		calculatedFee, err := s.shippingService.CalculateShippingFee(req.Province, req.City, shippingMethod, parcelItems)
		if err != nil {
			return nil, err
		}

		// Apply free shipping rule if applicable
		settings := s.shippingService.GetTariffSettings()
		if shippingMethod == "post_pishtaz" && settings.FreeShippingThresholdIRR > 0 && cart.Breakdown.SubtotalIRR >= settings.FreeShippingThresholdIRR {
			calculatedFee = 0
		}
		shippingFeeIRR = calculatedFee
	}

	// 3. Reserve inventory for items
	reservations := make([]*inventory.StockReservation, 0, len(cart.Items))
	for _, item := range cart.Items {
		res, err := s.inventoryService.ReserveStock(item.VariantID, item.Quantity, nil, 15*time.Minute)
		if err != nil {
			// Rollback previous reservations atomically
			for _, r := range reservations {
				_ = s.inventoryService.ReleaseReservation(r.ID)
			}
			return nil, err
		}
		reservations = append(reservations, res)
	}

	// 4. Freeze item snapshots
	orderItems := make([]orders.OrderItemSnapshot, len(cart.Items))
	for i, item := range cart.Items {
		orderItems[i] = orders.OrderItemSnapshot{
			ID:           uuid.New(),
			ProductID:    item.ProductID,
			VariantID:    item.VariantID,
			ProductTitle: item.ProductTitle,
			VariantTitle: item.VariantTitle,
			SKU:          item.SKU,
			UnitPriceIRR: item.UnitPriceIRR,
			Quantity:     item.Quantity,
			SubtotalIRR:  item.LineSubtotalIRR,
			WeightGrams:  item.ShippingWeightGrams,
		}
	}

	// 5. Freeze address snapshot
	addressSnap := orders.OrderAddressSnapshot{
		RecipientName:  req.RecipientName,
		RecipientPhone: req.RecipientPhone,
		Province:       req.Province,
		City:           req.City,
		PostalAddress:  req.PostalAddress,
		PostalCode:     req.PostalCode,
	}

	// 6. Compute total with calculated shipping fee
	discountTotal := cart.Breakdown.ItemDiscountIRR + cart.Breakdown.CartDiscountIRR
	grandTotal := cart.Breakdown.SubtotalIRR - discountTotal + shippingFeeIRR
	if grandTotal < 0 {
		grandTotal = 0
	}

	// 7. Create Order with snapshots & Idempotency-Key
	ord, err := s.orderService.CreateOrder(&orders.Order{
		GuestPhone:     &req.RecipientPhone,
		SubtotalIRR:    cart.Breakdown.SubtotalIRR,
		DiscountIRR:    discountTotal,
		ShippingFeeIRR: shippingFeeIRR,
		TotalIRR:       grandTotal,
		ShippingMethod: shippingMethod,
		IdempotencyKey: req.IdempotencyKey,
		Address:        addressSnap,
		Items:          orderItems,
	})
	if err != nil {
		// Rollback reservations
		for _, r := range reservations {
			_ = s.inventoryService.ReleaseReservation(r.ID)
		}
		return nil, err
	}

	// 8. Create Payment session
	payment, err := s.paymentService.CreatePaymentSession(ord.ID, ord.OrderNumber, ord.TotalIRR)
	if err != nil {
		// Rollback reservations
		for _, r := range reservations {
			_ = s.inventoryService.ReleaseReservation(r.ID)
		}
		return nil, err
	}

	res := &SubmitCheckoutResponse{
		Order:   ord,
		Payment: payment,
	}

	// 9. Dispatch Order Placed notification (SMS to customer and admin)
	if s.notifier != nil {
		phone := req.RecipientPhone
		name := req.RecipientName
		orderNum := ord.OrderNumber
		orderTotal := ord.TotalIRR
		status := string(ord.Status)
		go func() {
			_, _ = s.notifier.NotifyOrderPlaced(orderNum, orderTotal, phone, name, status)
		}()
	}

	s.mu.Lock()
	if req.IdempotencyKey != "" {
		s.seenOrders[req.IdempotencyKey] = res
	}
	s.mu.Unlock()

	return res, nil
}
