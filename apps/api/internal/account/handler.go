package account

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

type CreateAddressPayload struct {
	Label         string `json:"label"`
	RecipientName string `json:"recipient_name"`
	Phone         string `json:"phone"`
	ProvinceName  string `json:"province_name"`
	CityName      string `json:"city_name"`
	PostalCode    string `json:"postal_code"`
	AddressLine   string `json:"address_line"`
	IsDefault     bool   `json:"is_default"`
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Mock authenticated user ID for demonstration
	userID := uuid.Nil
	profile := h.service.GetProfile(userID)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}

func (h *Handler) ListAddresses(w http.ResponseWriter, r *http.Request) {
	userID := uuid.Nil
	addresses := h.service.ListAddresses(userID)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"addresses": addresses})
}

func (h *Handler) CreateAddress(w http.ResponseWriter, r *http.Request) {
	userID := uuid.Nil
	var payload CreateAddressPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	addr, err := h.service.CreateAddress(userID, payload.Label, payload.RecipientName, payload.Phone, payload.ProvinceName, payload.CityName, payload.PostalCode, payload.AddressLine, payload.IsDefault)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{"code": "INVALID_ADDRESS", "detail": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(addr)
}

func (h *Handler) SetDefaultAddress(w http.ResponseWriter, r *http.Request) {
	userID := uuid.Nil
	idStr := chi.URLParam(r, "id")
	addrID, err := uuid.Parse(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if err := h.service.SetDefaultAddress(userID, addrID); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{"code": "FORBIDDEN", "detail": err.Error()})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteAddress(w http.ResponseWriter, r *http.Request) {
	userID := uuid.Nil
	idStr := chi.URLParam(r, "id")
	addrID, err := uuid.Parse(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteAddress(userID, addrID); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{"code": "FORBIDDEN", "detail": err.Error()})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
