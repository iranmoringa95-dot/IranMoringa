package catalog

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"moringalab/api/internal/audit"
)

type Handler struct {
	service      *Service
	auditService *audit.Service
}

func NewHandler(service *Service, auditService *audit.Service) *Handler {
	return &Handler{
		service:      service,
		auditService: auditService,
	}
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

// Admin Handlers
func (h *Handler) AdminListProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	status := r.URL.Query().Get("status")
	categorySlug := r.URL.Query().Get("category_slug")
	stockStatus := r.URL.Query().Get("stock_status")
	sortParam := r.URL.Query().Get("sort")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	filter := AdminProductFilter{
		Query:        q,
		Status:       status,
		CategorySlug: categorySlug,
		StockStatus:  stockStatus,
		Sort:         sortParam,
		Page:         page,
		Limit:        limit,
	}

	products, total := h.service.AdminListProducts(filter)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"items": products,
		"total": total,
		"page":  filter.Page,
		"limit": filter.Limit,
	})
}

func (h *Handler) AdminGetProductByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه محصول معتبر نیست")
		return
	}

	prod, err := h.service.AdminGetProductByID(id)
	if err != nil {
		h.writeError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(prod)
}

func (h *Handler) AdminCreateProduct(w http.ResponseWriter, r *http.Request) {
	var input CreateProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.writeError(w, http.StatusBadRequest, "INVALID_JSON", "اطلاعات ورودی نا معتبر است")
		return
	}

	prod, err := h.service.AdminCreateProduct(input)
	if err != nil {
		if errors.Is(err, ErrSlugExists) || errors.Is(err, ErrSKUExists) {
			h.writeError(w, http.StatusConflict, "CONFLICT", err.Error())
			return
		}
		h.writeError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
		return
	}

	if h.auditService != nil {
		h.auditService.LogAction("admin-system", "admin", "CREATE_PRODUCT", "Product", prod.ID.String(), "Created product "+prod.TitleFA)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(prod)
}

func (h *Handler) AdminUpdateProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه محصول معتبر نیست")
		return
	}

	var input UpdateProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.writeError(w, http.StatusBadRequest, "INVALID_JSON", "اطلاعات ورودی نا معتبر است")
		return
	}

	prod, err := h.service.AdminUpdateProduct(id, input)
	if err != nil {
		if errors.Is(err, ErrOptimisticLock) {
			h.writeError(w, http.StatusPreconditionFailed, "OPTIMISTIC_LOCK_CONFLICT", err.Error())
			return
		}
		if errors.Is(err, ErrSlugExists) || errors.Is(err, ErrSKUExists) {
			h.writeError(w, http.StatusConflict, "CONFLICT", err.Error())
			return
		}
		if errors.Is(err, ErrProductNotFound) {
			h.writeError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", err.Error())
			return
		}
		h.writeError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
		return
	}

	if h.auditService != nil {
		h.auditService.LogAction("admin-system", "admin", "UPDATE_PRODUCT", "Product", prod.ID.String(), "Updated product "+prod.TitleFA)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(prod)
}

func (h *Handler) AdminPublishProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه محصول معتبر نیست")
		return
	}

	prod, err := h.service.AdminPublishProduct(id)
	if err != nil {
		if errors.Is(err, ErrProductNotFound) {
			h.writeError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", err.Error())
			return
		}
		h.writeError(w, http.StatusUnprocessableEntity, "PUBLISH_REJECTED", err.Error())
		return
	}

	if h.auditService != nil {
		h.auditService.LogAction("admin-system", "admin", "PUBLISH_PRODUCT", "Product", prod.ID.String(), "Published product "+prod.TitleFA)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(prod)
}

func (h *Handler) AdminUnpublishProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه محصول معتبر نیست")
		return
	}

	prod, err := h.service.AdminUnpublishProduct(id)
	if err != nil {
		if errors.Is(err, ErrProductNotFound) {
			h.writeError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", err.Error())
			return
		}
		h.writeError(w, http.StatusUnprocessableEntity, "UNPUBLISH_FAILED", err.Error())
		return
	}

	if h.auditService != nil {
		h.auditService.LogAction("admin-system", "admin", "UNPUBLISH_PRODUCT", "Product", prod.ID.String(), "Unpublished product "+prod.TitleFA)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(prod)
}

func (h *Handler) AdminArchiveProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه محصول معتبر نیست")
		return
	}

	err = h.service.ArchiveProduct(id)
	if err != nil {
		if errors.Is(err, ErrProductNotFound) {
			h.writeError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", err.Error())
			return
		}
		h.writeError(w, http.StatusUnprocessableEntity, "ARCHIVE_FAILED", err.Error())
		return
	}

	if h.auditService != nil {
		h.auditService.LogAction("admin-system", "admin", "ARCHIVE_PRODUCT", "Product", id.String(), "Archived product "+id.String())
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "محصول با موفقیت آرشیو شد"})
}

func (h *Handler) writeError(w http.ResponseWriter, status int, code, detail string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"type":   "https://example.local/problems/catalog-error",
		"title":  "خطای ماژول محصول",
		"status": status,
		"code":   code,
		"detail": detail,
	})
}
