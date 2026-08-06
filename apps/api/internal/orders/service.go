package orders

import (
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
)

var (
	ErrOrderNotFound      = errors.New("سفارش یافت نشد")
	ErrInvalidStateChange = errors.New("تغییر وضعیت سفارش نامعتبر است")
	ErrConflict           = errors.New("کلید Idempotency تکراری با داده‌های متفاوت ارسال شده است")
)

type Service struct {
	mu           sync.RWMutex
	orders       map[uuid.UUID]*Order
	byNum        map[string]*Order
	idempotency  map[string]*Order // key: idempotencyKey
	counter      uint64
}

func NewService() *Service {
	return &Service{
		orders:      make(map[uuid.UUID]*Order),
		byNum:       make(map[string]*Order),
		idempotency: make(map[string]*Order),
	}
}

func (s *Service) GenerateOrderNumber() string {
	seq := atomic.AddUint64(&s.counter, 1)
	return fmt.Sprintf("ML-1405-%06d", seq)
}

func (s *Service) CreateOrder(req *Order) (*Order, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if req.IdempotencyKey != "" {
		if existing, exists := s.idempotency[req.IdempotencyKey]; exists {
			return existing, nil
		}
	}

	now := time.Now()
	req.ID = uuid.New()
	req.OrderNumber = s.GenerateOrderNumber()
	req.Status = StatusPendingPayment
	req.CreatedAt = now
	req.UpdatedAt = now

	s.orders[req.ID] = req
	s.byNum[req.OrderNumber] = req

	if req.IdempotencyKey != "" {
		s.idempotency[req.IdempotencyKey] = req
	}

	return req, nil
}

func (s *Service) GetOrderByNumber(orderNumber string) (*Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ord, exists := s.byNum[orderNumber]
	if !exists {
		return nil, ErrOrderNotFound
	}
	return ord, nil
}

func (s *Service) GetOrderByID(id uuid.UUID) (*Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ord, exists := s.orders[id]
	if !exists {
		return nil, ErrOrderNotFound
	}
	return ord, nil
}

func (s *Service) UpdateStatus(orderID uuid.UUID, newStatus OrderStatus) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	ord, exists := s.orders[orderID]
	if !exists {
		return ErrOrderNotFound
	}

	// Validate state machine transitions
	if !isValidTransition(ord.Status, newStatus) {
		return ErrInvalidStateChange
	}

	ord.Status = newStatus
	ord.UpdatedAt = time.Now()
	return nil
}

func isValidTransition(current, next OrderStatus) bool {
	if current == next {
		return true
	}
	switch current {
	case StatusPendingPayment:
		return next == StatusPaid || next == StatusCancelled
	case StatusPaid:
		return next == StatusProcessing || next == StatusRefundRequested || next == StatusRefunded
	case StatusProcessing:
		return next == StatusPacked || next == StatusCancelled
	case StatusPacked:
		return next == StatusShipped
	case StatusShipped:
		return next == StatusDelivered
	}
	return false
}
