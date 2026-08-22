package chatbot

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	chatbotService *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{chatbotService: svc}
}

// ─── Customer Endpoints ──────────────────────────────────────────────────────

// StartConversation handles POST /api/v1/chatbot/conversations
func (h *Handler) StartConversation(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		UserID string `json:"user_id,omitempty"`
	}

	var uID *uuid.UUID
	if err := json.NewDecoder(r.Body).Decode(&payload); err == nil && payload.UserID != "" {
		if parsed, err := uuid.Parse(payload.UserID); err == nil {
			uID = &parsed
		}
	}

	conv := h.chatbotService.StartConversation(uID)
	writeJSON(w, http.StatusCreated, conv)
}

// SendMessage handles POST /api/v1/chatbot/conversations/{id}/messages
func (h *Handler) SendMessage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه گفتگو معتبر نیست")
		return
	}

	var payload struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || strings.TrimSpace(payload.Content) == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "متن پیام الزامی است")
		return
	}

	msg, err := h.chatbotService.SendMessage(r.Context(), id, payload.Content)
	if err != nil {
		writeError(w, http.StatusNotFound, "CONVERSATION_NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, msg)
}

// RequestHandoff handles POST /api/v1/chatbot/conversations/{id}/handoff
func (h *Handler) RequestHandoff(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه گفتگو معتبر نیست")
		return
	}

	var payload struct {
		CustomerName string `json:"customer_name"`
		ContactInfo  string `json:"contact_info"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.ContactInfo == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "اطلاعات تماس برای ارجاع به کارشناس الزامی است")
		return
	}

	if payload.CustomerName == "" {
		payload.CustomerName = "کاربر چت‌بات"
	}

	inquiry, err := h.chatbotService.HandoffToSupport(id, payload.CustomerName, payload.ContactInfo)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "HANDOFF_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "handed_off",
		"inquiry": inquiry,
	})
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// AdminGetStats handles GET /api/v1/admin/chatbot/stats
func (h *Handler) AdminGetStats(w http.ResponseWriter, r *http.Request) {
	stats := h.chatbotService.GetAdminStats()
	writeJSON(w, http.StatusOK, stats)
}

// AdminSyncKnowledge handles POST /api/v1/admin/chatbot/sync
func (h *Handler) AdminSyncKnowledge(w http.ResponseWriter, r *http.Request) {
	count := h.chatbotService.SyncKnowledgeIndex()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":        "synced",
		"indexed_docs":  count,
	})
}

// AdminListConversations handles GET /api/v1/admin/chatbot/conversations
func (h *Handler) AdminListConversations(w http.ResponseWriter, r *http.Request) {
	conversations := h.chatbotService.ListConversationsForAdmin()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"conversations": conversations,
	})
}

// AdminGetConversationMessages handles GET /api/v1/admin/chatbot/conversations/{id}/messages
func (h *Handler) AdminGetConversationMessages(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه گفتگو معتبر نیست")
		return
	}

	messages := h.chatbotService.GetConversationMessages(id)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"messages": messages,
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
