package support

import (
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

func setupTestSupportService(t *testing.T) (*Service, *orders.Service) {
	t.Helper()
	ordersSvc := orders.NewService()
	svc := NewService(ordersSvc)
	return svc, ordersSvc
}

// ─── Test 1: Business Hours Asia/Tehran ──────────────────────────────────────

func TestBusinessHoursAsiaTehran(t *testing.T) {
	svc, _ := setupTestSupportService(t)

	loc, _ := time.LoadLocation("Asia/Tehran")
	if loc == nil {
		loc = time.Local
	}

	// Saturday 10:00 AM Tehran -> Open
	sat10AM := time.Date(2026, 8, 8, 10, 0, 0, 0, loc)
	if !svc.IsCurrentlyOpen(sat10AM) {
		t.Error("expected support to be open on Saturday at 10 AM Tehran")
	}

	// Friday 10:00 AM Tehran -> Closed
	fri10AM := time.Date(2026, 8, 7, 10, 0, 0, 0, loc)
	if svc.IsCurrentlyOpen(fri10AM) {
		t.Error("expected support to be closed on Friday")
	}

	// Saturday 22:00 PM Tehran -> Closed
	sat10PM := time.Date(2026, 8, 8, 22, 0, 0, 0, loc)
	if svc.IsCurrentlyOpen(sat10PM) {
		t.Error("expected support to be closed at 10 PM")
	}
}

// ─── Test 2: Ticket Number Generation Format ──────────────────────────────────

func TestTicketNumberGenerationFormat(t *testing.T) {
	svc, _ := setupTestSupportService(t)

	inq, err := svc.CreateInquiry(SubmitInquiryRequest{
		CustomerName: "مشتری تست",
		ContactInfo:  "09121111111",
		Subject:      "تست کد تیکت",
		Body:         "متن تیکت",
	})

	if err != nil {
		t.Fatalf("CreateInquiry failed: %v", err)
	}

	if !strings.HasPrefix(inq.TicketNumber, "TCK-") {
		t.Errorf("expected ticket number to start with 'TCK-', got '%s'", inq.TicketNumber)
	}
}

// ─── Test 3: Honeypot Anti-Spam Guard ─────────────────────────────────────────

func TestCreateInquiryHoneypotSpamGuard(t *testing.T) {
	svc, _ := setupTestSupportService(t)

	// Submission with filled honeypot -> MUST fail as spam
	_, err := svc.CreateInquiry(SubmitInquiryRequest{
		CustomerName: "ربات اسپمر",
		Subject:      "اسپم",
		Body:         "متن اسپم",
		Honeypot:     "bot_field_filled",
	})

	if err != ErrSpamDetected {
		t.Errorf("expected ErrSpamDetected for filled honeypot, got %v", err)
	}
}

// ─── Test 4 & 5: Order Ownership Verification ─────────────────────────────────

func TestCreateInquiryOrderOwnershipVerification(t *testing.T) {
	svc, ordersSvc := setupTestSupportService(t)

	userID := uuid.New()
	anotherUser := uuid.New()

	ord, _ := ordersSvc.CreateOrder(&orders.Order{
		UserID:         &userID,
		Status:         orders.StatusPaid,
		IdempotencyKey: uuid.New().String(),
	})

	// 1. User owns order -> OrderOwnerVerified = true
	inqVerified, _ := svc.CreateInquiry(SubmitInquiryRequest{
		UserID:       &userID,
		CustomerName: "مالک واقعی سفارش",
		Subject:      "پیگیری سفارش من",
		Body:         "متن تیکت",
		OrderNumber:  ord.OrderNumber,
	})

	if !inqVerified.OrderOwnerVerified {
		t.Error("expected OrderOwnerVerified to be true for actual order owner")
	}

	// 2. Different user claims order -> OrderOwnerVerified = false
	inqUnverified, _ := svc.CreateInquiry(SubmitInquiryRequest{
		UserID:       &anotherUser,
		CustomerName: "کاربر غریبه",
		Subject:      "پیگیری سفارش دیگران",
		Body:         "متن تیکت",
		OrderNumber:  ord.OrderNumber,
	})

	if inqUnverified.OrderOwnerVerified {
		t.Error("expected OrderOwnerVerified to be false for non-owner user")
	}
}

// ─── Test 6: WhatsApp Prefilled URL Generator ─────────────────────────────────

func TestGenerateWhatsAppURLWithPrefilledText(t *testing.T) {
	svc, _ := setupTestSupportService(t)

	channels, _ := svc.ListChannels()
	var waChannelID uuid.UUID
	for _, c := range channels {
		if c.Type == "whatsapp" {
			waChannelID = c.ID
			break
		}
	}

	waURL, err := svc.GenerateWhatsAppURL(waChannelID, "سلام سوال دارم")
	if err != nil {
		t.Fatalf("GenerateWhatsAppURL failed: %v", err)
	}

	if !strings.Contains(waURL, "https://wa.me/") {
		t.Errorf("expected wa.me URL, got '%s'", waURL)
	}
	if !strings.Contains(waURL, "text=") {
		t.Error("expected prefilled text query param")
	}
}

// ─── Test 7: Admin Inquiry Status & Notes Update ───────────────────────────────

func TestAdminUpdateInquiryStatusAndNotes(t *testing.T) {
	svc, _ := setupTestSupportService(t)

	inq, _ := svc.CreateInquiry(SubmitInquiryRequest{
		CustomerName: "کاربر تست ادمین",
		Subject:      "مشکل در پرداختی",
		Body:         "مبلغ کسر شد.",
	})

	updated, err := svc.AdminUpdateInquiry(inq.ID, StatusInProgress, "کارشناس حسینی", "در حال استعلام از درگاه")
	if err != nil {
		t.Fatalf("AdminUpdateInquiry failed: %v", err)
	}

	if updated.Status != StatusInProgress {
		t.Errorf("expected status in_progress, got %s", updated.Status)
	}
	if updated.AssignedTo == nil || *updated.AssignedTo != "کارشناس حسینی" {
		t.Errorf("expected assignee کارشناس حسینی")
	}
	if updated.AdminNotes != "در حال استعلام از درگاه" {
		t.Errorf("expected admin notes saved, got '%s'", updated.AdminNotes)
	}
}

// ─── Test 8: List Channels Returns Online Status ──────────────────────────────

func TestListChannelsReturnsOnlineStatus(t *testing.T) {
	svc, _ := setupTestSupportService(t)

	channels, _ := svc.ListChannels()
	if len(channels) == 0 {
		t.Error("expected active support channels list")
	}
}

// ─── Test 9: Lookup Inquiry Ticket ────────────────────────────────────────────

func TestGetInquiryByTicketNumber(t *testing.T) {
	svc, _ := setupTestSupportService(t)

	inq, _ := svc.CreateInquiry(SubmitInquiryRequest{
		CustomerName: "کاربر جستجو",
		Subject:      "سوال",
		Body:         "متن",
	})

	found, err := svc.GetInquiryByTicketNumber(inq.TicketNumber)
	if err != nil || found.ID != inq.ID {
		t.Fatalf("GetInquiryByTicketNumber failed: %v", err)
	}
}

// ─── Test 10: XSS Sanitization in Inquiry Body ────────────────────────────────

func TestXSSSanitizationInInquiryBody(t *testing.T) {
	svc, _ := setupTestSupportService(t)

	inq, _ := svc.CreateInquiry(SubmitInquiryRequest{
		CustomerName: "<script>alert(1)</script>رضا",
		Subject:      "<b>موضوع</b>",
		Body:         "<iframe src='http://evil.com'></iframe>متن پاک",
	})

	if inq.CustomerName != "رضا" {
		t.Errorf("expected clean customer name 'رضا', got '%s'", inq.CustomerName)
	}
	if inq.Subject != "موضوع" {
		t.Errorf("expected clean subject 'موضوع', got '%s'", inq.Subject)
	}
	if inq.Body != "متن پاک" {
		t.Errorf("expected clean body 'متن پاک', got '%s'", inq.Body)
	}
}
