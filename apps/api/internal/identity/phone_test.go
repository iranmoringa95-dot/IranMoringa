package identity

import (
	"testing"
)

func TestNormalizeIranianPhone(t *testing.T) {
	tests := []struct {
		input    string
		expected string
		err      bool
	}{
		{"09123456789", "+989123456789", false},
		{"+989123456789", "+989123456789", false},
		{"00989123456789", "+989123456789", false},
		{"9123456789", "+989123456789", false},
		{"091234567", "", true},
		{"12345", "", true},
		{"abcd", "", true},
	}

	for _, tt := range tests {
		got, err := NormalizeIranianPhone(tt.input)
		if (err != nil) != tt.err {
			t.Errorf("NormalizeIranianPhone(%q) error = %v, wantErr %v", tt.input, err, tt.err)
			continue
		}
		if got != tt.expected {
			t.Errorf("NormalizeIranianPhone(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}
