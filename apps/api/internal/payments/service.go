package payments

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

var (
	ErrPaymentNotFound = errors.New("تراکنش پرداخت یافت نشد")
	ErrPaymentAlreadyCompleted = errors.New("این تراکنش قبلاً تعیین تکلیف شده است")
)

type Service struct {
	mu           sync.RWMutex
	payments     map[uuid.UUID]*Payment
	orderService *orders.Service
}

func NewService(orderSvc *orders.Service) *Service {
	return &Service{
		payments:     make(map[uuid.UUID]*Payment),
		orderService: orderSvc,
	}
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

		// Transition order to paid
		_ = s.orderService.UpdateStatus(p.OrderID, orders.StatusPaid)
	} else {
		p.Status = PaymentStatusFailed
		p.UpdatedAt = now
	}

	return p, nil
}
