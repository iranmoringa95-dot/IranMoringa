package shipping

import (
	"context"
	"testing"

	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
)

func TestShippingQuotesAndCityRestrictions(t *testing.T) {
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)
	svc := NewService(orderSvc, paySvc)

	standardItems := []ShippingParcelItem{
		{WeightGrams: 200, LengthCM: 10, WidthCM: 10, HeightCM: 5, Quantity: 1},
	}

	// 1. Calculate quotes for Isfahan -> Must have both Post Pishtaz AND Isfahan Courier
	quotesIsf := svc.CalculateQuotes("اصفهان", "اصفهان", 10000000, standardItems)
	if len(quotesIsf) != 2 {
		t.Fatalf("expected 2 shipping options for Isfahan, got %d", len(quotesIsf))
	}

	hasCourier := false
	hasPishtaz := false
	for _, q := range quotesIsf {
		if q.Code == "courier_isfahan" {
			hasCourier = true
			if q.FeeIRR <= 0 {
				t.Errorf("expected positive courier fee, got %d", q.FeeIRR)
			}
		}
		if q.Code == "post_pishtaz" {
			hasPishtaz = true
		}
	}
	if !hasCourier || !hasPishtaz {
		t.Errorf("Isfahan must offer both courier and pishtaz, got courier=%v pishtaz=%v", hasCourier, hasPishtaz)
	}

	// 2. Calculate quotes for Tehran -> ONLY Post Pishtaz (Courier must NOT be available)
	quotesTeh := svc.CalculateQuotes("تهران", "تهران", 10000000, standardItems)
	if len(quotesTeh) != 1 {
		t.Fatalf("expected exactly 1 shipping option (post_pishtaz) for Tehran, got %d", len(quotesTeh))
	}
	if quotesTeh[0].Code != "post_pishtaz" {
		t.Errorf("expected post_pishtaz for Tehran, got %s", quotesTeh[0].Code)
	}

	// 3. Calculate quotes for Shiraz -> ONLY Post Pishtaz
	quotesShiraz := svc.CalculateQuotes("فارس", "شیراز", 10000000, standardItems)
	if len(quotesShiraz) != 1 || quotesShiraz[0].Code != "post_pishtaz" {
		t.Fatalf("expected only post_pishtaz for Shiraz, got %+v", quotesShiraz)
	}

	// 4. Free Shipping Threshold Check (Subtotal >= 15,000,000 IRR)
	quotesFree := svc.CalculateQuotes("اصفهان", "اصفهان", 15000000, standardItems)
	pishtazFree := false
	for _, q := range quotesFree {
		if q.Code == "post_pishtaz" && q.FeeIRR == 0 && q.IsFree {
			pishtazFree = true
		}
	}
	if !pishtazFree {
		t.Errorf("expected free Post Pishtaz shipping for subtotal >= 15,000,000 IRR")
	}
}

func TestVolumetricWeightAndPackagingCalculation(t *testing.T) {
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)
	svc := NewService(orderSvc, paySvc)

	// Bulky parcel with high volume but low actual weight
	// Volume = 30 * 25 * 15 = 11,250 cm3 -> Volumetric Weight = 11250 / 5 = 2,250g
	// Actual Weight = 500g
	// Expected Charged Weight = 2,250g
	bulkyItems := []ShippingParcelItem{
		{WeightGrams: 500, LengthCM: 30, WidthCM: 25, HeightCM: 15, Quantity: 1},
	}

	actualW, volW, chargedW, totalVol := ComputeParcelMetrics(bulkyItems)
	if actualW != 500 {
		t.Errorf("expected actual weight 500g, got %d", actualW)
	}
	if volW != 2250 {
		t.Errorf("expected volumetric weight 2250g, got %d", volW)
	}
	if chargedW != 2250 {
		t.Errorf("expected charged weight to be max (2250g), got %d", chargedW)
	}
	if totalVol != 11250 {
		t.Errorf("expected total volume 11250 cm3, got %d", totalVol)
	}

	quotesTeh := svc.CalculateQuotes("تهران", "تهران", 5000000, bulkyItems)
	if len(quotesTeh) == 0 {
		t.Fatalf("expected quotes for bulky parcel")
	}
	quote := quotesTeh[0]
	if quote.ChargedWeightGrams != 2250 {
		t.Errorf("expected charged weight 2250g in quote, got %d", quote.ChargedWeightGrams)
	}
	// Total fee for 2.25kg to non-neighboring province should be greater than base 380,000
	if quote.FeeIRR <= 580000 {
		t.Errorf("expected bulky post fee to exceed base rate, got %d", quote.FeeIRR)
	}
}

func TestShippingFeeMethodRestrictions(t *testing.T) {
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)
	svc := NewService(orderSvc, paySvc)

	items := []ShippingParcelItem{
		{WeightGrams: 300, LengthCM: 10, WidthCM: 10, HeightCM: 5, Quantity: 1},
	}

	// Courier in Isfahan should succeed
	feeIsf, err := svc.CalculateShippingFee("اصفهان", "اصفهان", "courier_isfahan", items)
	if err != nil {
		t.Fatalf("courier in isfahan failed: %v", err)
	}
	if feeIsf <= 0 {
		t.Errorf("expected positive fee for isfahan courier, got %d", feeIsf)
	}

	// Courier in Tehran should fail with ErrCourierOnlyInIsfahan
	_, errTeh := svc.CalculateShippingFee("تهران", "تهران", "courier_isfahan", items)
	if errTeh != ErrCourierOnlyInIsfahan {
		t.Errorf("expected ErrCourierOnlyInIsfahan for tehran courier, got %v", errTeh)
	}
}

func TestTariffSettingsAndSync(t *testing.T) {
	orderSvc := orders.NewService()
	paySvc := payments.NewService(orderSvc)
	svc := NewService(orderSvc, paySvc)

	settings := svc.GetTariffSettings()
	if settings.BaseFeeIRR != 380000 {
		t.Errorf("expected base fee 380000, got %d", settings.BaseFeeIRR)
	}

	synced, err := svc.SyncTariffs(context.Background())
	if err != nil {
		t.Fatalf("sync tariffs failed: %v", err)
	}
	if synced.LastSyncedAt == nil {
		t.Errorf("expected LastSyncedAt to be populated")
	}
}
