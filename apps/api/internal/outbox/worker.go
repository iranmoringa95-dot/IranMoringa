package outbox

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/google/uuid"
)

type EventStatus string

const (
	StatusPending   EventStatus = "pending"
	StatusPublished EventStatus = "published"
	StatusFailed    EventStatus = "failed"
)

type OutboxEvent struct {
	ID        uuid.UUID   `json:"id"`
	EventType string      `json:"event_type"`
	Payload   string      `json:"payload"`
	Status    EventStatus `json:"status"`
	CreatedAt time.Time   `json:"created_at"`
}

type Worker struct {
	mu     sync.RWMutex
	events []*OutboxEvent
	logger *slog.Logger
}

func NewWorker(logger *slog.Logger) *Worker {
	return &Worker{
		events: make([]*OutboxEvent, 0),
		logger: logger,
	}
}

func (w *Worker) EnqueueEvent(eventType string, payload string) *OutboxEvent {
	w.mu.Lock()
	defer w.mu.Unlock()

	evt := &OutboxEvent{
		ID:        uuid.New(),
		EventType: eventType,
		Payload:   payload,
		Status:    StatusPending,
		CreatedAt: time.Now(),
	}
	w.events = append(w.events, evt)
	return evt
}

func (w *Worker) ProcessOutboxEvents(ctx context.Context) int {
	w.mu.Lock()
	defer w.mu.Unlock()

	processed := 0
	for _, evt := range w.events {
		if evt.Status == StatusPending {
			w.logger.Info("outbox worker publishing event",
				slog.String("id", evt.ID.String()),
				slog.String("event_type", evt.EventType),
			)
			evt.Status = StatusPublished
			processed++
		}
	}
	return processed
}
