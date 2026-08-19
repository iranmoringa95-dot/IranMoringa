package orders

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ─── Handler ─────────────────────────────────────────────────────────────────

type Handler struct {
	service *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{service: svc}
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// AdminListOrders handles GET /api/v1/admin/orders
func (h *Handler) AdminListOrders(w http.ResponseWriter, r *http.Request) {
	filter := ListFilter{
		Status:      OrderStatus(r.URL.Query().Get("status")),
		SearchQuery: r.URL.Query().Get("q"),
	}

	if p, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil {
		filter.Page = p
	}
	if ps, err := strconv.Atoi(r.URL.Query().Get("page_size")); err == nil {
		filter.PageSize = ps
	}

	result := h.service.ListOrders(filter)
	writeJSON(w, http.StatusOK, result)
}

// AdminGetOrder handles GET /api/v1/admin/orders/{id}
func (h *Handler) AdminGetOrder(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه سفارش معتبر نیست")
		return
	}

	ord, err := h.service.GetOrderByID(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, ord)
}

// AdminTransitionStatus handles PATCH /api/v1/admin/orders/{id}/status
func (h *Handler) AdminTransitionStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه سفارش معتبر نیست")
		return
	}

	var payload struct {
		Status       OrderStatus `json:"status"`
		TrackingCode string      `json:"tracking_code"`
		Note         string      `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت ورودی معتبر نیست")
		return
	}

	err = h.service.TransitionStatus(TransitionRequest{
		OrderID:      id,
		NewStatus:    payload.Status,
		ActorType:    ActorAdmin,
		ActorID:      "admin-super",
		TrackingCode: payload.TrackingCode,
		Note:         payload.Note,
	})
	if err != nil {
		status := http.StatusUnprocessableEntity
		if err == ErrOrderNotFound {
			status = http.StatusNotFound
		}
		writeError(w, status, "TRANSITION_FAILED", err.Error())
		return
	}

	ord, _ := h.service.GetOrderByID(id)
	writeJSON(w, http.StatusOK, ord)
}

// AdminGetTimeline handles GET /api/v1/admin/orders/{id}/timeline
func (h *Handler) AdminGetTimeline(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه سفارش معتبر نیست")
		return
	}

	events, err := h.service.GetTimeline(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"events": events,
	})
}

// AdminAddNote handles POST /api/v1/admin/orders/{id}/notes
func (h *Handler) AdminAddNote(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه سفارش معتبر نیست")
		return
	}

	var payload struct {
		Note string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Note == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "یادداشت خالی نمی‌تواند باشد")
		return
	}

	err = h.service.AddNote(id, payload.Note, "admin-super")
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// ─── Customer Endpoints ──────────────────────────────────────────────────────

// CustomerListOrders handles GET /api/v1/orders
// In a real system, customerID comes from the session. Here we use a query param for demo.
func (h *Handler) CustomerListOrders(w http.ResponseWriter, r *http.Request) {
	// In production, extract from authentication middleware
	cidStr := r.URL.Query().Get("customer_id")
	if cidStr == "" {
		// For guest browsing, return empty list
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"orders": []*Order{},
		})
		return
	}

	cid, err := uuid.Parse(cidStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مشتری معتبر نیست")
		return
	}

	result := h.service.ListOrdersByCustomer(cid)
	if result == nil {
		result = []*Order{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"orders": result,
	})
}

// CustomerGetOrder handles GET /api/v1/orders/{orderNumber}
func (h *Handler) CustomerGetOrder(w http.ResponseWriter, r *http.Request) {
	orderNumber := chi.URLParam(r, "orderNumber")

	// Look up by order number (no IDOR check in demo mode)
	ord, err := h.service.GetOrderByNumber(orderNumber)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	// Include timeline events
	events, _ := h.service.GetTimeline(ord.ID)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"order":    ord,
		"timeline": events,
	})
}

// CustomerCancelOrder handles POST /api/v1/orders/{orderNumber}/cancel
func (h *Handler) CustomerCancelOrder(w http.ResponseWriter, r *http.Request) {
	orderNumber := chi.URLParam(r, "orderNumber")

	ord, err := h.service.GetOrderByNumber(orderNumber)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	err = h.service.CancelOrder(ord.ID, ActorCustomer, "customer")
	if err != nil {
		status := http.StatusUnprocessableEntity
		if err == ErrCancelNotAllowed {
			status = http.StatusForbidden
		}
		writeError(w, status, "CANCEL_FAILED", err.Error())
		return
	}

	// Refresh order state after cancel
	updated, _ := h.service.GetOrderByNumber(orderNumber)
	writeJSON(w, http.StatusOK, updated)
}

// ─── Public Tracking ─────────────────────────────────────────────────────────

// PublicTrackOrder handles GET /api/v1/tracking/{query}
func (h *Handler) PublicTrackOrder(w http.ResponseWriter, r *http.Request) {
	query := chi.URLParam(r, "query")

	// Try by order number first
	ord, err := h.service.GetOrderByNumber(query)
	if err != nil {
		// Try by tracking code
		ord, err = h.service.GetOrderByTrackingCode(query)
		if err != nil {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "سفارشی با این مشخصات یافت نشد")
			return
		}
	}

	events, _ := h.service.GetTimeline(ord.ID)

	// Build step-based timeline for public display
	statusLabel, ok := StatusLabelFA[ord.Status]
	if !ok {
		statusLabel = string(ord.Status)
	}

	steps := []map[string]interface{}{
		{"title": "ثبت سفارش", "completed": true, "current": ord.Status == StatusPendingPayment},
		{"title": "پرداخت شده", "completed": ord.Status != StatusPendingPayment && ord.Status != StatusCancelled, "current": ord.Status == StatusPaid},
		{"title": "در حال پردازش", "completed": isStatusAfter(ord.Status, StatusProcessing), "current": ord.Status == StatusProcessing},
		{"title": "بسته‌بندی شده", "completed": isStatusAfter(ord.Status, StatusPacked), "current": ord.Status == StatusPacked},
		{"title": "ارسال شده", "completed": isStatusAfter(ord.Status, StatusShipped), "current": ord.Status == StatusShipped},
		{"title": "تحویل داده شده", "completed": ord.Status == StatusDelivered, "current": ord.Status == StatusDelivered},
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"order_number":  ord.OrderNumber,
		"status":        ord.Status,
		"status_title":  statusLabel,
		"recipient":     ord.Address.RecipientName,
		"city":          ord.Address.City,
		"tracking_code": ord.TrackingCode,
		"total_irr":     ord.TotalIRR,
		"total_toman":   ord.TotalIRR / 10,
		"timeline":      steps,
		"events":        events,
	})
}

// isStatusAfter returns true if the current status is at or past the target in the happy path.
func isStatusAfter(current, target OrderStatus) bool {
	statusOrder := map[OrderStatus]int{
		StatusPendingPayment: 0,
		StatusPaid:           1,
		StatusProcessing:     2,
		StatusPacked:         3,
		StatusShipped:        4,
		StatusDelivered:      5,
	}
	ci, cok := statusOrder[current]
	ti, tok := statusOrder[target]
	if !cok || !tok {
		return false
	}
	return ci >= ti
}

// ─── JSON Helpers ────────────────────────────────────────────────────────────

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
