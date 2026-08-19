package orders

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

// ─── Helper ──────────────────────────────────────────────────────────────────

func createTestOrder(t *testing.T, svc *Service) *Order {
	t.Helper()
	ord, err := svc.CreateOrder(&Order{
		IdempotencyKey: uuid.New().String(),
		SubtotalIRR:    400000,
		ShippingFeeIRR: 30000,
		TotalIRR:       430000,
		Address: OrderAddressSnapshot{
			RecipientName: "علی محمدی",
			Province:      "تهران",
			City:          "تهران",
			PostalCode:    "1234567890",
		},
		Items: []OrderItemSnapshot{
			{
				ID:           uuid.New(),
				ProductTitle: "پودر مورینگا",
				VariantTitle: "۲۵۰ گرم",
				UnitPriceIRR: 200000,
				Quantity:     2,
				SubtotalIRR:  400000,
			},
		},
	})
	if err != nil {
		t.Fatalf("CreateOrder failed: %v", err)
	}
	return ord
}

// ─── Test 1: Order Number Format MOR-YYYYMMDD-XXXXX ─────────────────────────

func TestOrderNumberFormatMOR(t *testing.T) {
	svc := NewService()
	ord := createTestOrder(t, svc)

	if !strings.HasPrefix(ord.OrderNumber, "MOR-") {
		t.Errorf("expected order number to start with MOR-, got %s", ord.OrderNumber)
	}

	// Format: MOR-YYYYMMDD-XXXXX (total ~19 chars)
	parts := strings.Split(ord.OrderNumber, "-")
	if len(parts) != 3 {
		t.Fatalf("expected 3 parts in order number, got %d: %s", len(parts), ord.OrderNumber)
	}

	if parts[0] != "MOR" {
		t.Errorf("expected prefix MOR, got %s", parts[0])
	}
	if len(parts[1]) != 8 {
		t.Errorf("expected 8-digit date part, got %s (len=%d)", parts[1], len(parts[1]))
	}
	if len(parts[2]) != 5 {
		t.Errorf("expected 5-digit sequence, got %s (len=%d)", parts[2], len(parts[2]))
	}
}

// ─── Test 2: Timeline Recording on Create ───────────────────────────────────

func TestOrderTimelineRecordingOnCreate(t *testing.T) {
	svc := NewService()
	ord := createTestOrder(t, svc)

	events, err := svc.GetTimeline(ord.ID)
	if err != nil {
		t.Fatalf("GetTimeline failed: %v", err)
	}

	if len(events) != 1 {
		t.Fatalf("expected 1 timeline event on creation, got %d", len(events))
	}

	if events[0].EventType != "order_created" {
		t.Errorf("expected event type 'order_created', got '%s'", events[0].EventType)
	}
	if events[0].NewStatus != StatusPendingPayment {
		t.Errorf("expected new status pending_payment, got %s", events[0].NewStatus)
	}
}

// ─── Test 3: Timeline Recording on Status Change ────────────────────────────

func TestOrderTimelineRecordingOnStatusChange(t *testing.T) {
	svc := NewService()
	ord := createTestOrder(t, svc)

	err := svc.TransitionStatus(TransitionRequest{
		OrderID:   ord.ID,
		NewStatus: StatusPaid,
		ActorType: ActorSystem,
		Note:      "پرداخت تأیید شد",
	})
	if err != nil {
		t.Fatalf("TransitionStatus to paid failed: %v", err)
	}

	events, _ := svc.GetTimeline(ord.ID)
	if len(events) != 2 {
		t.Fatalf("expected 2 timeline events, got %d", len(events))
	}

	last := events[1]
	if last.EventType != "status_change" {
		t.Errorf("expected event type 'status_change', got '%s'", last.EventType)
	}
	if last.OldStatus != StatusPendingPayment {
		t.Errorf("expected old status pending_payment, got %s", last.OldStatus)
	}
	if last.NewStatus != StatusPaid {
		t.Errorf("expected new status paid, got %s", last.NewStatus)
	}
}

// ─── Test 4: All Valid State Machine Transitions ─────────────────────────────

