package identity

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

type Handler struct {
	service    *Service
	production bool
}

func NewHandler(service *Service, production bool) *Handler {
	return &Handler{service: service, production: production}
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
		status := http.StatusUnprocessableEntity
		code := "INVALID_PHONE"
		detail := err.Error()
		if errors.Is(err, ErrOTPDelivery) {
			status = http.StatusBadGateway
			code = "OTP_DELIVERY_FAILED"
			detail = "ارسال پیامک کد تایید ناموفق بود. لطفاً چند لحظه دیگر دوباره تلاش کنید."
		} else if errors.Is(err, ErrOTPGeneration) {
			status = http.StatusInternalServerError
			code = "OTP_GENERATION_FAILED"
			detail = "تولید کد تایید ناموفق بود."
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]interface{}{"code": code, "detail": detail})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	response := map[string]interface{}{
		"status":  "success",
		"message": "کد تایید ارسال شد",
	}
	if !h.production {
		response["dev_otp"] = otpCode
	}
	json.NewEncoder(w).Encode(response)
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
		Secure:   h.production,
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
	cookie, _ := r.Cookie("session_token")
	if cookie != nil && cookie.Value != "" {
		_ = h.service.Logout(cookie.Value)
	}

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

func (h *Handler) LogoutAll(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err == nil && cookie.Value != "" {
		if user, errVal := h.service.ValidateSession(cookie.Value); errVal == nil && user != nil {
			_ = h.service.LogoutAll(user.ID)
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "all_sessions_revoked"})
}
