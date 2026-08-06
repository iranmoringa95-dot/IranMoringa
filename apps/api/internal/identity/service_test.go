package identity

import (
	"testing"
)

func TestOTPFlow(t *testing.T) {
	store := NewMemoryStore()
	svc := NewService(store)

	phone := "09123456789"
	otpCode, err := svc.RequestOTP(phone)
	if err != nil {
		t.Fatalf("RequestOTP failed: %v", err)
	}

	t.Run("Verify with wrong code fails", func(t *testing.T) {
		_, _, err := svc.VerifyOTP(phone, "000000")
		if err == nil {
			t.Fatal("expected error with wrong OTP code, got nil")
		}
	})

	t.Run("Verify with correct code succeeds", func(t *testing.T) {
		sessionToken, user, err := svc.VerifyOTP(phone, otpCode)
		if err != nil {
			t.Fatalf("VerifyOTP failed with correct code: %v", err)
		}
		if user.Phone != "+989123456789" {
			t.Errorf("expected normalized phone +989123456789, got %s", user.Phone)
		}
		if sessionToken == "" {
			t.Fatal("expected non-empty session token")
		}

		// Validate session token
		validUser, err := svc.ValidateSession(sessionToken)
		if err != nil {
			t.Fatalf("ValidateSession failed: %v", err)
		}
		if validUser.ID != user.ID {
			t.Errorf("expected user ID %s, got %s", user.ID, validUser.ID)
		}
	})
}

func TestRBACPermissionCheck(t *testing.T) {
	store := NewMemoryStore()
	svc := NewService(store)

	// Verify customer role default permissions
	_, user, err := svc.VerifyOTP("09123456789", "123456")
	if err != nil {
		// If OTP code wasn't pre-set, request first
		code, _ := svc.RequestOTP("09123456789")
		_, user, err = svc.VerifyOTP("09123456789", code)
	}

	if !svc.HasPermission(user.ID, "me.read") {
		t.Error("expected customer to have me.read permission")
	}

	if svc.HasPermission(user.ID, "inventory.adjust") {
		t.Error("customer should NOT have inventory.adjust permission")
	}
}
