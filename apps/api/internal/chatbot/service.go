package chatbot

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
	"moringalab/api/internal/support"
)

var (
	ErrConversationNotFound = errors.New("گفتگوی چت‌بات یافت نشد")
	MedicalRefusalDisclaimer = "فروشگاه سبزینه ارائه‌دهنده فرآورده‌های طبیعی است و مجاز به ارائه توصیه پزشکی، تجویز دوز دارویی یا ادعای درمان بیماری‌ها نیست. لطفاً در خصوص موارد درمانی با پزشک متخصص مشورت فرمایید."
)

type Service struct {
	mu            sync.RWMutex
	docs          map[uuid.UUID]*KnowledgeDocument
	conversations map[uuid.UUID]*ChatConversation
	messages      map[uuid.UUID][]*ChatMessage // key: conversationID
	feedback      map[uuid.UUID]*ChatFeedback

	catalogSvc *catalog.Service
	contentSvc *content.Service
	supportSvc *support.Service
	llm        LLMProvider
}

func NewService(catalogSvc *catalog.Service, contentSvc *content.Service, supportSvc *support.Service, llm LLMProvider) *Service {
	if llm == nil {
		llm = NewFakeLLMProvider()
	}

	svc := &Service{
		docs:          make(map[uuid.UUID]*KnowledgeDocument),
		conversations: make(map[uuid.UUID]*ChatConversation),
		messages:      make(map[uuid.UUID][]*ChatMessage),
		feedback:      make(map[uuid.UUID]*ChatFeedback),
		catalogSvc:    catalogSvc,
		contentSvc:    contentSvc,
		supportSvc:    supportSvc,
		llm:           llm,
	}

	// Initial Sync
	svc.SyncKnowledgeIndex()
	return svc
}

// ─── Knowledge Indexer ────────────────────────────────────────────────────────

func (s *Service) SyncKnowledgeIndex() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.docs = make(map[uuid.UUID]*KnowledgeDocument)
	count := 0

	// 1. Index Products
	if s.catalogSvc != nil {
		products := s.catalogSvc.SearchProducts("", uuid.Nil, uuid.Nil, 0, 1000)
		for _, p := range products {
			docContent := fmt.Sprintf("محصول %s با قیمت %d ریال. SKU: %s. توضیحات: %s", p.NameFA, p.PriceIRR, p.SKU, p.DescriptionFA)
			h := sha256.Sum256([]byte(docContent))
			checksum := fmt.Sprintf("%x", h[:8])

			doc := &KnowledgeDocument{
				ID:              uuid.New(),
				SourceType:      "product",
				SourceID:        p.ID,
				Title:           p.NameFA,
				ApprovedContent: docContent,
				Checksum:        checksum,
				IndexedAt:       time.Now(),
			}
			s.docs[doc.ID] = doc
			count++
		}
	}

	// 2. Index Published Articles
	if s.contentSvc != nil {
		articles := s.contentSvc.ListArticles()
		for _, a := range articles {
			docContent := fmt.Sprintf("مقاله %s. خلاصه: %s. متن: %s", a.TitleFA, a.SummaryFA, a.ContentFA)
			h := sha256.Sum256([]byte(docContent))
			checksum := fmt.Sprintf("%x", h[:8])

			doc := &KnowledgeDocument{
				ID:              uuid.New(),
				SourceType:      "article",
				SourceID:        a.ID,
				Title:           a.TitleFA,
				ApprovedContent: docContent,
				Checksum:        checksum,
				IndexedAt:       time.Now(),
			}
			s.docs[doc.ID] = doc
			count++
		}

		// 3. Index FAQs
		faqs := s.contentSvc.ListFAQs()
		for _, f := range faqs {
			docContent := fmt.Sprintf("سوال متداول: %s - پاسخ: %s", f.QuestionFA, f.AnswerFA)
			h := sha256.Sum256([]byte(docContent))
			checksum := fmt.Sprintf("%x", h[:8])

			doc := &KnowledgeDocument{
				ID:              uuid.New(),
				SourceType:      "faq",
				SourceID:        f.ID,
				Title:           f.QuestionFA,
				ApprovedContent: docContent,
				Checksum:        checksum,
				IndexedAt:       time.Now(),
			}
			s.docs[doc.ID] = doc
			count++
		}
	}

	return count
}

// ─── Medical Safety Scanner ──────────────────────────────────────────────────

var dangerousMedicalQueryRegex = regexp.MustCompile(`(?i)(درمان قطعی|دوز مصرف پزشکی|جایگزین داروی|علاج قطعی|نسخه دارویی|تشخیص بیماری)`)

func ScanMedicalAdviceQuery(query string) bool {
	return dangerousMedicalQueryRegex.MatchString(query)
}

// ─── Conversation API ────────────────────────────────────────────────────────

func (s *Service) StartConversation(userID *uuid.UUID) *ChatConversation {
	s.mu.Lock()
	defer s.mu.Unlock()

	conv := &ChatConversation{
		ID:        uuid.New(),
		UserID:    userID,
		Status:    ConvActive,
		StartedAt: time.Now(),
	}

	s.conversations[conv.ID] = conv
	s.messages[conv.ID] = make([]*ChatMessage, 0)
	return conv
}

