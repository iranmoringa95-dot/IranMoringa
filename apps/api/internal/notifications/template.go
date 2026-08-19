package notifications

import (
	"bytes"
	"errors"
	"fmt"
	"text/template"
)

type Channel string

const (
	ChannelSMS   Channel = "sms"
	ChannelEmail Channel = "email"
)

type TemplateStatus string

const (
	TemplateActive TemplateStatus = "active"
	TemplateDraft  TemplateStatus = "draft"
)

type NotificationTemplate struct {
	Code      string         `json:"code"`
	Channel   Channel        `json:"channel"`
	Locale    string         `json:"locale"` // default "fa"
	Subject   string         `json:"subject,omitempty"`
	Body      string         `json:"body"`
	Variables []string       `json:"variables"`
	Status    TemplateStatus `json:"status"`
	Version   int            `json:"version"`
}

var (
	ErrTemplateNotFound = errors.New("قالب اعلان یافت نشد")
	ErrMissingVariable  = errors.New("متغیر الزامی در داده‌های ارسال پیامک یافت نشد")
)

// RenderTemplate renders the template body and subject with the provided variable map.
// It strictly validates that ALL variables defined in template.Variables exist in data.
func RenderTemplate(tmpl *NotificationTemplate, data map[string]string) (renderedSubject string, renderedBody string, err error) {
	if tmpl == nil {
		return "", "", ErrTemplateNotFound
	}

	// Validate missing variables
	for _, reqVar := range tmpl.Variables {
		val, ok := data[reqVar]
		if !ok || val == "" {
			return "", "", fmt.Errorf("%w: متغیر '%s' برای قالب '%s'", ErrMissingVariable, reqVar, tmpl.Code)
		}
	}

	// Render Subject (if any)
	if tmpl.Subject != "" {
		tSub, err := template.New("subject").Parse(tmpl.Subject)
		if err != nil {
			return "", "", fmt.Errorf("خطا در پردازش عنوان قالب: %w", err)
		}
		var bSub bytes.Buffer
		if err := tSub.Execute(&bSub, data); err != nil {
			return "", "", fmt.Errorf("خطا در اجرای عنوان قالب: %w", err)
		}
		renderedSubject = bSub.String()
	}

	// Render Body
	tBody, err := template.New("body").Parse(tmpl.Body)
	if err != nil {
		return "", "", fmt.Errorf("خطا در پردازش متن قالب: %w", err)
	}
	var bBody bytes.Buffer
	if err := tBody.Execute(&bBody, data); err != nil {
		return "", "", fmt.Errorf("خطا در اجرای متن قالب: %w", err)
	}
	renderedBody = bBody.String()

	return renderedSubject, renderedBody, nil
}

// GetSeedTemplates returns the initial Persian notification templates for system bootstrap.
func GetSeedTemplates() []NotificationTemplate {
	return []NotificationTemplate{
		{
			Code:      "otp_requested",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "کد تایید ورود به سبزینه: {{.Code}}\nمعتبر تا ۲ دقیقه.",
			Variables: []string{"Code"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "order_placed",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: سفارش {{.OrderNumber}} شما با موفقیت ثبت شد. مبلغ: {{.TotalToman}} تومان.",
			Variables: []string{"OrderNumber", "TotalToman"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "payment_paid",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: پرداخت سفارش {{.OrderNumber}} به مبلغ {{.AmountToman}} تومان تایید شد.",
			Variables: []string{"OrderNumber", "AmountToman"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "payment_failed",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: پرداخت سفارش {{.OrderNumber}} ناموفق بود. جهت تلاش مجدد به بخش سفارش‌های من مراجعه کنید.",
			Variables: []string{"OrderNumber"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "order_processing",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: سفارش {{.OrderNumber}} وارد مرحله پردازش انبار شد.",
			Variables: []string{"OrderNumber"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "order_shipped",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: سفارش {{.OrderNumber}} تحویل پست شد.\nکد رهگیری: {{.TrackingCode}}",
			Variables: []string{"OrderNumber", "TrackingCode"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "order_delivered",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: سفارش {{.OrderNumber}} با موفقیت تحویل داده شد. با تشکر از انتخاب سبزینه!",
			Variables: []string{"OrderNumber"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "order_cancelled",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: سفارش {{.OrderNumber}} لغو گردید.",
			Variables: []string{"OrderNumber"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "refund_completed",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: بازگشت وجه سفارش {{.OrderNumber}} به مبلغ {{.AmountToman}} تومان انجام شد.",
			Variables: []string{"OrderNumber", "AmountToman"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "back_in_stock",
			Channel:   ChannelSMS,
			Locale:    "fa",
			Body:      "سبزینه: محصول «{{.ProductTitle}}» مجدداً در فروشگاه موجود شد!",
			Variables: []string{"ProductTitle"},
			Status:    TemplateActive,
			Version:   1,
		},
		{
			Code:      "order_email_confirmation",
			Channel:   ChannelEmail,
			Locale:    "fa",
			Subject:   "تایید ثبت سفارش {{.OrderNumber}} - فروشگاه سبزینه",
			Body:      "مشتری گرامی،\nسفارش شما با شماره {{.OrderNumber}} و مبلغ {{.TotalToman}} تومان در سیستم ثبت شد.",
			Variables: []string{"OrderNumber", "TotalToman"},
			Status:    TemplateActive,
			Version:   1,
		},
	}
}
