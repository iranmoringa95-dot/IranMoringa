package identity

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestProductionOTPHandlerHidesCodeAndSetsSecureCookie(t *testing.T) {
	store := NewMemoryStore()
	var deliveredCode string
	service := NewService(store, func(phone, code string) error {
		deliveredCode = code
		return nil
	})
	handler := NewHandler(service, true)

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/auth/otp/request",
		bytes.NewBufferString(`{"phone":"09121234567"}`),
	)
	response := httptest.NewRecorder()
	handler.RequestOTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected request status 200, got %d", response.Code)
	}
	var body map[string]interface{}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode request response: %v", err)
	}
	if _, exposed := body["dev_otp"]; exposed {
		t.Fatal("production response must not expose dev_otp")
	}
	if deliveredCode == "" {
		t.Fatal("expected OTP code to be delivered")
	}

	verifyRequest := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/auth/otp/verify",
		bytes.NewBufferString(`{"phone":"09121234567","code":"`+deliveredCode+`"}`),
	)
	verifyResponse := httptest.NewRecorder()
	handler.VerifyOTP(verifyResponse, verifyRequest)

	if verifyResponse.Code != http.StatusOK {
		t.Fatalf("expected verify status 200, got %d", verifyResponse.Code)
	}
	if !strings.Contains(verifyResponse.Header().Get("Set-Cookie"), "Secure") {
		t.Fatal("production session cookie must include Secure")
	}
}
