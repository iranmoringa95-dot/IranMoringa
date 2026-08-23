package promotions

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{service: svc}
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// AdminListCoupons handles GET /api/v1/admin/promotions/coupons
func (h *Handler) AdminListCoupons(w http.ResponseWriter, r *http.Request) {
	coupons := h.service.ListCoupons()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"coupons": coupons,
	})
}

// AdminCreateCoupon handles POST /api/v1/admin/promotions/coupons
func (h *Handler) AdminCreateCoupon(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Code                  string         `json:"code"`
		DiscountType          DiscountType   `json:"discount_type"`
		ValueIRR              int64          `json:"value_irr"`
		Percentage            int            `json:"percentage"`
		MinOrderAmount        int64          `json:"min_order_amount"`
		MaxDiscount           int64          `json:"max_discount"`
		TotalUsageLimit       int            `json:"total_usage_limit"`
		UsageLimitPerUser     int            `json:"usage_limit_per_user"`
		ApplicableProductIDs  []string       `json:"applicable_product_ids"`
		ApplicableCategoryIDs []string       `json:"applicable_category_ids"`
		IsFirstOrderOnly      bool           `json:"is_first_order_only"`
		StackingPolicy        StackingPolicy `json:"stacking_policy"`
		StartsAt              string         `json:"starts_at"`
		ExpiresAt             string         `json:"expires_at"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Code == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "کد تخفیف و اطلاعات اصلی الزامی است")
		return
	}

	startsAt := time.Now()
	if t, err := time.Parse(time.RFC3339, payload.StartsAt); err == nil {
		startsAt = t
	}

	expiresAt := time.Now().Add(365 * 24 * time.Hour)
	if t, err := time.Parse(time.RFC3339, payload.ExpiresAt); err == nil {
		expiresAt = t
	}

	productUUIDs := make([]uuid.UUID, 0, len(payload.ApplicableProductIDs))
	for _, idStr := range payload.ApplicableProductIDs {
		if parsed, err := uuid.Parse(idStr); err == nil {
			productUUIDs = append(productUUIDs, parsed)
		}
	}

	categoryUUIDs := make([]uuid.UUID, 0, len(payload.ApplicableCategoryIDs))
	for _, idStr := range payload.ApplicableCategoryIDs {
		if parsed, err := uuid.Parse(idStr); err == nil {
			categoryUUIDs = append(categoryUUIDs, parsed)
		}
	}

	coupon := &Coupon{
		ID:                    uuid.New(),
		Code:                  payload.Code,
		DiscountType:          payload.DiscountType,
		ValueIRR:              payload.ValueIRR,
		Percentage:            payload.Percentage,
		MinOrderAmount:        payload.MinOrderAmount,
		MaxDiscount:           payload.MaxDiscount,
		TotalUsageLimit:       payload.TotalUsageLimit,
		UsageLimitPerUser:     payload.UsageLimitPerUser,
		ApplicableProductIDs:  productUUIDs,
		ApplicableCategoryIDs: categoryUUIDs,
		IsFirstOrderOnly:      payload.IsFirstOrderOnly,
		StackingPolicy:        payload.StackingPolicy,
		IsActive:              true,
		StartsAt:              startsAt,
		ExpiresAt:             expiresAt,
		CreatedAt:             time.Now(),
	}

	h.service.AddCoupon(coupon)
	writeJSON(w, http.StatusCreated, coupon)
}

// AdminGetCoupon handles GET /api/v1/admin/promotions/coupons/{code}
func (h *Handler) AdminGetCoupon(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	coupon, err := h.service.GetCouponByCode(code)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, coupon)
}

// AdminListRedemptions handles GET /api/v1/admin/promotions/redemptions
func (h *Handler) AdminListRedemptions(w http.ResponseWriter, r *http.Request) {
	redemptions := h.service.ListRedemptions()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"redemptions": redemptions,
	})
}

// AdminSimulatePromotion handles POST /api/v1/admin/promotions/simulate
func (h *Handler) AdminSimulatePromotion(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Code        string           `json:"code"`
		SubtotalIRR int64            `json:"subtotal_irr"`
		Items       []EvaluationItem `json:"items"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Code == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "کد تخفیف و مبلغ سبد الزامی است")
		return
	}

	req := EvaluationRequest{
		SubtotalIRR: payload.SubtotalIRR,
		Items:       payload.Items,
	}

	breakdown, err := h.service.EvaluateCoupon(payload.Code, req)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "SIMULATION_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, breakdown)
}

// ─── Customer Endpoints ──────────────────────────────────────────────────────

// CustomerValidateCoupon handles POST /api/v1/promotions/validate
func (h *Handler) CustomerValidateCoupon(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Code        string           `json:"code"`
		SubtotalIRR int64            `json:"subtotal_irr"`
		Items       []EvaluationItem `json:"items"`
		UserID      string           `json:"user_id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Code == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "کد تخفیف الزامی است")
		return
	}

	var uID *uuid.UUID
	if payload.UserID != "" {
		if parsed, err := uuid.Parse(payload.UserID); err == nil {
			uID = &parsed
		}
	}

	req := EvaluationRequest{
		UserID:      uID,
		SubtotalIRR: payload.SubtotalIRR,
		Items:       payload.Items,
	}

	breakdown, err := h.service.EvaluateCoupon(payload.Code, req)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "INVALID_COUPON", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, breakdown)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, code, detail string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"code":   code,
		"detail": detail,
	})
}
