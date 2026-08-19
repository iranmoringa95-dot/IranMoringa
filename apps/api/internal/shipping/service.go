package shipping

import (
	"errors"
	"strings"

	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
)

var (
	ErrTrackingNotFound = errors.New("کد رهگیری یا شماره سفارش واردشده در سیستم یافت نشد")
)

type ShippingQuoteOption struct {
	Code        string `json:"code"`
	NameFA      string `json:"name_fa"`
	Carrier     string `json:"carrier"`
	FeeIRR      int64  `json:"fee_irr"`
	ETAMinDays  int    `json:"eta_min_days"`
	ETAMaxDays  int    `json:"eta_max_days"`
	IsFree      bool   `json:"is_free"`
	Description string `json:"description"`
}

type TrackingResult struct {
	OrderNumber  string             `json:"order_number"`
	Status       orders.OrderStatus `json:"status"`
	StatusTitle  string             `json:"status_title"`
	TrackingCode *string            `json:"tracking_code,omitempty"`
	Recipient    string             `json:"recipient"`
	City         string             `json:"city"`
	TotalToman   int64              `json:"total_toman"`
	Timeline     []TimelineStep     `json:"timeline"`
}

type TimelineStep struct {
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
	Current   bool   `json:"current"`
}

type Service struct {
	orderService   *orders.Service
	paymentService *payments.Service
}

func NewService(orderSvc *orders.Service, paySvc *payments.Service) *Service {
	return &Service{
		orderService:   orderSvc,
		paymentService: paySvc,
	}
}

const FreeShippingThresholdIRR = int64(15000000) // 1,500,000 Toman (15 Million IRR)

func (s *Service) CalculateQuotes(province, city string, subtotalIRR int64, totalWeightGrams int) []ShippingQuoteOption {
	options := make([]ShippingQuoteOption, 0)

	// 1. Post Pishtaz (Always Available)
	pishtazFee := int64(350000)
	if totalWeightGrams > 1000 {
		pishtazFee += int64((totalWeightGrams-1000)/500) * 50000
	}
	isPishtazFree := false
	if subtotalIRR >= FreeShippingThresholdIRR {
		pishtazFee = 0
		isPishtazFree = true
	}

	options = append(options, ShippingQuoteOption{
		Code:        "post_pishtaz",
		NameFA:      "پست پیشتاز",
		Carrier:     "post",
		FeeIRR:      pishtazFee,
		ETAMinDays:  2,
		ETAMaxDays:  4,
		IsFree:      isPishtazFree,
		Description: "تحویل درب منزل توسط شرکت پست جمهوری اسلامی ایران",
	})

	// 2. Tipax (Always Available)
	tipaxFee := int64(500000)
	if totalWeightGrams > 1000 {
		tipaxFee += int64((totalWeightGrams-1000)/500) * 80000
	}

	options = append(options, ShippingQuoteOption{
		Code:        "tipax",
		NameFA:      "سریع تیپاکس (پس‌کرایه / پیش‌کرایه)",
		Carrier:     "tipax",
		FeeIRR:      tipaxFee,
		ETAMinDays:  1,
		ETAMaxDays:  3,
		IsFree:      false,
		Description: "ارسال سریع با نمایندگی‌های اختصاصی تیپاکس",
	})

	// 3. Tehran Express Courier (Restricted exclusively to Tehran City)
	if strings.Contains(city, "تهران") || strings.Contains(province, "تهران") {
		options = append(options, ShippingQuoteOption{
			Code:        "courier_tehran",
			NameFA:      "پیک اکسپرس درون‌شهری (ویژه تهران)",
			Carrier:     "courier",
			FeeIRR:      450000,
			ETAMinDays:  1,
			ETAMaxDays:  1,
			IsFree:      false,
			Description: "تحویل فوری ظرف ۲۴ ساعت در مناطق ۲۲‌گانه تهران",
		})
	}

	return options
}

func (s *Service) CalculateShippingFee(province string, weightGrams int) int64 {
	baseFee := int64(350000)
	if strings.Contains(province, "تهران") {
		return baseFee
	}
	if weightGrams > 1000 {
		return baseFee + int64((weightGrams-1000)/500)*50000
	}
	return baseFee + int64(50000)
}

func (s *Service) LookupTracking(query string) (*TrackingResult, error) {
	q := strings.TrimSpace(query)
	ord, err := s.orderService.GetOrderByNumber(q)
	if err != nil {
		return nil, ErrTrackingNotFound
	}

	statusTitle := getPersianStatus(ord.Status)
	timeline := generateTimeline(ord.Status)

	return &TrackingResult{
		OrderNumber:  ord.OrderNumber,
		Status:       ord.Status,
		StatusTitle:  statusTitle,
		TrackingCode: nil,
		Recipient:    ord.Address.RecipientName,
		City:         ord.Address.City,
		TotalToman:   ord.TotalIRR / 10,
		Timeline:     timeline,
	}, nil
}

func getPersianStatus(status orders.OrderStatus) string {
	switch status {
	case orders.StatusPendingPayment:
		return "در انتظار پرداخت"
	case orders.StatusPaid:
		return "پرداخت شده"
	case orders.StatusProcessing:
		return "در حال پردازش در انبار"
	case orders.StatusPacked:
		return "بسته‌بندی شده"
	case orders.StatusShipped:
		return "تحویل به پست"
	case orders.StatusDelivered:
		return "تحویل داده شد"
	case orders.StatusCancelled:
		return "لغو شده"
	}
	return string(status)
}

func generateTimeline(status orders.OrderStatus) []TimelineStep {
	steps := []struct {
		key   orders.OrderStatus
		title string
	}{
		{orders.StatusPendingPayment, "ثبت سفارش"},
		{orders.StatusPaid, "پرداخت موفق"},
		{orders.StatusProcessing, "پردازش انبار"},
		{orders.StatusShipped, "تحویل به پست"},
		{orders.StatusDelivered, "تحویل به مشتری"},
	}

	result := make([]TimelineStep, len(steps))
	foundCurrent := false

	for i, st := range steps {
		if st.key == status {
			result[i] = TimelineStep{Title: st.title, Completed: true, Current: true}
			foundCurrent = true
		} else if !foundCurrent {
			result[i] = TimelineStep{Title: st.title, Completed: true, Current: false}
		} else {
			result[i] = TimelineStep{Title: st.title, Completed: false, Current: false}
		}
	}
	return result
}
