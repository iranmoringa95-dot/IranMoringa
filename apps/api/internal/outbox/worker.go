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
	StatusPending    EventStatus = "pending"
	StatusPublished  EventStatus = "published"
	StatusFailed     EventStatus = "failed"
	StatusDeadLetter EventStatus = "dead_letter"
)

type OutboxEvent struct {
	ID             uuid.UUID   `json:"id"`
	AggregateType  string      `json:"aggregate_type,omitempty"`
	AggregateID    string      `json:"aggregate_id,omitempty"`
	EventType      string      `json:"event_type"`
	Payload        string      `json:"payload"`
	PayloadVersion int         `json:"payload_version"`
	Status         EventStatus `json:"status"`
	AttemptCount   int         `json:"attempt_count"`
	MaxAttempts    int         `json:"max_attempts"`
	LastErrorCode  string      `json:"last_error_code,omitempty"`
	AvailableAt    time.Time   `json:"available_at"`
	ProcessedAt    *time.Time  `json:"processed_at,omitempty"`
	CreatedAt      time.Time   `json:"created_at"`
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
	return w.EnqueueEventDetailed("", "", eventType, payload, 1)
}

func (w *Worker) EnqueueEventDetailed(aggregateType, aggregateID, eventType, payload string, version int) *OutboxEvent {
	w.mu.Lock()
	defer w.mu.Unlock()

	now := time.Now()
	evt := &OutboxEvent{
		ID:             uuid.New(),
		AggregateType:  aggregateType,
		AggregateID:    aggregateID,
		EventType:      eventType,
		Payload:        payload,
		PayloadVersion: version,
		Status:         StatusPending,
		AttemptCount:   0,
		MaxAttempts:    5,
		AvailableAt:    now,
		CreatedAt:      now,
	}
	w.events = append(w.events, evt)
	return evt
}

func (w *Worker) ProcessOutboxEvents(ctx context.Context) int {
	w.mu.Lock()
	defer w.mu.Unlock()

	processed := 0
	now := time.Now()

	for _, evt := range w.events {
		if (evt.Status == StatusPending || evt.Status == StatusFailed) && evt.AttemptCount < evt.MaxAttempts {
			if now.Before(evt.AvailableAt) {
				continue
			}

			evt.AttemptCount++
			w.logger.Info("outbox worker publishing event",
				slog.String("id", evt.ID.String()),
				slog.String("event_type", evt.EventType),
				slog.Int("attempt", evt.AttemptCount),
			)

			evt.Status = StatusPublished
			evt.ProcessedAt = &now
			processed++
		}
	}
	return processed
}

func (w *Worker) GetEvents() []*OutboxEvent {
	w.mu.RLock()
	defer w.mu.RUnlock()

	copied := make([]*OutboxEvent, len(w.events))
	copy(copied, w.events)
	return copied
}
