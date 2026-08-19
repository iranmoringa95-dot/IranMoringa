package notifications

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type NotificationDelivery struct {
	ID                uuid.UUID  `json:"id"`
	EventID           *uuid.UUID `json:"event_id,omitempty"`
	EventCode         string     `json:"event_code"`
	RecipientMasked   string     `json:"recipient_masked"`
	RecipientRaw      string     `json:"-"` // Hidden from JSON serialization for security/PII
	Channel           Channel    `json:"channel"`
	Provider          string     `json:"provider"`
	Status            SendStatus `json:"status"`
	ProviderMessageID string     `json:"provider_message_id,omitempty"`
	AttemptCount      int        `json:"attempt_count"`
	MaxAttempts       int        `json:"max_attempts"`
	LastError         string     `json:"last_error,omitempty"`
	IsOTP             bool       `json:"is_otp"`
	Subject           string     `json:"subject,omitempty"`
	Body              string     `json:"body"`
	CreatedAt         time.Time  `json:"created_at"`
	SentAt            *time.Time `json:"sent_at,omitempty"`
}

// RedactOTPBody ensures OTP content is never exposed in JSON logs or responses.
func (d *NotificationDelivery) SanitizeForJSON() *NotificationDelivery {
	sanitized := *d
	if sanitized.IsOTP {
		sanitized.Body = "[REDACTED]"
	}
	return &sanitized
}

// ─── PII Masking Utilities ───────────────────────────────────────────────────

// MaskPhone masks a phone number, preserving prefix and suffix digits.
// Example: "+989121234567" -> "+98912***4567", "09121234567" -> "0912***4567"
func MaskPhone(phone string) string {
	phone = strings.TrimSpace(phone)
	if len(phone) < 7 {
		return "****"
	}

	if strings.HasPrefix(phone, "+98") && len(phone) >= 12 {
		return phone[:6] + "***" + phone[len(phone)-4:]
	}

	if strings.HasPrefix(phone, "09") && len(phone) == 11 {
		return phone[:4] + "***" + phone[len(phone)-4:]
	}

	// Generic masking
	return phone[:3] + "***" + phone[len(phone)-3:]
}

// MaskEmail masks an email address, preserving first letter and domain.
// Example: "user@example.com" -> "u***@example.com"
func MaskEmail(email string) string {
	email = strings.TrimSpace(email)
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***@***"
	}

	username := parts[0]
	domain := parts[1]

	if len(username) <= 1 {
		return "*@" + domain
	}

	return string(username[0]) + "***@" + domain
}
