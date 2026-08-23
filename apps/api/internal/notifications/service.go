package notifications

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

type QueueStatus struct {
	PendingCount    int `json:"pending_count"`
	SentCount       int `json:"sent_count"`
	FailedCount     int `json:"failed_count"`
	DeadLetterCount int `json:"dead_letter_count"`
	TotalCount      int `json:"total_count"`
}

type DeliveryFilter struct {
	Channel     Channel    `json:"channel"`
	Status      SendStatus `json:"status"`
	SearchQuery string     `json:"search_query"` // search masked recipient or event code
	Page        int        `json:"page"`
	PageSize    int        `json:"page_size"`
}

type DeliveryListResult struct {
	Deliveries []*NotificationDelivery `json:"deliveries"`
	TotalCount int                     `json:"total_count"`
	Page       int                     `json:"page"`
	PageSize   int                     `json:"page_size"`
}

type Service struct {
	mu               sync.RWMutex
	templates        map[string]*NotificationTemplate
	deliveries       map[uuid.UUID]*NotificationDelivery
	deliveryOrder    []uuid.UUID
	smsProvider      SMSProvider
	emailProvider    EmailProvider
	prefStore        *PreferencesStore
	stockAlertsStore *StockAlertsStore
	gatewayManager   *SMSGatewayManager
}

func NewService(sms SMSProvider, email EmailProvider) *Service {
	svc := &Service{
		templates:        make(map[string]*NotificationTemplate),
		deliveries:       make(map[uuid.UUID]*NotificationDelivery),
		deliveryOrder:    make([]uuid.UUID, 0),
		smsProvider:      sms,
		emailProvider:    email,
		prefStore:        NewPreferencesStore(),
		stockAlertsStore: NewStockAlertsStore(),
		gatewayManager:   NewSMSGatewayManager(),
	}

	// Register Seed Templates
	for _, tmpl := range GetSeedTemplates() {
		t := tmpl
		svc.templates[t.Code] = &t
	}

	return svc
}

// ─── Dispatch / Notify ───────────────────────────────────────────────────────

func (s *Service) NotifyEvent(
	eventCode string,
	recipient string,
	channel Channel,
	data map[string]string,
	userID *uuid.UUID,
	eventID *uuid.UUID,
) (*NotificationDelivery, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Preference check (transactional override enforced inside)
	if !s.prefStore.ShouldDeliverNotification(userID, channel, eventCode) {
		return nil, nil // Opted out for marketing channel
	}

	// 2. Lookup template
	tmpl, exists := s.templates[eventCode]
	if !exists {
		return nil, fmt.Errorf("%w: %s", ErrTemplateNotFound, eventCode)
	}

	// 3. Render template (guarded against missing variables)
	renderedSubj, renderedBody, err := RenderTemplate(tmpl, data)
	if err != nil {
		// Log failed rendering delivery record
		deliveryID := uuid.New()
		del := &NotificationDelivery{
			ID:              deliveryID,
			EventID:         eventID,
			EventCode:       eventCode,
			RecipientMasked: s.maskRecipient(recipient, channel),
			RecipientRaw:    recipient,
			Channel:         channel,
			Provider:        s.providerName(channel),
			Status:          SendStatusFailed,
			AttemptCount:    1,
			MaxAttempts:     5,
			LastError:       err.Error(),
			IsOTP:           (eventCode == "otp_requested"),
			Subject:         renderedSubj,
			Body:            renderedBody,
			CreatedAt:       time.Now(),
		}
		s.deliveries[deliveryID] = del
		s.deliveryOrder = append(s.deliveryOrder, deliveryID)
		return del, err
	}

	// 4. Construct delivery record
	deliveryID := uuid.New()
	now := time.Now()

	delivery := &NotificationDelivery{
		ID:              deliveryID,
		EventID:         eventID,
		EventCode:       eventCode,
		RecipientMasked: s.maskRecipient(recipient, channel),
		RecipientRaw:    recipient,
		Channel:         channel,
		Provider:        s.providerName(channel),
		Status:          SendStatusQueued,
		AttemptCount:    1,
		MaxAttempts:     5,
		IsOTP:           (eventCode == "otp_requested"),
		Subject:         renderedSubj,
		Body:            renderedBody,
		CreatedAt:       now,
	}

	// 5. Send via provider
	var result *SendResult
	var sendErr error

	if channel == ChannelSMS {
		if s.smsProvider != nil {
			result, sendErr = s.smsProvider.SendSMS(recipient, renderedBody)
		} else if s.gatewayManager != nil && s.gatewayManager.EnableSMS {
			result, sendErr = s.gatewayManager.Send(recipient, renderedBody, "", nil)
		} else {
			return nil, errors.New("ارائه‌دهنده پیامک تنظیم نشده است")
		}
	} else if channel == ChannelEmail {
		if s.emailProvider == nil {
			return nil, errors.New("ارائه‌دهنده ایمیل تنظیم نشده است")
		}
		result, sendErr = s.emailProvider.SendEmail(recipient, renderedSubj, renderedBody)
	}

	// 6. Update delivery status
	if sendErr != nil || (result != nil && result.Status == SendStatusFailed) {
		delivery.Status = SendStatusFailed
		if sendErr != nil {
			delivery.LastError = sendErr.Error()
		} else if result != nil {
			delivery.LastError = result.ErrorMessage
		}
	} else if result != nil {
		delivery.Status = SendStatusSent
		delivery.ProviderMessageID = result.ProviderMessageID
		delivery.SentAt = &now
	}

	s.deliveries[deliveryID] = delivery
	s.deliveryOrder = append(s.deliveryOrder, deliveryID)

	return delivery, sendErr
}