func (s *Service) SendMessage(ctx context.Context, conversationID uuid.UUID, userContent string) (*ChatMessage, error) {
	s.mu.Lock()
	conv, exists := s.conversations[conversationID]
	if !exists {
		s.mu.Unlock()
		return nil, ErrConversationNotFound
	}

	// 1. Save User Message
	userMsg := &ChatMessage{
		ID:             uuid.New(),
		ConversationID: conversationID,
		Role:           "user",
		Content:        userContent,
		CreatedAt:      time.Now(),
	}
	s.messages[conversationID] = append(s.messages[conversationID], userMsg)
	s.mu.Unlock()

	// 2. Check Medical Advice Guard
	if ScanMedicalAdviceQuery(userContent) {
		assistantMsg := &ChatMessage{
			ID:               uuid.New(),
			ConversationID:   conversationID,
			Role:             "assistant",
			Content:          MedicalRefusalDisclaimer,
			SafetyFlagged:    true,
			HandoffSuggested: true,
			CreatedAt:        time.Now(),
		}

		s.mu.Lock()
		s.messages[conversationID] = append(s.messages[conversationID], assistantMsg)
		s.mu.Unlock()
		return assistantMsg, nil
	}

	// 3. Grounded Retrieval (Phase A)
	s.mu.RLock()
	matchedDocs := s.retrieveRelevantDocsUnlocked(userContent)
	s.mu.RUnlock()

	var retrievedText strings.Builder
	citations := make([]Citation, 0)

	for _, doc := range matchedDocs {
		retrievedText.WriteString(fmt.Sprintf("[%s]: %s\n", doc.Title, doc.ApprovedContent))
		urlPath := "/shop"
		if doc.SourceType == "product" {
			urlPath = "/shop"
		} else if doc.SourceType == "article" {
			urlPath = "/articles"
		}

		citations = append(citations, Citation{
			Title:      doc.Title,
			URL:        urlPath,
			SourceType: doc.SourceType,
		})
	}

	// 4. Generate Answer via LLM Provider Port
	llmResp, err := s.llm.GenerateAnswer(ctx, userContent, retrievedText.String())
	if err != nil || llmResp == nil {
		llmResp = &LLMResponse{
			AnswerText: "بر اساس پایگاه دانش سبزینه، برای بررسی جزئیات بیشتر می‌توانید از منابع لینک‌شده زیر استفاده کنید.",
		}
	}

	if len(citations) > 0 {
		llmResp.Citations = citations
	}

	assistantMsg := &ChatMessage{
		ID:               uuid.New(),
		ConversationID:   conversationID,
		Role:             "assistant",
		Content:          llmResp.AnswerText,
		Citations:        llmResp.Citations,
		HandoffSuggested: len(citations) == 0, // Suggest handoff if no documents matched
		CreatedAt:        time.Now(),
	}

	s.mu.Lock()
	s.messages[conversationID] = append(s.messages[conversationID], assistantMsg)
	s.mu.Unlock()

	return assistantMsg, nil
}

func (s *Service) retrieveRelevantDocsUnlocked(query string) []*KnowledgeDocument {
	queryLower := strings.ToLower(query)
	type docScore struct {
		doc   *KnowledgeDocument
		score int
	}

	scores := make([]docScore, 0, len(s.docs))
	for _, doc := range s.docs {
		score := 0
		words := strings.Fields(queryLower)
		for _, w := range words {
			if len(w) > 2 && strings.Contains(strings.ToLower(doc.ApprovedContent), w) {
				score += 2
			}
			if len(w) > 2 && strings.Contains(strings.ToLower(doc.Title), w) {
				score += 5
			}
		}

		if score > 0 {
			scores = append(scores, docScore{doc: doc, score: score})
		}
	}

	sort.Slice(scores, func(i, j int) bool {
		return scores[i].score > scores[j].score
	})

	var result []*KnowledgeDocument
	for i := 0; i < len(scores) && i < 3; i++ {
		result = append(result, scores[i].doc)
	}
	return result
}

// ─── Human Support Handoff Integration ────────────────────────────────────────

func (s *Service) HandoffToSupport(conversationID uuid.UUID, customerName, contactInfo string) (*support.SupportInquiry, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	conv, exists := s.conversations[conversationID]
	if !exists {
		return nil, ErrConversationNotFound
	}

	// Fetch transcript
	msgs := s.messages[conversationID]
	var transcript strings.Builder
	for _, m := range msgs {
		transcript.WriteString(fmt.Sprintf("%s: %s\n", m.Role, m.Content))
	}

	conv.Status = ConvHandedOff
	now := time.Now()
	conv.ClosedAt = &now

	// Create Support Inquiry Ticket
	if s.supportSvc != nil {
		inquiry, err := s.supportSvc.CreateInquiry(support.SubmitInquiryRequest{
			UserID:       conv.UserID,
			CustomerName: customerName,
			ContactInfo:  contactInfo,
			Subject:      "ارجاع چت‌بات هوشمند به پشتیبانی انسانی",
			Body:         transcript.String(),
			Priority:     "high",
		})
		return inquiry, err
	}

	return nil, nil
}

// ─── Admin Dashboard Stats & Transcripts ──────────────────────────────────────

func (s *Service) GetAdminStats() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	safetyFlaggedCount := 0
	for _, msgList := range s.messages {
		for _, m := range msgList {
			if m.SafetyFlagged {
				safetyFlaggedCount++
			}
		}
	}

	return map[string]interface{}{
		"indexed_docs_count":  len(s.docs),
		"conversations_count": len(s.conversations),
		"safety_flags_count":  safetyFlaggedCount,
	}
}

func (s *Service) ListConversationsForAdmin() []*ChatConversation {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []*ChatConversation
	for _, c := range s.conversations {
		list = append(list, c)
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].StartedAt.After(list[j].StartedAt)
	})
	return list
}

func (s *Service) GetConversationMessages(convID uuid.UUID) []*ChatMessage {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.messages[convID]
}
