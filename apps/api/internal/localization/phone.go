package localization

import (
	"errors"
	"regexp"
	"strings"
)

var (
	ErrInvalidPhone = errors.New("شماره تلفن همراه واردشده معتبر نیست (مثال معتبر: 09123456789)")
	iranMobileRegex = regexp.MustCompile(`^(?:\+98|0098|98|0)?9\d{9}$`)
)

// NormalizeIranianPhone converts 09123456789, +989123456789, 00989123456789, or Persian digits into canonical E.164 format (+989123456789).
func NormalizeIranianPhone(phone string) (string, error) {
	// First normalize Persian/Arabic digits
	normalized := NormalizeDigits(strings.TrimSpace(phone))

	// Remove all whitespace, dashes, spaces
	normalized = strings.ReplaceAll(normalized, " ", "")
	normalized = strings.ReplaceAll(normalized, "-", "")

	if !iranMobileRegex.MatchString(normalized) {
		return "", ErrInvalidPhone
	}

	if strings.HasPrefix(normalized, "+98") {
		return normalized, nil
	}
	if strings.HasPrefix(normalized, "0098") {
		return "+98" + normalized[4:], nil
	}
	if strings.HasPrefix(normalized, "98") {
		return "+98" + normalized[2:], nil
	}
	if strings.HasPrefix(normalized, "0") {
		return "+98" + normalized[1:], nil
	}
	return "+98" + normalized, nil
}