// ─── Retry Worker & Queue Processing ────────────────────────────────────────

func (s *Service) ProcessRetryQueue() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	retried := 0
	now := time.Now()

	for _, delID := range s.deliveryOrder {
		del := s.deliveries[delID]
		if del.Status == SendStatusFailed && del.AttemptCount < del.MaxAttempts {
			del.AttemptCount++

			var result *SendResult
			var err error

			if del.Channel == ChannelSMS && s.smsProvider != nil {
				result, err = s.smsProvider.SendSMS(del.RecipientRaw, del.Body)
			} else if del.Channel == ChannelEmail && s.emailProvider != nil {
				result, err = s.emailProvider.SendEmail(del.RecipientRaw, del.Subject, del.Body)
			}

			if err == nil && result != nil && result.Status == SendStatusSent {
				del.Status = SendStatusSent
				del.ProviderMessageID = result.ProviderMessageID
				del.SentAt = &now
				del.LastError = ""
			} else {
				if err != nil {
					del.LastError = err.Error()
				} else if result != nil {
					del.LastError = result.ErrorMessage
				}

				if del.AttemptCount >= del.MaxAttempts {
					del.Status = SendStatusDeadLetter
				}
			}

			retried++
		}
	}

	return retried
}

// RetryDelivery allows manual admin retry of a failed or dead-letter delivery.
func (s *Service) RetryDelivery(deliveryID uuid.UUID) (*NotificationDelivery, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	del, exists := s.deliveries[deliveryID]
	if !exists {
		return nil, errors.New("سابقه ارسال اعلان یافت نشد")
	}

	now := time.Now()
	del.AttemptCount++
	del.Status = SendStatusQueued

	var result *SendResult
	var err error

	if del.Channel == ChannelSMS && s.smsProvider != nil {
		result, err = s.smsProvider.SendSMS(del.RecipientRaw, del.Body)
	} else if del.Channel == ChannelEmail && s.emailProvider != nil {
		result, err = s.emailProvider.SendEmail(del.RecipientRaw, del.Subject, del.Body)
	}

	if err == nil && result != nil && result.Status == SendStatusSent {
		del.Status = SendStatusSent
		del.ProviderMessageID = result.ProviderMessageID
		del.SentAt = &now
		del.LastError = ""
	} else {
		if err != nil {
			del.LastError = err.Error()
		} else if result != nil {
			del.LastError = result.ErrorMessage
		}

		if del.AttemptCount >= del.MaxAttempts {
			del.Status = SendStatusDeadLetter
		} else {
			del.Status = SendStatusFailed
		}
	}

	return del, nil
}

