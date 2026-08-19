package notifications

import (
	"encoding/json"
	"net/http"
	"strconv"

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

// AdminListDeliveries handles GET /api/v1/admin/notifications/deliveries
func (h *Handler) AdminListDeliveries(w http.ResponseWriter, r *http.Request) {
	filter := DeliveryFilter{
		Channel: Channel(r.URL.Query().Get("channel")),
		Status:  SendStatus(r.URL.Query().Get("status")),
	}

	if p, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil {
		filter.Page = p
	}
	if ps, err := strconv.Atoi(r.URL.Query().Get("page_size")); err == nil {
		filter.PageSize = ps
	}

	res := h.service.ListDeliveries(filter)
	writeJSON(w, http.StatusOK, res)
}

// AdminRetryDelivery handles POST /api/v1/admin/notifications/deliveries/{id}/retry
func (h *Handler) AdminRetryDelivery(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه ارسال معتبر نیست")
		return
	}

	del, err := h.service.RetryDelivery(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, del.SanitizeForJSON())
}

// AdminGetQueueStatus handles GET /api/v1/admin/notifications/queue-status
func (h *Handler) AdminGetQueueStatus(w http.ResponseWriter, r *http.Request) {
	stats := h.service.GetQueueStatus()
	writeJSON(w, http.StatusOK, stats)
}

// AdminListTemplates handles GET /api/v1/admin/notifications/templates
func (h *Handler) AdminListTemplates(w http.ResponseWriter, r *http.Request) {
	templates := h.service.ListTemplates()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"templates": templates,
	})
}

// AdminTestTemplate handles POST /api/v1/admin/notifications/templates/{code}/test
func (h *Handler) AdminTestTemplate(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var payload struct {
		Recipient string            `json:"recipient"`
		Data      map[string]string `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Recipient == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "گیرنده تست و اطلاعات قالب الزامی است")
		return
	}

	tmpl, err := h.service.GetTemplate(code)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	if payload.Data == nil {
		payload.Data = make(map[string]string)
	}

	delivery, err := h.service.NotifyEvent(tmpl.Code, payload.Recipient, tmpl.Channel, payload.Data, nil, nil)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "SEND_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, delivery.SanitizeForJSON())
}

// ─── Customer Endpoints ──────────────────────────────────────────────────────

// CustomerGetPreferences handles GET /api/v1/notifications/preferences
func (h *Handler) CustomerGetPreferences(w http.ResponseWriter, r *http.Request) {
	// For demo/unauthenticated calls, generate a default guest profile
	userID := uuid.Nil
	if uidStr := r.URL.Query().Get("user_id"); uidStr != "" {
		if parsed, err := uuid.Parse(uidStr); err == nil {
			userID = parsed
		}
	}

	prefs := h.service.GetPreferencesStore().GetUserPreferences(userID)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"preferences": prefs,
	})
}

// CustomerUpdatePreferences handles PUT /api/v1/notifications/preferences
func (h *Handler) CustomerUpdatePreferences(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		UserID   string        `json:"user_id"`
		Channel  Channel       `json:"channel"`
		Category EventCategory `json:"category"`
		Enabled  bool          `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت درخواست معتبر نیست")
		return
	}

	uid, err := uuid.Parse(payload.UserID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_USER_ID", "شناسه کاربر معتبر نیست")
		return
	}

	h.service.GetPreferencesStore().SetPreference(uid, payload.Channel, payload.Category, payload.Enabled)
	writeJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// CustomerSubscribeStockAlert handles POST /api/v1/stock-alerts
func (h *Handler) CustomerSubscribeStockAlert(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		UserID    string `json:"user_id,omitempty"`
		Phone     string `json:"phone,omitempty"`
		Email     string `json:"email,omitempty"`
		VariantID string `json:"variant_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت درخواست معتبر نیست")
		return
	}

	varUUID, err := uuid.Parse(payload.VariantID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_VARIANT_ID", "شناسه متغیر کالا معتبر نیست")
		return
	}

	var uID *uuid.UUID
	if payload.UserID != "" {
		if parsed, err := uuid.Parse(payload.UserID); err == nil {
			uID = &parsed
		}
	}

	sub, err := h.service.SubscribeStockAlert(uID, payload.Phone, payload.Email, varUUID)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "SUBSCRIBE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, sub)
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
