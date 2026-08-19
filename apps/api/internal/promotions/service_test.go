package promotions

import (
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
)

// ─── Test 1: Persian & Arabic Code Normalizer ────────────────────────────────

func TestNormalizeCouponCodePersianAndArabic(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"welcome10", "WELCOME10"},
		{"welcome۱۰", "WELCOME10"},
		{"مورینگا۱۲۳", "مورینگا123"},
		{"  test-code  ", "TEST-CODE"},
	}

	for _, tc := range tests {
		actual := NormalizeCouponCode(tc.input)
		if actual != tc.expected {
			t.Errorf("input '%s': expected '%s', got '%s'", tc.input, tc.expected, actual)
		}
	}
}

// ─── Test 2: Percentage Discount with Max Cap ────────────────────────────────

func TestPercentageDiscountWithMaxCap(t *testing.T) {
	svc := NewService()

	// Subtotal: 1,500,000 IRR (150,000 Toman)
	// WELCOME10: 10% = 150,000 IRR, but capped at MaxDiscount = 100,000 IRR
	req := EvaluationRequest{
		SubtotalIRR: 1500000,
	}

	breakdown, err := svc.EvaluateCoupon("WELCOME10", req)
	if err != nil {
		t.Fatalf("EvaluateCoupon failed: %v", err)
	}

	if breakdown.DiscountIRR != 100000 {
		t.Errorf("expected discount capped at 100000 IRR, got %d", breakdown.DiscountIRR)
	}
	if breakdown.DiscountToman != 10000 {
		t.Errorf("expected discount 10000 Toman, got %d", breakdown.DiscountToman)
	}
	if breakdown.FinalTotalIRR != 1400000 {
		t.Errorf("expected final total 1400000 IRR, got %d", breakdown.FinalTotalIRR)
	}
}

// ─── Test 3: Fixed Amount Discount ──────────────────────────────────────────

func TestFixedAmountDiscount(t *testing.T) {
	svc := NewService()

	// MORINGA50K: 500,000 IRR (50,000 Toman) fixed discount, min order 1,000,000 IRR
	req := EvaluationRequest{
		SubtotalIRR: 1200000,
	}

	breakdown, err := svc.EvaluateCoupon("moringa50k", req)
	if err != nil {
		t.Fatalf("EvaluateCoupon failed: %v", err)
	}

	if breakdown.DiscountIRR != 500000 {
		t.Errorf("expected fixed discount 500000 IRR, got %d", breakdown.DiscountIRR)
	}
	if breakdown.FinalTotalIRR != 700000 {
		t.Errorf("expected final total 700000 IRR, got %d", breakdown.FinalTotalIRR)
	}
}

// ─── Test 4: Min Order Amount Enforcement ────────────────────────────────────

func TestMinOrderAmountEnforcement(t *testing.T) {
	svc := NewService()

	// Subtotal: 200,000 IRR (Min required: 300,000 IRR)
	req := EvaluationRequest{
		SubtotalIRR: 200000,
	}

	_, err := svc.EvaluateCoupon("WELCOME10", req)
	if err == nil {
		t.Fatal("expected ErrMinAmount, got nil")
	}
	if !strings.Contains(err.Error(), "کمتر از حداقل مبلغ") {
		t.Errorf("expected min amount error message, got %v", err)
	}
}

// ─── Test 5: Expiration Check ────────────────────────────────────────────────

func TestExpirationCheck(t *testing.T) {
	svc := NewService()
	now := time.Now()

	expiredCoupon := &Coupon{
		ID:             uuid.New(),
		Code:           "EXPIRED",
		DiscountType:   TypeFixedAmount,
		ValueIRR:       100000,
		MinOrderAmount: 100000,
		IsActive:       true,
		StartsAt:       now.Add(-48 * time.Hour),
		ExpiresAt:      now.Add(-1 * time.Hour), // Expired 1 hour ago
	}
	svc.AddCoupon(expiredCoupon)

	req := EvaluationRequest{SubtotalIRR: 500000}
	_, err := svc.EvaluateCoupon("EXPIRED", req)
	if err != ErrCouponExpired {
		t.Errorf("expected ErrCouponExpired, got %v", err)
	}
}

