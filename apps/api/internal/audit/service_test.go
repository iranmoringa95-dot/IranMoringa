package audit

import (
	"testing"
)

func TestAuditLogRecording(t *testing.T) {
	svc := NewService()

	svc.LogAction("admin-1", "super_admin", "UPDATE_ORDER_STATUS", "order", "ML-1405-000001", "Changed status to shipped")

	logs := svc.ListLogs()
	if len(logs) != 1 {
		t.Fatalf("expected 1 audit log entry, got %d", len(logs))
	}
	if logs[0].Action != "UPDATE_ORDER_STATUS" {
		t.Errorf("expected action UPDATE_ORDER_STATUS, got %s", logs[0].Action)
	}
}
