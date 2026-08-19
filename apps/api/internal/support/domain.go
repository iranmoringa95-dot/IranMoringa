package support

import (
	"time"

	"github.com/google/uuid"
)

type InquiryStatus string

const (
	StatusOpen       InquiryStatus = "open"
	StatusInProgress InquiryStatus = "in_progress"
	StatusResolved   InquiryStatus = "resolved"
	StatusClosed     InquiryStatus = "closed"
)

type InquiryPriority string

const (
	PriorityNormal InquiryPriority = "normal"
	PriorityHigh   InquiryPriority = "high"
	PriorityUrgent InquiryPriority = "urgent"
)

type SupportChannel struct {
	ID              uuid.UUID `json:"id"`
	Type            string    `json:"type"` // "whatsapp", "telegram", "instagram", "phone", "contact_form"
	LabelFA         string    `json:"label_fa"`
	HandleOrURL     string    `json:"handle_or_url"`
	PrefillTemplate string    `json:"prefill_template,omitempty"`
	AvailabilityInfo string   `json:"availability_info"`
	IsActive        bool      `json:"is_active"`
}

type BusinessHours struct {
	Weekday      int    `json:"weekday"` // 0=Sunday, 6=Saturday
	OpenTime     string `json:"open_time"`
	CloseTime    string `json:"close_time"`
	Timezone     string `json:"timezone"`
	IsClosed     bool   `json:"is_closed"`
	ClosedReason string `json:"closed_reason,omitempty"`
}

type SupportInquiry struct {
	ID                 uuid.UUID       `json:"id"`
	TicketNumber       string          `json:"ticket_number"` // TCK-YYYYMMDD-XXXXX
	UserID             *uuid.UUID      `json:"user_id,omitempty"`
	CustomerName       string          `json:"customer_name"`
	ContactInfo        string          `json:"contact_info"`
	Subject            string          `json:"subject"`
	Body               string          `json:"body"`
	OrderNumber        string          `json:"order_number,omitempty"`
	OrderOwnerVerified bool            `json:"order_owner_verified"`
	Status             InquiryStatus   `json:"status"`
	Priority           InquiryPriority `json:"priority"`
	AssignedTo         *string         `json:"assigned_to,omitempty"`
	AdminNotes         string          `json:"admin_notes,omitempty"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}
