package identity

import (
	"moringalab/api/internal/localization"
)

var (
	ErrInvalidPhone = localization.ErrInvalidPhone
)

// NormalizeIranianPhone converts 09123456789, +989123456789, 00989123456789, or Persian digits into canonical E.164 (+989123456789) format.
func NormalizeIranianPhone(phone string) (string, error) {
	return localization.NormalizeIranianPhone(phone)
}
