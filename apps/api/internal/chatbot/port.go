package chatbot

import (
	"context"
	"strings"
	"time"
)

type LLMResponse struct {
	AnswerText string     `json:"answer_text"`
	Citations  []Citation `json:"citations,omitempty"`
	TokensUsed int        `json:"tokens_used"`
	LatencyMs  int64      `json:"latency_ms"`
}

type LLMProvider interface {
	GenerateAnswer(ctx context.Context, question string, retrievedContext string) (*LLMResponse, error)
}

type FakeLLMProvider struct{}

func NewFakeLLMProvider() *FakeLLMProvider {
	return &FakeLLMProvider{}
}

func (p *FakeLLMProvider) GenerateAnswer(ctx context.Context, question string, retrievedContext string) (*LLMResponse, error) {
	start := time.Now()

	// Mock offline response based on context
	answer := "بر اساس اطلاعات رسمی ثبت‌شده در سبزینه: "
	if retrievedContext != "" {
		lines := strings.Split(retrievedContext, "\n")
		if len(lines) > 0 {
			answer += lines[0]
		} else {
			answer += retrievedContext
		}
	} else {
		answer = "متأسفانه اطلاعات دقیق و مستندی در این زمینه در پایگاه دانش یافت نشد. لطفاً با پشتیبانی انسانی تماس بگیرید."
	}

	latency := time.Since(start).Milliseconds()
	return &LLMResponse{
		AnswerText: answer,
		TokensUsed: 120,
		LatencyMs:  latency,
	}, nil
}
