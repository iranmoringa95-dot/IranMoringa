package chatbot

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
	"moringalab/api/internal/orders"
	"moringalab/api/internal/support"
)

func setupTestChatbotService(t *testing.T) (*Service, *catalog.Service, *content.Service, *support.Service) {
	t.Helper()
	catalogSvc := catalog.NewService()
	contentSvc := content.NewService()
	ordersSvc := orders.NewService()
	supportSvc := support.NewService(ordersSvc)

	svc := NewService(catalogSvc, contentSvc, supportSvc, NewFakeLLMProvider())
	return svc, catalogSvc, contentSvc, supportSvc
}

// ─── Test 1: Knowledge Index Sync ─────────────────────────────────────────────

func TestKnowledgeIndexSync(t *testing.T) {
	svc, catalogSvc, contentSvc, _ := setupTestChatbotService(t)

	// Add product & published article
	_, _ = catalogSvc.CreateProduct(&catalog.Product{
		NameFA:        "روغن مورینگا ۳۰ میل",
		Slug:          "moringa-oil-30ml",
		DescriptionFA: "روغن خالص پوست و مو",
		PriceIRR:      2500000,
	})

	art, _ := contentSvc.CreateArticle(&content.Article{
		TitleFA:   "خواص روغن مورینگا برای مو",
		Slug:      "moringa-hair-benefits",
		SummaryFA: "خلاصه تقویت مو",
		ContentFA: "متن کامل فواید پرپشت شدن مو",
		Sources:   []content.ScientificSource{{Title: "Nature Science"}},
	})
	rID := uuid.New()
	_, _ = contentSvc.ReviewArticle(art.ID, rID, "دکتر حسینی", true, "")
	_, _ = contentSvc.PublishArticle(art.ID)

	count := svc.SyncKnowledgeIndex()
	if count < 2 {
		t.Errorf("expected at least 2 indexed docs, got %d", count)
	}
}

// ─── Test 2: Medical Advice Refusal Guard ──────────────────────────────────────

func TestMedicalAdviceQueryRefusal(t *testing.T) {
	svc, _, _, _ := setupTestChatbotService(t)

	conv := svc.StartConversation(nil)

	// Ask dangerous medical query
	msg, err := svc.SendMessage(context.Background(), conv.ID, "آیا این پودر درمان قطعی دیابت است؟")
	if err != nil {
		t.Fatalf("SendMessage failed: %v", err)
	}

	if !msg.SafetyFlagged {
		t.Error("expected message to be SafetyFlagged = true for medical claim query")
	}
	if !msg.HandoffSuggested {
		t.Error("expected HandoffSuggested = true for medical claim query")
	}
	if !strings.Contains(msg.Content, "پزشک") {
		t.Errorf("expected medical refusal disclaimer, got '%s'", msg.Content)
	}
}

// ─── Test 3: Grounded Answer With Citations ────────────────────────────────────

func TestGroundedAnswerWithCitations(t *testing.T) {
	svc, catalogSvc, _, _ := setupTestChatbotService(t)

	_, _ = catalogSvc.CreateProduct(&catalog.Product{
		NameFA:        "پودر مورینگا ۱۰۰ گرم",
		Slug:          "moringa-powder-100g",
		DescriptionFA: "پودر برگ ارگانیک",
		PriceIRR:      1500000,
	})
	svc.SyncKnowledgeIndex()

	conv := svc.StartConversation(nil)

	msg, err := svc.SendMessage(context.Background(), conv.ID, "قیمت پودر مورینگا چقدر است؟")
	if err != nil {
		t.Fatalf("SendMessage failed: %v", err)
	}

	if msg.SafetyFlagged {
		t.Error("expected normal query not to be safety flagged")
	}
	if len(msg.Citations) == 0 {
		t.Error("expected grounded response to include citations")
	}
}

// ─── Test 4: Human Support Handoff Ticket Creation ────────────────────────────

