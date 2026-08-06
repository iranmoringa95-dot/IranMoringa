package orders

import (
	"testing"
)

func TestOrderStateMachineAndIdempotency(t *testing.T) {
	svc := NewService()

	orderReq := &Order{
		IdempotencyKey: "key-12345",
		SubtotalIRR:    400000,
		ShippingFeeIRR: 30000,
		TotalIRR:       430000,
	}

	// 1. First submission succeeds
	ord1, err := svc.CreateOrder(orderReq)
	if err != nil {
		t.Fatalf("CreateOrder failed: %v", err)
	}
	if ord1.Status != StatusPendingPayment {
		t.Errorf("expected initial status pending_payment, got %s", ord1.Status)
	}

	// 2. Duplicate submission returns identical order (Idempotency)
	ord2, err := svc.CreateOrder(orderReq)
	if err != nil {
		t.Fatalf("Duplicate CreateOrder failed: %v", err)
	}
	if ord2.ID != ord1.ID {
		t.Errorf("expected idempotent order ID %s, got %s", ord1.ID, ord2.ID)
	}

	// 3. Valid State Machine Transition: pending_payment -> paid
	if err := svc.UpdateStatus(ord1.ID, StatusPaid); err != nil {
		t.Fatalf("UpdateStatus to paid failed: %v", err)
	}

	// 4. Invalid State Machine Transition: paid -> shipped (must go through processing/packed first)
	if err := svc.UpdateStatus(ord1.ID, StatusShipped); err != ErrInvalidStateChange {
		t.Fatalf("expected ErrInvalidStateChange for illegal transition, got %v", err)
	}
}
