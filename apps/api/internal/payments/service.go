package payments

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/notifications"
	"moringalab/api/internal/orders"
)

var (
	ErrPaymentNotFound         = errors.New("تراکنش پرداخت یافت نشد")
	ErrPaymentAlreadyCompleted = errors.New("این تراکنش قبلاً تعیین تکلیف شده است")
)

type PaymentPaidNotifier interface {
	NotifyPaymentPaid(orderNumber string, totalIRR int64, recipientPhone string, recipientName string) (*notifications.NotificationDelivery, error)
}

type Service struct {
	mu           sync.RWMutex
	payments     map[uuid.UUID]*Payment
	orderService *orders.Service
	gateway      PaymentGateway
	notifier     PaymentPaidNotifier
}

func NewService(orderSvc *orders.Service) *Service {
	return &Service{
		payments:     make(map[uuid.UUID]*Payment),
		orderService: orderSvc,
		gateway:      NewFakeGateway(),
	}
}

func (s *Service) SetNotifier(n PaymentPaidNotifier) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.notifier = n
}

func (s *Service) CreatePaymentSession(orderID uuid.UUID, orderNum string, amountIRR int64) (*Payment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	p := &Payment{
		ID:          uuid.New(),
		OrderID:     orderID,
		OrderNumber: orderNum,
		AmountIRR:   amountIRR,
		Status:      PaymentStatusPending,
		GatewayName: "fake_gateway",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	s.payments[p.ID] = p
	return p, nil
}

func (s *Service) GetPayment(paymentID uuid.UUID) (*Payment, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, exists := s.payments[paymentID]
	if !exists {
		return nil, ErrPaymentNotFound
	}
	return p, nil
}

func (s *Service) VerifyPayment(paymentID uuid.UUID, simulateSuccess bool) (*Payment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	p, exists := s.payments[paymentID]
	if !exists {
		return nil, ErrPaymentNotFound
	}

	// Callback Replay Protection: If already succeeded, return cleanly
	if p.Status == PaymentStatusSucceeded {
		return p, nil
	}

	now := time.Now()
	if simulateSuccess {
		refID := fmt.Sprintf("REF-%d", now.UnixNano())
		trackCode := fmt.Sprintf("TRK-%d", now.Unix()%1000000)
		p.Status = PaymentStatusSucceeded
		p.ReferenceID = &refID
		p.TrackingCode = &trackCode
		p.UpdatedAt = now

		// Transition order status to paid
		_ = s.orderService.UpdateStatus(p.OrderID, orders.StatusPaid)

		if s.notifier != nil {
			ord, err := s.orderService.GetOrderByID(p.OrderID)
			if err == nil && ord != nil {
				phone := ""
				name := ""
				if ord.GuestPhone != nil {
					phone = *ord.GuestPhone
				}
				if ord.Address.RecipientPhone != "" {
					phone = ord.Address.RecipientPhone
				}
				if ord.Address.RecipientName != "" {
					name = ord.Address.RecipientName
				}
				go func() {
					_, _ = s.notifier.NotifyPaymentPaid(ord.OrderNumber, ord.TotalIRR, phone, name)
				}()
			}
		}
	} else {
		p.Status = PaymentStatusFailed
		p.UpdatedAt = now
	}

	return p, nil
}

func (s *Service) VerifyPaymentWithAmount(paymentID uuid.UUID, expectedAmountIRR int64, simulateSuccess bool) (*Payment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	p, exists := s.payments[paymentID]
	if !exists {
		return nil, ErrPaymentNotFound
	}

	// Strict Amount Mismatch Verification
	if p.AmountIRR != expectedAmountIRR {
		return nil, ErrAmountMismatch
	}

	// Callback Replay Protection
	if p.Status == PaymentStatusSucceeded {
		return p, nil
	}

	now := time.Now()
	if simulateSuccess {
		refID := fmt.Sprintf("REF-%d", now.UnixNano())
		trackCode := fmt.Sprintf("TRK-%d", now.Unix()%1000000)
		p.Status = PaymentStatusSucceeded
		p.ReferenceID = &refID
		p.TrackingCode = &trackCode
		p.UpdatedAt = now

		_ = s.orderService.UpdateStatus(p.OrderID, orders.StatusPaid)

		if s.notifier != nil {
			ord, err := s.orderService.GetOrderByID(p.OrderID)
			if err == nil && ord != nil {
				phone := ""
				name := ""
				if ord.GuestPhone != nil {
					phone = *ord.GuestPhone
				}
				if ord.Address.RecipientPhone != "" {
					phone = ord.Address.RecipientPhone
				}
				if ord.Address.RecipientName != "" {
					name = ord.Address.RecipientName
				}
				go func() {
					_, _ = s.notifier.NotifyPaymentPaid(ord.OrderNumber, ord.TotalIRR, phone, name)
				}()
			}
		}
	} else {
		p.Status = PaymentStatusFailed
		p.UpdatedAt = now
	}

	return p, nil
}
