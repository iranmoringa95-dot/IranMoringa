package catalog

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	categories := h.service.ListCategories()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(categories)
}

func (h *Handler) ListBrands(w http.ResponseWriter, r *http.Request) {
	brands := h.service.ListBrands()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(brands)
}

func (h *Handler) ListAttributes(w http.ResponseWriter, r *http.Request) {
	attributes := h.service.ListAttributes()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(attributes)
}

func (h *Handler) SearchProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	categorySlug := r.URL.Query().Get("category_slug")
	sort := r.URL.Query().Get("sort")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	filter := ProductFilter{
		Query:        q,
		CategorySlug: categorySlug,
		Sort:         sort,
		Page:         page,
		Limit:        limit,
	}

	products, total := h.service.SearchProducts(filter)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"items": products,
		"total": total,
		"page":  filter.Page,
		"limit": filter.Limit,
	})
}

func (h *Handler) GetProductBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	product, err := h.service.GetProductBySlug(slug)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"type":   "https://example.local/problems/not-found",
			"title":  "محصول یافت نشد",
			"status": 404,
			"code":   "PRODUCT_NOT_FOUND",
			"detail": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(product)
}
