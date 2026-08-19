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

func NewHandler(reviewsSvc *Service, wishlistSvc *wishlist.Service, catalogSvc *catalog.Service) *Handler {
	return &Handler{
		reviewsService:  reviewsSvc,
		wishlistService: wishlistSvc,
		catalogService:  catalogSvc,
	}
}

// ─── Customer Endpoints ──────────────────────────────────────────────────────

// GetProductReviews handles GET /api/v1/catalog/products/{slug}/reviews
func (h *Handler) GetProductReviews(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	prod, err := h.catalogService.GetProductBySlug(slug)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "محصول پیدا نشد")
		return
	}

	sortOpt := r.URL.Query().Get("sort")
	filterVerified := r.URL.Query().Get("verified") == "true"

	summary := h.reviewsService.GetProductReviews(prod.ID, sortOpt, filterVerified)
	writeJSON(w, http.StatusOK, summary)
}

// AddReview handles POST /api/v1/catalog/products/{slug}/reviews
func (h *Handler) AddReview(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	prod, err := h.catalogService.GetProductBySlug(slug)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "محصول پیدا نشد")
		return
	}

	var payload struct {
		CustomerName string `json:"customer_name"`
		Rating       int    `json:"rating"`
		Title        string `json:"title"`
		Comment      string `json:"comment"`
		UserID       string `json:"user_id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Rating < 1 || payload.Rating > 5 {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "امتیاز بین ۱ تا ۵ ستاره الزامی است")
		return
	}

	if payload.CustomerName == "" {
		payload.CustomerName = "کاربر سبزینه"
	}

	var uID *uuid.UUID
	if payload.UserID != "" {
		if parsed, err := uuid.Parse(payload.UserID); err == nil {
			uID = &parsed
		}
	}

	rev, err := h.reviewsService.AddReview(SubmitReviewRequest{
		ProductID:    prod.ID,
		UserID:       uID,
		CustomerName: payload.CustomerName,
		Rating:       payload.Rating,
		Title:        payload.Title,
		Comment:      payload.Comment,
	})
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "SUBMIT_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, rev)
}

// VoteReview handles POST /api/v1/reviews/{id}/vote
func (h *Handler) VoteReview(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه دیدگاه معتبر نیست")
		return
	}

	var payload struct {
		VoterIdentity string `json:"voter_identity"`
		IsHelpful     bool   `json:"is_helpful"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.VoterIdentity == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "شناسه رای‌دهنده الزامی است")
		return
	}

	err = h.reviewsService.VoteReview(id, payload.VoterIdentity, payload.IsHelpful)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "VOTE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// GetProductQuestions handles GET /api/v1/catalog/products/{slug}/questions
func (h *Handler) GetProductQuestions(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	prod, err := h.catalogService.GetProductBySlug(slug)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "محصول پیدا نشد")
		return
	}

	questions := h.reviewsService.GetProductQuestions(prod.ID)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"questions": questions,
	})
}

// SubmitQuestion handles POST /api/v1/catalog/products/{slug}/questions
func (h *Handler) SubmitQuestion(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	prod, err := h.catalogService.GetProductBySlug(slug)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "محصول پیدا نشد")
		return
	}

	var payload struct {
		CustomerName string `json:"customer_name"`
		QuestionBody string `json:"question_body"`
		UserID       string `json:"user_id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.QuestionBody == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "متن پرسش الزامی است")
		return
	}

	if payload.CustomerName == "" {
		payload.CustomerName = "کاربر مهمان"
	}

	var uID *uuid.UUID
	if payload.UserID != "" {
		if parsed, err := uuid.Parse(payload.UserID); err == nil {
			uID = &parsed
		}
	}

	q, err := h.reviewsService.SubmitQuestion(prod.ID, uID, payload.CustomerName, payload.QuestionBody)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "SUBMIT_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, q)
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// AdminListReviews handles GET /api/v1/admin/reviews
func (h *Handler) AdminListReviews(w http.ResponseWriter, r *http.Request) {
	reviews := h.reviewsService.ListAllReviewsForAdmin()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"reviews": reviews,
	})
}

// AdminUpdateReviewStatus handles PATCH /api/v1/admin/reviews/{id}/status
func (h *Handler) AdminUpdateReviewStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه دیدگاه معتبر نیست")
		return
	}

	var payload struct {
		Action string `json:"action"` // "approve" or "reject"
		Reason string `json:"reason,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت ورودی معتبر نیست")
		return
	}

	var rev *ProductReview
	if payload.Action == "approve" {
		rev, err = h.reviewsService.ApproveReview(id)
	} else if payload.Action == "reject" {
		rev, err = h.reviewsService.RejectReview(id, payload.Reason)
	} else {
		writeError(w, http.StatusBadRequest, "INVALID_ACTION", "عملیات باید approve یا reject باشد")
		return
	}

	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, rev)
}

// AdminAddOfficialReply handles POST /api/v1/admin/reviews/{id}/reply
func (h *Handler) AdminAddOfficialReply(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه دیدگاه معتبر نیست")
		return
	}

	var payload struct {
		ReplyBody string `json:"reply_body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.ReplyBody == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "متن پاسخ رسمی مدیر الزامی است")
		return
	}

	reply, err := h.reviewsService.AddOfficialReply(id, payload.ReplyBody)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, reply)
}

// AdminListQuestions handles GET /api/v1/admin/questions
func (h *Handler) AdminListQuestions(w http.ResponseWriter, r *http.Request) {
	questions := h.reviewsService.ListAllQuestionsForAdmin()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"questions": questions,
	})
}

// AdminUpdateQuestionStatus handles PATCH /api/v1/admin/questions/{id}/status
func (h *Handler) AdminUpdateQuestionStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه پرسش معتبر نیست")
		return
	}

	var payload struct {
		Action string `json:"action"` // "approve" or "reject"
		Reason string `json:"reason,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت ورودی معتبر نیست")
		return
	}

	var q *ProductQuestion
	if payload.Action == "approve" {
		q, err = h.reviewsService.ApproveQuestion(id)
	} else if payload.Action == "reject" {
		q, err = h.reviewsService.RejectQuestion(id, payload.Reason)
	} else {
		writeError(w, http.StatusBadRequest, "INVALID_ACTION", "عملیات باید approve یا reject باشد")
		return
	}

	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, q)
}

// AdminAnswerQuestion handles POST /api/v1/admin/questions/{id}/answers
func (h *Handler) AdminAnswerQuestion(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه پرسش معتبر نیست")
		return
	}

	var payload struct {
		AnswerBody string `json:"answer_body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.AnswerBody == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "متن پاسخ الزامی است")
		return
	}

	ans, err := h.reviewsService.AnswerQuestion(id, "پشتیبانی سبزینه", payload.AnswerBody, true)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, ans)
}

// ─── Toggle Wishlist ─────────────────────────────────────────────────────────

func (h *Handler) ToggleWishlist(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		ProductID string `json:"product_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت ورودی معتبر نیست")
		return
	}

	pID, err := uuid.Parse(payload.ProductID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه محصول معتبر نیست")
		return
	}

	wID := uuid.Nil
	added := h.wishlistService.ToggleWishlist(wID, pID)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"added": added,
	})
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
