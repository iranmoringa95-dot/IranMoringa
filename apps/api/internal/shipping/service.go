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

func (s *Service) CalculateShippingFee(province string, weightGrams int) int64 {
	baseFee := int64(300000) // 30,000 Toman base fee
	if strings.Contains(province, "تهران") {
		return baseFee
	}
	if weightGrams > 1000 {
		return baseFee + int64((weightGrams-1000)/500)*50000
	}
	return baseFee + int64(100000) // 40,000 Toman for other provinces
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
