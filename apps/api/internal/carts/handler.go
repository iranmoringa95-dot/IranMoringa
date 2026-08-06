package carts

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetCurrentCart(w http.ResponseWriter, r *http.Request) {
	var anonID *string
	cookie, err := r.Cookie("cart_token")
	if err == nil && cookie.Value != "" {
		anonID = &cookie.Value
	}

	cart := h.service.GetOrCreateCart(anonID, nil)

	// Issue anonymous cart token cookie if not present
	if cookie == nil || cookie.Value == "" {
		http.SetCookie(w, &http.Cookie{
			Name:     "cart_token",
			Value:    *cart.AnonymousID,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(cart)
}

type AddItemPayload struct {
	VariantID string `json:"variant_id"`
	Quantity  int    `json:"quantity"`
}

func (h *Handler) AddItem(w http.ResponseWriter, r *http.Request) {
	var payload AddItemPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت داده معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	variantUUID, err := uuid.Parse(payload.VariantID)
	if err != nil {
		http.Error(w, `{"code":"INVALID_VARIANT_ID","detail":"شناسه متغیر معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	var anonID *string
	cookie, err := r.Cookie("cart_token")
	if err == nil && cookie.Value != "" {
		anonID = &cookie.Value
	}

	cart := h.service.GetOrCreateCart(anonID, nil)
	updatedCart, err := h.service.AddItem(cart.ID, variantUUID, payload.Quantity)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "ADD_ITEM_FAILED",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedCart)
}
