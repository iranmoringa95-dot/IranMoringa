package outbox

import (
	"context"
	"log/slog"
	"os"
	"testing"
)

func TestOutboxEventPublishing(t *testing.T) {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	w := NewWorker(logger)

	w.EnqueueEvent("ORDER_CREATED", `{"order_number":"ML-1405-000001"}`)
	w.EnqueueEvent("BACK_IN_STOCK", `{"variant_id":"v1"}`)

	count := w.ProcessOutboxEvents(context.Background())
	if count != 2 {
		t.Fatalf("expected 2 published outbox events, got %d", count)
	}
}
