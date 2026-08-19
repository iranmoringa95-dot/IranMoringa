package reports

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	reportsService *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{reportsService: svc}
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// GetExecutiveSummary handles GET /api/v1/admin/reports/summary
func (h *Handler) GetExecutiveSummary(w http.ResponseWriter, r *http.Request) {
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")

	var startDate, endDate time.Time
	if startStr != "" {
		startDate, _ = time.Parse("2006-01-02", startStr)
	}
	if endStr != "" {
		endDate, _ = time.Parse("2006-01-02", endStr)
	}

	summary, err := h.reportsService.GetExecutiveSummary(startDate, endDate)
	if err != nil {
		writeError(w, http.StatusBadRequest, "CALCULATION_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, summary)
}

// GetSalesTimeSeries handles GET /api/v1/admin/reports/sales-timeseries
func (h *Handler) GetSalesTimeSeries(w http.ResponseWriter, r *http.Request) {
	series, err := h.reportsService.GetSalesTimeSeries(time.Time{}, time.Time{})
	if err != nil {
		writeError(w, http.StatusBadRequest, "TIMESERIES_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"timeseries": series,
	})
}

// GetTopSellingProducts handles GET /api/v1/admin/reports/products
func (h *Handler) GetTopSellingProducts(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	products, err := h.reportsService.GetTopSellingProducts(limit)
	if err != nil {
		writeError(w, http.StatusBadRequest, "PRODUCTS_REPORT_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"products": products,
	})
}

// CreateExportJob handles POST /api/v1/admin/reports/exports
func (h *Handler) CreateExportJob(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		ReportType  string `json:"report_type"` // "sales_summary" or "products_performance"
		RequestedBy string `json:"requested_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		payload.ReportType = "sales_summary"
	}
	if payload.RequestedBy == "" {
		payload.RequestedBy = "مدیر سیستم"
	}

	job, err := h.reportsService.CreateReportExportJob(payload.ReportType, payload.RequestedBy)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "EXPORT_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, job)
}

// DownloadExportJob handles GET /api/v1/admin/reports/exports/{id}/download
func (h *Handler) DownloadExportJob(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه گزارش معتبر نیست")
		return
	}

	csvBlob, err := h.reportsService.GetExportJobDownload(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	filename := fmt.Sprintf("report_%s.csv", id.String()[:8])
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.WriteHeader(http.StatusOK)
	w.Write(csvBlob)
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
