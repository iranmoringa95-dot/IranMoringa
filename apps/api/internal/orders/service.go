package orders

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
)

// ─── Errors ──────────────────────────────────────────────────────────────────

var (
	ErrOrderNotFound        = errors.New("سفارش یافت نشد")
	ErrInvalidStateChange   = errors.New("تغییر وضعیت سفارش نامعتبر است")
	ErrConflict             = errors.New("کلید Idempotency تکراری با داده‌های متفاوت ارسال شده است")
	ErrTrackingCodeRequired = errors.New("ثبت کد رهگیری پستی برای تغییر وضعیت به 'ارسال شده' الزامی است")
	ErrCancelNotAllowed     = errors.New("لغو سفارش در این وضعیت امکان‌پذیر نیست")
	ErrAccessDenied         = errors.New("دسترسی به این سفارش مجاز نیست")
)

// ─── Transition Request ──────────────────────────────────────────────────────

type TransitionRequest struct {
	OrderID      uuid.UUID
	NewStatus    OrderStatus
	ActorType    ActorType
	ActorID      string
	TrackingCode string // required when transitioning to shipped
	Note         string // optional admin note
}

// ─── List Filters ────────────────────────────────────────────────────────────

type ListFilter struct {
	Status      OrderStatus // empty = all
	SearchQuery string      // search by order number
	Page        int
	PageSize    int
}

type ListResult struct {
	Orders     []*Order `json:"orders"`
	TotalCount int      `json:"total_count"`
	Page       int      `json:"page"`
	PageSize   int      `json:"page_size"`
}

// ─── Service ─────────────────────────────────────────────────────────────────

type Service struct {
	mu          sync.RWMutex
	orders      map[uuid.UUID]*Order
	byNum       map[string]*Order
	idempotency map[string]*Order
	timeline    map[uuid.UUID][]OrderTimelineEvent
	counter     uint64
}

func NewService() *Service {
	return &Service{
		orders:      make(map[uuid.UUID]*Order),
		byNum:       make(map[string]*Order),
		idempotency: make(map[string]*Order),
		timeline:    make(map[uuid.UUID][]OrderTimelineEvent),
	}
}

// ─── Order Number Generation ─────────────────────────────────────────────────

// GenerateOrderNumber creates order numbers in MOR-YYYYMMDD-XXXXX format
// using Jalali (Solar Hijri) date components.
func (s *Service) GenerateOrderNumber() string {
	seq := atomic.AddUint64(&s.counter, 1)
	now := time.Now()

	// Simple Jalali conversion for current date
	jy, jm, jd := gregorianToJalali(now.Year(), int(now.Month()), now.Day())
	return fmt.Sprintf("MOR-%04d%02d%02d-%05d", jy, jm, jd, seq)
}

// gregorianToJalali converts a Gregorian date to a Jalali (Solar Hijri) date.
func gregorianToJalali(gy, gm, gd int) (int, int, int) {
	gDaysInMonth := []int{0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334}
	gy2 := gy + 1 // for leap calculations when gm > 2
	if gm > 2 {
		gy2 = gy
	}

	days := 355666 + (365 * gy) + ((gy2 + 3) / 4) - ((gy2 + 99) / 100) + ((gy2 + 399) / 400) + gd + gDaysInMonth[gm-1]
	jy := -1595 + (33 * ((days - 1) / 12053))
	days = (days - 1) % 12053

	jy += 4 * (days / 1461)
	days %= 1461

	if days > 365 {
		jy += (days - 1) / 365
		days = (days - 1) % 365
	}

	jm := 0
	if days < 186 {
		jm = 1 + (days / 31)
		jd := 1 + (days % 31)
		return jy, jm, jd
	}
	days -= 186
	jm = 7 + (days / 30)
	jd := 1 + (days % 30)
	return jy, jm, jd
}

// ─── Create Order ────────────────────────────────────────────────────────────

