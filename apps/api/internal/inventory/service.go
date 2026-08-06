package inventory

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInsufficientStock = errors.New("موجودی کافی برای این کالا وجود ندارد")
	ErrItemNotFound      = errors.New("آیتم انبار یافت نشد")
)

type InventoryItem struct {
	ID          uuid.UUID `json:"id"`
	LocationID  uuid.UUID `json:"location_id"`
	VariantID   uuid.UUID `json:"variant_id"`
	OnHand      int       `json:"on_hand"`
	Reserved    int       `json:"reserved"`
	Available   int       `json:"available"`
	ReorderPoint int      `json:"reorder_point"`
	Version     int       `json:"version"`
}

type StockReservation struct {
	ID              uuid.UUID  `json:"id"`
	InventoryItemID uuid.UUID  `json:"inventory_item_id"`
	CartID          *uuid.UUID `json:"cart_id,omitempty"`
	OrderID         *uuid.UUID `json:"order_id,omitempty"`
	Quantity        int        `json:"quantity"`
	ExpiresAt       time.Time  `json:"expires_at"`
	ReleasedAt      *time.Time `json:"released_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

type Service struct {
	mu           sync.Mutex
	items        map[uuid.UUID]*InventoryItem // key: variantID
	reservations map[uuid.UUID]*StockReservation
}

func NewService() *Service {
	return &Service{
		items:        make(map[uuid.UUID]*InventoryItem),
		reservations: make(map[uuid.UUID]*StockReservation),
	}
}

func (s *Service) SetStock(variantID uuid.UUID, onHand int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, exists := s.items[variantID]
	if !exists {
		item = &InventoryItem{
			ID:          uuid.New(),
			LocationID:  uuid.New(),
			VariantID:   variantID,
			OnHand:      onHand,
			Reserved:    0,
			Available:   onHand,
			ReorderPoint: 5,
			Version:     1,
		}
		s.items[variantID] = item
		return
	}
	item.OnHand = onHand
	item.Available = item.OnHand - item.Reserved
}

func (s *Service) ReserveStock(variantID uuid.UUID, quantity int, orderID *uuid.UUID, ttl time.Duration) (*StockReservation, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, exists := s.items[variantID]
	if !exists {
		// Auto-initialize default stock of 100 in development
		item = &InventoryItem{
			ID:          uuid.New(),
			LocationID:  uuid.New(),
			VariantID:   variantID,
			OnHand:      100,
			Reserved:    0,
			Available:   100,
			ReorderPoint: 5,
			Version:     1,
		}
		s.items[variantID] = item
	}

	available := item.OnHand - item.Reserved
	if available < quantity {
		return nil, ErrInsufficientStock
	}

	item.Reserved += quantity
	item.Available = item.OnHand - item.Reserved
	item.Version++

	now := time.Now()
	res := &StockReservation{
		ID:              uuid.New(),
		InventoryItemID: item.ID,
		OrderID:         orderID,
		Quantity:        quantity,
		ExpiresAt:       now.Add(ttl),
		CreatedAt:       now,
	}

	s.reservations[res.ID] = res
	return res, nil
}

func (s *Service) ReleaseReservation(resID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	res, exists := s.reservations[resID]
	if !exists || res.ReleasedAt != nil {
		return nil
	}

	now := time.Now()
	res.ReleasedAt = &now

	for _, item := range s.items {
		if item.ID == res.InventoryItemID {
			item.Reserved -= res.Quantity
			if item.Reserved < 0 {
				item.Reserved = 0
			}
			item.Available = item.OnHand - item.Reserved
			break
		}
	}
	return nil
}
