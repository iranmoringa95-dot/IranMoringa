package support

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

var (
	ErrSpamDetected    = errors.New("شناسایی فعالیت ربات (Spam detected)")
	ErrInquiryNotFound = errors.New("تیکت پشتیبانی یافت نشد")
	ErrChannelNotFound = errors.New("کانال پشتیبانی یافت نشد")
)

type SubmitInquiryRequest struct {
	UserID       *uuid.UUID `json:"user_id,omitempty"`
	CustomerName string     `json:"customer_name"`
	ContactInfo  string     `json:"contact_info"`
	Subject      string     `json:"subject"`
	Body         string     `json:"body"`
	OrderNumber  string     `json:"order_number,omitempty"`
	Priority     string     `json:"priority,omitempty"`
	Honeypot     string     `json:"honeypot,omitempty"` // Honeypot field (must be empty)
}

type Service struct {
	mu        sync.RWMutex
	channels  map[uuid.UUID]*SupportChannel
	inquiries map[uuid.UUID]*SupportInquiry
	byTicket  map[string]*SupportInquiry
	seq       int
	ordersSvc *orders.Service
}

func NewService(ordersSvc *orders.Service) *Service {
	svc := &Service{
		channels:  make(map[uuid.UUID]*SupportChannel),
		inquiries: make(map[uuid.UUID]*SupportInquiry),
		byTicket:  make(map[string]*SupportInquiry),
		seq:       100,
		ordersSvc: ordersSvc,
	}

	// Seed Channels
	c1 := uuid.New()
	svc.channels[c1] = &SupportChannel{
		ID:              c1,
		Type:            "whatsapp",
		LabelFA:         "پشتیبانی واتساپ",
		HandleOrURL:     "https://wa.me/989123456789",
		PrefillTemplate: "سلام، درباره سفارش/محصول سوال دارم.",
		AvailabilityInfo: "شنبه تا چهارشنبه ۹ الی ۱۷",
		IsActive:        true,
	}

	c2 := uuid.New()
	svc.channels[c2] = &SupportChannel{
		ID:              c2,
		Type:            "telegram",
		LabelFA:         "کانال تلگرام سبزینه",
		HandleOrURL:     "https://t.me/moringalab_support",
		AvailabilityInfo: "پاسخگویی سریع آنلاین",
		IsActive:        true,
	}

	c3 := uuid.New()
	svc.channels[c3] = &SupportChannel{
		ID:              c3,
		Type:            "phone",
		LabelFA:         "تماس تلفنی",
		HandleOrURL:     "02188888888",
		AvailabilityInfo: "ساعات کاری ۹ الی ۱۷",
		IsActive:        true,
	}

	// Seed Inquiry Ticket
	tID := uuid.New()
	ticketNum := "TCK-20260807-00101"
	svc.inquiries[tID] = &SupportInquiry{
		ID:                 tID,
		TicketNumber:       ticketNum,
		CustomerName:       "علی رضایی",
		ContactInfo:        "09121111111",
		Subject:            "پیگیری زمان ارسال سفارش",
		Body:               "سلام، سفارش من ثبت شده میخواستم زمان ارسال پستی رو بپرسم.",
		OrderNumber:        "MOR-20260807-00001",
		OrderOwnerVerified: true,
		Status:             StatusOpen,
		Priority:           PriorityNormal,
		CreatedAt:          time.Now().Add(-2 * time.Hour),
		UpdatedAt:          time.Now().Add(-2 * time.Hour),
	}
	svc.byTicket[ticketNum] = svc.inquiries[tID]

	return svc
}

// ─── Business Hours Engine (Asia/Tehran) ──────────────────────────────────────

func (s *Service) IsCurrentlyOpen(t time.Time) bool {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.Local
	}

	tTehran := t.In(loc)
	weekday := tTehran.Weekday() // 0 = Sunday, 5 = Friday, 6 = Saturday

	// Friday is closed
	if weekday == time.Friday {
		return false
	}

	hour := tTehran.Hour()
	// Saturday to Wednesday: 09:00 to 17:00
	if hour >= 9 && hour < 17 {
		return true
	}

	return false
}

// ─── Anti-Spam & Sanitizer ───────────────────────────────────────────────────

