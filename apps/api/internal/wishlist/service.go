package wishlist

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

type WishlistItem struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	ProductID uuid.UUID `json:"product_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Service struct {
	mu    sync.RWMutex
	items map[uuid.UUID][]WishlistItem // key: userID
}

func NewService() *Service {
	return &Service{
		items: make(map[uuid.UUID][]WishlistItem),
	}
}

func (s *Service) ToggleWishlist(userID, productID uuid.UUID) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	userItems := s.items[userID]
	for i, item := range userItems {
		if item.ProductID == productID {
			// Remove item
			s.items[userID] = append(userItems[:i], userItems[i+1:]...)
			return false // Removed
		}
	}

	// Add item
	newItem := WishlistItem{
		ID:        uuid.New(),
		UserID:    userID,
		ProductID: productID,
		CreatedAt: time.Now(),
	}
	s.items[userID] = append(s.items[userID], newItem)
	return true // Added
}

func (s *Service) GetWishlist(userID uuid.UUID) []WishlistItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]WishlistItem, len(s.items[userID]))
	copy(result, s.items[userID])
	return result
}
