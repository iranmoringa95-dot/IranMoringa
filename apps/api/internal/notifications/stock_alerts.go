package notifications

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
)

type StockAlertStatus string

const (
	StockAlertPending   StockAlertStatus = "pending"
	StockAlertNotified  StockAlertStatus = "notified"
	StockAlertCancelled StockAlertStatus = "cancelled"
)

type StockAlertSubscription struct {
	ID          uuid.UUID        `json:"id"`
	UserID      *uuid.UUID       `json:"user_id,omitempty"`
	Phone       string           `json:"phone,omitempty"`
	Email       string           `json:"email,omitempty"`
	VariantID   uuid.UUID        `json:"variant_id"`
	Status      StockAlertStatus `json:"status"`
	VerifiedAt  time.Time        `json:"verified_at"`
	NotifiedAt  *time.Time       `json:"notified_at,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
}

type StockAlertsStore struct {
	mu            sync.RWMutex
	subscriptions map[uuid.UUID]*StockAlertSubscription
}

func NewStockAlertsStore() *StockAlertsStore {
	return &StockAlertsStore{
		subscriptions: make(map[uuid.UUID]*StockAlertSubscription),
	}
}

func (s *StockAlertsStore) Subscribe(userID *uuid.UUID, phone string, email string, variantID uuid.UUID) (*StockAlertSubscription, error) {
	if phone == "" && email == "" {
		return nil, errors.New("ثبت شماره تلفن یا ایمیل برای اطلاع‌رسانی موجودی الزامی است")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Deduplicate active subscriptions
	for _, sub := range s.subscriptions {
		if sub.VariantID == variantID && sub.Status == StockAlertPending {
			if (phone != "" && sub.Phone == phone) || (email != "" && sub.Email == email) {
				return sub, nil // Already subscribed
			}
		}
	}

	now := time.Now()
	sub := &StockAlertSubscription{
		ID:         uuid.New(),
		UserID:     userID,
		Phone:      phone,
		Email:      email,
		VariantID:  variantID,
		Status:     StockAlertPending,
		VerifiedAt: now,
		CreatedAt:  now,
	}

	s.subscriptions[sub.ID] = sub
	return sub, nil
}

func (s *StockAlertsStore) GetPendingSubscriptionsForVariant(variantID uuid.UUID) []*StockAlertSubscription {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*StockAlertSubscription
	for _, sub := range s.subscriptions {
		if sub.VariantID == variantID && sub.Status == StockAlertPending {
			result = append(result, sub)
		}
	}
	return result
}

func (s *StockAlertsStore) MarkNotified(id uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sub, exists := s.subscriptions[id]
	if exists {
		now := time.Now()
		sub.Status = StockAlertNotified
		sub.NotifiedAt = &now
	}
}
