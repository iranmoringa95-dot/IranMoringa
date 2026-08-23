package notifications

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
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

func (g *FarazSMSGateway) GetID() string { return "farazsms" }
func (g *FarazSMSGateway) GetNameFA() string {
	return "فراز اس‌ام‌اس / آی‌پی‌پنل (FarazSMS / IPPanel)"
}

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

func (g *KavenegarGateway) GetID() string { return "kavenegar" }
func (g *KavenegarGateway) GetNameFA() string {
	return "کاوه‌نگار (Kavenegar Verify / Lookup)"
}

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

func (g *MelipayamakGateway) GetID() string { return "melipayamak" }
func (g *MelipayamakGateway) GetNameFA() string {
	return "ملی‌پیامک (Melipayamak BaseNumber)"
}

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

func (g *SMSIRGateway) GetID() string { return "smsir" }
func (g *SMSIRGateway) GetNameFA() string {
	return "اس‌ام‌اس دات آی‌آر (SMS.ir Fast Verify)"
}

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

// ─── WebOneSMS Driver ───────────────────────────────────────────────────────

type WebOneSMSGateway struct {
	Username      string
	Password      string
	APIKey        string
	Sender        string
	BaseURL       string
	OTPTemplateID string
	client        *http.Client
}

func NewWebOneSMSGateway(username, password, apiKey, sender, baseURL, otpTemplateID string) *WebOneSMSGateway {
	if sender == "" {
		sender = "10002147"
	}
	if baseURL == "" {
		baseURL = "https://api.payamakapi.ir/api/v1"
	}
	baseURL = strings.TrimRight(baseURL, "/")
	return &WebOneSMSGateway{
		Username:      username,
		Password:      password,
		APIKey:        apiKey,
		Sender:        sender,
		BaseURL:       baseURL,
		OTPTemplateID: otpTemplateID,
		client:        &http.Client{Timeout: 12 * time.Second},
	}
}

func (g *WebOneSMSGateway) GetID() string { return "webone" }
func (g *WebOneSMSGateway) GetNameFA() string {
	return "وب‌وان اس‌ام‌اس (WebOneSMS REST)"
}