// ─── Test 6: Total Usage Limit Check ─────────────────────────────────────────

func TestTotalUsageLimit(t *testing.T) {
	svc := NewService()
	now := time.Now()

	limitCoupon := &Coupon{
		ID:              uuid.New(),
		Code:            "LIMIT1",
		DiscountType:    TypeFixedAmount,
		ValueIRR:        50000,
		MinOrderAmount:  100000,
		TotalUsageLimit: 1,
		UsedCount:       1, // Already used once
		IsActive:        true,
		StartsAt:        now.Add(-1 * time.Hour),
		ExpiresAt:       now.Add(24 * time.Hour),
	}
	svc.AddCoupon(limitCoupon)

	req := EvaluationRequest{SubtotalIRR: 500000}
	_, err := svc.EvaluateCoupon("LIMIT1", req)
	if err != ErrCouponLimit {
		t.Errorf("expected ErrCouponLimit, got %v", err)
	}
}

// ─── Test 7: Per-User Usage Limit Check ──────────────────────────────────────

func TestUsageLimitPerUser(t *testing.T) {
	svc := NewService()
	userID := uuid.New()

	req := EvaluationRequest{
		UserID:      &userID,
		SubtotalIRR: 500000,
	}

	// WELCOME10 has UsageLimitPerUser = 1
	// 1st time: Reserve & Consume
	red, err := svc.ReserveCoupon("WELCOME10", req, nil)
	if err != nil {
		t.Fatalf("First ReserveCoupon failed: %v", err)
	}
	_ = svc.ConsumeCoupon(red.ID)

	// 2nd time: Should fail with ErrUserLimit
	_, err = svc.EvaluateCoupon("WELCOME10", req)
	if err != ErrUserLimit {
		t.Errorf("expected ErrUserLimit for 2nd attempt by same user, got %v", err)
	}
}

// ─── Test 8: First Order Only Condition ─────────────────────────────────────

func TestIsFirstOrderOnlyCondition(t *testing.T) {
	svc := NewService()

	// New user with 0 order count -> Allowed
	reqNewUser := EvaluationRequest{
		SubtotalIRR:    500000,
		UserOrderCount: 0,
	}
	_, err := svc.EvaluateCoupon("WELCOME10", reqNewUser)
	if err != nil {
		t.Fatalf("expected new user to pass first-order check, got %v", err)
	}

	// Existing user with 1 order count -> Denied
	reqExistingUser := EvaluationRequest{
		SubtotalIRR:    500000,
		UserOrderCount: 1,
	}
	_, err = svc.EvaluateCoupon("WELCOME10", reqExistingUser)
	if err != ErrFirstOrderOnly {
		t.Errorf("expected ErrFirstOrderOnly for user with existing orders, got %v", err)
	}
}

// ─── Test 9: Product & Category Scope Filtering ─────────────────────────────

func TestProductScopeFiltering(t *testing.T) {
	svc := NewService()
	now := time.Now()

	prodA := uuid.New()
	prodB := uuid.New()

	scopedCoupon := &Coupon{
		ID:                   uuid.New(),
		Code:                 "PRODAONLY",
		DiscountType:         TypePercentage,
		Percentage:           20,
		MinOrderAmount:       100000,
		ApplicableProductIDs: []uuid.UUID{prodA},
		IsActive:             true,
		StartsAt:             now.Add(-1 * time.Hour),
		ExpiresAt:            now.Add(24 * time.Hour),
	}
	svc.AddCoupon(scopedCoupon)

	// Cart contains Prod A (200,000 IRR) and Prod B (300,000 IRR)
	req := EvaluationRequest{
		SubtotalIRR: 500000,
		Items: []EvaluationItem{
			{ProductID: prodA, UnitPriceIRR: 200000, Quantity: 1, SubtotalIRR: 200000},
			{ProductID: prodB, UnitPriceIRR: 300000, Quantity: 1, SubtotalIRR: 300000},
		},
	}

	breakdown, err := svc.EvaluateCoupon("PRODAONLY", req)
	if err != nil {
		t.Fatalf("EvaluateCoupon scoped failed: %v", err)
	}

	// 20% of ProdA eligible subtotal (200,000) = 40,000 IRR
	if breakdown.EligibleSubtotalIRR != 200000 {
		t.Errorf("expected eligible subtotal 200000 IRR, got %d", breakdown.EligibleSubtotalIRR)
	}
	if breakdown.DiscountIRR != 40000 {
		t.Errorf("expected 20%% discount on ProdA (40000 IRR), got %d", breakdown.DiscountIRR)
	}
}

