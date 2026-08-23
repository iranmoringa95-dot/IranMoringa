package identity

import (
	"errors"
	"testing"
)

func TestGenerateOTPCode(t *testing.T) {
	code, err := GenerateOTPCode()
	if err != nil {
		t.Fatalf("unexpected error generating CSPRNG OTP: %v", err)
	}
	if len(code) != 6 {
		t.Errorf("expected 6-digit OTP code, got %s", code)
	}
}

func TestOTPFlowAndSessionRevocation(t *testing.T) {
	store := NewMemoryStore()
	svc := NewService(store)

	phone := "09123456789"
	otpCode, errReq := svc.RequestOTP(phone)
	if errReq != nil {
		t.Fatalf("unexpected error requesting OTP: %v", errReq)
	}

	// Invalid OTP code -> Error
	_, _, errInvalid := svc.VerifyOTP(phone, "000000")
	if errInvalid != ErrOTPInvalid {
		t.Errorf("expected ErrOTPInvalid for wrong OTP code, got %v", errInvalid)
	}

	// Valid OTP code -> Returns plain session token & User
	plainToken, user, errVerify := svc.VerifyOTP(phone, otpCode)
	if errVerify != nil || user == nil || plainToken == "" {
		t.Fatalf("unexpected error during valid OTP verify: %v", errVerify)
	}

	// Validate Session -> OK
	validUser, errVal := svc.ValidateSession(plainToken)
	if errVal != nil || validUser.ID != user.ID {
		t.Fatalf("expected valid session user, got %v, err %v", validUser, errVal)
	}

	// Logout All -> Session Revoked
	_ = svc.LogoutAll(user.ID)
	_, errRevoked := svc.ValidateSession(plainToken)
	if errRevoked != ErrUnauthorized {
		t.Errorf("expected ErrUnauthorized after LogoutAll, got %v", errRevoked)
	}
}
func TestRequestOTPDeliversCodeBeforeStoringChallenge(t *testing.T) {
	store := NewMemoryStore()
	var deliveredPhone string
	var deliveredCode string
	svc := NewService(store, func(phone, code string) error {
		deliveredPhone = phone
		deliveredCode = code
		return nil
	})

	otpCode, err := svc.RequestOTP("+989121234567")
	if err != nil {
		t.Fatalf("unexpected request error: %v", err)
	}
	if deliveredPhone != "+989121234567" || deliveredCode != otpCode {
		t.Fatalf("expected normalized phone and generated code to be delivered")
	}

	if _, _, err := svc.VerifyOTP(deliveredPhone, deliveredCode); err != nil {
		t.Fatalf("expected delivered OTP to verify: %v", err)
	}
}

func TestRequestOTPDoesNotStoreChallengeWhenDeliveryFails(t *testing.T) {
	store := NewMemoryStore()
	svc := NewService(store, func(phone, code string) error {
		return errors.New("gateway unavailable")
	})

	_, err := svc.RequestOTP("09121234567")
	if !errors.Is(err, ErrOTPDelivery) {
		t.Fatalf("expected ErrOTPDelivery, got %v", err)
	}

	if _, _, verifyErr := svc.VerifyOTP("09121234567", "123456"); verifyErr != ErrOTPInvalid {
		t.Fatalf("expected no challenge after failed delivery, got %v", verifyErr)
	}
}