var htmlRegex = regexp.MustCompile(`(?i)<[^>]*>`)

func sanitizeText(text string) string {
	cleaned := htmlRegex.ReplaceAllString(text, "")
	return strings.TrimSpace(cleaned)
}

// ─── Ticket Sequence Generator ───────────────────────────────────────────────

func (s *Service) generateTicketNumberUnlocked() string {
	s.seq++
	nowStr := time.Now().Format("20060102")
	return fmt.Sprintf("TCK-%s-%05d", nowStr, s.seq)
}

// ─── Support Inquiries API ───────────────────────────────────────────────────

func (s *Service) CreateInquiry(req SubmitInquiryRequest) (*SupportInquiry, error) {
	// Honeypot check: If filled, reject as spam
	if req.Honeypot != "" {
		return nil, ErrSpamDetected
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	ticketNum := s.generateTicketNumberUnlocked()

	// Verify Order Ownership
	isOrderVerified := false
	if req.OrderNumber != "" && s.ordersSvc != nil {
		ord, err := s.ordersSvc.GetOrderByNumber(req.OrderNumber)
		if err == nil && ord != nil {
			if req.UserID != nil && ord.CustomerID != nil && *req.UserID == *ord.CustomerID {
				isOrderVerified = true
			}
		}
	}

	prio := PriorityNormal
	if req.Priority == "high" {
		prio = PriorityHigh
	} else if req.Priority == "urgent" {
		prio = PriorityUrgent
	}

	now := time.Now()
	inquiry := &SupportInquiry{
		ID:                 uuid.New(),
		TicketNumber:       ticketNum,
		UserID:             req.UserID,
		CustomerName:       sanitizeText(req.CustomerName),
		ContactInfo:        sanitizeText(req.ContactInfo),
		Subject:            sanitizeText(req.Subject),
		Body:               sanitizeText(req.Body),
		OrderNumber:        sanitizeText(req.OrderNumber),
		OrderOwnerVerified: isOrderVerified,
		Status:             StatusOpen,
		Priority:           prio,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	s.inquiries[inquiry.ID] = inquiry
	s.byTicket[ticketNum] = inquiry

	return inquiry, nil
}

func (s *Service) GetInquiryByTicketNumber(ticketNum string) (*SupportInquiry, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	inq, exists := s.byTicket[ticketNum]
	if !exists {
		return nil, ErrInquiryNotFound
	}
	return inq, nil
}

func (s *Service) ListChannels() ([]*SupportChannel, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []*SupportChannel
	for _, c := range s.channels {
		if c.IsActive {
			list = append(list, c)
		}
	}

	isOpen := s.IsCurrentlyOpen(time.Now())
	return list, isOpen
}

func (s *Service) GenerateWhatsAppURL(channelID uuid.UUID, customMsg string) (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ch, exists := s.channels[channelID]
	if !exists || ch.Type != "whatsapp" {
		return "", ErrChannelNotFound
	}

	msg := ch.PrefillTemplate
	if customMsg != "" {
		msg = customMsg
	}

	encodedMsg := url.QueryEscape(msg)
	return fmt.Sprintf("%s?text=%s", ch.HandleOrURL, encodedMsg), nil
}

// ─── Admin Support Management ────────────────────────────────────────────────

func (s *Service) AdminListInquiries(statusFilter string) []*SupportInquiry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []*SupportInquiry
	for _, inq := range s.inquiries {
		if statusFilter == "" || string(inq.Status) == statusFilter {
			list = append(list, inq)
		}
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].CreatedAt.After(list[j].CreatedAt)
	})
	return list
}

func (s *Service) AdminUpdateInquiry(id uuid.UUID, status InquiryStatus, assignedTo string, adminNotes string) (*SupportInquiry, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	inq, exists := s.inquiries[id]
	if !exists {
		return nil, ErrInquiryNotFound
	}

	inq.Status = status
	if assignedTo != "" {
		inq.AssignedTo = &assignedTo
	}
	if adminNotes != "" {
		inq.AdminNotes = sanitizeText(adminNotes)
	}

	inq.UpdatedAt = time.Now()
	return inq, nil
}