// ─── Test 10: Reservation Lifecycle (Reserve, Consume, Release) ─────────────

func TestReservationAndRedemptionLifecycle(t *testing.T) {
	svc := NewService()
	req := EvaluationRequest{SubtotalIRR: 500000}

	// 1. Reserve
	red, err := svc.ReserveCoupon("MORINGA50K", req, nil)
	if err != nil {
		t.Fatalf("ReserveCoupon failed: %v", err)
	}
	if red.Status != RedemptionReserved {
		t.Errorf("expected status reserved, got %s", red.Status)
	}

	// 2. Consume
	err = svc.ConsumeCoupon(red.ID)
	if err != nil {
		t.Fatalf("ConsumeCoupon failed: %v", err)
	}
	if red.Status != RedemptionConsumed {
		t.Errorf("expected status consumed, got %s", red.Status)
	}

	// 3. Test Release for cancelled order reservation
	red2, _ := svc.ReserveCoupon("MORINGA50K", req, nil)
	err = svc.ReleaseCouponReservation(red2.ID)
	if err != nil {
		t.Fatalf("ReleaseCouponReservation failed: %v", err)
	}
	if red2.Status != RedemptionReleased {
		t.Errorf("expected status released, got %s", red2.Status)
	}
}

// ─── Test 11: Concurrent Reservation Race Condition ─────────────────────────

func TestConcurrentReservationRaceCondition(t *testing.T) {
	svc := NewService()
	now := time.Now()

	// Coupon with total usage limit of 5
	svc.AddCoupon(&Coupon{
		ID:              uuid.New(),
		Code:            "CAP5",
		DiscountType:    TypeFixedAmount,
		ValueIRR:        50000,
		MinOrderAmount:  100000,
		TotalUsageLimit: 5,
		IsActive:        true,
		StartsAt:        now.Add(-1 * time.Hour),
		ExpiresAt:       now.Add(24 * time.Hour),
	})

	var wg sync.WaitGroup
	count := 20
	successes := make(chan bool, count)

	for i := 0; i < count; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			req := EvaluationRequest{SubtotalIRR: 500000}
			_, err := svc.ReserveCoupon("CAP5", req, nil)
			if err == nil {
				successes <- true
			}
		}()
	}

	wg.Wait()
	close(successes)

	successCount := 0
	for range successes {
		successCount++
	}

	if successCount != 5 {
		t.Errorf("expected exactly 5 successful reservations for CAP5, got %d", successCount)
	}
}

// ─── Test 12: Discount Never Exceeds Subtotal ───────────────────────────────

func TestDiscountNeverExceedsSubtotal(t *testing.T) {
	svc := NewService()
	now := time.Now()

	svc.AddCoupon(&Coupon{
		ID:             uuid.New(),
		Code:           "BIG100K",
		DiscountType:   TypeFixedAmount,
		ValueIRR:       1000000, // 100,000 Toman discount
		MinOrderAmount: 50000,
		IsActive:       true,
		StartsAt:       now.Add(-1 * time.Hour),
		ExpiresAt:      now.Add(24 * time.Hour),
	})

	// Subtotal is only 500,000 IRR (less than 1,000,000 IRR discount)
	req := EvaluationRequest{SubtotalIRR: 500000}
	breakdown, err := svc.EvaluateCoupon("BIG100K", req)
	if err != nil {
		t.Fatalf("EvaluateCoupon failed: %v", err)
	}

	if breakdown.DiscountIRR != 500000 {
		t.Errorf("expected discount capped at subtotal (500000 IRR), got %d", breakdown.DiscountIRR)
	}
	if breakdown.FinalTotalIRR != 0 {
		t.Errorf("expected final total 0 IRR, got %d", breakdown.FinalTotalIRR)
	}
}
