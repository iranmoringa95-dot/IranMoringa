package shipping

import (
	"context"
	"errors"
	"strings"

	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
)

var (
	ErrTrackingNotFound      = errors.New("کد رهگیری یا شماره سفارش واردشده در سیستم یافت نشد")
	ErrCourierOnlyInIsfahan = errors.New("ارسال با پیک موتوری فقط برای آدرس‌های داخل شهر اصفهان امکان‌پذیر است")
)

type Service struct {
	orderService   *orders.Service
	paymentService *payments.Service
	calculator     TariffProvider
}

func NewService(orderSvc *orders.Service, paySvc *payments.Service) *Service {
	return &Service{
		orderService:   orderSvc,
		paymentService: paySvc,
		calculator:     NewIranPostCalculator(),
	}
}

func (s *Service) GetTariffSettings() TariffSettings {
	return s.calculator.GetSettings()
}

func (s *Service) UpdateTariffSettings(settings TariffSettings) {
	s.calculator.UpdateSettings(settings)
}

func (s *Service) SyncTariffs(ctx context.Context) (*TariffSettings, error) {
	return s.calculator.SyncFromRemote(ctx)
}

func (s *Service) CalculateQuotes(province, city string, subtotalIRR int64, items []ShippingParcelItem) []ShippingQuoteOption {
	settings := s.calculator.GetSettings()
	actualWeight, volumetricWeight, chargedWeight, totalVolume := ComputeParcelMetrics(items)

	options := make([]ShippingQuoteOption, 0)

	// 1. Post Pishtaz (Available Nationwide for all cities across Iran)
	calculatedPostFee := s.calculator.CalculatePostFee(province, chargedWeight, totalVolume)
	isPishtazFree := false

	if settings.FreeShippingThresholdIRR > 0 && subtotalIRR >= settings.FreeShippingThresholdIRR {
		calculatedPostFee = 0
		isPishtazFree = true
	}

	etaMin := 2
	etaMax := 4
	if DetectProvinceZone(province) == ZoneIntraProvince {
		etaMin = 1
		etaMax = 2
	}

	options = append(options, ShippingQuoteOption{
		Code:               "post_pishtaz",
		NameFA:             "پست پیشتاز سراسری (شرکت ملی پست ایران)",
		Carrier:            "post",
		FeeIRR:             calculatedPostFee,
		ETAMinDays:         etaMin,
		ETAMaxDays:         etaMax,
		IsFree:             isPishtazFree,
		Description:        "ارسال سریع و مطمئن درب منزل با بارکد رهگیری ۲۴ رقمی رسمی",
		ChargedWeightGrams: chargedWeight,
		VolumetricWeightG:  volumetricWeight,
		ActualWeightGrams:  actualWeight,
	})

	// 2. Isfahan Express Courier (Exclusively available for Isfahan City)
	if IsCityIsfahan(city) {
		minHours := 2
		maxHours := 4
		options = append(options, ShippingQuoteOption{
			Code:               "courier_isfahan",
			NameFA:             "پیک موتوری فوری درون‌شهری (ویژه شهر اصفهان)",
			Carrier:            "courier",
			FeeIRR:             settings.CourierIsfahanFeeIRR,
			ETAMinDays:         0,
			ETAMaxDays:         1,
			EstimatedHoursMin:  &minHours,
			EstimatedHoursMax:  &maxHours,
			IsFree:             false,
			Description:        "تحویل فوری ۲ تا ۴ ساعته در تمامی مناطق ۱۵گانه شهر اصفهان",
			ChargedWeightGrams: chargedWeight,
			VolumetricWeightG:  volumetricWeight,
			ActualWeightGrams:  actualWeight,
		})
	}

	return options
}

func (s *Service) CalculateShippingFee(province, city, shippingMethod string, items []ShippingParcelItem) (int64, error) {
	quotes := s.CalculateQuotes(province, city, 0, items)
	for _, q := range quotes {
		if q.Code == shippingMethod {
			return q.FeeIRR, nil
		}
	}

	if shippingMethod == "courier_isfahan" && !IsCityIsfahan(city) {
		return 0, ErrCourierOnlyInIsfahan
	}

	// Fallback to post pishtaz if method not explicitly matched
	for _, q := range quotes {
		if q.Code == "post_pishtaz" {
			return q.FeeIRR, nil
		}
	}

	return 380000, nil
}

func (s *Service) LookupTracking(query string) (*TrackingResult, error) {
	q := strings.TrimSpace(query)
	ord, err := s.orderService.GetOrderByNumber(q)
	if err != nil {
		return nil, ErrTrackingNotFound
	}

	statusTitle := getPersianStatus(ord.Status)
	timeline := generateTimeline(ord.Status)

	carrierName := "شرکت ملی پست جمهوری اسلامی ایران"
	if ord.ShippingMethod == "courier_isfahan" {
		carrierName = "پیک موتوری درون‌شهری اصفهان"
	}

	var trackingCode *string
	if ord.TrackingCode != "" {
		trackingCode = &ord.TrackingCode
	}

	return &TrackingResult{
		OrderNumber:  ord.OrderNumber,
		Status:       ord.Status,
		StatusTitle:  statusTitle,
		TrackingCode: trackingCode,
		Carrier:      carrierName,
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
		return "تحویل به شرکت ارسال‌کننده"
	case orders.StatusDelivered:
		return "تحویل مشتری شد"
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
		{orders.StatusShipped, "تحویل به مامور ارسال"},
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
