package identity

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `json:"id"`
	Phone     string    `json:"phone"`
	Email     *string   `json:"email,omitempty"`
	FirstName *string   `json:"first_name,omitempty"`
	LastName  *string   `json:"last_name,omitempty"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserCredentials struct {
	UserID              uuid.UUID  `json:"user_id"`
	PasswordHash        *string    `json:"-"`
	TOTPSecret          *string    `json:"-"`
	TOTPEnabled         bool       `json:"totp_enabled"`
	FailedLoginAttempts int        `json:"failed_login_attempts"`
	LockedUntil         *time.Time `json:"locked_until,omitempty"`
}

type OTPChallenge struct {
	ID          uuid.UUID  `json:"id"`
	Phone       string     `json:"phone"`
	OTPHash     string     `json:"-"`
	Attempts    int        `json:"attempts"`
	MaxAttempts int        `json:"max_attempts"`
	ExpiresAt   time.Time  `json:"expires_at"`
	ConsumedAt  *time.Time `json:"consumed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Session struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	TokenHash string    `json:"-"`
	IPAddress string    `json:"ip_address,omitempty"`
	UserAgent string    `json:"user_agent,omitempty"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type Role struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

type Permission struct {
	ID    uuid.UUID `json:"id"`
	Code  string    `json:"code"`
	Title string    `json:"title"`
}
