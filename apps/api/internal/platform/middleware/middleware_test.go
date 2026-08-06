package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRedactHeaderValue(t *testing.T) {
	if RedactHeaderValue("Authorization", "Bearer secret-token") != "[REDACTED]" {
		t.Errorf("expected Authorization header to be redacted")
	}
	if RedactHeaderValue("Cookie", "session=123") != "[REDACTED]" {
		t.Errorf("expected Cookie header to be redacted")
	}
	if RedactHeaderValue("Content-Type", "application/json") != "application/json" {
		t.Errorf("expected non-sensitive header to be preserved")
	}
}

func TestRateLimiter(t *testing.T) {
	store := NewRateLimiterStore(2, 60) // 2 requests allowed
	handler := RateLimit(store)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Request 1: OK
	req1 := httptest.NewRequest("GET", "/test", nil)
	req1.RemoteAddr = "192.168.1.1:1234"
	rec1 := httptest.NewRecorder()
	handler.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("expected request 1 to be 200 OK, got %d", rec1.Code)
	}

	// Request 2: OK
	req2 := httptest.NewRequest("GET", "/test", nil)
	req2.RemoteAddr = "192.168.1.1:1234"
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected request 2 to be 200 OK, got %d", rec2.Code)
	}

	// Request 3: Exceeded -> HTTP 429 Too Many Requests
	req3 := httptest.NewRequest("GET", "/test", nil)
	req3.RemoteAddr = "192.168.1.1:1234"
	rec3 := httptest.NewRecorder()
	handler.ServeHTTP(rec3, req3)
	if rec3.Code != http.StatusTooManyRequests {
		t.Fatalf("expected request 3 to be 429 Too Many Requests, got %d", rec3.Code)
	}
	if rec3.Header().Get("Retry-After") != "60" {
		t.Errorf("expected Retry-After header to be 60")
	}
}
