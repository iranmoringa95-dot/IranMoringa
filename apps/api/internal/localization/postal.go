package localization

import (
	"errors"
	"regexp"
	"strings"
)

var (
	ErrInvalidPostalCode = errors.New("کد پستی باید یک عدد ۱۰ رقمی معتبر باشد")
	postalCodeRegex      = regexp.MustCompile(`^\d{10}$`)
)

// ValidatePostalCode normalizes digits and validates that the string is exactly a 10-digit Iranian postal code.
func ValidatePostalCode(postalCode string) (string, error) {
	normalized := NormalizeDigits(strings.TrimSpace(postalCode))
	normalized = strings.ReplaceAll(normalized, "-", "")
	normalized = strings.ReplaceAll(normalized, " ", "")

	if !postalCodeRegex.MatchString(normalized) {
		return "", ErrInvalidPostalCode
	}
	return normalized, nil
}
