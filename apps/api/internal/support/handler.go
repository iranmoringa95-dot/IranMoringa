package support

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	supportService *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{supportService: svc}
}

// ─── Public Endpoints ────────────────────────────────────────────────────────

// GetSupportChannels handles GET /api/v1/support/channels
func (h *Handler) GetSupportChannels(w http.ResponseWriter, r *http.Request) {
	channels, isOpen := h.supportService.ListChannels()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"is_open":  isOpen,
		"channels": channels,
	})
}

// CreateInquiry handles POST /api/v1/support/inquiries
func (h *Handler) CreateInquiry(w http.ResponseWriter, r *http.Request) {
	var payload SubmitInquiryRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Subject == "" || payload.Body == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "موضوع و متن پیام الزامی است")
		return
	}

	if payload.CustomerName == "" {
		payload.CustomerName = "کاربر مهمان"
	}

	inquiry, err := h.supportService.CreateInquiry(payload)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "INQUIRY_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, inquiry)
}

// GetInquiryByTicketNumber handles GET /api/v1/support/inquiries/{ticketNumber}
func (h *Handler) GetInquiryByTicketNumber(w http.ResponseWriter, r *http.Request) {
	ticketNum := chi.URLParam(r, "ticketNumber")

	inquiry, err := h.supportService.GetInquiryByTicketNumber(ticketNum)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, inquiry)
}

// GetWhatsAppURL handles GET /api/v1/support/channels/{id}/whatsapp-url
func (h *Handler) GetWhatsAppURL(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه کانال معتبر نیست")
		return
	}

	customMsg := r.URL.Query().Get("msg")
	urlStr, err := h.supportService.GenerateWhatsAppURL(id, customMsg)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"whatsapp_url": urlStr,
	})
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// AdminListInquiries handles GET /api/v1/admin/support/inquiries
func (h *Handler) AdminListInquiries(w http.ResponseWriter, r *http.Request) {
	statusFilter := r.URL.Query().Get("status")
	inquiries := h.supportService.AdminListInquiries(statusFilter)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"inquiries": inquiries,
	})
}

// AdminUpdateInquiry handles PATCH /api/v1/admin/support/inquiries/{id}
func (h *Handler) AdminUpdateInquiry(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه تیکت معتبر نیست")
		return
	}

	var payload struct {
		Status     string `json:"status"`
		AssignedTo string `json:"assigned_to,omitempty"`
		AdminNotes string `json:"admin_notes,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت ورودی معتبر نیست")
		return
	}

	status := StatusOpen
	if payload.Status == "in_progress" {
		status = StatusInProgress
	} else if payload.Status == "resolved" {
		status = StatusResolved
	} else if payload.Status == "closed" {
		status = StatusClosed
	}

	inquiry, err := h.supportService.AdminUpdateInquiry(id, status, payload.AssignedTo, payload.AdminNotes)
	if err != nil {
		writeError(w, http.StatusNotFound, "UPDATE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, inquiry)
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
