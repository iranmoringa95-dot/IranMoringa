package media

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type CreateUploadSessionRequest struct {
	Filename     string `json:"filename"`
	IntendedMIME string `json:"intended_mime"`
	SizeBytes    int64  `json:"size_bytes"`
}

func (h *Handler) CreateUploadSession(w http.ResponseWriter, r *http.Request) {
	var req CreateUploadSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	session, err := h.service.CreateUploadSession(r.Context(), "admin-1", req.Filename, req.IntendedMIME, req.SizeBytes)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"code": "INVALID_MIME", "detail": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(session)
}

func (h *Handler) ListAssets(w http.ResponseWriter, r *http.Request) {
	assets := h.service.ListAssets()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"assets": assets})
}

func (h *Handler) DeleteAsset(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	assetID, err := uuid.Parse(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteAsset(r.Context(), assetID); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		if err == ErrAssetInUse {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]interface{}{"code": "ASSET_IN_USE", "detail": err.Error()})
			return
		}
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{"code": "ASSET_NOT_FOUND", "detail": err.Error()})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
