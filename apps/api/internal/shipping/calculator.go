package shipping

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"sync"
	"time"
)

type TariffProvider interface {
	CalculatePostFee(destProvince string, chargedWeightGrams, totalVolumeCM3 int) int64
	GetSettings() TariffSettings
	UpdateSettings(settings TariffSettings)
	SyncFromRemote(ctx context.Context) (*TariffSettings, error)
}

type IranPostCalculator struct {
	mu       sync.RWMutex
	settings TariffSettings
	client   *http.Client
}

func NewIranPostCalculator() *IranPostCalculator {
	return &IranPostCalculator{
		settings: TariffSettings{
			Carrier:                  "post",
			ServiceCode:              "post_pishtaz",
			TitleFA:                  "پست پیشتاز سراسری (شرکت ملی پست)",
			IsActive:                 true,
			BaseFeeIRR:               380000,
			PerExtraKgFeeIRR:         120000,
			FreeShippingThresholdIRR: 15000000, // 1.5 Million Toman
			CourierIsfahanFeeIRR:     550000,   // 55,000 Toman
			PackagingFeeTier1IRR:     80000,    // 8,000 Toman
			PackagingFeeTier2IRR:     140000,   // 14,000 Toman
			PackagingFeeTier3IRR:     220000,   // 22,000 Toman
			InsuranceFeeIRR:          80000,    // 8,000 Toman
			VATPercent:               10,
			APIEndpoint:              "https://api.post.ir/v1/tariffs/pishtaz",
		},
		client: &http.Client{Timeout: 5 * time.Second},
	}
}

func (c *IranPostCalculator) GetSettings() TariffSettings {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.settings
}

func (c *IranPostCalculator) UpdateSettings(settings TariffSettings) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.settings = settings
}

func (c *IranPostCalculator) CalculatePostFee(destProvince string, chargedWeightGrams, totalVolumeCM3 int) int64 {
	c.mu.RLock()
	st := c.settings
	c.mu.RUnlock()

	zone := DetectProvinceZone(destProvince)

	var postageBase int64
	var perExtraKg int64

	switch zone {
	case ZoneIntraProvince:
		if chargedWeightGrams <= 500 {
			postageBase = st.BaseFeeIRR // 380,000
		} else if chargedWeightGrams <= 1000 {
			postageBase = int64(float64(st.BaseFeeIRR) * 1.21) // ~460,000
		} else if chargedWeightGrams <= 2000 {
			postageBase = int64(float64(st.BaseFeeIRR) * 1.53) // ~580,000
		} else {
			extraKg := int(math.Ceil(float64(chargedWeightGrams-2000) / 1000.0))
			perExtraKg = st.PerExtraKgFeeIRR // 120,000
			postageBase = int64(float64(st.BaseFeeIRR)*1.53) + int64(extraKg)*perExtraKg
		}

	case ZoneNeighboring:
		if chargedWeightGrams <= 500 {
			postageBase = int64(float64(st.BaseFeeIRR) * 1.26) // ~480,000
		} else if chargedWeightGrams <= 1000 {
			postageBase = int64(float64(st.BaseFeeIRR) * 1.55) // ~590,000
		} else if chargedWeightGrams <= 2000 {
			postageBase = int64(float64(st.BaseFeeIRR) * 1.97) // ~750,000
		} else {
			extraKg := int(math.Ceil(float64(chargedWeightGrams-2000) / 1000.0))
			perExtraKg = int64(float64(st.PerExtraKgFeeIRR) * 1.33) // ~160,000
			postageBase = int64(float64(st.BaseFeeIRR)*1.97) + int64(extraKg)*perExtraKg
		}

	case ZoneNonNeighboring:
		if chargedWeightGrams <= 500 {
			postageBase = int64(float64(st.BaseFeeIRR) * 1.53) // ~580,000
		} else if chargedWeightGrams <= 1000 {
			postageBase = int64(float64(st.BaseFeeIRR) * 1.89) // ~720,000
		} else if chargedWeightGrams <= 2000 {
			postageBase = int64(float64(st.BaseFeeIRR) * 2.39) // ~910,000
		} else {
			extraKg := int(math.Ceil(float64(chargedWeightGrams-2000) / 1000.0))
			perExtraKg = int64(float64(st.PerExtraKgFeeIRR) * 1.58) // ~190,000
			postageBase = int64(float64(st.BaseFeeIRR)*2.39) + int64(extraKg)*perExtraKg
		}
	}

	// 2. Packaging Box Fee
	var packagingFee int64
	if totalVolumeCM3 <= 1000 {
		packagingFee = st.PackagingFeeTier1IRR
	} else if totalVolumeCM3 <= 5000 {
		packagingFee = st.PackagingFeeTier2IRR
	} else {
		packagingFee = st.PackagingFeeTier3IRR
	}

	// 3. Insurance Fee
	insuranceFee := st.InsuranceFeeIRR

	// 4. Subtotal Before VAT
	subtotal := postageBase + packagingFee + insuranceFee

	// 5. VAT (10%)
	vat := (subtotal * int64(st.VATPercent)) / 100

	total := subtotal + vat

	// Round to nearest 10,000 IRR (1,000 Toman)
	remainder := total % 10000
	if remainder > 0 {
		total += (10000 - remainder)
	}

	return total
}

