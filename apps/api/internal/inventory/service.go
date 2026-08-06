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
	ID           uuid.UUID `json:"id"`
	LocationID   uuid.UUID `json:"location_id"`
	VariantID    uuid.UUID `json:"variant_id"`
	OnHand       int       `json:"on_hand"`
	Reserved     int       `json:"reserved"`
	SafetyStock  int       `json:"safety_stock"`
	Available    int       `json:"available"`
	ReorderPoint int       `json:"reorder_point"`
	Version      int       `json:"version"`
}

type InventoryMovement struct {
	ID             uuid.UUID `json:"id"`
	VariantID      uuid.UUID `json:"variant_id"`
	Type           string    `json:"type"` // receive | adjust | reserve | release | consume
	QuantityDelta  int       `json:"quantity_delta"`
	BeforeOnHand   int       `json:"before_on_hand"`
	AfterOnHand    int       `json:"after_on_hand"`
	Reason         string    `json:"reason"`
	ActorID        string    `json:"actor_id"`
	IdempotencyKey string    `json:"idempotency_key"`
	CreatedAt      time.Time `json:"created_at"`
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
	movements    []InventoryMovement
	seenKeys     map[string]*InventoryMovement
}

func NewService() *Service {
	return &Service{
		items:        make(map[uuid.UUID]*InventoryItem),
		reservations: make(map[uuid.UUID]*StockReservation),
		movements:    make([]InventoryMovement, 0),
		seenKeys:     make(map[string]*InventoryMovement),
	}
}

func (s *Service) SetStock(variantID uuid.UUID, onHand int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, exists := s.items[variantID]
	if !exists {
		item = &InventoryItem{
			ID:           uuid.New(),
			LocationID:   uuid.New(),
			VariantID:    variantID,
			OnHand:       onHand,
			Reserved:     0,
			SafetyStock:  0,
			Available:    onHand,
			ReorderPoint: 5,
			Version:      1,
		}
		s.items[variantID] = item
		return
	}
	item.OnHand = onHand
	item.Available = item.OnHand - item.Reserved - item.SafetyStock
}

func (s *Service) AdjustStockWithKey(variantID uuid.UUID, delta int, reason, actorID, idempotencyKey string) (*InventoryMovement, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if idempotencyKey != "" {
		if prev, exists := s.seenKeys[idempotencyKey]; exists {
			return prev, nil
		}
	}

	item, exists := s.items[variantID]
	if !exists {
		item = &InventoryItem{
			ID:           uuid.New(),
			LocationID:   uuid.New(),
			VariantID:    variantID,
			OnHand:       0,
			Reserved:     0,
			SafetyStock:  0,
			Available:    0,
			ReorderPoint: 5,
			Version:      1,
		}
		s.items[variantID] = item
	}

	beforeOnHand := item.OnHand
	newOnHand := beforeOnHand + delta
	if newOnHand < 0 {
		return nil, ErrInsufficientStock
	}

	item.OnHand = newOnHand
	item.Available = item.OnHand - item.Reserved - item.SafetyStock
	item.Version++

	mov := InventoryMovement{
		ID:             uuid.New(),
		VariantID:      variantID,
		Type:           "adjust",
		QuantityDelta:  delta,
		BeforeOnHand:   beforeOnHand,
		AfterOnHand:    newOnHand,
		Reason:         reason,
		ActorID:        actorID,
		IdempotencyKey: idempotencyKey,
		CreatedAt:      time.Now(),
	}

	s.movements = append(s.movements, mov)
	if idempotencyKey != "" {
		s.seenKeys[idempotencyKey] = &mov
	}

	return &mov, nil
}

func (s *Service) ReserveStock(variantID uuid.UUID, quantity int, orderID *uuid.UUID, ttl time.Duration) (*StockReservation, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, exists := s.items[variantID]
	if !exists {
		item = &InventoryItem{
			ID:           uuid.New(),
			LocationID:   uuid.New(),
			VariantID:    variantID,
			OnHand:       100,
			Reserved:     0,
			SafetyStock:  0,
			Available:    100,
			ReorderPoint: 5,
			Version:      1,
		}
		s.items[variantID] = item
	}

	available := item.OnHand - item.Reserved - item.SafetyStock
	if available < quantity {
		return nil, ErrInsufficientStock
	}

	item.Reserved += quantity
	item.Available = item.OnHand - item.Reserved - item.SafetyStock
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

	s.movements = append(s.movements, InventoryMovement{
		ID:            uuid.New(),
		VariantID:     variantID,
		Type:          "reserve",
		QuantityDelta: quantity,
		BeforeOnHand:  item.OnHand,
		AfterOnHand:   item.OnHand,
		Reason:        "Order checkout reservation",
		ActorID:       "checkout_service",
		CreatedAt:     now,
	})

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
			item.Available = item.OnHand - item.Reserved - item.SafetyStock
			break
		}
	}
	return nil
}