func (s *Service) CreateOrder(req *Order) (*Order, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if req.IdempotencyKey != "" {
		if existing, exists := s.idempotency[req.IdempotencyKey]; exists {
			return existing, nil
		}
	}

	now := time.Now()
	req.ID = uuid.New()
	req.OrderNumber = s.GenerateOrderNumber()
	if req.Status == "" {
		req.Status = StatusPendingPayment
	}
	req.CreatedAt = now
	req.UpdatedAt = now

	s.orders[req.ID] = req
	s.byNum[req.OrderNumber] = req

	if req.IdempotencyKey != "" {
		s.idempotency[req.IdempotencyKey] = req
	}

	// Record initial timeline event
	s.addTimelineEvent(req.ID, OrderTimelineEvent{
		ID:        uuid.New(),
		OrderID:   req.ID,
		EventType: "order_created",
		NewStatus: req.Status,
		ActorType: ActorSystem,
		Note:      "سفارش ایجاد شد",
		CreatedAt: now,
	})

	return req, nil
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

func (s *Service) GetOrderByNumber(orderNumber string) (*Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ord, exists := s.byNum[orderNumber]
	if !exists {
		return nil, ErrOrderNotFound
	}
	return ord, nil
}

func (s *Service) GetOrderByID(id uuid.UUID) (*Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ord, exists := s.orders[id]
	if !exists {
		return nil, ErrOrderNotFound
	}
	return ord, nil
}

// GetOrderByTrackingCode looks up an order by its tracking code.
func (s *Service) GetOrderByTrackingCode(trackingCode string) (*Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, ord := range s.orders {
		if ord.TrackingCode != "" && ord.TrackingCode == trackingCode {
			return ord, nil
		}
	}
	return nil, ErrOrderNotFound
}

// ─── List Orders (Admin) ────────────────────────────────────────────────────

func (s *Service) ListOrders(filter ListFilter) ListResult {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}

	var matched []*Order
	for _, ord := range s.orders {
		if filter.Status != "" && ord.Status != filter.Status {
			continue
		}
		if filter.SearchQuery != "" && !strings.Contains(ord.OrderNumber, filter.SearchQuery) {
			continue
		}
		matched = append(matched, ord)
	}

	total := len(matched)

	// Simple pagination
	start := (filter.Page - 1) * filter.PageSize
	if start >= total {
		return ListResult{Orders: []*Order{}, TotalCount: total, Page: filter.Page, PageSize: filter.PageSize}
	}
	end := start + filter.PageSize
	if end > total {
		end = total
	}

	return ListResult{
		Orders:     matched[start:end],
		TotalCount: total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
	}
}

// GetAllOrders returns all orders in memory
func (s *Service) GetAllOrders() []*Order {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*Order
	for _, ord := range s.orders {
		result = append(result, ord)
	}
	return result
}

// ─── List Orders by Customer (IDOR-safe) ─────────────────────────────────────

func (s *Service) ListOrdersByCustomer(customerID uuid.UUID) []*Order {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*Order
	for _, ord := range s.orders {
		if ord.CustomerID != nil && *ord.CustomerID == customerID {
			result = append(result, ord)
		}
	}
	return result
}

// GetCustomerOrder retrieves an order by number, but only if it belongs to the given customer.
func (s *Service) GetCustomerOrder(orderNumber string, customerID uuid.UUID) (*Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ord, exists := s.byNum[orderNumber]
	if !exists {
		return nil, ErrOrderNotFound
	}
	if ord.CustomerID == nil || *ord.CustomerID != customerID {
		return nil, ErrAccessDenied
	}
	return ord, nil
}

// ─── Transition Status ───────────────────────────────────────────────────────

func (s *Service) TransitionStatus(req TransitionRequest) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	ord, exists := s.orders[req.OrderID]
	if !exists {
		return ErrOrderNotFound
	}

	// Validate state machine
	if !isValidTransition(ord.Status, req.NewStatus) {
		return ErrInvalidStateChange
	}

	// Tracking code is mandatory for shipped transition
	if req.NewStatus == StatusShipped && req.TrackingCode == "" {
		return ErrTrackingCodeRequired
	}

	oldStatus := ord.Status
	now := time.Now()

	// Apply status change
	ord.Status = req.NewStatus
	ord.UpdatedAt = now

	// Store tracking code when shipping
	if req.NewStatus == StatusShipped && req.TrackingCode != "" {
		ord.TrackingCode = req.TrackingCode
	}

	// Record timeline event
	s.addTimelineEvent(ord.ID, OrderTimelineEvent{
		ID:        uuid.New(),
		OrderID:   ord.ID,
		EventType: "status_change",
		OldStatus: oldStatus,
		NewStatus: req.NewStatus,
		ActorType: req.ActorType,
		ActorID:   req.ActorID,
		Note:      req.Note,
		CreatedAt: now,
	})

	return nil
}

