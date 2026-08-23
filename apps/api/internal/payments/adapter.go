package payments

import (
	"context"
	"fmt"
)

type FakeGateway struct{}

func NewFakeGateway() *FakeGateway {
	return &FakeGateway{}
}

func (g *FakeGateway) Initiate(ctx context.Context, p *Payment) (*InitiateResponse, error) {
	ref := fmt.Sprintf("FAKE-REF-%s", p.ID.String()[:8])
	return &InitiateResponse{
		RedirectURL:       fmt.Sprintf("/checkout/payment/%s?ref=%s", p.ID, ref),
		ProviderReference: ref,
	}, nil
}

func (g *FakeGateway) Verify(ctx context.Context, providerRef string, expectedAmountIRR int64) (*VerifyResponse, error) {
	// Simulated verification success
	return &VerifyResponse{
		Success:               true,
		ProviderTransactionID: fmt.Sprintf("TXN-%s", providerRef),
	}, nil
}