// ─── Stock Alerts Integration ────────────────────────────────────────────────

func (s *Service) SubscribeStockAlert(userID *uuid.UUID, phone string, email string, variantID uuid.UUID) (*StockAlertSubscription, error) {
	return s.stockAlertsStore.Subscribe(userID, phone, email, variantID)
}

func (s *Service) NotifyBackInStock(variantID uuid.UUID, productTitle string) int {
	subs := s.stockAlertsStore.GetPendingSubscriptionsForVariant(variantID)
	notifiedCount := 0

	for _, sub := range subs {
		data := map[string]string{
			"ProductTitle": productTitle,
		}

		sent := false
		if sub.Phone != "" {
			_, err := s.NotifyEvent("back_in_stock", sub.Phone, ChannelSMS, data, sub.UserID, nil)
			if err == nil {
				sent = true
			}
		}
		if sub.Email != "" && !sent {
			_, err := s.NotifyEvent("back_in_stock", sub.Email, ChannelEmail, data, sub.UserID, nil)
			if err == nil {
				sent = true
			}
		}

		if sent {
			s.stockAlertsStore.MarkNotified(sub.ID)
			notifiedCount++
		}
	}

	return notifiedCount
}

// ─── Preferences Integration ─────────────────────────────────────────────────

func (s *Service) GetPreferencesStore() *PreferencesStore {
	return s.prefStore
}

// ─── Admin Log & Metrics Queries ─────────────────────────────────────────────

func (s *Service) ListDeliveries(filter DeliveryFilter) DeliveryListResult {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}

	var matched []*NotificationDelivery

	// Reverse order (newest first)
	for i := len(s.deliveryOrder) - 1; i >= 0; i-- {
		id := s.deliveryOrder[i]
		del := s.deliveries[id]

		if filter.Channel != "" && del.Channel != filter.Channel {
			continue
		}
		if filter.Status != "" && del.Status != filter.Status {
			continue
		}

		matched = append(matched, del.SanitizeForJSON())
	}

	total := len(matched)
	start := (filter.Page - 1) * filter.PageSize
	if start >= total {
		return DeliveryListResult{Deliveries: []*NotificationDelivery{}, TotalCount: total, Page: filter.Page, PageSize: filter.PageSize}
	}
	end := start + filter.PageSize
	if end > total {
		end = total
	}

	return DeliveryListResult{
		Deliveries: matched[start:end],
		TotalCount: total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
	}
}

func (s *Service) GetQueueStatus() QueueStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var stats QueueStatus
	stats.TotalCount = len(s.deliveries)

	for _, del := range s.deliveries {
		switch del.Status {
		case SendStatusQueued:
			stats.PendingCount++
		case SendStatusSent:
			stats.SentCount++
		case SendStatusFailed:
			stats.FailedCount++
		case SendStatusDeadLetter:
			stats.DeadLetterCount++
		}
	}
	return stats
}

func (s *Service) ListTemplates() []*NotificationTemplate {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*NotificationTemplate, 0, len(s.templates))
	for _, t := range s.templates {
		list = append(list, t)
	}
	return list
}

func (s *Service) GetTemplate(code string) (*NotificationTemplate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tmpl, exists := s.templates[code]
	if !exists {
		return nil, ErrTemplateNotFound
	}
	return tmpl, nil
}

// ─── Iranian SMS Gateways & Bulk Dispatcher ─────────────────────────────────

func (s *Service) GetGatewayManager() *SMSGatewayManager {
	return s.gatewayManager
}

