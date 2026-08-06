package localization

import (
	"testing"
	"time"
)

func TestNormalizeDigits(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"۰۹۱۲۳۴۵۶۷۸۹", "09123456789"},
		{"٠٩١٢٣٤٥٦٧٨٩", "09123456789"},
		{"۱۲۳۴۵۶7890", "1234567890"},
	}

	for _, tt := range tests {
		got := NormalizeDigits(tt.input)
		if got != tt.expected {
			t.Errorf("NormalizeDigits(%q) = %q; expected %q", tt.input, got, tt.expected)
		}
	}
}

func TestNormalizePersianText(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"مورينگا كبسول", "مورینگا کپسول"},
		{"  پودر   برگ  ", "پودر برگ"},
	}

	for _, tt := range tests {
		got := NormalizePersianText(tt.input)
		if got != tt.expected {
			t.Errorf("NormalizePersianText(%q) = %q; expected %q", tt.input, got, tt.expected)
		}
	}
}

func TestNormalizeIranianPhone(t *testing.T) {
	validPhones := []struct {
		input    string
		expected string
	}{
		{"09123456789", "+989123456789"},
		{"۰۹۱۲۳۴۵۶۷۸۹", "+989123456789"},
		{"+989123456789", "+989123456789"},
		{"00989123456789", "+989123456789"},
		{"989123456789", "+989123456789"},
		{" ۰۹۱۲-۳۴۵-۶۷۸۹ ", "+989123456789"},
	}

	for _, tt := range validPhones {
		got, err := NormalizeIranianPhone(tt.input)
		if err != nil {
			t.Errorf("NormalizeIranianPhone(%q) unexpectedly failed: %v", tt.input, err)
		}
		if got != tt.expected {
			t.Errorf("NormalizeIranianPhone(%q) = %q; expected %q", tt.input, got, tt.expected)
		}
	}

	invalidPhones := []string{
		"08123456789",
		"0912345678",   // 9 digits instead of 10
		"091234567890", // 11 digits
		"abcd",
	}

	for _, input := range invalidPhones {
		_, err := NormalizeIranianPhone(input)
		if err == nil {
			t.Errorf("NormalizeIranianPhone(%q) expected error but got nil", input)
		}
	}
}

func TestValidatePostalCode(t *testing.T) {
	validCode, err := ValidatePostalCode("۰۱۲۳۴۵۶۷۸۹")
	if err != nil || validCode != "0123456789" {
		t.Errorf("expected valid postal code '0123456789', got %q, err %v", validCode, err)
	}

	_, errInvalid := ValidatePostalCode("12345")
	if errInvalid != ErrInvalidPostalCode {
		t.Errorf("expected ErrInvalidPostalCode, got %v", errInvalid)
	}
}

func TestCurrencyFormatting(t *testing.T) {
	if IRRToToman(12750000) != 1275000 {
		t.Errorf("IRRToToman(12750000) expected 1275000")
	}

	formatted := FormatToman(12750000, true)
	if formatted != "۱,۲۷۵,۰۰۰ تومان" {
		t.Errorf("FormatToman(12750000, true) = %q; expected '۱,۲۷۵,۰۰۰ تومان'", formatted)
	}
}

func TestJalaliConversion(t *testing.T) {
	// Aug 6, 2026 -> 15 Mordad 1405
	loc, _ := time.LoadLocation("Asia/Tehran")
	gDate := time.Date(2026, 8, 6, 12, 0, 0, 0, loc)

	jy, jm, jd := ToJalali(gDate)
	if jy != 1405 || jm != 5 || jd != 15 {
		t.Errorf("ToJalali(2026-08-06) = %d/%d/%d; expected 1405/5/15", jy, jm, jd)
	}

	str := FormatJalali(gDate, true)
	if str != "۱۵ مرداد ۱۴۰۵" {
		t.Errorf("FormatJalali long = %q; expected '۱۵ مرداد ۱۴۰۵'", str)
	}
}
