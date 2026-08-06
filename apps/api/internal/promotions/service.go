package promotions

import (
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrCouponNotFound = errors.New("کد تخفیف واردشده وجود ندارد")
	ErrCouponExpired  = errors.New("مهلت استفاده از این کد تخفیف به پایان رسیده است")
	ErrCouponLimit    = errors.New("ظرفیت استفاده از این کد تخفیف تکمیل شده است")
	ErrMinAmount      = errors.New("مبلغ سفارش کمتر از حداقل مبلغ لازم برای اعمال این کد تخفیف است")
)

type Service struct {
	mu      sync.RWMutex
	coupons map[string]*Coupon // key: upper(code)
}

func NewService() *Service {
	svc := &Service{
		coupons: make(map[string]*Coupon),
	}
	// Seed development test coupon
	svc.AddCoupon(&Coupon{
		ID:              uuid.New(),
		Code:            "WELCOME10",
		DiscountType:    TypePercentage,
		Percentage:      10,
		MinOrderAmount:  300000,
		MaxDiscount:     100000,
		TotalUsageLimit: 100,
		UsedCount:       0,
		IsActive:        true,
		StartsAt:        time.Now().Add(-24 * time.Hour),
		ExpiresAt:       time.Now().Add(365 * 24 * time.Hour),
	})
	return svc
}

func (s *Service) AddCoupon(coupon *Coupon) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.coupons[strings.ToUpper(coupon.Code)] = coupon
}

func (s *Service) ValidateAndCalculate(code string, subtotalIRR int64) (int64, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	coupon, exists := s.coupons[strings.ToUpper(strings.TrimSpace(code))]
	if !exists || !coupon.IsActive {
		return 0, ErrCouponNotFound
	}

	now := time.Now()
	if now.Before(coupon.StartsAt) || now.After(coupon.ExpiresAt) {
		return 0, ErrCouponExpired
	}

	if coupon.TotalUsageLimit > 0 && coupon.UsedCount >= coupon.TotalUsageLimit {
		return 0, ErrCouponLimit
	}

	if subtotalIRR < coupon.MinOrderAmount {
		return 0, ErrMinAmount
	}

	var discount int64 = 0
	if coupon.DiscountType == TypeFixedAmount {
		discount = coupon.ValueIRR
	} else if coupon.DiscountType == TypePercentage {
		discount = (subtotalIRR * int64(coupon.Percentage)) / 100
		if coupon.MaxDiscount > 0 && discount > coupon.MaxDiscount {
			discount = coupon.MaxDiscount
		}
	}

	if discount > subtotalIRR {
		discount = subtotalIRR
	}

	return discount, nil
}