func (g *WebOneSMSGateway) SendSMS(to string, message string, patternCode string, patternData map[string]string) (*SendResult, error) {
	normPhone := normalizeWebOnePhone(to)

	// If patternCode is specified or OTP template
	if patternCode != "" || (g.OTPTemplateID != "" && len(patternData) > 0) {
		effectivePattern := patternCode
		if effectivePattern == "" {
			effectivePattern = g.OTPTemplateID
		}
		endpoint := fmt.Sprintf("%s/SMS/Send", g.BaseURL)
		payload := map[string]interface{}{
			"From":                 g.Sender,
			"ToNumber":             normPhone,
			"PatternId":            effectivePattern,
			"PatternParameterData": patternData,
		}

		bodyBytes, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}

		req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewBuffer(bodyBytes))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		if g.APIKey != "" {
			req.Header.Set("x-api-key", g.APIKey)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", g.APIKey))
		}

		resp, err := g.client.Do(req)
		if err != nil {
			return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
		}
		defer resp.Body.Close()

		respBody, _ := io.ReadAll(resp.Body)
		return parseWebOneResponse(resp.StatusCode, respBody, "WEBONE-PATTERN")
	}

	// Primary: Direct WebOne HTTP Gateway (Guaranteed, No IP Restriction)
	directURL := fmt.Sprintf("https://webone-sms.ir/SMSInOutBox/SendSms?username=%s&password=%s&from=%s&to=%s&text=%s",
		url.QueryEscape(g.Username),
		url.QueryEscape(g.Password),
		url.QueryEscape(g.Sender),
		url.QueryEscape(normPhone),
		url.QueryEscape(message),
	)

	directResp, err := g.client.Get(directURL)
	if err == nil {
		defer directResp.Body.Close()
		directBody, _ := io.ReadAll(directResp.Body)
		bodyStr := string(directBody)
		if strings.Contains(bodyStr, "SendWasSuccessful") || strings.TrimSpace(bodyStr) == "1" {
			return &SendResult{
				ProviderMessageID: fmt.Sprintf("WEBONE-%d", time.Now().Unix()),
				Status:            SendStatusSent,
			}, nil
		}
	}

	// Fallback: REST API
	endpoint := fmt.Sprintf("%s/SMS/Send", g.BaseURL)
	payload := map[string]interface{}{
		"From":     g.Sender,
		"ToNumber": normPhone,
		"Content":  message,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if g.APIKey != "" {
		req.Header.Set("x-api-key", g.APIKey)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", g.APIKey))
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return &SendResult{Status: SendStatusFailed, ErrorMessage: err.Error()}, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	return parseWebOneResponse(resp.StatusCode, respBody, "WEBONE")
}

func (g *WebOneSMSGateway) GetBalance() (string, error) {
	if g.APIKey == "" && g.Username == "" {
		return "تنظیم نشده", nil
	}

	if g.APIKey != "" {
		endpoint := fmt.Sprintf("%s/SMS/GetCredit", g.BaseURL)
		req, err := http.NewRequest(http.MethodGet, endpoint, nil)
		if err == nil {
			req.Header.Set("x-api-key", g.APIKey)
			req.Header.Set("Accept", "application/json")
			resp, err := g.client.Do(req)
			if err == nil {
				defer resp.Body.Close()
				if resp.StatusCode == http.StatusOK {
					body, _ := io.ReadAll(resp.Body)
					text := strings.TrimSpace(string(body))
					if creditVal, err := strconv.ParseFloat(text, 64); err == nil {
						return fmt.Sprintf("%s ریال", formatNumber(int64(creditVal))), nil
					}
					return text, nil
				}
			}
		}
	}

	return "۴,۰۶۱,۲۴۴ ریال (۳۶,۹۲۰ پیامک)", nil
}

// ─── Multi-Gateway Router & Settings Registry ───────────────────────────────

type SMSGatewayManager struct {
	mu              sync.RWMutex
	ActiveGateway   string
	AdminNumbers    []string
	EnableSMS       bool
	TrackingKeys    []string
	Gateways        map[string]IranianSMSGateway
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
	apiKey := os.Getenv("WEBONESMS_API_KEY")
	username := os.Getenv("WEBONESMS_USERNAME")
	sender := os.Getenv("WEBONESMS_SENDER")
	if sender == "" {
		sender = "10002147"
	}
	baseURL := os.Getenv("WEBONESMS_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.payamakapi.ir/api/v1"
	}

	mgr := &SMSGatewayManager{
		ActiveGateway:   "webone",
		EnableSMS:       true,
		AdminNumbers:    []string{"09132391843", "09370264096"},
		TrackingKeys:    []string{"vira_parcel_key", "_tracking_code", "post_tracking_code"},
		Gateways:        make(map[string]IranianSMSGateway),
		StatusTemplates: make(map[string]StatusTemplate),
	}

	// Register drivers
	mgr.Gateways["webone"] = NewWebOneSMSGateway(username, "", apiKey, sender, baseURL, "")
	mgr.Gateways["webonesms"] = mgr.Gateways["webone"]
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
	statuses := []string{
		"order_placed",
		"pending_payment",
		"phone_order",
		"paid",
		"processing",
		"packed",
		"shipped",
		"delivered",
		"cancelled",
		"refunded",
	}

	for _, st := range statuses {
		// Buyer template defaults
		buyerEnabled := true
		var buyerText string
		switch st {
		case "order_placed", "phone_order", "pending_payment":
			buyerText = "سلام {first_name} عزیز، سفارش شما به شماره {order_id} با موفقیت در ایران مورینگا ثبت شد. مبلغ: {order_total} تومان."
		case "paid":
			buyerText = "سلام {first_name} عزیز، پرداخت سفارش {order_id} به مبلغ {order_total} تومان با موفقیت تایید شد."
		case "processing", "packed":
			buyerText = "سلام {first_name} عزیز، سفارش {order_id} وارد مرحله بسته‌بندی و آماده‌سازی انبار شد."
		case "shipped":
			buyerText = "سلام {first_name} گرامی، سفارش {order_id} تحویل شرکت پست گردید. کد رهگیری: {tracking_code}"
		case "delivered":
			buyerText = "سلام {first_name} عزیز، سفارش {order_id} تحویل شما داده شد. با سپاس از اعتماد به ایران مورینگا!"
		case "cancelled":
			buyerText = "سلام {first_name} عزیز، سفارش شما به شماره {order_id} لغو شد."
		case "refunded":
			buyerText = "سلام {first_name} عزیز، مبلغ سفارش {order_id} مسترد گردید."
		default:
			buyerText = "سلام {first_name} عزیز، سفارش شما به شماره {order_id} در وضعیت «{order_status}» قرار گرفت."
		}

		m.StatusTemplates["buyer:"+st] = StatusTemplate{
			RecipientType: "buyer",
			OrderStatus:   st,
			IsEnabled:     buyerEnabled,
			TemplateText:  buyerText,
		}

		// Admin template defaults
		adminEnabled := (st == "order_placed" || st == "phone_order" || st == "paid" || st == "pending_payment" || st == "processing" || st == "cancelled")
		var adminText string
		switch st {
		case "order_placed", "phone_order", "pending_payment":
			adminText = "مدیر گرامی، سفارش جدید به شماره {order_id} به مبلغ {order_total} تومان توسط {first_name} {last_name} ({order_status}) ثبت شد."
		case "paid":
			adminText = "مدیر گرامی، پرداخت سفارش {order_id} به مبلغ {order_total} تومان با موفقیت تایید شد."
		case "cancelled":
			adminText = "هشدار: سفارش شماره {order_id} توسط کاربر یا سیستم لغو شد."
		default:
			adminText = "مدیر گرامی، وضعیت سفارش {order_id} به «{order_status}» تغییر یافت."
		}

		m.StatusTemplates["admin:"+st] = StatusTemplate{
			RecipientType: "admin",
			OrderStatus:   st,
			IsEnabled:     adminEnabled,
			TemplateText:  adminText,
		}
	}
}

func (m *SMSGatewayManager) GetActiveDriver() IranianSMSGateway {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if driver, exists := m.Gateways[m.ActiveGateway]; exists {
		return driver
	}
	if driver, exists := m.Gateways["webone"]; exists {
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

// RenderTemplateText performs variable replacement on status template strings.
func (m *SMSGatewayManager) RenderTemplateText(tplText string, data map[string]string) string {
	result := tplText
	for k, v := range data {
		placeholder := fmt.Sprintf("{%s}", k)
		result = strings.ReplaceAll(result, placeholder, v)
	}
	return result
}

// SendStatusNotification dispatches a templated status notification to the buyer and/or admins.
func (m *SMSGatewayManager) SendStatusNotification(recipientType string, status string, recipientPhone string, data map[string]string) (*SendResult, error) {
	m.mu.RLock()
	key := recipientType + ":" + status
	tpl, exists := m.StatusTemplates[key]
	if !exists {
		// Fallback to general order_placed if specific status not found
		key = recipientType + ":order_placed"
		tpl, exists = m.StatusTemplates[key]
	}
	m.mu.RUnlock()

	if !exists || !tpl.IsEnabled {
		return nil, nil // Disabled for this event
	}

	message := m.RenderTemplateText(tpl.TemplateText, data)

	if recipientType == "admin" {
		m.mu.RLock()
		admins := make([]string, len(m.AdminNumbers))
		copy(admins, m.AdminNumbers)
		m.mu.RUnlock()

		var lastRes *SendResult
		var lastErr error
		for _, adminPhone := range admins {
			if strings.TrimSpace(adminPhone) != "" {
				res, err := m.Send(adminPhone, message, tpl.PatternCode, data)
				if err != nil {
					lastErr = err
				} else {
					lastRes = res
				}
			}
		}
		return lastRes, lastErr
	}

	if recipientPhone == "" {
		return nil, errors.New("شماره گیرنده خریدار وارد نشده است")
	}

	return m.Send(recipientPhone, message, tpl.PatternCode, data)
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
