package inventory

import (
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestStockReservationConcurrency(t *testing.T) {
	svc := NewService()
	variantID := uuid.New()

	// Set stock on hand to exactly 1 unit
	svc.SetStock(variantID, 1)

	var wg sync.WaitGroup
	successCount := 0
	failureCount := 0
	var mu sync.Mutex

	// 10 concurrent routines competing for the last unit
	for i := 0; i < 10; i++ {
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

	if successCount != 1 {
		t.Fatalf("expected exactly 1 successful reservation, got %d", successCount)
	}
	if failureCount != 9 {
		t.Fatalf("expected exactly 9 failed reservations, got %d", failureCount)
	}
}