func TestAllValidTransitions(t *testing.T) {
	validPaths := []struct {
		name string
		path []OrderStatus
	}{
		{
			"happy path: pending → paid → processing → packed → shipped → delivered",
			[]OrderStatus{StatusPaid, StatusProcessing, StatusPacked, StatusShipped, StatusDelivered},
		},
		{
			"customer cancel: pending → cancelled",
			[]OrderStatus{StatusCancelled},
		},
		{
			"admin cancel paid: pending → paid → cancelled",
			[]OrderStatus{StatusPaid, StatusCancelled},
		},
		{
			"paid refund: pending → paid → refunded",
			[]OrderStatus{StatusPaid, StatusRefunded},
		},
		{
			"cancelled then refunded: pending → paid → cancelled → refunded",
			[]OrderStatus{StatusPaid, StatusCancelled, StatusRefunded},
		},
	}

	for _, tc := range validPaths {
		t.Run(tc.name, func(t *testing.T) {
			svc := NewService()
			ord := createTestOrder(t, svc)

			for _, status := range tc.path {
				req := TransitionRequest{
					OrderID:   ord.ID,
					NewStatus: status,
					ActorType: ActorAdmin,
					ActorID:   "admin",
				}
				if status == StatusShipped {
					req.TrackingCode = "TRK-1405-12345678"
				}
				if err := svc.TransitionStatus(req); err != nil {
					t.Fatalf("transition to %s failed: %v", status, err)
				}
			}
		})
	}
}

// ─── Test 5: All Invalid State Machine Transitions ──────────────────────────

func TestAllInvalidTransitions(t *testing.T) {
	invalidTransitions := []struct {
		name    string
		from    OrderStatus
		to      OrderStatus
	}{
		{"pending → processing (must go through paid)", StatusPendingPayment, StatusProcessing},
		{"pending → shipped", StatusPendingPayment, StatusShipped},
		{"pending → delivered", StatusPendingPayment, StatusDelivered},
		{"paid → shipped (must go through processing/packed)", StatusPaid, StatusShipped},
		{"paid → packed", StatusPaid, StatusPacked},
		{"paid → delivered", StatusPaid, StatusDelivered},
		{"processing → shipped (must go through packed)", StatusProcessing, StatusShipped},
		{"processing → delivered", StatusProcessing, StatusDelivered},
		{"packed → delivered (must go through shipped)", StatusPacked, StatusDelivered},
		{"shipped → cancelled", StatusShipped, StatusCancelled},
		{"delivered → cancelled", StatusDelivered, StatusCancelled},
		{"delivered → shipped", StatusDelivered, StatusShipped},
	}

	for _, tc := range invalidTransitions {
		t.Run(tc.name, func(t *testing.T) {
			svc := NewService()
			ord := createTestOrder(t, svc)

			// Advance to the "from" status
			advanceTo(t, svc, ord.ID, tc.from)

			// Now try the invalid transition
			err := svc.TransitionStatus(TransitionRequest{
				OrderID:      ord.ID,
				NewStatus:    tc.to,
				ActorType:    ActorAdmin,
				TrackingCode: "TRK-X",
			})
			if err != ErrInvalidStateChange {
				t.Errorf("expected ErrInvalidStateChange, got %v", err)
			}
		})
	}
}

// ─── Test 6: Tracking Code Required for Shipped ─────────────────────────────

func TestTrackingCodeRequiredForShipped(t *testing.T) {
	svc := NewService()
	ord := createTestOrder(t, svc)

	// Advance to packed
	advanceTo(t, svc, ord.ID, StatusPacked)

	// Try shipped without tracking code
	err := svc.TransitionStatus(TransitionRequest{
		OrderID:   ord.ID,
		NewStatus: StatusShipped,
		ActorType: ActorAdmin,
	})
	if err != ErrTrackingCodeRequired {
		t.Fatalf("expected ErrTrackingCodeRequired, got %v", err)
	}

	// Now with tracking code
	err = svc.TransitionStatus(TransitionRequest{
		OrderID:      ord.ID,
		NewStatus:    StatusShipped,
		ActorType:    ActorAdmin,
		TrackingCode: "TRK-1405-87654321",
	})
	if err != nil {
		t.Fatalf("transition to shipped with tracking code failed: %v", err)
	}

	// Verify tracking code stored on order
	updated, _ := svc.GetOrderByID(ord.ID)
	if updated.TrackingCode != "TRK-1405-87654321" {
		t.Errorf("expected tracking code TRK-1405-87654321, got %s", updated.TrackingCode)
	}
}

// ─── Test 7: Customer Cancel Only PendingPayment ─────────────────────────────

