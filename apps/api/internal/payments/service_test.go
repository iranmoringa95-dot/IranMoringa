package payments

import (
	"testing"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

func TestPaymentVerificationFlow(t *testing.T) {
	orderSvc := orders.NewService()
	paymentSvc := NewService(orderSvc)

	// Create test order
	ord, _ := orderSvc.CreateOrder(&orders.Order{
		SubtotalIRR:    400000,
		ShippingFeeIRR: 30000,
		TotalIRR:       430000,
	})

	// 1. Create payment session
	p, err := paymentSvc.CreatePaymentSession(ord.ID, ord.OrderNumber, ord.TotalIRR)
	if err != nil {
		t.Fatalf("CreatePaymentSession failed: %v", err)
	}

	// 2. Verify payment as succeeded
	verifiedPayment, err := paymentSvc.VerifyPayment(p.ID, true)
	if err != nil {
		t.Fatalf("VerifyPayment failed: %v", err)
	}
	if verifiedPayment.Status != PaymentStatusSucceeded {
		t.Errorf("expected payment status succeeded, got %s", verifiedPayment.Status)
	}
	if verifiedPayment.ReferenceID == nil {
		t.Fatal("expected non-empty reference ID")
	}

	// 3. Verify order status transitioned to paid
	updatedOrd, _ := orderSvc.GetOrderByID(ord.ID)
	if updatedOrd.Status != orders.StatusPaid {
		t.Errorf("expected order status paid, got %s", updatedOrd.Status)
	}
}