func (s *Service) SendManualSMS(recipient string, message string, orderID *uuid.UUID) (*NotificationDelivery, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	driver := s.gatewayManager.GetActiveDriver()
	result, err := driver.SendSMS(recipient, message, "", nil)

	deliveryID := uuid.New()
	now := time.Now()
	del := &NotificationDelivery{
		ID:              deliveryID,
		EventID:         orderID,
		EventCode:       "manual_sms",
		RecipientMasked: MaskPhone(recipient),
		RecipientRaw:    recipient,
		Channel:         ChannelSMS,
		Provider:        driver.GetID(),
		Status:          SendStatusSent,
		Subject:         "پیامک دستی سفارش",
		Body:            message,
		AttemptCount:    1,
		MaxAttempts:     1,
		CreatedAt:       now,
		SentAt:          &now,
	}

	if err != nil || (result != nil && result.Status == SendStatusFailed) {
		del.Status = SendStatusFailed
		if err != nil {
			del.LastError = err.Error()
		} else if result != nil {
			del.LastError = result.ErrorMessage
		}
	} else if result != nil {
		del.ProviderMessageID = result.ProviderMessageID
	}

	s.deliveries[deliveryID] = del
	s.deliveryOrder = append(s.deliveryOrder, deliveryID)

	return del, err
}

func (s *Service) SendBulkSMS(mobiles []string, message string) (int, int, error) {
	driver := s.gatewayManager.GetActiveDriver()
	successCount := 0
	failCount := 0

	for _, mob := range mobiles {
		_, err := driver.SendSMS(mob, message, "", nil)
		if err == nil {
			successCount++
		} else {
			failCount++
		}
	}

	return successCount, failCount, nil
}

func (s *Service) maskRecipient(recipient string, channel Channel) string {
	if channel == ChannelSMS {
		return MaskPhone(recipient)
	}
	return MaskEmail(recipient)
}

func (s *Service) providerName(channel Channel) string {
	if channel == ChannelSMS {
		return s.gatewayManager.ActiveGateway
	}
	return "fake_email_mailpit"
}

func (s *Service) GetUserPreferences(userID uuid.UUID) []NotificationPreference {
	return s.prefStore.GetUserPreferences(userID)
}

func (s *Service) SetUserPreference(userID uuid.UUID, channel Channel, category EventCategory, enabled bool) {
	s.prefStore.SetPreference(userID, channel, category, enabled)
}

// ─── Order Lifecycle Notifications ──────────────────────────────────────────

// NotifyOrderPlaced sends order placement SMS to customer and administrative alerts to admins.
func (s *Service) NotifyOrderPlaced(orderNumber string, totalIRR int64, recipientPhone string, recipientName string, orderStatus string) (*NotificationDelivery, error) {
	totalToman := totalIRR / 10
	totalTomanFormatted := formatNumber(totalToman)

	data := map[string]string{
		"first_name":    recipientName,
		"last_name":     "",
		"order_id":      orderNumber,
		"OrderNumber":   orderNumber,
		"order_total":   totalTomanFormatted,
		"TotalToman":    totalTomanFormatted,
		"order_status":  orderStatus,
		"tracking_code": "—",
		"tracking_url":  fmt.Sprintf("https://moringano.ir/tracking/%s", orderNumber),
	}

	// 1. Send to Buyer
	var delivery *NotificationDelivery
	var buyerErr error

	if recipientPhone != "" {
		delivery, buyerErr = s.NotifyEvent("order_placed", recipientPhone, ChannelSMS, data, nil, nil)
	}

	// 2. Send to Admins if enabled in gateway manager
	if s.gatewayManager != nil && s.gatewayManager.EnableSMS {
		for _, adminPhone := range s.gatewayManager.AdminNumbers {
			if adminPhone != "" && adminPhone != "09120000000" && adminPhone != recipientPhone {
				_, _ = s.NotifyEvent("order_placed", adminPhone, ChannelSMS, data, nil, nil)
			}
		}
	}

	return delivery, buyerErr
}

