package reviews

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/wishlist"
)

type Handler struct {
	reviewsService  *Service
	wishlistService *wishlist.Service
	catalogService  *catalog.Service
}

func NewHandler(revSvc *Service, wishSvc *wishlist.Service, catSvc *catalog.Service) *Handler {
	return &Handler{
		reviewsService:  revSvc,
		wishlistService: wishSvc,
		catalogService:  catSvc,
	}
}

func (h *Handler) GetProductReviews(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	prod, err := h.catalogService.GetProductBySlug(slug)
	if err != nil {
		http.Error(w, `{"code":"PRODUCT_NOT_FOUND","detail":"محصول یافت نشد"}`, http.StatusNotFound)
		return
	}

	summary := h.reviewsService.GetProductReviews(prod.ID)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(summary)
}

type AddReviewPayload struct {
	CustomerName string `json:"customer_name"`
	Title        string `json:"title"`
	Comment      string `json:"comment"`
	Rating       int    `json:"rating"`
}

func (h *Handler) AddReview(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	prod, err := h.catalogService.GetProductBySlug(slug)
	if err != nil {
		http.Error(w, `{"code":"PRODUCT_NOT_FOUND","detail":"محصول یافت نشد"}`, http.StatusNotFound)
		return
	}

	var payload AddReviewPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت ورودی معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	rev, err := h.reviewsService.AddReview(prod.ID, payload.CustomerName, payload.Title, payload.Comment, payload.Rating, true)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":   "REVIEW_FAILED",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rev)
}

type WishlistPayload struct {
	ProductID string `json:"product_id"`
}

func (h *Handler) ToggleWishlist(w http.ResponseWriter, r *http.Request) {
	var payload WishlistPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"code":"INVALID_JSON","detail":"فرمت ورودی معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	prodUUID, err := uuid.Parse(payload.ProductID)
	if err != nil {
		http.Error(w, `{"code":"INVALID_PRODUCT_ID","detail":"شناسه محصول معتبر نیست"}`, http.StatusBadRequest)
		return
	}

	testUserID := uuid.Nil // Development user ID
	added := h.wishlistService.ToggleWishlist(testUserID, prodUUID)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"added": added,
	})
}
