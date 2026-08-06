package localization

import (
	"fmt"
	"strings"
)

// IRRToToman converts integer Rial (IRR) to Toman (10 IRR = 1 Toman).
func IRRToToman(irr int64) int64 {
	return irr / 10
}

// TomanToIRR converts integer Toman to Rial (IRR).
func TomanToIRR(toman int64) int64 {
	return toman * 10
}

// FormatToman formats IRR money into human-readable Toman string with thousand separators.
func FormatToman(irr int64, usePersianDigits bool) string {
	toman := IRRToToman(irr)
	formatted := formatWithCommas(toman)
	if usePersianDigits {
		formatted = convertToPersianDigits(formatted)
	}
	return fmt.Sprintf("%s تومان", formatted)
}

func formatWithCommas(n int64) string {
	in := fmt.Sprintf("%d", n)
	out := make([]byte, len(in)+(len(in)-1)/3)

	for i, j, k := len(in)-1, len(out)-1, 0; i >= 0; i, j, k = i-1, j-1, k+1 {
		if k > 0 && k%3 == 0 {
			out[j] = ','
			j--
		}
		out[j] = in[i]
	}
	return string(out)
}

func convertToPersianDigits(s string) string {
	persianDigitsReplacer := strings.NewReplacer(
		"0", "۰", "1", "۱", "2", "۲", "3", "۳", "4", "۴",
		"5", "۵", "6", "۶", "7", "۷", "8", "۸", "9", "۹",
	)
	return persianDigitsReplacer.Replace(s)
}
