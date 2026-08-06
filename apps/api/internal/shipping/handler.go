package shipping

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"moringalab/api/internal/returns"
)

type Handler struct {
	shippingService *Service
	returnsService  *returns.Service
}

func NewHandler(shipSvc *Service, retSvc *returns.Service) *Handler {
	return &Handler{
		shippingService: shipSvc,
		returnsService:  retSvc,
	}
}

type TrackingLookupPayload struct {
	Query string `json:"query"`
}

func (h *Handler) LookupTracking(w http.ResponseWriter, r *http.Request) {
	var payload TrackingLookupPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Query == "" {
		http.Error(w, `{"code":"INVALID_JSON","detail":"کد رهگیری وارد نشده است"}`, http.StatusBadRequest)
		return
	}

	result, err := h.shippingService.LookupTracking(payload.Query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "TRACKING_NOT_FOUND",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

type CreateReturnPayload struct {
	Reason      returns.ReturnReason `json:"reason"`
	Description string               `json:"description"`
}

func (h *Handler) CreateReturn(w http.ResponseWriter, r *http.Request) {
	orderNum := chi.URLParam(r, "orderNumber")

	var payload CreateReturnPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت ورودی معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	ret, err := h.returnsService.CreateReturnRequest(orderNum, payload.Reason, payload.Description)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "RETURN_FAILED",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ret)
}
