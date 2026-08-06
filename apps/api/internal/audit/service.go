package audit

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID         uuid.UUID `json:"id"`
	ActorID    string    `json:"actor_id"`
	ActorRole  string    `json:"actor_role"`
	Action     string    `json:"action"`
	EntityType string    `json:"entity_type"`
	EntityID   string    `json:"entity_id"`
	Details    string    `json:"details"`
	IPAddress  string    `json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`
}

type Service struct {
	mu   sync.RWMutex
	logs []AuditLog
}

func NewService() *Service {
	return &Service{
		logs: make([]AuditLog, 0),
	}
}

func (s *Service) LogAction(actorID, role, action, entityType, entityID, details string) AuditLog {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry := AuditLog{
		ID:         uuid.New(),
		ActorID:    actorID,
		ActorRole:  role,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Details:    details,
		IPAddress:  "127.0.0.1",
		CreatedAt:  time.Now(),
	}

	s.logs = append([]AuditLog{entry}, s.logs...) // Prepend for latest first
	return entry
}

func (s *Service) ListLogs() []AuditLog {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]AuditLog, len(s.logs))
	copy(result, s.logs)
	return result
}
