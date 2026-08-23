package notifications

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWebOneSMSProviderSendSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/SMS/Send" {
			t.Fatalf("expected /SMS/Send, got %s", r.URL.Path)
		}
		if r.Header.Get("x-api-key") != "test-api-key" {
			t.Fatalf("expected x-api-key test-api-key, got %s", r.Header.Get("x-api-key"))
		}

		var payload webOneSendSMSPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}

		if payload.ToNumber != "09121234567" {
			t.Fatalf("expected recipient 09121234567, got %s", payload.ToNumber)
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"isSuccess":true,"message":"ارسال با موفقیت انجام شد","status":200}`))
	}))
	defer server.Close()

	provider := NewWebOneSMSProvider(WebOneSMSConfig{
		APIKey:       "test-api-key",
		SenderNumber: "10001234",
		BaseURL:      server.URL,
		HTTPClient:   server.Client(),
	})

	res, err := provider.SendSMS("09121234567", "کد ورود شما: 654321")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.Status != SendStatusSent {
		t.Fatalf("expected status sent, got %s", res.Status)
	}
}

func TestWebOneSMSProviderSendFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"isSuccess":false,"message":"اعتبار پیامک کافی نیست","status":400}`))
	}))
	defer server.Close()

	provider := NewWebOneSMSProvider(WebOneSMSConfig{
		APIKey:       "test-api-key",
		SenderNumber: "10001234",
		BaseURL:      server.URL,
		HTTPClient:   server.Client(),
	})

	res, err := provider.SendSMS("09121234567", "تست")
	if err == nil {
		t.Fatalf("expected error on 400 response, got nil")
	}

	if res.Status != SendStatusFailed {
		t.Fatalf("expected status failed, got %s", res.Status)
	}
}
func TestWebOneSMSProviderSendOTPSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/SMS/Send" {
			t.Fatalf("expected /SMS/Send, got %s", r.URL.Path)
		}

		var payload webOneSendOTPPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Fatalf("failed to decode OTP request: %v", err)
		}
		if payload.ToNumber != "09121234567" || payload.PatternID != "pattern-1" {
			t.Fatalf("unexpected OTP payload: %+v", payload)
		}
		if payload.PatternParameterData["ParameterValue"] != "654321" {
			t.Fatalf("expected OTP code in pattern parameters")
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"Succeeded":true,"refId":42,"resultCode":0}`))
	}))
	defer server.Close()

	provider := NewWebOneSMSProvider(WebOneSMSConfig{
		APIKey:        "test-api-key",
		SenderNumber:  "10001234",
		BaseURL:       server.URL,
		OTPTemplateID: "pattern-1",
		HTTPClient:    server.Client(),
	})

	result, err := provider.SendOTP("+989121234567", "654321")
	if err != nil {
		t.Fatalf("unexpected OTP error: %v", err)
	}
	if result.Status != SendStatusSent || result.ProviderMessageID != "42" {
		t.Fatalf("unexpected OTP result: %+v", result)
	}
}

func TestWebOneSMSProviderRejectsUnsuccessful200Response(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"Succeeded":false,"message":"invalid API key","resultCode":1}`))
	}))
	defer server.Close()

	provider := NewWebOneSMSProvider(WebOneSMSConfig{
		APIKey:       "test-api-key",
		SenderNumber: "10001234",
		BaseURL:      server.URL,
		HTTPClient:   server.Client(),
	})

	result, err := provider.SendSMS("09121234567", "test")
	if err == nil {
		t.Fatal("expected unsuccessful provider response to return an error")
	}
	if result == nil || result.Status != SendStatusFailed {
		t.Fatalf("expected failed result, got %+v", result)
	}
}
func TestWebOneSMSProviderRejectsMissingAPIKey(t *testing.T) {
	provider := NewWebOneSMSProvider(WebOneSMSConfig{})

	result, err := provider.SendSMS("09121234567", "test")
	if err == nil {
		t.Fatal("expected missing API key to fail instead of reporting a mock success")
	}
	if result == nil || result.Status != SendStatusFailed {
		t.Fatalf("expected failed result, got %+v", result)
	}
}
