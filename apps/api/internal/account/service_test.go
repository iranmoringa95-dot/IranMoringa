package account

import (
	"testing"

	"github.com/google/uuid"
)

func TestAddressIDORScopingAndDefaults(t *testing.T) {
	svc := NewService()

	userA := uuid.New()
	userB := uuid.New()

	// 1. Create Address for User A -> Auto default
	addrA, errA := svc.CreateAddress(userA, "خانه", "علی محمدی", "09123456789", "تهران", "تهران", "0123456789", "خیابان آزادی پلاک ۱۰", true)
	if errA != nil || addrA == nil {
		t.Fatalf("unexpected error creating address A: %v", errA)
	}
	if !addrA.IsDefaultShipping {
		t.Errorf("expected first address to be default shipping")
	}

	// 2. User B tries to modify User A's address -> ErrForbiddenAccess (IDOR Protection)
	errIDOR := svc.SetDefaultAddress(userB, addrA.ID)
	if errIDOR != ErrForbiddenAccess {
		t.Errorf("expected ErrForbiddenAccess for IDOR attack attempt, got %v", errIDOR)
	}

	// 3. User B tries to delete User A's address -> ErrForbiddenAccess
	errDeleteIDOR := svc.DeleteAddress(userB, addrA.ID)
	if errDeleteIDOR != ErrForbiddenAccess {
		t.Errorf("expected ErrForbiddenAccess for IDOR delete attempt, got %v", errDeleteIDOR)
	}

	// 4. User A creates 2nd address -> Sets default -> Unsets 1st address default atomically
	addrA2, errA2 := svc.CreateAddress(userA, "دفتر", "علی محمدی", "09123456789", "تهران", "تهران", "9876543210", "خیابان انقلاب پلاک ۲۰", true)
	if errA2 != nil || addrA2 == nil {
		t.Fatalf("unexpected error creating address A2: %v", errA2)
	}

	addressesA := svc.ListAddresses(userA)
	defaultCount := 0
	for _, a := range addressesA {
		if a.IsDefaultShipping {
			defaultCount++
		}
	}
	if defaultCount != 1 {
		t.Errorf("expected exactly 1 default shipping address for User A, got %d", defaultCount)
	}
}