func TestCustomerCancelOnlyPendingPayment(t *testing.T) {
	svc := NewService()

	// Case 1: Cancel pending_payment — should succeed
	ord1 := createTestOrder(t, svc)
	err := svc.CancelOrder(ord1.ID, ActorCustomer, "cust-1")
	if err != nil {
		t.Fatalf("expected customer cancel of pending_payment to succeed, got %v", err)
	}

	// Case 2: Cancel paid order — should fail for customer
	ord2 := createTestOrder(t, svc)
	_ = svc.TransitionStatus(TransitionRequest{OrderID: ord2.ID, NewStatus: StatusPaid, ActorType: ActorSystem})
	err = svc.CancelOrder(ord2.ID, ActorCustomer, "cust-1")
	if err != ErrCancelNotAllowed {
		t.Fatalf("expected ErrCancelNotAllowed for customer cancelling paid order, got %v", err)
	}

	// Case 3: Cancel processing order — should fail for customer
	_ = svc.TransitionStatus(TransitionRequest{OrderID: ord2.ID, NewStatus: StatusProcessing, ActorType: ActorAdmin})
	err = svc.CancelOrder(ord2.ID, ActorCustomer, "cust-1")
	if err != ErrCancelNotAllowed {
		t.Fatalf("expected ErrCancelNotAllowed for customer cancelling processing order, got %v", err)
	}
}

// ─── Test 8: Admin Cancel Paid Order ─────────────────────────────────────────

func TestAdminCancelPaidOrder(t *testing.T) {
	svc := NewService()
	ord := createTestOrder(t, svc)

	_ = svc.TransitionStatus(TransitionRequest{OrderID: ord.ID, NewStatus: StatusPaid, ActorType: ActorSystem})

	err := svc.CancelOrder(ord.ID, ActorAdmin, "admin-1")
	if err != nil {
		t.Fatalf("expected admin cancel of paid order to succeed, got %v", err)
	}

	updated, _ := svc.GetOrderByID(ord.ID)
	if updated.Status != StatusCancelled {
		t.Errorf("expected status cancelled, got %s", updated.Status)
	}
}

// ─── Test 9: Order Listing and Filtering ─────────────────────────────────────

func TestOrderListingAndFiltering(t *testing.T) {
	svc := NewService()

	// Create 3 orders with different statuses
	ord1 := createTestOrder(t, svc)
	ord2 := createTestOrder(t, svc)
	_ = createTestOrder(t, svc) // ord3 stays pending_payment

	_ = svc.TransitionStatus(TransitionRequest{OrderID: ord1.ID, NewStatus: StatusPaid, ActorType: ActorSystem})
	_ = svc.TransitionStatus(TransitionRequest{OrderID: ord2.ID, NewStatus: StatusPaid, ActorType: ActorSystem})
	_ = svc.TransitionStatus(TransitionRequest{OrderID: ord2.ID, NewStatus: StatusProcessing, ActorType: ActorAdmin})

	// List all
	all := svc.ListOrders(ListFilter{})
	if all.TotalCount != 3 {
		t.Errorf("expected 3 total orders, got %d", all.TotalCount)
	}

	// Filter by paid
	paid := svc.ListOrders(ListFilter{Status: StatusPaid})
	if paid.TotalCount != 1 {
		t.Errorf("expected 1 paid order, got %d", paid.TotalCount)
	}

	// Filter by processing
	processing := svc.ListOrders(ListFilter{Status: StatusProcessing})
	if processing.TotalCount != 1 {
		t.Errorf("expected 1 processing order, got %d", processing.TotalCount)
	}

	// Search by order number
	searched := svc.ListOrders(ListFilter{SearchQuery: ord1.OrderNumber})
	if searched.TotalCount != 1 {
		t.Errorf("expected 1 order matching search, got %d", searched.TotalCount)
	}
}

// ─── Test 10: Customer Order Listing IDOR ────────────────────────────────────

func TestCustomerOrderListingIDOR(t *testing.T) {
	svc := NewService()

	customer1 := uuid.New()
	customer2 := uuid.New()

	// Create orders for customer1
	ord1, _ := svc.CreateOrder(&Order{
		CustomerID:     &customer1,
		IdempotencyKey: uuid.New().String(),
		SubtotalIRR:    100000,
		TotalIRR:       100000,
	})
	_, _ = svc.CreateOrder(&Order{
		CustomerID:     &customer1,
		IdempotencyKey: uuid.New().String(),
		SubtotalIRR:    200000,
		TotalIRR:       200000,
	})

	// Create order for customer2
	_, _ = svc.CreateOrder(&Order{
		CustomerID:     &customer2,
		IdempotencyKey: uuid.New().String(),
		SubtotalIRR:    300000,
		TotalIRR:       300000,
	})

	// Customer1 should see 2 orders
	c1Orders := svc.ListOrdersByCustomer(customer1)
	if len(c1Orders) != 2 {
		t.Errorf("expected 2 orders for customer1, got %d", len(c1Orders))
	}

	// Customer2 should see 1 order
	c2Orders := svc.ListOrdersByCustomer(customer2)
	if len(c2Orders) != 1 {
		t.Errorf("expected 1 order for customer2, got %d", len(c2Orders))
	}

	// Customer2 should not access customer1's order
	_, err := svc.GetCustomerOrder(ord1.OrderNumber, customer2)
	if err != ErrAccessDenied {
		t.Errorf("expected ErrAccessDenied, got %v", err)
	}

	// Customer1 should access their own order
	_, err = svc.GetCustomerOrder(ord1.OrderNumber, customer1)
	if err != nil {
		t.Errorf("expected customer1 to access own order, got %v", err)
	}
}

