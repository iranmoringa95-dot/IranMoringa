package identity

import (
	"errors"
	"regexp"

	"strings"
)

var (
	ErrInvalidPhone = errors.New("شماره تلفن همراه واردشده معتبر نیست")
	phoneRegex      = regexp.MustCompile(`^(?:\+98|0098|0)?9\d{9}$`)
)

// NormalizeIranianPhone converts 09123456789, +989123456789, 00989123456789 into canonical +989123456789 format.
func NormalizeIranianPhone(phone string) (string, error) {
	cleaned := strings.TrimSpace(phone)
	if !phoneRegex.MatchString(cleaned) {
		return "", ErrInvalidPhone
	}

	if strings.HasPrefix(cleaned, "+98") {
		return cleaned, nil
	}
	if strings.HasPrefix(cleaned, "0098") {
		return "+98" + cleaned[4:], nil
	}
	if strings.HasPrefix(cleaned, "0") {
		return "+98" + cleaned[1:], nil
	}
	return "+98" + cleaned, nil
}
