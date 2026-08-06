package identity

import (
	"encoding/json"
	"net/http"
	"time"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type OTPRequestPayload struct {
	Phone string `json:"phone"`
}

type OTPVerifyPayload struct {
	Phone string `json:"phone"`
	Code  string `json:"code"`
}

func (h *Handler) RequestOTP(w http.ResponseWriter, r *http.Request) {
	var payload OTPRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت داده ورودی معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	otpCode, err := h.service.RequestOTP(payload.Phone)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "INVALID_PHONE",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "کد تایید ارسال شد",
		"dev_otp": otpCode, // Mock code output for local dev
	})
}

func (h *Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var payload OTPVerifyPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت داده ورودی معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	plainToken, user, err := h.service.VerifyOTP(payload.Phone, payload.Code)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "VERIFICATION_FAILED",
			"detail": err.Error(),
		})
		return
	}

	// Set HttpOnly Secure Session Cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    plainToken,
		Path:     "/",
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false, // set true in production TLS
	})

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"user":   user,
	})
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil || cookie.Value == "" {
		http.Error(w, `{"code":"UNAUTHORIZED","detail":"احراز هویت انجام نشده است"}`, http.StatusUnauthorized)
		return
	}

	user, err := h.service.ValidateSession(cookie.Value)
	if err != nil {
		http.Error(w, `{"code":"UNAUTHORIZED","detail":"نشست معتبر نیست"}`, http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "logged_out"})
}
