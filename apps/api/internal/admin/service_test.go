package admin

import (
	"testing"

	"github.com/google/uuid"

	"moringalab/api/internal/audit"
	"moringalab/api/internal/inventory"
	"moringalab/api/internal/orders"
)

func TestAdminOrderFulfillmentAndInventoryAdjustment(t *testing.T) {
	auditSvc := audit.NewService()
	orderSvc := orders.NewService()
	invSvc := inventory.NewService()
	svc := NewService(auditSvc, orderSvc, invSvc)

	// Create test order
	ord, _ := orderSvc.CreateOrder(&orders.Order{
		SubtotalIRR: 500000,
	})

	// 1. Updating status to shipped without tracking code fails
	_, errNoTrack := svc.FulfillOrder(ord.OrderNumber, orders.StatusShipped, "")
	if errNoTrack == nil {
		t.Fatal("expected error when fulfilling order to shipped without tracking code")
	}

	// 2. Adjust inventory logs audit entry
	varID := uuid.New()
	errAdj := svc.AdjustInventory(varID, 50)
	if errAdj != nil {
		t.Fatalf("AdjustInventory failed: %v", errAdj)
	}

	logs := auditSvc.ListLogs()
	if len(logs) != 1 {
		t.Fatalf("expected 1 audit log entry, got %d", len(logs))
	}
	if logs[0].Action != "ADJUST_INVENTORY" {
		t.Errorf("expected action ADJUST_INVENTORY, got %s", logs[0].Action)
	}
}
