package admin

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"moringalab/api/internal/audit"
	"moringalab/api/internal/orders"
)

type Handler struct {
	adminService *Service
	auditService *audit.Service
}

func NewHandler(adminSvc *Service, auditSvc *audit.Service) *Handler {
	return &Handler{
		adminService: adminSvc,
		auditService: auditSvc,
	}
}

func (h *Handler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	stats := h.adminService.GetDashboardStats()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stats)
}

type FulfillOrderPayload struct {
	Status       orders.OrderStatus `json:"status"`
	TrackingCode string             `json:"tracking_code"`
}

func (h *Handler) FulfillOrder(w http.ResponseWriter, r *http.Request) {
	orderNum := chi.URLParam(r, "orderNumber")

	var payload FulfillOrderPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت ورودی معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	ord, err := h.adminService.FulfillOrder(orderNum, payload.Status, payload.TrackingCode)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "FULFILLMENT_FAILED",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ord)
}

type AdjustInventoryPayload struct {
	VariantID string `json:"variant_id"`
	OnHand    int    `json:"on_hand"`
}

func (h *Handler) AdjustInventory(w http.ResponseWriter, r *http.Request) {
	var payload AdjustInventoryPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت ورودی معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	varUUID, err := uuid.Parse(payload.VariantID)
	if err != nil {
		http.Error(w, `{"code":"INVALID_VARIANT_ID","detail":"شناسه متغیر معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	_ = h.adminService.AdjustInventory(varUUID, payload.OnHand)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *Handler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	logs := h.auditService.ListLogs()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(logs)
}

func (h *Handler) AdminListCustomers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	customers := h.adminService.ListCustomers(q)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"customers": customers,
		"total":     len(customers),
	})
}
