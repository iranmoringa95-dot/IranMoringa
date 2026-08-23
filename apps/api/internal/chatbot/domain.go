package chatbot

import (
	"time"

	"github.com/google/uuid"
)

type ChatConversationStatus string

const (
	ConvActive    ChatConversationStatus = "active"
	ConvHandedOff ChatConversationStatus = "handed_off"
	ConvClosed    ChatConversationStatus = "closed"
)

type Citation struct {
	Title      string `json:"title"`
	URL        string `json:"url"`
	SourceType string `json:"source_type"` // "product", "article", "faq"
}

type KnowledgeDocument struct {
	ID              uuid.UUID `json:"id"`
	SourceType      string    `json:"source_type"` // "product", "article", "faq"
	SourceID        uuid.UUID `json:"source_id"`
	Title           string    `json:"title"`
	ApprovedContent string    `json:"approved_content"`
	Checksum        string    `json:"checksum"`
	IndexedAt       time.Time `json:"indexed_at"`
}

type ChatConversation struct {
	ID        uuid.UUID              `json:"id"`
	UserID    *uuid.UUID             `json:"user_id,omitempty"`
	Status    ChatConversationStatus `json:"status"`
	StartedAt time.Time              `json:"started_at"`
	ClosedAt  *time.Time             `json:"closed_at,omitempty"`
}

type ChatMessage struct {
	ID               uuid.UUID  `json:"id"`
	ConversationID   uuid.UUID  `json:"conversation_id"`
	Role             string     `json:"role"` // "user", "assistant", "system"
	Content          string     `json:"content"`
	Citations        []Citation `json:"citations,omitempty"`
	SafetyFlagged    bool       `json:"safety_flagged"`
	HandoffSuggested bool       `json:"handoff_suggested"`
	CreatedAt        time.Time  `json:"created_at"`
}

type ChatFeedback struct {
	ID             uuid.UUID `json:"id"`
	ConversationID uuid.UUID `json:"conversation_id"`
	Rating         int       `json:"rating"` // 1 to 5
	Reason         string    `json:"reason,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}
