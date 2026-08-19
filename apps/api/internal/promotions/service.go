package promotions

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrCouponNotFound = errors.New("کد تخفیف واردشده وجود ندارد")
	ErrCouponInactive = errors.New("کد تخفیف فعال نیست")
	ErrCouponExpired  = errors.New("مهلت استفاده از این کد تخفیف به پایان رسیده است")
	ErrCouponLimit    = errors.New("ظرفیت کل استفاده از این کد تخفیف تکمیل شده است")
	ErrUserLimit      = errors.New("سقف مجاز استفاده از این کد تخفیف برای حساب شما به پایان رسیده است")
	ErrFirstOrderOnly = errors.New("این کد تخفیف فقط برای اولین خرید مشتریان جدید قابل استفاده است")
	ErrMinAmount      = errors.New("مبلغ سفارش کمتر از حداقل مبلغ لازم برای اعمال این کد تخفیف است")
	ErrIneligibleCart = errors.Ne0
)

var (
	ErrIneligibleItems = errors.New("اقلام سبد خرید شامل محصولات این کد تخفیف نمی‌شوند")
)

type Service struct {
	mu          sync.RWMutex
	coupons     map[string]*Coupon            // key: CodeNormalized
	redemptions map[uuid.UUID]*CouponRedemption
}

func NewService() *Service {
	svc := &Service{
		coupons:     make(map[string]*Coupon),
		redemptions: make(map[uuid.UUID]*CouponRedemption),
	}

	// Seed default test coupons
	now := time.Now()
	svc.AddCoupon(&Coupon{
		ID:                uuid.New(),
		Code:              "WELCOME10",
		DiscountType:      TypePercentage,
		Percentage:        10,
		MinOrderAmount:    300000,
		MaxDiscount:       100000,
		TotalUsageLimit:   100,
		UsageLimitPerUser: 1,
		IsFirstOrderOnly:  true,
		StackingPolicy:    PolicyExclusive,
		IsActive:          true,
		StartsAt:          now.Add(-24 * time.Hour),
		ExpiresAt:         now.Add(365 * 24 * time.Hour),
		CreatedAt:         now,
	})

	svc.AddCoupon(&Coupon{
		ID:                uuid.New(),
		Code:              "MORINGA50K",
		DiscountType:      TypeFixedAmount,
		ValueIRR:          500000, // 50,000 Toman
		MinOrderAmount:    1000000, // 100,000 Toman
		TotalUsageLimit:   50,
		UsageLimitPerUser: 2,
		IsFirstOrderOnly:  false,
		StackingPolicy:    PolicyStackable,
		IsActive:          true,
		StartsAt:          now.Add(-24 * time.Hour),
		ExpiresAt:         now.Add(365 * 24 * time.Hour),
		CreatedAt:         now,
	})

	return svc
}

// ─── Persian & Arabic Digit Normalizer ───────────────────────────────────────

func NormalizeCouponCode(code string) string {
	code = strings.TrimSpace(code)

	// Replace Persian digits
	persianDigits := []string{"۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"}
	englishDigits := []string{"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}
	for i, pd := range persianDigits {
		code = strings.ReplaceAll(code, pd, englishDigits[i])
	}

	// Replace Arabic digits
	arabicDigits := []string{"٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"}
	for i, ad := range arabicDigits {
		code = strings.ReplaceAll(code, ad, englishDigits[i])
	}

	return strings.ToUpper(code)
}

// ─── Admin Coupon Management ─────────────────────────────────────────────────

func (s *Service) AddCoupon(coupon *Coupon) {
	s.mu.Lock()
	defer s.mu.Unlock()

	norm := NormalizeCouponCode(coupon.Code)
	coupon.CodeNormalized = norm
	if coupon.ID == uuid.Nil {
		coupon.ID = uuid.New()
	}
	if coupon.CreatedAt.IsZero() {
		coupon.CreatedAt = time.Now()
	}

	s.coupons[norm] = coupon
}

func (s *Service) GetCouponByCode(code string) (*Coupon, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	norm := NormalizeCouponCode(code)
	c, exists := s.coupons[norm]
	if !exists {
		return nil, ErrCouponNotFound
	}
	return c, nil
}

func (s *Service) ListCoupons() []*Coupon {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*Coupon, 0, len(s.coupons))
	for _, c := range s.coupons {
		list = append(list, c)
	}
	return list
}

func (s *Service) ListRedemptions() []*CouponRedemption {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*CouponRedemption, 0, len(s.redemptions))
	for _, r := range s.redemptions {
		list = append(list, r)
	}
	return list
}

// ─── Evaluation Engine ───────────────────────────────────────────────────────

func (s *Service) EvaluateCoupon(code string, req EvaluationRequest) (*DiscountBreakdown, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.evaluateUnlocked(code, req)
}

