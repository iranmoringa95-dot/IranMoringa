package catalog

import (
	"time"

	"github.com/google/uuid"
)

type ProductStatus string
type ProductType string

const (
	StatusDraft       ProductStatus = "draft"
	StatusInReview    ProductStatus = "in_review"
	StatusPublished   ProductStatus = "published"
	StatusUnpublished ProductStatus = "unpublished"
	StatusArchived    ProductStatus = "archived"

	TypeSimple   ProductType = "simple"
	TypeVariable ProductType = "variable"
)

type Brand struct {
	ID     uuid.UUID `json:"id"`
	NameFA string    `json:"name_fa"`
	Slug   string    `json:"slug"`
}

type Category struct {
	ID          uuid.UUID  `json:"id"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	NameFA      string     `json:"name_fa"`
	Slug        string     `json:"slug"`
	Description *string    `json:"description_fa,omitempty"`
	SortOrder   int        `json:"sort_order"`
	Children    []Category `json:"children,omitempty"`
}

type ProductVariant struct {
	ID                  uuid.UUID `json:"id"`
	ProductID           uuid.UUID `json:"product_id"`
	SKU                 string    `json:"sku"`
	Barcode             *string   `json:"barcode,omitempty"`
	TitleFA             string    `json:"title_fa"`
	PriceIRR            int64     `json:"price_irr"`
	CompareAtPriceIRR   *int64    `json:"compare_at_price_irr,omitempty"`
	CostPriceIRR        *int64    `json:"cost_price_irr,omitempty"`
	NetWeightGrams      int       `json:"net_weight_grams"`
	ShippingWeightGrams int       `json:"shipping_weight_grams"`
	IsActive            bool      `json:"is_active"`
	Version             int       `json:"version"`
	CreatedAt           time.Time `json:"created_at"`
}

type ProductMedia struct {
	ID        uuid.UUID `json:"id"`
	ProductID uuid.UUID `json:"product_id"`
	URL       string    `json:"url"`
	AltFA     string    `json:"alt_fa"`
	IsPrimary bool      `json:"is_primary"`
	SortOrder int       `json:"sort_order"`
}

type ProductSpecification struct {
	ID       uuid.UUID `json:"id"`
	KeyFA    string    `json:"key_fa"`
	ValueFA  string    `json:"value_fa"`
	SortOrder int       `json:"sort_order"`
}

type Product struct {
	ID                  uuid.UUID              `json:"id"`
	BrandID             *uuid.UUID             `json:"brand_id,omitempty"`
	BrandNameFA         *string                `json:"brand_name_fa,omitempty"`
	Slug                string                 `json:"slug"`
	TitleFA             string                 `json:"title_fa"`
	ShortDescriptionFA  *string                `json:"short_description_fa,omitempty"`
	FullDescriptionFA   *string                `json:"full_description_fa,omitempty"`
	ProductType         ProductType            `json:"product_type"`
	Status              ProductStatus          `json:"status"`
	IsFeatured          bool                   `json:"is_featured"`
	UsageInstructionsFA *string                `json:"usage_instructions_fa,omitempty"`
	IngredientsFA       *string                `json:"ingredients_fa,omitempty"`
	WarningsFA          *string                `json:"warnings_fa,omitempty"`
	StorageConditionsFA *string                `json:"storage_conditions_fa,omitempty"`
	CountryOfOrigin     *string                `json:"country_of_origin,omitempty"`
	LicenseNumber       *string                `json:"license_number,omitempty"`
	SEOTitle            *string                `json:"seo_title,omitempty"`
	SEODescription      *string                `json:"seo_description,omitempty"`
	Version             int                    `json:"version"`
	PublishedAt         *time.Time             `json:"published_at,omitempty"`
	CreatedAt           time.Time              `json:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at"`
	Categories          []Category             `json:"categories,omitempty"`
	Variants            []ProductVariant       `json:"variants,omitempty"`
	Media               []ProductMedia         `json:"media,omitempty"`
	Specifications      []ProductSpecification `json:"specifications,omitempty"`
}

type ProductFilter struct {
	Query        string
	CategorySlug string
	BrandSlug    string
	MinPriceIRR  *int64
	MaxPriceIRR  *int64
	Sort         string
	Page         int
	Limit        int
}
