package checkout

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"moringalab/api/internal/payments"
)

type Handler struct {
	checkoutService *Service
	paymentService  *payments.Service
}

func NewHandler(checkoutSvc *Service, paySvc *payments.Service) *Handler {
	return &Handler{
		checkoutService: checkoutSvc,
		paymentService:  paySvc,
	}
}

func (h *Handler) SubmitOrder(w http.ResponseWriter, r *http.Request) {
	idempotencyKey := r.Header.Get("Idempotency-Key")

	var req SubmitCheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت داده ورودی معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	req.IdempotencyKey = idempotencyKey

	res, err := h.checkoutService.SubmitCheckout(req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "CHECKOUT_FAILED",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(res)
}

func (h *Handler) GetPayment(w http.ResponseWriter, r *http.Request) {
	paymentIDStr := chi.URLParam(r, "paymentId")
	paymentID, err := uuid.Parse(paymentIDStr)
	if err != nil {
		http.Error(w, `{"code":"INVALID_PAYMENT_ID","detail":"شناسه تراکنش معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	payment, err := h.paymentService.GetPayment(paymentID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "PAYMENT_NOT_FOUND",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(payment)
}

type VerifyPaymentPayload struct {
	SimulateSuccess bool `json:"simulate_success"`
}

func (h *Handler) VerifyPayment(w http.ResponseWriter, r *http.Request) {
	paymentIDStr := chi.URLParam(r, "paymentId")
	paymentID, err := uuid.Parse(paymentIDStr)
	if err != nil {
		http.Error(w, `{"code":"INVALID_PAYMENT_ID","detail":"شناسه تراکنش معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	var payload VerifyPaymentPayload
	_ = json.NewDecoder(r.Body).Decode(&payload)

	payment, err := h.paymentService.VerifyPayment(paymentID, payload.SimulateSuccess)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "VERIFICATION_FAILED",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(payment)
}
