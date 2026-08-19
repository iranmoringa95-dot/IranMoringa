package invoices

import (
	"encoding/json"
	"net/http"

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

// AdminIssueInvoice handles POST /api/v1/admin/orders/{orderNumber}/invoice
func (h *Handler) AdminIssueInvoice(w http.ResponseWriter, r *http.Request) {
	orderNumber := chi.URLParam(r, "orderNumber")

	inv, err := h.service.IssueInvoice(orderNumber)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "ISSUE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, inv)
}

// AdminGetInvoice handles GET /api/v1/admin/invoices/{invoiceNumber}
func (h *Handler) AdminGetInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceNumber := chi.URLParam(r, "invoiceNumber")

	inv, err := h.service.GetInvoiceByNumber(invoiceNumber)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, inv)
}

// AdminVoidInvoice handles POST /api/v1/admin/invoices/{invoiceNumber}/void
func (h *Handler) AdminVoidInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceNumber := chi.URLParam(r, "invoiceNumber")

	var payload struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Reason == "" {
		payload.Reason = "ابطال توسط مدیر سیستم"
	}

	inv, err := h.service.VoidInvoice(invoiceNumber, payload.Reason)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, inv)
}

// AdminPrintInvoice handles GET /api/v1/admin/invoices/{invoiceNumber}/print
func (h *Handler) AdminPrintInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceNumber := chi.URLParam(r, "invoiceNumber")
	format := r.URL.Query().Get("format")
	if format == "" {
		format = "a4"
	}

	htmlContent, err := h.service.RenderInvoiceHTML(invoiceNumber, format)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(htmlContent))
}

// AdminCreateExportJob handles POST /api/v1/admin/exports/orders
func (h *Handler) AdminCreateExportJob(w http.ResponseWriter, r *http.Request) {
	var payload ExportFilters
	_ = json.NewDecoder(r.Body).Decode(&payload)

	job, err := h.service.CreateExportJob("admin-super", payload)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "EXPORT_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, job)
}

// AdminGetExportJob handles GET /api/v1/admin/exports/{jobId}
func (h *Handler) AdminGetExportJob(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "jobId")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه فیلتر معتبر نیست")
		return
	}

	job, err := h.service.GetExportJob(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, job)
}

// AdminDownloadExportJob handles GET /api/v1/admin/exports/{jobId}/download
func (h *Handler) AdminDownloadExportJob(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "jobId")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه فایل معتبر نیست")
		return
	}

	job, err := h.service.GetExportJob(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename="+job.Filename)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(job.Content))
}

// ─── Customer Endpoints ──────────────────────────────────────────────────────

// CustomerGetInvoice handles GET /api/v1/orders/{orderNumber}/invoice
func (h *Handler) CustomerGetInvoice(w http.ResponseWriter, r *http.Request) {
	orderNumber := chi.URLParam(r, "orderNumber")

	// Issue or retrieve existing invoice
	inv, err := h.service.IssueInvoice(orderNumber)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, inv)
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
