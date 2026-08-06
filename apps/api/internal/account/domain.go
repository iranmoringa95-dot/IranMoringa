package account

import (
	"time"

	"github.com/google/uuid"
)

type CustomerProfile struct {
	UserID    uuid.UUID `json:"user_id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email,omitempty"`
	PhoneE164 string    `json:"phone_e164"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CustomerAddress struct {
	ID                uuid.UUID `json:"id"`
	UserID            uuid.UUID `json:"user_id"`
	Label             string    `json:"label"`
	RecipientName     string    `json:"recipient_name"`
	PhoneE164         string    `json:"phone_e164"`
	ProvinceName      string    `json:"province_name"`
	CityName          string    `json:"city_name"`
	PostalCode        string    `json:"postal_code"`
	AddressLine       string    `json:"address_line"`
	IsDefaultShipping bool      `json:"is_default_shipping"`
	IsDefaultBilling  bool      `json:"is_default_billing"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