// ─── Test 11: Admin Add Note ─────────────────────────────────────────────────

func TestAdminAddNote(t *testing.T) {
	svc := NewService()
	ord := createTestOrder(t, svc)

	err := svc.AddNote(ord.ID, "مرسوله بسته‌بندی ویژه نیاز دارد", "admin-1")
	if err != nil {
		t.Fatalf("AddNote failed: %v", err)
	}

	updated, _ := svc.GetOrderByID(ord.ID)
	if !strings.Contains(updated.Notes, "بسته‌بندی ویژه") {
		t.Errorf("expected note to be stored on order, got %s", updated.Notes)
	}

	// Verify timeline event
	events, _ := svc.GetTimeline(ord.ID)
	found := false
	for _, e := range events {
		if e.EventType == "note_added" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected 'note_added' timeline event")
	}
}

// ─── Test 12: Idempotency Key ────────────────────────────────────────────────

func TestOrderIdempotencyKey(t *testing.T) {
	svc := NewService()
	key := "idem-key-" + uuid.New().String()

	ord1, err := svc.CreateOrder(&Order{
		IdempotencyKey: key,
		SubtotalIRR:    100000,
		TotalIRR:       100000,
	})
	if err != nil {
		t.Fatalf("CreateOrder failed: %v", err)
	}

	ord2, err := svc.CreateOrder(&Order{
		IdempotencyKey: key,
		SubtotalIRR:    999999,
		TotalIRR:       999999,
	})
	if err != nil {
		t.Fatalf("Duplicate CreateOrder failed: %v", err)
	}

	if ord1.ID != ord2.ID {
		t.Errorf("expected same order ID for idempotent call, got %s vs %s", ord1.ID, ord2.ID)
	}
}

// ─── Test 13: Tracking Code Lookup ───────────────────────────────────────────

func TestTrackingCodeLookup(t *testing.T) {
	svc := NewService()
	ord := createTestOrder(t, svc)

	// Advance to shipped with tracking code
	advanceTo(t, svc, ord.ID, StatusPacked)
	trackingCode := "TRK-1405-LOOKUP001"
	_ = svc.TransitionStatus(TransitionRequest{
		OrderID:      ord.ID,
		NewStatus:    StatusShipped,
		ActorType:    ActorAdmin,
		TrackingCode: trackingCode,
	})

	// Lookup by tracking code
	found, err := svc.GetOrderByTrackingCode(trackingCode)
	if err != nil {
		t.Fatalf("GetOrderByTrackingCode failed: %v", err)
	}
	if found.ID != ord.ID {
		t.Errorf("expected order %s, got %s", ord.ID, found.ID)
	}

	// Lookup non-existent tracking code
	_, err = svc.GetOrderByTrackingCode("TRK-DOES-NOT-EXIST")
	if err != ErrOrderNotFound {
		t.Errorf("expected ErrOrderNotFound, got %v", err)
	}
}

// ─── Test Helper: Advance Order to Target Status ─────────────────────────────

func advanceTo(t *testing.T, svc *Service, orderID uuid.UUID, target OrderStatus) {
	t.Helper()

	// Define the happy-path sequence
	path := []OrderStatus{StatusPaid, StatusProcessing, StatusPacked, StatusShipped, StatusDelivered}

	for _, step := range path {
		ord, _ := svc.GetOrderByID(orderID)
		if ord.Status == target {
			return
		}

		req := TransitionRequest{
			OrderID:   orderID,
			NewStatus: step,
			ActorType: ActorAdmin,
			ActorID:   "test",
		}
		if step == StatusShipped {
			req.TrackingCode = "TRK-TEST-12345"
		}

		if err := svc.TransitionStatus(req); err != nil {
			t.Fatalf("advanceTo(%s): transition to %s failed: %v", target, step, err)
		}
	}
}
