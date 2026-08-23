package shipping

import (
	"strings"
	"time"

	"moringalab/api/internal/orders"
)

// Destination Zone relative to Isfahan hub
type ProvinceZone string

const (
	ZoneIntraProvince  ProvinceZone = "intra_province"  // اصفهان
	ZoneNeighboring    ProvinceZone = "neighboring"     // چهارمحال، یزد، مرکزی، فارس، قم، لرستان، سمنان
	ZoneNonNeighboring ProvinceZone = "non_neighboring" // سایر استان‌ها
)

type ShippingParcelItem struct {
	WeightGrams int `json:"weight_grams"`
	LengthCM    int `json:"length_cm"`
	WidthCM     int `json:"width_cm"`
	HeightCM    int `json:"height_cm"`
	Quantity    int `json:"quantity"`
}

type ShippingQuoteOption struct {
	Code               string `json:"code"`
	NameFA             string `json:"name_fa"`
	Carrier            string `json:"carrier"`
	FeeIRR             int64  `json:"fee_irr"`
	ETAMinDays         int    `json:"eta_min_days"`
	ETAMaxDays         int    `json:"eta_max_days"`
	IsFree             bool   `json:"is_free"`
	Description        string `json:"description"`
	EstimatedHoursMin  *int   `json:"estimated_hours_min,omitempty"`
	EstimatedHoursMax  *int   `json:"estimated_hours_max,omitempty"`
	ChargedWeightGrams int    `json:"charged_weight_grams"`
	VolumetricWeightG  int    `json:"volumetric_weight_grams"`
	ActualWeightGrams  int    `json:"actual_weight_grams"`
}

type CalculateQuotesRequest struct {
	Province    string               `json:"province"`
	City        string               `json:"city"`
	SubtotalIRR int64                `json:"subtotal_irr"`
	Items       []ShippingParcelItem `json:"items"`
}

type TariffSettings struct {
	Carrier                  string     `json:"carrier"`
	ServiceCode              string     `json:"service_code"`
	TitleFA                  string     `json:"title_fa"`
	IsActive                 bool       `json:"is_active"`
	BaseFeeIRR               int64      `json:"base_fee_irr"`
	PerExtraKgFeeIRR         int64      `json:"per_extra_kg_fee_irr"`
	FreeShippingThresholdIRR int64      `json:"free_shipping_threshold_irr"`
	CourierIsfahanFeeIRR     int64      `json:"courier_isfahan_fee_irr"`
	PackagingFeeTier1IRR     int64      `json:"packaging_fee_tier1_irr"`
	PackagingFeeTier2IRR     int64      `json:"packaging_fee_tier2_irr"`
	PackagingFeeTier3IRR     int64      `json:"packaging_fee_tier3_irr"`
	InsuranceFeeIRR          int64      `json:"insurance_fee_irr"`
	VATPercent               int        `json:"vat_percent"`
	APIEndpoint              string     `json:"api_endpoint,omitempty"`
	APIKey                   string     `json:"api_key,omitempty"`
	LastSyncedAt             *time.Time `json:"last_synced_at,omitempty"`
}

type TrackingResult struct {
	OrderNumber  string             `json:"order_number"`
	Status       orders.OrderStatus `json:"status"`
	StatusTitle  string             `json:"status_title"`
	TrackingCode *string            `json:"tracking_code,omitempty"`
	Carrier      string             `json:"carrier,omitempty"`
	Recipient    string             `json:"recipient"`
	City         string             `json:"city"`
	TotalToman   int64              `json:"total_toman"`
	Timeline     []TimelineStep     `json:"timeline"`
}

type TimelineStep struct {
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
	Current   bool   `json:"current"`
}

// Neighboring provinces of Isfahan
var IsfahanNeighboringProvinces = map[string]bool{
	"چهارمحال و بختیاری": true,
	"چهارمحال":           true,
	"یزد":                true,
	"مرکزی":              true,
	"فارس":               true,
	"قم":                 true,
	"لرستان":             true,
	"سمنان":              true,
}

func DetectProvinceZone(province string) ProvinceZone {
	clean := strings.TrimSpace(province)
	if strings.Contains(clean, "اصفهان") {
		return ZoneIntraProvince
	}
	for p := range IsfahanNeighboringProvinces {
		if strings.Contains(clean, p) {
			return ZoneNeighboring
		}
	}
	return ZoneNonNeighboring
}

func IsCityIsfahan(city string) bool {
	c := strings.TrimSpace(city)
	return strings.Contains(c, "اصفهان") || strings.EqualFold(c, "isfahan") || strings.EqualFold(c, "esfahan")
}
