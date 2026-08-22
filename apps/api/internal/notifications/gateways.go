package notifications

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ─── Iranian SMS Gateway Interface ──────────────────────────────────────────

type IranianSMSGateway interface {
	GetID() string
	GetNameFA() string
	SendSMS(to string, message string, patternCode string, patternData map[string]string) (*SendResult, error)
	GetBalance() (string, error)
}

// ─── FarazSMS / IPPanel Driver ──────────────────────────────────────────────

type FarazSMSGateway struct {
	Username string
	Password string
	Sender   string
	client   *http.Client
}

func NewFarazSMSGateway(username, password, sender string) *FarazSMSGateway {
	if sender == "" {
		sender = "+983000505"
	}
	return &FarazSMSGateway{
		Username: username,
		Password: password,
		Sender:   sender,
		client:   &http.Client{Timeout: 12 * time.Second},
	}
}

func (g *FarazSMSGateway) GetID() string     { return "farazsms" }
func (g *FarazSMSGateway) GetNameFA() string { return "فراز اس‌ام‌اس / آی‌پی‌پنل (FarazSMS / IPPanel)" }

func (g *FarazSMSGateway) SendSMS(to string, message string, patternCode string, patternData map[string]string) (*SendResult, error) {
	if g.Username == "" || g.Password == "" {
		return nil, errors.New("اطلاعات کاربری فراز اس‌ام‌اس تنظیم نشده است")
	}

	apiURL := "http://ippanel.com/api/select"
	var payload map[string]interface{}

	if patternCode != "" {
		payload = map[string]interface{}{
			"op":          "pattern",
			"user":        g.Username,
			"pass":        g.Password,
			"fromNum":     g.Sender,
			"toNum":       to,
			"patternCode": patternCode,
			"inputData":   patternData,
		}
	} else {
		payload = map[string]interface{}{
			"op":      "send",
			"user":    g.Username,
			"pass":    g.Password,
			"fromNum": g.Sender,
			"toNum":   []string{to},
			"message": message,
		}
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	resp, err := g.client.Post(apiURL, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	respStr := string(respBody)

	// Check if integer ID returned (success)
	if num, err := strconv.ParseInt(strings.TrimSpace(respStr), 10, 64); err == nil && num > 1000 {
		return &SendResult{
			ProviderMessageID: fmt.Sprintf("%d", num),
			Status:            SendStatusSent,
		}, nil
	}

	return &SendResult{
		ProviderMessageID: respStr,
		Status:            SendStatusSent,
	}, nil
}

func (g *FarazSMSGateway) GetBalance() (string, error) {
	if g.Username == "" || g.Password == "" {
		return "تنظیم نشده", nil
	}

	apiURL := "http://ippanel.com/api/select"
	payload := map[string]interface{}{
		"op":   "credit",
		"user": g.Username,
		"pass": g.Password,
	}

	bodyBytes, _ := json.Marshal(payload)
	resp, err := g.client.Post(apiURL, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "خطا در اتصال", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	creditStr := strings.TrimSpace(string(respBody))
	if val, err := strconv.ParseFloat(creditStr, 64); err == nil {
		return fmt.Sprintf("%s ریال", formatNumber(int64(val))), nil
	}

	return creditStr, nil
}

// ─── Kavenegar Driver ───────────────────────────────────────────────────────

type KavenegarGateway struct {
	APIKey string
	Sender string
	client *http.Client
}

func NewKavenegarGateway(apiKey, sender string) *KavenegarGateway {
	return &KavenegarGateway{
		APIKey: apiKey,
		Sender: sender,
		client: &http.Client{Timeout: 12 * time.Second},
	}
}

func (g *KavenegarGateway) GetID() string     { return "kavenegar" }
func (g *KavenegarGateway) GetNameFA() string { return "کاوه‌نگار (Kavenegar Verify / Lookup)" }

func (g *KavenegarGateway) SendSMS(to string, message string, patternCode string, patternData map[string]string) (*SendResult, error) {
	if g.APIKey == "" {
		return nil, errors.New("کلید API کاوه‌نگار تنظیم نشده است")
	}

	if patternCode != "" {
		endpoint := fmt.Sprintf("https://api.kavenegar.com/v1/%s/verify/lookup.json", g.APIKey)
		formData := url.Values{}
		formData.Set("receptor", to)
		formData.Set("template", patternCode)

		i := 1
		for _, v := range patternData {
			formData.Set(fmt.Sprintf("token%d", i), strings.ReplaceAll(v, " ", "_"))
			i++
			if i > 3 {
				break
			}
		}

		resp, err := g.client.PostForm(endpoint, formData)
		if err != nil {
			return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
		}
		defer resp.Body.Close()

		return &SendResult{Status: SendStatusSent, ProviderMessageID: "kavenegar-pattern"}, nil
	}

	endpoint := fmt.Sprintf("https://api.kavenegar.com/v1/%s/sms/send.json", g.APIKey)
	formData := url.Values{}
	formData.Set("receptor", to)
	formData.Set("message", message)
	if g.Sender != "" {
		formData.Set("sender", g.Sender)
	}

	resp, err := g.client.PostForm(endpoint, formData)
	if err != nil {
		return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
	}
	defer resp.Body.Close()

	return &SendResult{Status: SendStatusSent, ProviderMessageID: "kavenegar-sms"}, nil
}

func (g *KavenegarGateway) GetBalance() (string, error) {
	if g.APIKey == "" {
		return "تنظیم نشده", nil
	}

	endpoint := fmt.Sprintf("https://api.kavenegar.com/v1/%s/account/info.json", g.APIKey)
	resp, err := g.client.Get(endpoint)
	if err != nil {
		return "خطا در استعلام", err
	}
	defer resp.Body.Close()

	var result struct {
		Entries struct {
			RemainCredit int64 `json:"remaincredit"`
		} `json:"entries"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err == nil && result.Entries.RemainCredit > 0 {
		return fmt.Sprintf("%s ریال", formatNumber(result.Entries.RemainCredit)), nil
	}

	return "فعال", nil
}

// ─── Melipayamak Driver ─────────────────────────────────────────────────────

type MelipayamakGateway struct {
	Username string
	Password string
	Sender   string
	client   *http.Client
}

func NewMelipayamakGateway(username, password, sender string) *MelipayamakGateway {
	return &MelipayamakGateway{
		Username: username,
		Password: password,
		Sender:   sender,
		client:   &http.Client{Timeout: 12 * time.Second},
	}
}

func (g *MelipayamakGateway) GetID() string     { return "melipayamak" }
func (g *MelipayamakGateway) GetNameFA() string { return "ملی‌پیامک (Melipayamak BaseNumber)" }

func (g *MelipayamakGateway) SendSMS(to string, message string, patternCode string, patternData map[string]string) (*SendResult, error) {
	if g.Username == "" || g.Password == "" {
		return nil, errors.New("اطلاعات کاربری ملی‌پیامک تنظیم نشده است")
	}

	if patternCode != "" {
		endpoint := "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber"
		var vals []string
		for _, v := range patternData {
			vals = append(vals, v)
		}

		bodyID, _ := strconv.ParseInt(patternCode, 10, 64)
		payload := map[string]interface{}{
			"username": g.Username,
			"password": g.Password,
			"text":     strings.Join(vals, ";"),
			"to":       to,
			"bodyId":   bodyID,
		}

		bodyBytes, _ := json.Marshal(payload)
		resp, err := g.client.Post(endpoint, "application/json", bytes.NewBuffer(bodyBytes))
		if err != nil {
			return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
		}
		defer resp.Body.Close()

		return &SendResult{Status: SendStatusSent, ProviderMessageID: "melipayamak-pattern"}, nil
	}

	endpoint := "https://rest.payamak-panel.com/api/SendSMS/SendSMS"
	payload := map[string]interface{}{
		"username": g.Username,
		"password": g.Password,
		"to":       to,
		"from":     g.Sender,
		"text":     message,
		"isFlash":  false,
	}

	bodyBytes, _ := json.Marshal(payload)
	resp, err := g.client.Post(endpoint, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
	}
	defer resp.Body.Close()

	return &SendResult{Status: SendStatusSent, ProviderMessageID: "melipayamak-sms"}, nil
}

func (g *MelipayamakGateway) GetBalance() (string, error) {
	if g.Username == "" || g.Password == "" {
		return "تنظیم نشده", nil
	}

	endpoint := "https://rest.payamak-panel.com/api/SendSMS/GetCredit"
	payload := map[string]interface{}{
		"username": g.Username,
		"password": g.Password,
	}

	bodyBytes, _ := json.Marshal(payload)
	resp, err := g.client.Post(endpoint, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "خطا در استعلام", err
	}
	defer resp.Body.Close()

	var result struct {
		Value float64 `json:"Value"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
		return fmt.Sprintf("%s ریال", formatNumber(int64(result.Value))), nil
	}

	return "فعال", nil
}

// ─── SMS.ir Driver ──────────────────────────────────────────────────────────

type SMSIRGateway struct {
	APIKey string
	Sender string
	client *http.Client
}

func NewSMSIRGateway(apiKey, sender string) *SMSIRGateway {
	return &SMSIRGateway{
		APIKey: apiKey,
		Sender: sender,
		client: &http.Client{Timeout: 12 * time.Second},
	}
}

func (g *SMSIRGateway) GetID() string     { return "smsir" }
func (g *SMSIRGateway) GetNameFA() string { return "اس‌ام‌اس دات آی‌آر (SMS.ir Fast Verify)" }

func (g *SMSIRGateway) SendSMS(to string, message string, patternCode string, patternData map[string]string) (*SendResult, error) {
	if g.APIKey == "" {
		return nil, errors.New("کلید API سامانه SMS.ir تنظیم نشده است")
	}

	if patternCode != "" {
		endpoint := "https://api.sms.ir/v1/send/verify"
		templateID, _ := strconv.Atoi(patternCode)

		var params []map[string]string
		for k, v := range patternData {
			params = append(params, map[string]string{
				"name":  k,
				"value": v,
			})
		}

		payload := map[string]interface{}{
			"mobile":     to,
			"templateId": templateID,
			"parameters": params,
		}

		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("x-api-key", g.APIKey)

		resp, err := g.client.Do(req)
		if err != nil {
			return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
		}
		defer resp.Body.Close()

		return &SendResult{Status: SendStatusSent, ProviderMessageID: "smsir-verify"}, nil
	}

	endpoint := "https://api.sms.ir/v1/send/bulk"
	payload := map[string]interface{}{
		"lineNumber":  g.Sender,
		"messageText": message,
		"mobiles":     []string{to},
	}

	bodyBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", g.APIKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
	}
	defer resp.Body.Close()

	return &SendResult{Status: SendStatusSent, ProviderMessageID: "smsir-bulk"}, nil
}

func (g *SMSIRGateway) GetBalance() (string, error) {
	if g.APIKey == "" {
		return "تنظیم نشده", nil
	}

	endpoint := "https://api.sms.ir/v1/credit"
	req, _ := http.NewRequest("GET", endpoint, nil)
	req.Header.Set("x-api-key", g.APIKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return "خطا در استعلام", err
	}
	defer resp.Body.Close()

	var result struct {
		Data float64 `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
		return fmt.Sprintf("%s پیامک/ریال", formatNumber(int64(result.Data))), nil
	}

	return "فعال", nil
}

// ─── Ghasedak Driver ────────────────────────────────────────────────────────

type GhasedakGateway struct {
	APIKey string
	Sender string
	client *http.Client
}

func NewGhasedakGateway(apiKey, sender string) *GhasedakGateway {
	return &GhasedakGateway{
		APIKey: apiKey,
		Sender: sender,
		client: &http.Client{Timeout: 12 * time.Second},
	}
}

func (g *GhasedakGateway) GetID() string     { return "ghasedak" }
func (g *GhasedakGateway) GetNameFA() string { return "قاصدک (Ghasedak OTP / Send)" }

func (g *GhasedakGateway) SendSMS(to string, message string, patternCode string, patternData map[string]string) (*SendResult, error) {
	if g.APIKey == "" {
		return nil, errors.New("کلید API قاصدک تنظیم نشده است")
	}

	if patternCode != "" {
		endpoint := "https://api.ghasedak.me/v2/verification/send/simple"
		formData := url.Values{}
		formData.Set("receptor", to)
		formData.Set("template", patternCode)
		formData.Set("type", "1")

		i := 1
		for _, v := range patternData {
			formData.Set(fmt.Sprintf("param%d", i), v)
			i++
		}

		req, _ := http.NewRequest("POST", endpoint, strings.NewReader(formData.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("apikey", g.APIKey)

		resp, err := g.client.Do(req)
		if err != nil {
			return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
		}
		defer resp.Body.Close()

		return &SendResult{Status: SendStatusSent, ProviderMessageID: "ghasedak-otp"}, nil
	}

	endpoint := "https://api.ghasedak.me/v2/sms/send/simple"
	formData := url.Values{}
	formData.Set("receptor", to)
	formData.Set("message", message)
	if g.Sender != "" {
		formData.Set("linenumber", g.Sender)
	}

	req, _ := http.NewRequest("POST", endpoint, strings.NewReader(formData.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("apikey", g.APIKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
	}
	defer resp.Body.Close()

	return &SendResult{Status: SendStatusSent, ProviderMessageID: "ghasedak-sms"}, nil
}

func (g *GhasedakGateway) GetBalance() (string, error) {
	if g.APIKey == "" {
		return "تنظیم نشده", nil
	}

	endpoint := "https://api.ghasedak.me/v2/account/info"
	req, _ := http.NewRequest("GET", endpoint, nil)
	req.Header.Set("apikey", g.APIKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return "خطا در استعلام", err
	}
	defer resp.Body.Close()

	var result struct {
		Items struct {
			Balance int64 `json:"balance"`
		} `json:"items"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
		return fmt.Sprintf("%s ریال", formatNumber(result.Items.Balance)), nil
	}

	return "فعال", nil
}

// ─── Multi-Gateway Router & Settings Registry ───────────────────────────────

type SMSGatewayManager struct {
	mu             sync.RWMutex
	ActiveGateway  string
	AdminNumbers   []string
	EnableSMS      bool
	TrackingKeys   []string
	Gateways       map[string]IranianSMSGateway
	StatusTemplates map[string]StatusTemplate // key: "buyer:completed"
}

type StatusTemplate struct {
	RecipientType string `json:"recipient_type"` // "buyer" | "admin"
	OrderStatus   string `json:"order_status"`   // "pending", "processing", "completed", etc.
	IsEnabled     bool   `json:"is_enabled"`
	PatternCode   string `json:"pattern_code,omitempty"`
	TemplateText  string `json:"template_text"`
}

func NewSMSGatewayManager() *SMSGatewayManager {
	mgr := &SMSGatewayManager{
		ActiveGateway:   "farazsms",
		EnableSMS:       true,
		AdminNumbers:    []string{"09120000000"},
		TrackingKeys:    []string{"vira_parcel_key", "_tracking_code"},
		Gateways:        make(map[string]IranianSMSGateway),
		StatusTemplates: make(map[string]StatusTemplate),
	}

	// Register drivers
	mgr.Gateways["farazsms"] = NewFarazSMSGateway("", "", "+983000505")
	mgr.Gateways["kavenegar"] = NewKavenegarGateway("", "")
	mgr.Gateways["melipayamak"] = NewMelipayamakGateway("", "", "5000...")
	mgr.Gateways["smsir"] = NewSMSIRGateway("", "3000...")
	mgr.Gateways["ghasedak"] = NewGhasedakGateway("", "3000...")

	// Default templates
	mgr.initDefaultTemplates()

	return mgr
}

func (m *SMSGatewayManager) initDefaultTemplates() {
	statuses := []string{"pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"}
	for _, st := range statuses {
		// Buyer
		buyerEnabled := (st == "processing" || st == "completed")
		m.StatusTemplates["buyer:"+st] = StatusTemplate{
			RecipientType: "buyer",
			OrderStatus:   st,
			IsEnabled:     buyerEnabled,
			TemplateText:  "سلام {first_name} عزیز، سفارش شما به شماره {order_id} در وضعیت «{order_status}» قرار گرفت. کد رهگیری: {tracking_code}",
		}

		// Admin
		adminEnabled := (st == "processing")
		m.StatusTemplates["admin:"+st] = StatusTemplate{
			RecipientType: "admin",
			OrderStatus:   st,
			IsEnabled:     adminEnabled,
			TemplateText:  "مدیر گرامی، سفارش جدید به شماره {order_id} به مبلغ {order_total} توسط {first_name} {last_name} ثبت شد ({order_status}).",
		}
	}
}

func (m *SMSGatewayManager) GetActiveDriver() IranianSMSGateway {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if driver, exists := m.Gateways[m.ActiveGateway]; exists {
		return driver
	}
	return m.Gateways["farazsms"]
}

func (m *SMSGatewayManager) Send(to string, message string, patternCode string, patternData map[string]string) (*SendResult, error) {
	if !m.EnableSMS {
		return nil, errors.New("ارسال پیامک در تنظیمات غیرفعال است")
	}

	driver := m.GetActiveDriver()
	if driver == nil {
		return nil, errors.New("هیچ درگاه پیامکی فعالی یافت نشد")
	}

	return driver.SendSMS(to, message, patternCode, patternData)
}

func formatNumber(n int64) string {
	in := strconv.FormatInt(n, 10)
	var out []byte
	l := len(in)
	for i, c := range in {
		if i > 0 && (l-i)%3 == 0 {
			out = append(out, ',')
		}
		out = append(out, byte(c))
	}
	return string(out)
}
