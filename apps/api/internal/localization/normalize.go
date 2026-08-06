package localization

import (
	"regexp"
	"strings"
)

var (
	// Map for Persian (۰-۹) and Arabic (٠-٩) digits to English ASCII (0-9)
	digitReplacer = strings.NewReplacer(
		"۰", "0", "۱", "1", "۲", "2", "۳", "3", "۴", "4",
		"۵", "5", "۶", "6", "۷", "7", "۸", "8", "۹", "9",
		"٠", "0", "١", "1", "٢", "2", "٣", "3", "٤", "4",
		"٥", "5", "٦", "6", "٧", "7", "٨", "8", "٩", "9",
	)

	// Map for Arabic characters to Persian counterparts
	charReplacer = strings.NewReplacer(
		"ي", "ی",
		"ك", "ک",
		"ة", "ه",
		"أ", "ا",
		"إ", "ا",
		"آ", "ا",
		"ؤ", "و",
		"ئ", "ی",
	)

	multipleSpacesRegex = regexp.MustCompile(`\s+`)
)

// NormalizeDigits converts Persian and Arabic digits to ASCII English digits.
func NormalizeDigits(s string) string {
	return digitReplacer.Replace(s)
}

// NormalizePersianText unifies Arabic characters (ي/ك) to Persian (ی/ک) and cleans extra spaces.
func NormalizePersianText(s string) string {
	cleaned := strings.TrimSpace(s)
	cleaned = charReplacer.Replace(cleaned)
	cleaned = multipleSpacesRegex.ReplaceAllString(cleaned, " ")
	return cleaned
}

// NormalizeSearchQuery combines digit and character normalization for database search queries.
func NormalizeSearchQuery(s string) string {
	digitsNormalized := NormalizeDigits(s)
	return NormalizePersianText(digitsNormalized)
}
