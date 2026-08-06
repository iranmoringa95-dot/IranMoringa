package payments

import (
	"context"
	"errors"
)

var (
	ErrAmountMismatch  = errors.New("مبلغ پرداختی با مبلغ سفارش مطابقت ندارد")
	ErrPaymentFailed   = errors.New("تراکنش پرداخت توسط درگاه ناموفق اعلام شده است")
	ErrCallbackInvalid = errors.New("داده‌های بازگشتی (Callback) درگاه پرداخت معتبر نیست")
)

type InitiateResponse struct {
	RedirectURL       string `json:"redirect_url"`
	ProviderReference string `json:"provider_reference"`
}

type VerifyResponse struct {
	Success              bool   `json:"success"`
	ProviderTransactionID string `json:"provider_transaction_id"`
	FailureCode          string `json:"failure_code,omitempty"`
}

type PaymentGateway interface {
	Initiate(ctx context.Context, p *Payment) (*InitiateResponse, error)
	Verify(ctx context.Context, providerRef string, expectedAmountIRR int64) (*VerifyResponse, error)
}