// UpdateStatus is a simplified transition for backward compatibility.
func (s *Service) UpdateStatus(orderID uuid.UUID, newStatus OrderStatus) error {
	return s.TransitionStatus(TransitionRequest{
		OrderID:   orderID,
		NewStatus: newStatus,
		ActorType: ActorSystem,
	})
}

// ─── Cancel Order ────────────────────────────────────────────────────────────

// CancelOrder cancels an order. Customers may only cancel pending_payment orders.
// Admins may cancel pending_payment or paid orders.
func (s *Service) CancelOrder(orderID uuid.UUID, actorType ActorType, actorID string) error {
	s.mu.RLock()
	ord, exists := s.orders[orderID]
	if !exists {
		s.mu.RUnlock()
		return ErrOrderNotFound
	}
	currentStatus := ord.Status
	s.mu.RUnlock()

	// Customers can only cancel pending_payment
	if actorType == ActorCustomer && currentStatus != StatusPendingPayment {
		return ErrCancelNotAllowed
	}

	// Admins can cancel pending_payment or paid
	if actorType == ActorAdmin && currentStatus != StatusPendingPayment && currentStatus != StatusPaid {
		return ErrCancelNotAllowed
	}

	return s.TransitionStatus(TransitionRequest{
		OrderID:   orderID,
		NewStatus: StatusCancelled,
		ActorType: actorType,
		ActorID:   actorID,
		Note:      "سفارش لغو شد",
	})
}

// ─── Admin Notes ─────────────────────────────────────────────────────────────

func (s *Service) AddNote(orderID uuid.UUID, note string, actorID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	ord, exists := s.orders[orderID]
	if !exists {
		return ErrOrderNotFound
	}

	now := time.Now()

	// Append note to order
	if ord.Notes != "" {
		ord.Notes += "\n---\n"
	}
	ord.Notes += note
	ord.UpdatedAt = now

	// Record timeline event
	s.addTimelineEvent(orderID, OrderTimelineEvent{
		ID:        uuid.New(),
		OrderID:   orderID,
		EventType: "note_added",
		ActorType: ActorAdmin,
		ActorID:   actorID,
		Note:      note,
		CreatedAt: now,
	})

	return nil
}

// ─── Timeline ────────────────────────────────────────────────────────────────

func (s *Service) GetTimeline(orderID uuid.UUID) ([]OrderTimelineEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if _, exists := s.orders[orderID]; !exists {
		return nil, ErrOrderNotFound
	}

	events := s.timeline[orderID]
	if events == nil {
		return []OrderTimelineEvent{}, nil
	}
	return events, nil
}

func (s *Service) addTimelineEvent(orderID uuid.UUID, event OrderTimelineEvent) {
	s.timeline[orderID] = append(s.timeline[orderID], event)
}

// ─── State Machine ───────────────────────────────────────────────────────────

// isValidTransition defines the allowed transitions in the order state machine:
//
//	pending_payment → paid | cancelled
//	paid → processing | cancelled | refund_requested | refunded
//	processing → packed | cancelled
//	packed → shipped
//	shipped → delivered
//	cancelled → refunded
func isValidTransition(current, next OrderStatus) bool {
	if current == next {
		return true
	}
	switch current {
	case StatusPendingPayment:
		return next == StatusPaid || next == StatusCancelled
	case StatusPaid:
		return next == StatusProcessing || next == StatusCancelled || next == StatusRefundRequested || next == StatusRefunded
	case StatusProcessing:
		return next == StatusPacked || next == StatusCancelled
	case StatusPacked:
		return next == StatusShipped
	case StatusShipped:
		return next == StatusDelivered
	case StatusCancelled:
		return next == StatusRefunded
	}
	return false
}

func (s *Service) ListOrdersForAdmin(status, searchQuery string) []Order {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var res []Order
	for _, ord := range s.orders {
		if status != "" && string(ord.Status) != status {
			continue
		}
		if searchQuery != "" && !strings.Contains(ord.OrderNumber, searchQuery) {
			continue
		}
		res = append(res, *ord)
	}
	return res
}