func (s *Service) evaluateUnlocked(code string, req EvaluationRequest) (*DiscountBreakdown, error) {
	norm := NormalizeCouponCode(code)
	coupon, exists := s.coupons[norm]
	if !exists {
		return nil, ErrCouponNotFound
	}

	if !coupon.IsActive {
		return nil, ErrCouponInactive
	}

	now := time.Now()
	if now.Before(coupon.StartsAt) || now.After(coupon.ExpiresAt) {
		return nil, ErrCouponExpired
	}

	// 1. Total usage limit check (Consumed + Active Reserved)
	if coupon.TotalUsageLimit > 0 && (coupon.UsedCount+coupon.ReservedCount) >= coupon.TotalUsageLimit {
		return nil, ErrCouponLimit
	}

	// 2. Per-user usage limit check
	if coupon.UsageLimitPerUser > 0 {
		userRedemptions := 0
		for _, red := range s.redemptions {
			if red.CouponID == coupon.ID && (red.Status == RedemptionConsumed || red.Status == RedemptionReserved) {
				if req.UserID != nil && red.UserID != nil && *red.UserID == *req.UserID {
					userRedemptions++
				} else if req.GuestIdentity != "" && red.GuestIdentity == req.GuestIdentity {
					userRedemptions++
				}
			}
		}
		if userRedemptions >= coupon.UsageLimitPerUser {
			return nil, ErrUserLimit
		}
	}

	// 3. First order condition check
	if coupon.IsFirstOrderOnly && req.UserOrderCount > 0 {
		return nil, ErrFirstOrderOnly
	}

	// 4. Product / Category Scope Filtering
	eligibleSubtotal := int64(0)
	if len(coupon.ApplicableProductIDs) == 0 && len(coupon.ApplicableCategoryIDs) == 0 {
		// All items eligible
		eligibleSubtotal = req.SubtotalIRR
	} else {
		for _, item := range req.Items {
			isProductMatch := containsUUID(coupon.ApplicableProductIDs, item.ProductID)
			isCategoryMatch := containsUUID(coupon.ApplicableCategoryIDs, item.CategoryID)
			if isProductMatch || isCategoryMatch {
				eligibleSubtotal += item.SubtotalIRR
			}
		}
		if eligibleSubtotal == 0 {
			return nil, ErrIneligibleItems
		}
	}

	// 5. Minimum order amount check
	if eligibleSubtotal < coupon.MinOrderAmount {
		return nil, fmt.Errorf("%w: حداقل مبلغ خرید %d تومان است", ErrMinAmount, coupon.MinOrderAmount/10)
	}

	// 6. Calculate Discount
	var discount int64 = 0
	if coupon.DiscountType == TypeFixedAmount {
		discount = coupon.ValueIRR
	} else if coupon.DiscountType == TypePercentage {
		discount = (eligibleSubtotal * int64(coupon.Percentage)) / 100
		if coupon.MaxDiscount > 0 && discount > coupon.MaxDiscount {
			discount = coupon.MaxDiscount
		}
	}

	// Guarantee discount never exceeds total subtotal
	if discount > req.SubtotalIRR {
		discount = req.SubtotalIRR
	}

	finalTotal := req.SubtotalIRR - discount
	if finalTotal < 0 {
		finalTotal = 0
	}

	return &DiscountBreakdown{
		CouponCode:          coupon.Code,
		DiscountType:        coupon.DiscountType,
		SubtotalIRR:         req.SubtotalIRR,
		EligibleSubtotalIRR: eligibleSubtotal,
		DiscountIRR:         discount,
		DiscountToman:       discount / 10,
		FinalTotalIRR:       finalTotal,
		ReasonFA:            "کد تخفیف با موفقیت اعمال شد",
	}, nil
}

// ─── Redemption Lifecycle (Reserve, Consume, Release) ────────────────────────

func (s *Service) ReserveCoupon(code string, req EvaluationRequest, orderID *uuid.UUID) (*CouponRedemption, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	breakdown, err := s.evaluateUnlocked(code, req)
	if err != nil {
		return nil, err
	}

	norm := NormalizeCouponCode(code)
	coupon := s.coupons[norm]

	now := time.Now()
	redemptionID := uuid.New()

	red := &CouponRedemption{
		ID:            redemptionID,
		CouponID:      coupon.ID,
		CouponCode:    coupon.Code,
		UserID:        req.UserID,
		GuestIdentity: req.GuestIdentity,
		OrderID:       orderID,
		AmountIRR:     breakdown.DiscountIRR,
		Status:        RedemptionReserved,
		ReservedAt:    now,
	}

	coupon.ReservedCount++
	s.redemptions[redemptionID] = red

	return red, nil
}

func (s *Service) ConsumeCoupon(redemptionID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	red, exists := s.redemptions[redemptionID]
	if !exists {
		return errors.New("رزرو تخفیف یافت نشد")
	}

	if red.Status == RedemptionConsumed {
		return nil
	}

	now := time.Now()
	red.Status = RedemptionConsumed
	red.ConsumedAt = &now

	coupon, exists := s.coupons[NormalizeCouponCode(red.CouponCode)]
	if exists {
		if coupon.ReservedCount > 0 {
			coupon.ReservedCount--
		}
		coupon.UsedCount++
	}

	return nil
}

func (s *Service) ReleaseCouponReservation(redemptionID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	red, exists := s.redemptions[redemptionID]
	if !exists {
		return errors.New("رزرو تخفیف یافت نشد")
	}

	if red.Status != RedemptionReserved {
		return nil
	}

	now := time.Now()
	red.Status = RedemptionReleased
	red.ReleasedAt = &now

	coupon, exists := s.coupons[NormalizeCouponCode(red.CouponCode)]
	if exists {
		if coupon.ReservedCount > 0 {
			coupon.ReservedCount--
		}
	}

	return nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func containsUUID(slice []uuid.UUID, target uuid.UUID) bool {
	for _, item := range slice {
		if item == target {
			return true
		}
	}
	return false
}