func TestHumanSupportHandoff(t *testing.T) {
	svc, _, _, supportSvc := setupTestChatbotService(t)

	conv := svc.StartConversation(nil)
	_, _ = svc.SendMessage(context.Background(), conv.ID, "سوال پیچیده فنی که پاسخ نیافتم")

	inquiry, err := svc.HandoffToSupport(conv.ID, "مشتری چت‌بات", "09121111111")
	if err != nil {
		t.Fatalf("HandoffToSupport failed: %v", err)
	}

	if inquiry == nil || !strings.HasPrefix(inquiry.TicketNumber, "TCK-") {
		t.Errorf("expected valid ticket number, got %+v", inquiry)
	}

	// Verify conversation status updated
	svc.mu.RLock()
	c := svc.conversations[conv.ID]
	svc.mu.RUnlock()

	if c.Status != ConvHandedOff {
		t.Errorf("expected conversation status handed_off, got %s", c.Status)
	}

	// Support inquiry ticket created in supportSvc
	tckInquiry, _ := supportSvc.GetInquiryByTicketNumber(inquiry.TicketNumber)
	if tckInquiry == nil {
		t.Error("expected ticket inquiry to exist in support service")
	}
}

// ─── Test 5: Fake LLM Provider Test ──────────────────────────────────────────

func TestFakeLLMProvider(t *testing.T) {
	provider := NewFakeLLMProvider()

	resp, err := provider.GenerateAnswer(context.Background(), "سوال تست", "متن دانش بازیابی‌شده")
	if err != nil {
		t.Fatalf("GenerateAnswer failed: %v", err)
	}

	if !strings.Contains(resp.AnswerText, "سبزینه") {
		t.Errorf("unexpected fake answer text: %s", resp.AnswerText)
	}
	if resp.TokensUsed <= 0 {
		t.Error("expected tokens used to be populated")
	}
}

// ─── Test 6: Unindexed Query Suggests Handoff ─────────────────────────────────

func TestUnindexedQuerySuggestsHandoff(t *testing.T) {
	svc, _, _, _ := setupTestChatbotService(t)

	conv := svc.StartConversation(nil)

	msg, _ := svc.SendMessage(context.Background(), conv.ID, "سوال درباره موضوعی کاملاً نامربوط که در سیستم نیست")
	if !msg.HandoffSuggested {
		t.Error("expected HandoffSuggested = true when no knowledge docs matched")
	}
}

// ─── Test 7: Start Conversation Initialization ───────────────────────────────

func TestStartConversation(t *testing.T) {
	svc, _, _, _ := setupTestChatbotService(t)

	uID := uuid.New()
	conv := svc.StartConversation(&uID)

	if conv.Status != ConvActive {
		t.Errorf("expected initial status active, got %s", conv.Status)
	}
	if conv.UserID == nil || *conv.UserID != uID {
		t.Errorf("expected user ID to match")
	}
}

// ─── Test 8: Admin Get Stats ──────────────────────────────────────────────────

func TestAdminGetStats(t *testing.T) {
	svc, _, _, _ := setupTestChatbotService(t)

	conv := svc.StartConversation(nil)
	_, _ = svc.SendMessage(context.Background(), conv.ID, "درمان قطعی سرطان")

	stats := svc.GetAdminStats()

	if stats["conversations_count"].(int) != 1 {
		t.Errorf("expected 1 conversation, got %v", stats["conversations_count"])
	}
	if stats["safety_flags_count"].(int) != 1 {
		t.Errorf("expected 1 safety flag, got %v", stats["safety_flags_count"])
	}
}

// ─── Test 9 & 10: Admin List Conversations & Messages ────────────────────────

func TestAdminListConversationsAndMessages(t *testing.T) {
	svc, _, _, _ := setupTestChatbotService(t)

	conv := svc.StartConversation(nil)
	_, _ = svc.SendMessage(context.Background(), conv.ID, "سلام")

	convs := svc.ListConversationsForAdmin()
	if len(convs) != 1 {
		t.Fatalf("expected 1 conversation for admin, got %d", len(convs))
	}

	msgs := svc.GetConversationMessages(conv.ID)
	if len(msgs) != 2 { // 1 user + 1 assistant
		t.Errorf("expected 2 messages in transcript, got %d", len(msgs))
	}
}
