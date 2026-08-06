package payments

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

func TestFakeGatewayAndPaymentVerification(t *testing.T) {
	orderSvc := orders.NewService()
	svc := NewService(orderSvc)

	orderID := uuid.New()
	amountIRR := int64(1500000) // 150,000 Toman

	// 1. Create Payment Session
	p, errCreate := svc.CreatePaymentSession(orderID, "ORD-TEST-001", amountIRR)
	if errCreate != nil || p == nil {
		t.Fatalf("unexpected error creating payment session: %v", errCreate)
	}

	// 2. Test Fake Gateway Initiate
	fakeGw := NewFakeGateway()
	initResp, errInit := fakeGw.Initiate(context.Background(), p)
	if errInit != nil || initResp == nil || initResp.RedirectURL == "" {
		t.Fatalf("unexpected error initiating fake gateway: %v", errInit)
	}

	// 3. Verify Payment with Amount Mismatch -> Reject
	_, errMismatch := svc.VerifyPaymentWithAmount(p.ID, 2000000, true)
	if errMismatch != ErrAmountMismatch {
		t.Errorf("expected ErrAmountMismatch when verifying wrong amount, got %v", errMismatch)
	}

	// 4. Verify Payment with Correct Amount -> Success
	pVerified, errVerify := svc.VerifyPaymentWithAmount(p.ID, amountIRR, true)
	if errVerify != nil || pVerified.Status != PaymentStatusSucceeded {
		t.Fatalf("unexpected error during valid payment verification: %v", errVerify)
	}

	// 5. Callback Replay Protection -> Returns same verified payment cleanly
	pReplay, errReplay := svc.VerifyPaymentWithAmount(p.ID, amountIRR, true)
	if errReplay != nil || pReplay.Status != PaymentStatusSucceeded {
		t.Fatalf("unexpected error during callback replay: %v", errReplay)
	}
}
