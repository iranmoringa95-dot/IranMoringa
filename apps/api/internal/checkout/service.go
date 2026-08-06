package checkout

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/carts"
	"moringalab/api/internal/inventory"
	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
)

type SubmitCheckoutRequest struct {
	CartID         uuid.UUID                   `json:"cart_id"`
	RecipientName  string                      `json:"recipient_name"`
	RecipientPhone string                      `json:"recipient_phone"`
	Province       string                      `json:"province"`
	City           string                      `json:"city"`
	PostalAddress  string                      `json:"postal_address"`
	PostalCode     string                      `json:"postal_code"`
	IdempotencyKey string                      `json:"idempotency_key"`
}

type SubmitCheckoutResponse struct {
	Order   *orders.Order     `json:"order"`
	Payment *payments.Payment `json:"payment"`
}

type Service struct {
	cartService      *carts.Service
	inventoryService *inventory.Service
	orderService     *orders.Service
	paymentService   *payments.Service
}

func NewService(
	cartSvc *carts.Service,
	invSvc *inventory.Service,
	orderSvc *orders.Service,
	paySvc *payments.Service,
) *Service {
	return &Service{
		cartService:      cartSvc,
		inventoryService: invSvc,
		orderService:     orderSvc,
		paymentService:   paySvc,
	}
}

func (s *Service) SubmitCheckout(req SubmitCheckoutRequest) (*SubmitCheckoutResponse, error) {
	// 1. Get cart
	cart := s.cartService.GetOrCreateCart(nil, nil)
	if len(cart.Items) == 0 {
		return nil, errors.New("سبد خرید شما خالی است")
	}

	// 2. Reserve inventory for items
	for _, item := range cart.Items {
		_, err := s.inventoryService.ReserveStock(item.VariantID, item.Quantity, nil, 15*time.Minute)
		if err != nil {
			return nil, err
		}
	}

	// 3. Freeze item snapshots
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
		}
	}

	// 4. Freeze address snapshot
	addressSnap := orders.OrderAddressSnapshot{
		RecipientName:  req.RecipientName,
		RecipientPhone: req.RecipientPhone,
		Province:       req.Province,
		City:           req.City,
		PostalAddress:  req.PostalAddress,
		PostalCode:     req.PostalCode,
	}

	// 5. Create Order with snapshots & Idempotency-Key
	ord, err := s.orderService.CreateOrder(&orders.Order{
		GuestPhone:     &req.RecipientPhone,
		SubtotalIRR:    cart.Breakdown.SubtotalIRR,
		DiscountIRR:    cart.Breakdown.ItemDiscountIRR + cart.Breakdown.CartDiscountIRR,
		ShippingFeeIRR: cart.Breakdown.ShippingFeeIRR,
		TotalIRR:       cart.Breakdown.GrandTotalIRR,
		IdempotencyKey: req.IdempotencyKey,
		Address:        addressSnap,
		Items:          orderItems,
	})
	if err != nil {
		return nil, err
	}

	// 6. Create Payment session
	payment, err := s.paymentService.CreatePaymentSession(ord.ID, ord.OrderNumber, ord.TotalIRR)
	if err != nil {
		return nil, err
	}

	return &SubmitCheckoutResponse{
		Order:   ord,
		Payment: payment,
	}, nil
}
