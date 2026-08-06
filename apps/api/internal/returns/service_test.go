package returns

import (
	"testing"
	"time"

	"moringalab/api/internal/orders"
)

func TestReturnRequestEligibility(t *testing.T) {
	orderSvc := orders.NewService()
	svc := NewService(orderSvc)

	// 1. Order created today is eligible for return
	ord, _ := orderSvc.CreateOrder(&orders.Order{
		SubtotalIRR: 500000,
	})

	ret, err := svc.CreateReturnRequest(ord.OrderNumber, ReasonDefective, "کالا در حمل و نقل آسیب دیده است")
	if err != nil {
		t.Fatalf("expected valid return request, got err: %v", err)
	}
	if ret.Status != ReturnStatusRequested {
		t.Errorf("expected return status requested, got %s", ret.Status)
	}

	// 2. Order created > 7 days ago fails eligibility
	oldOrd, _ := orderSvc.CreateOrder(&orders.Order{
		SubtotalIRR: 500000,
	})
	oldOrd.CreatedAt = time.Now().Add(-10 * 24 * time.Hour) // 10 days ago

	_, errOld := svc.CreateReturnRequest(oldOrd.OrderNumber, ReasonChangeMind, "انصراف مشتری")
	if errOld != ErrReturnNotEligible {
		t.Fatalf("expected ErrReturnNotEligible for order > 7 days, got %v", errOld)
	}
}
