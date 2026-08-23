package notifications

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ─── Provider Port Interfaces & Result ───────────────────────────────────────

type SendStatus string

const (
	SendStatusSent       SendStatus = "sent"
	SendStatusFailed     SendStatus = "failed"
	SendStatusQueued     SendStatus = "queued"
	SendStatusDeadLetter SendStatus = "dead_letter"
)

type SendResult struct {
	ProviderMessageID string     `json:"provider_message_id"`
	Status            SendStatus `json:"status"`
	Retryable         bool       `json:"retryable"`
	ErrorMessage      string     `json:"error_message,omitempty"`
}

type SMSProvider interface {
	SendSMS(to string, body string) (*SendResult, error)
}

type EmailProvider interface {
	SendEmail(to string, subject string, body string) (*SendResult, error)
}

// ─── Sent Message Records for Inspection/Testing ────────────────────────────

type SentSMS struct {
	ID     string    `json:"id"`
	To     string    `json:"to"`
	Body   string    `json:"body"`
	SentAt time.Time `json:"sent_at"`
}

type SentEmail struct {
	ID      string    `json:"id"`
	To      string    `json:"to"`
	Subject string    `json:"subject"`
	Body    string    `json:"body"`
	SentAt  time.Time `json:"sent_at"`
}

// ─── Fake SMS Provider Adapter ───────────────────────────────────────────────

type FakeSMSProvider struct {
	mu           sync.RWMutex
	messages     []SentSMS
	shouldFail   bool
	isRetryable  bool
	failureError error
}

func NewFakeSMSProvider() *FakeSMSProvider {
	return &FakeSMSProvider{
		messages: make([]SentSMS, 0),
	}
}

func (p *FakeSMSProvider) SetFailure(fail bool, retryable bool, err error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.shouldFail = fail
	p.isRetryable = retryable
	p.failureError = err
}

func (p *FakeSMSProvider) SendSMS(to string, body string) (*SendResult, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.shouldFail {
		errMsg := "خطای درگاه پیامک"
		if p.failureError != nil {
			errMsg = p.failureError.Error()
		}
		return &SendResult{
			ProviderMessageID: "",
			Status:            SendStatusFailed,
			Retryable:         p.isRetryable,
			ErrorMessage:      errMsg,
		}, errors.New(errMsg)
	}

	msgID := fmt.Sprintf("SMS-%s", uuid.New().String()[:8])
	p.messages = append(p.messages, SentSMS{
		ID:     msgID,
		To:     to,
		Body:   body,
		SentAt: time.Now(),
	})

	return &SendResult{
		ProviderMessageID: msgID,
		Status:            SendStatusSent,
		Retryable:         false,
	}, nil
}

func (p *FakeSMSProvider) GetSentMessages() []SentSMS {
	p.mu.RLock()
	defer p.mu.RUnlock()
	copied := make([]SentSMS, len(p.messages))
	copy(copied, p.messages)
	return copied
}

func (p *FakeSMSProvider) Clear() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.messages = make([]SentSMS, 0)
}

// ─── Fake Email Provider Adapter ──────────────────────────────────────────────

type FakeEmailProvider struct {
	mu           sync.RWMutex
	messages     []SentEmail
	shouldFail   bool
	isRetryable  bool
	failureError error
}

func NewFakeEmailProvider() *FakeEmailProvider {
	return &FakeEmailProvider{
		messages: make([]SentEmail, 0),
	}
}

func (p *FakeEmailProvider) SetFailure(fail bool, retryable bool, err error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.shouldFail = fail
	p.isRetryable = retryable
	p.failureError = err
}

func (p *FakeEmailProvider) SendEmail(to string, subject string, body string) (*SendResult, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.shouldFail {
		errMsg := "خطای سرور ایمیل"
		if p.failureError != nil {
			errMsg = p.failureError.Error()
		}
		return &SendResult{
			ProviderMessageID: "",
			Status:            SendStatusFailed,
			Retryable:         p.isRetryable,
			ErrorMessage:      errMsg,
		}, errors.New(errMsg)
	}

	msgID := fmt.Sprintf("MAIL-%s", uuid.New().String()[:8])
	p.messages = append(p.messages, SentEmail{
		ID:      msgID,
		To:      to,
		Subject: subject,
		Body:    body,
		SentAt:  time.Now(),
	})

	return &SendResult{
		ProviderMessageID: msgID,
		Status:            SendStatusSent,
		Retryable:         false,
	}, nil
}

func (p *FakeEmailProvider) GetSentMessages() []SentEmail {
	p.mu.RLock()
	defer p.mu.RUnlock()
	copied := make([]SentEmail, len(p.messages))
	copy(copied, p.messages)
	return copied
}

func (p *FakeEmailProvider) Clear() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.messages = make([]SentEmail, 0)
}