// NotifyPaymentPaid sends payment confirmation SMS to customer and admins.
func (s *Service) NotifyPaymentPaid(orderNumber string, totalIRR int64, recipientPhone string, recipientName string) (*NotificationDelivery, error) {
	totalToman := totalIRR / 10
	totalTomanFormatted := formatNumber(totalToman)

	data := map[string]string{
		"first_name":    recipientName,
		"last_name":     "",
		"order_id":      orderNumber,
		"OrderNumber":   orderNumber,
		"order_total":   totalTomanFormatted,
		"TotalToman":    totalTomanFormatted,
		"AmountToman":   totalTomanFormatted,
		"order_status":  "پرداخت شده",
		"tracking_code": "—",
		"tracking_url":  fmt.Sprintf("https://moringano.ir/tracking/%s", orderNumber),
	}

	var delivery *NotificationDelivery
	var buyerErr error

	if recipientPhone != "" {
		delivery, buyerErr = s.NotifyEvent("payment_paid", recipientPhone, ChannelSMS, data, nil, nil)
	}

	if s.gatewayManager != nil && s.gatewayManager.EnableSMS {
		for _, adminPhone := range s.gatewayManager.AdminNumbers {
			if adminPhone != "" && adminPhone != "09120000000" && adminPhone != recipientPhone {
				_, _ = s.NotifyEvent("payment_paid", adminPhone, ChannelSMS, data, nil, nil)
			}
		}
	}

	return delivery, buyerErr
}

// NotifyOrderStatusChanged sends order status change SMS (such as shipping, cancellation, etc.).
func (s *Service) NotifyOrderStatusChanged(orderNumber string, oldStatus, newStatus string, trackingCode string, recipientPhone string, recipientName string) (*NotificationDelivery, error) {
	data := map[string]string{
		"first_name":    recipientName,
		"last_name":     "",
		"order_id":      orderNumber,
		"OrderNumber":   orderNumber,
		"order_status":  newStatus,
		"tracking_code": trackingCode,
		"TrackingCode":  trackingCode,
		"tracking_url":  fmt.Sprintf("https://moringano.ir/tracking/%s", orderNumber),
	}

	var delivery *NotificationDelivery
	var buyerErr error

	if recipientPhone != "" {
		eventCode := "order_" + newStatus
		if newStatus == "shipped" {
			eventCode = "order_shipped"
		} else if newStatus == "delivered" {
			eventCode = "order_delivered"
		} else if newStatus == "cancelled" {
			eventCode = "order_cancelled"
		}

		if _, exists := s.templates[eventCode]; exists {
			delivery, buyerErr = s.NotifyEvent(eventCode, recipientPhone, ChannelSMS, data, nil, nil)
		}
	}

	return delivery, buyerErr
}

func (s *Service) recordDelivery(orderNum string, eventCode string, recipient string, channel Channel, res *SendResult, data map[string]string) *NotificationDelivery {
	s.mu.Lock()
	defer s.mu.Unlock()

	deliveryID := uuid.New()
	now := time.Now()

	del := &NotificationDelivery{
		ID:              deliveryID,
		EventCode:       eventCode,
		RecipientMasked: s.maskRecipient(recipient, channel),
		RecipientRaw:    recipient,
		Channel:         channel,
		Provider:        s.providerName(channel),
		Status:          SendStatusSent,
		AttemptCount:    1,
		MaxAttempts:     5,
		CreatedAt:       now,
		SentAt:          &now,
	}

	if res != nil {
		del.ProviderMessageID = res.ProviderMessageID
		if res.Status == SendStatusFailed {
			del.Status = SendStatusFailed
			del.LastError = res.ErrorMessage
		}
	}

	s.deliveries[deliveryID] = del
	s.deliveryOrder = append(s.deliveryOrder, deliveryID)
	return del
}
