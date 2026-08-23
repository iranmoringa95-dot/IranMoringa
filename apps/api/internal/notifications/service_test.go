package notifications

import (
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func setupTestService() (*Service, *FakeSMSProvider, *FakeEmailProvider) {
	sms := NewFakeSMSProvider()
	email := NewFakeEmailProvider()
	svc := NewService(sms, email)
	return svc, sms, email
}

// ─── Test 1: Fake SMS Provider ───────────────────────────────────────────────

func TestFakeSMSProviderSendsSuccessfully(t *testing.T) {
	svc, sms, _ := setupTestService()

	data := map[string]string{
		"OrderNumber": "MOR-14050515-00001",
		"TotalToman":  "430,000",
	}

	del, err := svc.NotifyEvent("order_placed", "+989121234567", ChannelSMS, data, nil, nil)
	if err != nil {
		t.Fatalf("NotifyEvent failed: %v", err)
	}

	if del.Status != SendStatusSent {
		t.Errorf("expected status sent, got %s", del.Status)
	}

	sentMsgs := sms.GetSentMessages()
	if len(sentMsgs) != 1 {
		t.Fatalf("expected 1 sent SMS message, got %d", len(sentMsgs))
	}
	if sentMsgs[0].To != "+989121234567" {
		t.Errorf("expected recipient +989121234567, got %s", sentMsgs[0].To)
	}
}

// ─── Test 2: Fake Email Provider ─────────────────────────────────────────────

func TestFakeEmailProviderSendsSuccessfully(t *testing.T) {
	svc, _, email := setupTestService()

	data := map[string]string{
		"OrderNumber": "MOR-14050515-00002",
		"TotalToman":  "500,000",
	}

	del, err := svc.NotifyEvent("order_email_confirmation", "customer@example.com", ChannelEmail, data, nil, nil)
	if err != nil {
		t.Fatalf("NotifyEvent email failed: %v", err)
	}

	if del.Status != SendStatusSent {
		t.Errorf("expected status sent, got %s", del.Status)
	}

	sentEmails := email.GetSentMessages()
	if len(sentEmails) != 1 {
		t.Fatalf("expected 1 sent Email message, got %d", len(sentEmails))
	}
	if sentEmails[0].To != "customer@example.com" {
		t.Errorf("expected recipient customer@example.com, got %s", sentEmails[0].To)
	}
}

// ─── Test 3: Template Variable Substitution ─────────────────────────────────

func TestTemplateRenderingWithVars(t *testing.T) {
	tmpl := &NotificationTemplate{
		Code:      "test_code",
		Channel:   ChannelSMS,
		Body:      "سلام {{.Name}}، سفارش {{.OrderNum}} آماده است.",
		Variables: []string{"Name", "OrderNum"},
	}

	data := map[string]string{
		"Name":     "علی",
		"OrderNum": "MOR-100",
	}

	_, body, err := RenderTemplate(tmpl, data)
	if err != nil {
		t.Fatalf("RenderTemplate failed: %v", err)
	}

	expected := "سلام علی، سفارش MOR-100 آماده است."
	if body != expected {
		t.Errorf("expected '%s', got '%s'", expected, body)
	}
}

// ─── Test 4: Missing Variable Guard ──────────────────────────────────────────

func TestTemplateMissingVariableGuard(t *testing.T) {
	svc, _, _ := setupTestService()

	// "order_shipped" requires "OrderNumber" AND "TrackingCode"
	dataMissingTracking := map[string]string{
		"OrderNumber": "MOR-1405-0001",
		// TrackingCode is missing
	}

	del, err := svc.NotifyEvent("order_shipped", "+989121234567", ChannelSMS, dataMissingTracking, nil, nil)
	if err == nil {
		t.Fatal("expected error due to missing variable, got nil")
	}

	if !errors.Is(err, ErrMissingVariable) {
		t.Errorf("expected ErrMissingVariable, got %v", err)
	}

	if del.Status != SendStatusFailed {
		t.Errorf("expected delivery status failed, got %s", del.Status)
	}
}

// ─── Test 5: PII Recipient Masking ───────────────────────────────────────────

func TestDeliveryRecordMaskedRecipient(t *testing.T) {
	maskedPhone := MaskPhone("+989121234567")
	if maskedPhone != "+98912***4567" {
		t.Errorf("expected +98912***4567, got %s", maskedPhone)
	}

	maskedEmail := MaskEmail("user@moringalab.ir")
	if maskedEmail != "u***@moringalab.ir" {
		t.Errorf("expected u***@moringalab.ir, got %s", maskedEmail)
	}
}

// ─── Test 6: OTP Body Redaction ──────────────────────────────────────────────

func TestOTPDeliveryBodyRedacted(t *testing.T) {
	svc, _, _ := setupTestService()

	data := map[string]string{
		"Code": "654321",
	}

	del, err := svc.NotifyEvent("otp_requested", "+989121234567", ChannelSMS, data, nil, nil)
	if err != nil {
		t.Fatalf("NotifyEvent OTP failed: %v", err)
	}

	sanitized := del.SanitizeForJSON()
	if sanitized.Body != "[REDACTED]" {
		t.Errorf("expected OTP body to be redacted to [REDACTED], got '%s'", sanitized.Body)
	}

	if !strings.Contains(del.Body, "654321") {
		t.Errorf("expected raw delivery body to contain unmasked code for provider dispatch")
	}
}

// ─── Test 7 & 8: Retry Worker & Dead Letter ──────────────────────────────────

func TestRetryWorkerWithBackoffAndDeadLetter(t *testing.T) {
	svc, sms, _ := setupTestService()

	// Set SMS provider to fail with retryable error
	sms.SetFailure(true, true, errors.New("ارتباط با درگاه پیامک قطع شد"))

	data := map[string]string{
		"OrderNumber": "MOR-RETRY-01",
	}

	del, _ := svc.NotifyEvent("order_cancelled", "+989121234567", ChannelSMS, data, nil, nil)
	if del.Status != SendStatusFailed {
		t.Fatalf("expected initial status failed, got %s", del.Status)
	}

	// Retry 1
	svc.ProcessRetryQueue()
	if del.AttemptCount != 2 {
		t.Errorf("expected attempt count 2, got %d", del.AttemptCount)
	}

	// Retry 2, 3, 4
	svc.ProcessRetryQueue() // attempt 3
	svc.ProcessRetryQueue() // attempt 4
	svc.ProcessRetryQueue() // attempt 5 -> transitions to dead_letter

	if del.Status != SendStatusDeadLetter {
		t.Errorf("expected status dead_letter after 5 attempts, got %s", del.Status)
	}

	// Fix SMS provider failure
	sms.SetFailure(false, false, nil)

	// Admin manual retry
	retried, err := svc.RetryDelivery(del.ID)
	if err != nil {
		t.Fatalf("RetryDelivery failed: %v", err)
	}
	if retried.Status != SendStatusSent {
		t.Errorf("expected status sent after manual retry, got %s", retried.Status)
	}
}

// ─── Test 9: Transactional Override Opt-Out ──────────────────────────────────

func TestTransactionalOverridesOptOut(t *testing.T) {
	svc, _, _ := setupTestService()
	userID := uuid.New()

	// User opts out of marketing SMS
	svc.GetPreferencesStore().SetPreference(userID, ChannelSMS, CategoryMarketing, false)

	// 1. Transactional OTP notification — MUST succeed despite opt-out
	otpData := map[string]string{"Code": "999888"}
	otpDel, err := svc.NotifyEvent("otp_requested", "+989121234567", ChannelSMS, otpData, &userID, nil)
	if err != nil || otpDel == nil {
		t.Fatalf("transactional OTP notification failed to send: %v", err)
	}

	// 2. Marketing back-in-stock notification — MUST be skipped due to opt-out
	mktData := map[string]string{"ProductTitle": "روغن مورینگا"}
	mktDel, err := svc.NotifyEvent("back_in_stock", "+989121234567", ChannelSMS, mktData, &userID, nil)
	if err != nil {
		t.Fatalf("unexpected error for opt-out notification: %v", err)
	}
	if mktDel != nil {
		t.Errorf("expected marketing notification to be skipped (nil delivery), got %v", mktDel)
	}
}

// ─── Test 10: Stock Alert Subscription & Notification ────────────────────────

func TestStockAlertSubscribeAndNotify(t *testing.T) {
	svc, sms, _ := setupTestService()
	variantID := uuid.New()

	// 1. Subscribe user
	sub, err := svc.SubscribeStockAlert(nil, "+989121234567", "", variantID)
	if err != nil {
		t.Fatalf("SubscribeStockAlert failed: %v", err)
	}
	if sub.Status != StockAlertPending {
		t.Errorf("expected status pending, got %s", sub.Status)
	}

	// 2. Trigger back-in-stock notification
	notifiedCount := svc.NotifyBackInStock(variantID, "پودر برگ مورینگا ارگانیک")
	if notifiedCount != 1 {
		t.Errorf("expected 1 subscriber notified, got %d", notifiedCount)
	}

	// Verify sent message content
	sentMsgs := sms.GetSentMessages()
	if len(sentMsgs) != 1 {
		t.Fatalf("expected 1 sent SMS, got %d", len(sentMsgs))
	}
	if !strings.Contains(sentMsgs[0].Body, "پودر برگ مورینگا ارگانیک") {
		t.Errorf("expected SMS body to contain product title, got '%s'", sentMsgs[0].Body)
	}
}

// ─── Test 11: Queue Status Metrics ───────────────────────────────────────────

func TestQueueStatusMetrics(t *testing.T) {
	svc, sms, _ := setupTestService()

	// Send 1 successful
	data := map[string]string{"OrderNumber": "MOR-100", "TotalToman": "100,000"}
	_, _ = svc.NotifyEvent("order_placed", "+989121234567", ChannelSMS, data, nil, nil)

	// Send 1 failed
	sms.SetFailure(true, true, errors.New("fail"))
	_, _ = svc.NotifyEvent("payment_failed", "+989121234567", ChannelSMS, map[string]string{"OrderNumber": "MOR-200"}, nil, nil)

	stats := svc.GetQueueStatus()
	if stats.SentCount != 1 {
		t.Errorf("expected 1 sent message, got %d", stats.SentCount)
	}
	if stats.FailedCount != 1 {
		t.Errorf("expected 1 failed message, got %d", stats.FailedCount)
	}
	if stats.TotalCount != 2 {
		t.Errorf("expected 2 total messages, got %d", stats.TotalCount)
	}
}

// ─── Test 12: Order Lifecycle Notifications (Placed, Paid, Shipped) ──────────

func TestOrderLifecycleNotifications(t *testing.T) {
	svc, sms, _ := setupTestService()
	svc.gatewayManager.AdminNumbers = []string{"09132391843"}

	// 1. NotifyOrderPlaced
	del, err := svc.NotifyOrderPlaced("MOR-14030101-00001", 1500000, "09121234567", "سارا احمدی", "pending_payment")
	if err != nil {
		t.Fatalf("NotifyOrderPlaced failed: %v", err)
	}
	if del == nil || del.Status != SendStatusSent {
		t.Fatalf("expected sent delivery for NotifyOrderPlaced")
	}

	msgs := sms.GetSentMessages()
	if len(msgs) < 2 { // 1 buyer + 1 admin
		t.Fatalf("expected at least 2 messages (buyer + admin), got %d", len(msgs))
	}
	if !strings.Contains(msgs[0].Body, "MOR-14030101-00001") {
		t.Errorf("expected order number in SMS, got %s", msgs[0].Body)
	}

	// 2. NotifyPaymentPaid
	sms.Clear()
	delPaid, err := svc.NotifyPaymentPaid("MOR-14030101-00001", 1500000, "09121234567", "سارا احمدی")
	if err != nil {
		t.Fatalf("NotifyPaymentPaid failed: %v", err)
	}
	if delPaid == nil || delPaid.Status != SendStatusSent {
		t.Fatalf("expected sent delivery for NotifyPaymentPaid")
	}

	msgs = sms.GetSentMessages()
	if len(msgs) < 2 {
		t.Fatalf("expected 2 messages for payment, got %d", len(msgs))
	}

	// 3. NotifyOrderStatusChanged (Shipped with tracking code)
	sms.Clear()
	delShipped, err := svc.NotifyOrderStatusChanged("MOR-14030101-00001", "packed", "shipped", "12345678901234567890", "09121234567", "سارا احمدی")
	if err != nil {
		t.Fatalf("NotifyOrderStatusChanged failed: %v", err)
	}
	if delShipped == nil || delShipped.Status != SendStatusSent {
		t.Fatalf("expected sent delivery for NotifyOrderStatusChanged")
	}
	msgs = sms.GetSentMessages()
	if len(msgs) < 1 {
		t.Fatalf("expected at least 1 message for shipped, got %d", len(msgs))
	}
	if !strings.Contains(msgs[0].Body, "12345678901234567890") {
		t.Errorf("expected tracking code in shipped SMS, got %s", msgs[0].Body)
	}
}

// ─── Test 13: SMSGatewayManager Template Rendering & Active Driver ───────────

func TestSMSGatewayManagerTemplateRendering(t *testing.T) {
	mgr := NewSMSGatewayManager()
	if mgr.ActiveGateway != "webone" {
		t.Errorf("expected default active gateway to be 'webone', got %s", mgr.ActiveGateway)
	}

	driver := mgr.GetActiveDriver()
	if driver == nil || driver.GetID() != "webone" {
		t.Fatalf("expected webone driver, got %v", driver)
	}

	data := map[string]string{
		"first_name":    "علی",
		"last_name":     "رضایی",
		"order_id":      "MOR-9999",
		"order_total":   "450,000",
		"order_status":  "تکمیل شده",
		"tracking_code": "TRACK-12345",
	}

	rendered := mgr.RenderTemplateText("سلام {first_name} {last_name}، سفارش {order_id} به مبلغ {order_total} ({order_status}). کد: {tracking_code}", data)
	expected := "سلام علی رضایی، سفارش MOR-9999 به مبلغ 450,000 (تکمیل شده). کد: TRACK-12345"
	if rendered != expected {
		t.Errorf("template render mismatch.\nGot:      %s\nExpected: %s", rendered, expected)
	}
}
