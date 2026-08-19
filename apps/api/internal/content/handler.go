package content

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

// ─── Public Endpoints ────────────────────────────────────────────────────────

// ListArticles handles GET /api/v1/content/articles
func (h *Handler) ListArticles(w http.ResponseWriter, r *http.Request) {
	articles := h.service.ListArticles()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"articles": articles,
	})
}

// GetArticleBySlug handles GET /api/v1/content/articles/{slug}
func (h *Handler) GetArticleBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	art, err := h.service.GetArticleBySlug(slug)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// ListFAQs handles GET /api/v1/content/faqs
func (h *Handler) ListFAQs(w http.ResponseWriter, r *http.Request) {
	faqs := h.service.ListFAQs()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"faqs": faqs,
	})
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// AdminListArticles handles GET /api/v1/admin/articles
func (h *Handler) AdminListArticles(w http.ResponseWriter, r *http.Request) {
	articles := h.service.ListAllArticlesForAdmin()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"articles": articles,
	})
}

// AdminCreateArticle handles POST /api/v1/admin/articles
func (h *Handler) AdminCreateArticle(w http.ResponseWriter, r *http.Request) {
	var payload Article
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.TitleFA == "" || payload.Slug == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "عنوان و اسلاگ مقاله الزامی است")
		return
	}

	art, err := h.service.CreateArticle(&payload)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "CREATE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, art)
}

// AdminUpdateArticle handles PUT /api/v1/admin/articles/{id}
func (h *Handler) AdminUpdateArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	var payload Article
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت درخواست معتبر نیست")
		return
	}
	payload.ID = id

	art, err := h.service.UpdateArticle(&payload)
	if err != nil {
		writeError(w, http.StatusNotFound, "UPDATE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// AdminSubmitReview handles POST /api/v1/admin/articles/{id}/submit-review
func (h *Handler) AdminSubmitReview(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	art, err := h.service.SubmitForReview(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "SUBMIT_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// AdminReviewArticle handles POST /api/v1/admin/articles/{id}/review
func (h *Handler) AdminReviewArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	var payload struct {
		ReviewerID   string `json:"reviewer_id"`
		ReviewerName string `json:"reviewer_name"`
		Approved     bool   `json:"approved"`
		Notes        string `json:"notes,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت درخواست معتبر نیست")
		return
	}

	revUUID, _ := uuid.Parse(payload.ReviewerID)
	if revUUID == uuid.Nil {
		revUUID = uuid.New()
	}
	if payload.ReviewerName == "" {
		payload.ReviewerName = "دکتر محمد حسینی (متخصص تغذیه)"
	}

	art, err := h.service.ReviewArticle(id, revUUID, payload.ReviewerName, payload.Approved, payload.Notes)
	if err != nil {
		writeError(w, http.StatusNotFound, "REVIEW_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// AdminPublishArticle handles POST /api/v1/admin/articles/{id}/publish
func (h *Handler) AdminPublishArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	art, err := h.service.PublishArticle(id)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "PUBLISH_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// AdminListRevisions handles GET /api/v1/admin/articles/{id}/revisions
func (h *Handler) AdminListRevisions(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	revisions, err := h.service.ListArticleRevisions(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"revisions": revisions,
	})
}

// AdminRestoreRevision handles POST /api/v1/admin/articles/{id}/revisions/{revId}/restore
func (h *Handler) AdminRestoreRevision(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	revIdStr := chi.URLParam(r, "revId")
	revID, err := uuid.Parse(revIdStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REVISION_ID", "شناسه نسخه معتبر نیست")
		return
	}

	art, err := h.service.RestoreArticleRevision(id, revID)
	if err != nil {
		writeError(w, http.StatusNotFound, "RESTORE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// AdminGetArticleByID handles GET /api/v1/admin/articles/{id}
func (h *Handler) AdminGetArticleByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	art, err := h.service.GetArticleByID(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// AdminUnpublishArticle handles POST /api/v1/admin/articles/{id}/unpublish
func (h *Handler) AdminUnpublishArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	art, err := h.service.UnpublishArticle(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "UNPUBLISH_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// AdminArchiveArticle handles POST /api/v1/admin/articles/{id}/archive
func (h *Handler) AdminArchiveArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه مقاله معتبر نیست")
		return
	}

	art, err := h.service.ArchiveArticle(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "ARCHIVE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, art)
}

// ListCategories handles GET /api/v1/content/article-categories
func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	cats := h.service.ListCategories()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"categories": cats,
	})
}

// AdminCreateFAQ handles POST /api/v1/admin/faqs
func (h *Handler) AdminCreateFAQ(w http.ResponseWriter, r *http.Request) {
	var payload FAQ
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.QuestionFA == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "متن سوال الزامی است")
		return
	}

	h.service.AddFAQ(&payload)
	writeJSON(w, http.StatusCreated, payload)
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

