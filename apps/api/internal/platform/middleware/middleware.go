package middleware

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

type contextKey string

const RequestIDKey contextKey = "request_id"

// RequestID attaches a unique X-Request-ID header to every request context.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if reqID == "" {
			reqID = uuid.New().String()
		}
		w.Header().Set("X-Request-ID", reqID)
		ctx := context.WithValue(r.Context(), RequestIDKey, reqID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Recoverer intercepts panics and returns structured JSON 500 Problem Details.
func Recoverer(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rerr := recover(); rerr != nil {
					logger.Error("panic recovered", slog.Any("panic", rerr))
					w.Header().Set("Content-Type", "application/problem+json; charset=utf-8")
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(map[string]interface{}{
						"type":       "https://moringalab.local/problems/internal-error",
						"title":      "خطای داخلی سرور رخ داده است",
						"status":     500,
						"code":       "INTERNAL_SERVER_ERROR",
						"detail":     "یک خطای غیرمنتظره در سیستم رخ داد.",
						"request_id": r.Context().Value(RequestIDKey),
					})
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// CORS handles Cross-Origin Resource Sharing headers.
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, Idempotency-Key")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RedactHeaderValue sanitizes sensitive HTTP header values (Cookie, Authorization, Set-Cookie).
func RedactHeaderValue(headerName, headerVal string) string {
	nameLower := strings.ToLower(headerName)
	if nameLower == "authorization" || nameLower == "cookie" || nameLower == "set-cookie" {
		return "[REDACTED]"
	}
	return headerVal
}

type rateLimitEntry struct {
	count     int
	resetTime time.Time
}

type RateLimiterStore struct {
	mu       sync.Mutex
	entries  map[string]*rateLimitEntry
	maxReq   int
	windowSec int
}

func NewRateLimiterStore(maxReq int, windowSec int) *RateLimiterStore {
	return &RateLimiterStore{
		entries:   make(map[string]*rateLimitEntry),
		maxReq:    maxReq,
		windowSec: windowSec,
	}
}

// RateLimit returns a middleware enforcing rate limiting (429 Too Many Requests + Retry-After).
func RateLimit(store *RateLimiterStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientIP := r.RemoteAddr
			if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
				clientIP = strings.Split(forwarded, ",")[0]
			}

			store.mu.Lock()
			now := time.Now()
			entry, exists := store.entries[clientIP]

			if !exists || now.After(entry.resetTime) {
				store.entries[clientIP] = &rateLimitEntry{
					count:     1,
					resetTime: now.Add(time.Duration(store.windowSec) * time.Second),
				}
				store.mu.Unlock()
				next.ServeHTTP(w, r)
				return
			}

			if entry.count >= store.maxReq {
				store.mu.Unlock()
				w.Header().Set("Retry-After", "60")
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"code":   "TOO_MANY_REQUESTS",
					"detail": "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.",
				})
				return
			}

			entry.count++
			store.mu.Unlock()
			next.ServeHTTP(w, r)
		})
	}
}
