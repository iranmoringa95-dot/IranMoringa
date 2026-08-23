package returns

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

var (
	ErrReturnNotEligible   = errors.New("مهلت مرجوعی کالا (۷ روز پس از تحویل) به پایان رسیده است")
	ErrReturnAlreadyExists = errors.New("درخواست مرجوعی برای این سفارش قبلاً ثبت شده است")
)

type Service struct {
	mu           sync.RWMutex
	returns      map[uuid.UUID]*ReturnRequest
	byOrder      map[uuid.UUID]*ReturnRequest
	orderService *orders.Service
}

func NewService(orderSvc *orders.Service) *Service {
	return &Service{
		returns:      make(map[uuid.UUID]*ReturnRequest),
		byOrder:      make(map[uuid.UUID]*ReturnRequest),
		orderService: orderSvc,
	}
}

func (s *Service) CreateReturnRequest(orderNumber string, reason ReturnReason, description string) (*ReturnRequest, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	ord, err := s.orderService.GetOrderByNumber(orderNumber)
	if err != nil {
		return nil, err
	}

	if _, exists := s.byOrder[ord.ID]; exists {
		return nil, ErrReturnAlreadyExists
	}

	// 7-day eligibility check from creation time
	if time.Since(ord.CreatedAt) > 7*24*time.Hour {
		return nil, ErrReturnNotEligible
	}

	now := time.Now()
	ret := &ReturnRequest{
		ID:          uuid.New(),
		OrderID:     ord.ID,
		OrderNumber: ord.OrderNumber,
		Reason:      reason,
		Description: description,
		Status:      ReturnStatusRequested,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	s.returns[ret.ID] = ret
	s.byOrder[ord.ID] = ret
	return ret, nil
}
