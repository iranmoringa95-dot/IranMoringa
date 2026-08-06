package promotions

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestCouponValidationRules(t *testing.T) {
	svc := NewService()

	t.Run("Valid coupon calculates percentage discount", func(t *testing.T) {
		discount, err := svc.ValidateAndCalculate("WELCOME10", 500000)
		if err != nil {
			t.Fatalf("expected valid coupon, got err: %v", err)
		}
		if discount != 50000 { // 10% of 500,000 IRR = 50,000 IRR
			t.Errorf("expected 50,000 IRR discount, got %d", discount)
		}
	})

	t.Run("Coupon below minimum amount fails", func(t *testing.T) {
		_, err := svc.ValidateAndCalculate("WELCOME10", 200000) // Min is 300,000 IRR
		if err != ErrMinAmount {
			t.Fatalf("expected ErrMinAmount, got %v", err)
		}
	})

	t.Run("Expired coupon fails validation", func(t *testing.T) {
		svc.AddCoupon(&Coupon{
			ID:             uuid.New(),
			Code:           "EXPIRED50",
			DiscountType:   TypeFixedAmount,
			ValueIRR:       50000,
			MinOrderAmount: 100000,
			IsActive:       true,
			StartsAt:       time.Now().Add(-48 * time.Hour),
			ExpiresAt:      time.Now().Add(-24 * time.Hour), // Expired 24 hours ago
		})

		_, err := svc.ValidateAndCalculate("EXPIRED50", 500000)
		if err != ErrCouponExpired {
			t.Fatalf("expected ErrCouponExpired, got %v", err)
		}
	})
}
