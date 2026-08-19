package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// WebOneSMSConfig holds connection and authentication configuration for WebOneSMS API.
type WebOneSMSConfig struct {
	Username       string
	Password       string
	APIKey         string
	SenderNumber   string
	BaseURL        string
	OTPTemplateID  string
	HTTPClient     *http.Client
	TimeoutSeconds int
}

// WebOneSMSProvider connects to the WebOneSMS (webonesms.ir / rest.payamakapi.ir) REST API.
type WebOneSMSProvider struct {
	username      string
	password      string
	apiKey        string
	sender        string
	baseURL       string
	otpTemplateID string
	client        *http.Client
}

// NewWebOneSMSProvider initializes a new WebOneSMS API provider adapter.
func NewWebOneSMSProvider(cfg WebOneSMSConfig) *WebOneSMSProvider {
	baseURL := strings.TrimRight(cfg.BaseURL, "/")
	if baseURL == "" {
		baseURL = "https://rest.payamakapi.ir/api/v1"
	}
	client := cfg.HTTPClient
	if client == nil {
		timeout := 12 * time.Second
		if cfg.TimeoutSeconds > 0 {
			timeout = time.Duration(cfg.TimeoutSeconds) * time.Second
		}
		client = &http.Client{Timeout: timeout}
	}
	return &WebOneSMSProvider{
		username:      cfg.Username,
		password:      cfg.Password,
		apiKey:        cfg.APIKey,
		sender:        cfg.SenderNumber,
		baseURL:       baseURL,
		otpTemplateID: cfg.OTPTemplateID,
		client:        client,
	}
}

// SendSMSRequest is the standard payload sent to WebOneSMS REST endpoint.
type webOneSendSMSPayload struct {
	Recipient string `json:"recipient"`
	Message   string `json:"message"`
	Sender    string `json:"sender,omitempty"`
}

// webOneSendOTPPayload is the fast OTP pattern payload sent to WebOneSMS.
type webOneSendOTPPayload struct {
	Mobile     string            `json:"mobile"`
	TemplateID string            `json:"templateId"`
	Parameters map[string]string `json:"parameters"`
}

// webOneAPIResponse models standard responses from WebOneSMS REST API.
type webOneAPIResponse struct {
	IsSuccess bool        `json:"isSuccess"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data"`
	Status    int         `json:"status"`
}

// SendSMS sends an SMS message via WebOneSMS REST endpoint.
func (p *WebOneSMSProvider) SendSMS(to string, body string) (*SendResult, error) {
	if strings.TrimSpace(p.apiKey) == "" {
		// Mock mode if API key is not yet configured in development
		msgID := fmt.Sprintf("WEBONE-DEV-%s", uuid.New().String()[:8])
		return &SendResult{
			ProviderMessageID: msgID,
			Status:            SendStatusSent,
			Retryable:         false,
		}, nil
	}

	endpoint := fmt.Sprintf("%s/SMS/Send", p.baseURL)
	payload := webOneSendSMSPayload{
		Recipient: to,
		Message:   body,
		Sender:    p.sender,
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return &SendResult{
			Status:       SendStatusFailed,
			Retryable:    false,
			ErrorMessage: fmt.Sprintf("خطای انکد داده پیامک: %v", err),
		}, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return &SendResult{
			Status:       SendStatusFailed,
			Retryable:    true,
			ErrorMessage: fmt.Sprintf("خطای ایجاد ریکوئست به وب وان: %v", err),
		}, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("x-api-key", p.apiKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.apiKey))

	resp, err := p.client.Do(req)
	if err != nil {
		return &SendResult{
			Status:       SendStatusFailed,
			Retryable:    true,
			ErrorMessage: fmt.Sprintf("خطای ارتباط با درگاه پیامک وب وان: %v", err),
		}, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		errMsg := fmt.Sprintf("خطای وب وان (کد %d): %s", resp.StatusCode, string(respBody))
		isRetryable := resp.StatusCode >= 500 || resp.StatusCode == 429
		return &SendResult{
			Status:       SendStatusFailed,
			Retryable:    isRetryable,
			ErrorMessage: errMsg,
		}, errors.New(errMsg)
	}

	msgID := fmt.Sprintf("WEBONE-%s", uuid.New().String()[:8])
	return &SendResult{
		ProviderMessageID: msgID,
		Status:            SendStatusSent,
		Retryable:         false,
	}, nil
}

// SendOTP sends an instant pattern-based verification code via WebOneSMS OTP route.
func (p *WebOneSMSProvider) SendOTP(to string, code string) (*SendResult, error) {
	if strings.TrimSpace(p.apiKey) == "" || strings.TrimSpace(p.otpTemplateID) == "" {
		// Fallback to standard SMS body if no template ID is configured
		message := fmt.Sprintf("کد ورود به ایران مورینگا: %s\nکد تا ۲ دقیقه معتبر است.", code)
		return p.SendSMS(to, message)
	}

	endpoint := fmt.Sprintf("%s/SMS/SendOtp", p.baseURL)
	payload := webOneSendOTPPayload{
		Mobile:     to,
		TemplateID: p.otpTemplateID,
		Parameters: map[string]string{
			"Code": code,
		},
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return p.SendSMS(to, fmt.Sprintf("کد ورود: %s", code))
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return p.SendSMS(to, fmt.Sprintf("کد ورود: %s", code))
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", p.apiKey)

	resp, err := p.client.Do(req)
	if err != nil {
		return p.SendSMS(to, fmt.Sprintf("کد ورود: %s", code))
	}
	defer resp.Body.Close()

	msgID := fmt.Sprintf("WEBONE-OTP-%s", uuid.New().String()[:8])
	return &SendResult{
		ProviderMessageID: msgID,
		Status:            SendStatusSent,
		Retryable:         false,
	}, nil
}