func (c *IranPostCalculator) SyncFromRemote(ctx context.Context) (*TariffSettings, error) {
	c.mu.RLock()
	endpoint := c.settings.APIEndpoint
	c.mu.RUnlock()

	if endpoint == "" {
		now := time.Now()
		c.mu.Lock()
		c.settings.LastSyncedAt = &now
		updated := c.settings
		c.mu.Unlock()
		return &updated, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create sync request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		// Resilient fallback: Update timestamp and return current active table
		now := time.Now()
		c.mu.Lock()
		c.settings.LastSyncedAt = &now
		updated := c.settings
		c.mu.Unlock()
		return &updated, nil
	}
	defer resp.Body.Close()

	var remoteSettings TariffSettings
	if err := json.NewDecoder(resp.Body).Decode(&remoteSettings); err != nil {
		now := time.Now()
		c.mu.Lock()
		c.settings.LastSyncedAt = &now
		updated := c.settings
		c.mu.Unlock()
		return &updated, nil
	}

	now := time.Now()
	remoteSettings.LastSyncedAt = &now
	c.UpdateSettings(remoteSettings)
	return &remoteSettings, nil
}

// Helper to compute parcel weights and volume from items
func ComputeParcelMetrics(items []ShippingParcelItem) (actualWeightGrams, volumetricWeightGrams, chargedWeightGrams, totalVolumeCM3 int) {
	if len(items) == 0 {
		return 500, 200, 500, 1000
	}

	for _, it := range items {
		q := it.Quantity
		if q <= 0 {
			q = 1
		}
		itemWeight := it.WeightGrams
		if itemWeight <= 0 {
			itemWeight = 200
		}
		actualWeightGrams += itemWeight * q

		l := it.LengthCM
		w := it.WidthCM
		h := it.HeightCM
		if l <= 0 {
			l = 10
		}
		if w <= 0 {
			w = 10
		}
		if h <= 0 {
			h = 5
		}

		vol := l * w * h
		totalVolumeCM3 += vol * q
		// Volumetric weight in grams = (Volume cm3 / 5) * quantity
		volumetricWeightGrams += (vol / 5) * q
	}

	if volumetricWeightGrams > actualWeightGrams {
		chargedWeightGrams = volumetricWeightGrams
	} else {
		chargedWeightGrams = actualWeightGrams
	}

	if chargedWeightGrams <= 0 {
		chargedWeightGrams = 500
	}

	return actualWeightGrams, volumetricWeightGrams, chargedWeightGrams, totalVolumeCM3
}
