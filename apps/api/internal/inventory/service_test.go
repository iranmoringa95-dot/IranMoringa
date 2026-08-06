package inventory

import (
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestStockReservationConcurrency20Routines(t *testing.T) {
	svc := NewService()
	variantID := uuid.New()

	// Set stock on hand to exactly 5 units
	svc.SetStock(variantID, 5)

	var wg sync.WaitGroup
	successCount := 0
	failureCount := 0
	var mu sync.Mutex

	// 20 concurrent routines competing for 5 available units
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := svc.ReserveStock(variantID, 1, nil, 10*time.Minute)
			mu.Lock()
			if err == nil {
				successCount++
			} else if err == ErrInsufficientStock {
				failureCount++
			}
			mu.Unlock()
		}()
	}

	wg.Wait()

	if successCount != 5 {
		t.Fatalf("expected exactly 5 successful reservations, got %d", successCount)
	}
	if failureCount != 15 {
		t.Fatalf("expected exactly 15 failed reservations, got %d", failureCount)
	}
}

func TestAdjustStockIdempotency(t *testing.T) {
	svc := NewService()
	variantID := uuid.New()
	idempotencyKey := "idempotent-key-101"

	mov1, err1 := svc.AdjustStockWithKey(variantID, 10, "Initial restock", "admin-1", idempotencyKey)
	if err1 != nil || mov1 == nil {
		t.Fatalf("unexpected error on first adjustment: %v", err1)
	}

	// Duplicate call with same idempotency key -> Must return same movement without double increment
	mov2, err2 := svc.AdjustStockWithKey(variantID, 10, "Initial restock", "admin-1", idempotencyKey)
	if err2 != nil || mov2 == nil {
		t.Fatalf("unexpected error on second adjustment: %v", err2)
	}

	if mov1.ID != mov2.ID {
		t.Errorf("expected duplicate idempotency key to return identical movement ID")
	}

	if mov2.AfterOnHand != 10 {
		t.Errorf("expected stock on hand to remain 10 after duplicate adjustment, got %d", mov2.AfterOnHand)
	}
}
