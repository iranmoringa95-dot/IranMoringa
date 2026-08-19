package catalog

import (
	"time"

	"github.com/google/uuid"
)

type ProductStatus string
type ProductType string
type AttributeDisplayType string

const (
	StatusDraft       ProductStatus = "draft"
	StatusInReview    ProductStatus = "in_review"
	StatusPublished   ProductStatus = "published"
	StatusUnpublished ProductStatus = "unpublished"
	StatusArchived    ProductStatus = "archived"

	TypeSimple   ProductType = "simple"
	TypeVariable ProductType = "variable"

	DisplaySelect AttributeDisplayType = "select"
	DisplayButton AttributeDisplayType = "button"
	DisplayColor  AttributeDisplayType = "color"
	DisplayImage  AttributeDisplayType = "image"
)

type Brand struct {
	ID          uuid.UUID `json:"id"`
	NameFA      string    `json:"name_fa"`
	Slug        string    `json:"slug"`
	Description string    `json:"description,omitempty"`
	LogoMediaID string    `json:"logo_media_id,omitempty"`
}

type Tag struct {
	ID     uuid.UUID `json:"id"`
	NameFA string    `json:"name_fa"`
	Slug   string    `json:"slug"`
}

type AttributeValue struct {
	ID          uuid.UUID `json:"id"`
	AttributeID uuid.UUID `json:"attribute_id"`
	Code        string    `json:"code"`
	LabelFA     string    `json:"label_fa"`
	ColorHex    string    `json:"color_hex,omitempty"`
	MediaID     string    `json:"media_id,omitempty"`
	Position    int       `json:"position"`
}

type Attribute struct {
	ID              uuid.UUID            `json:"id"`
	Code            string               `json:"code"`
	NameFA          string               `json:"name_fa"`
	DisplayType     AttributeDisplayType `json:"display_type"`
	Filterable      bool                 `json:"filterable"`
	VariantDefining bool                 `json:"variant_defining"`
	Position        int                  `json:"position"`
	Values          []AttributeValue     `json:"values,omitempty"`
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
	ID        uuid.UUID `json:"id"`
	KeyFA     string    `json:"key_fa"`
	ValueFA   string    `json:"value_fa"`
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
	AvailableStock      int                    `json:"available_stock"`
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

type AdminProductFilter struct {
	Query        string
	Status       string
	CategorySlug string
	StockStatus  string // "all", "in_stock", "out_of_stock"
	Sort         string
	Page         int
	Limit        int
}

type CreateProductInput struct {
	BrandID             *uuid.UUID `json:"brand_id,omitempty"`
	Slug                string     `json:"slug"`
	TitleFA             string     `json:"title_fa"`
	ShortDescriptionFA  *string    `json:"short_description_fa,omitempty"`
	FullDescriptionFA   *string    `json:"full_description_fa,omitempty"`
	ProductType         ProductType `json:"product_type"`
	IsFeatured          bool       `json:"is_featured"`
	UsageInstructionsFA *string    `json:"usage_instructions_fa,omitempty"`
	IngredientsFA       *string    `json:"ingredients_fa,omitempty"`
	WarningsFA          *string    `json:"warnings_fa,omitempty"`
	StorageConditionsFA *string    `json:"storage_conditions_fa,omitempty"`
	CountryOfOrigin     *string    `json:"country_of_origin,omitempty"`
	LicenseNumber       *string    `json:"license_number,omitempty"`
	SEOTitle            *string    `json:"seo_title,omitempty"`
	SEODescription      *string    `json:"seo_description,omitempty"`
	CategoryIDs         []uuid.UUID `json:"category_ids,omitempty"`

	// Default Variant Inputs
	SKU                 string  `json:"sku"`
	Barcode             *string `json:"barcode,omitempty"`
	PriceIRR            int64   `json:"price_irr"`
	CompareAtPriceIRR   *int64  `json:"compare_at_price_irr,omitempty"`
	NetWeightGrams      int     `json:"net_weight_grams"`
	ShippingWeightGrams int     `json:"shipping_weight_grams"`
	InitialStock        int     `json:"initial_stock"`
	Media               []ProductMediaInput `json:"media,omitempty"`
}

type UpdateProductInput struct {
	Version             int        `json:"version"` // For optimistic concurrency
	BrandID             *uuid.UUID `json:"brand_id,omitempty"`
	TitleFA             *string    `json:"title_fa,omitempty"`
	ShortDescriptionFA  *string    `json:"short_description_fa,omitempty"`
	FullDescriptionFA   *string    `json:"full_description_fa,omitempty"`
	IsFeatured          *bool      `json:"is_featured,omitempty"`
	UsageInstructionsFA *string    `json:"usage_instructions_fa,omitempty"`
	IngredientsFA       *string    `json:"ingredients_fa,omitempty"`
	WarningsFA          *string    `json:"warnings_fa,omitempty"`
	StorageConditionsFA *string    `json:"storage_conditions_fa,omitempty"`
	SEOTitle            *string    `json:"seo_title,omitempty"`
	SEODescription      *string    `json:"seo_description,omitempty"`
	CategoryIDs         []uuid.UUID `json:"category_ids,omitempty"`

	SKU                 *string `json:"sku,omitempty"`
	PriceIRR            *int64  `json:"price_irr,omitempty"`
	CompareAtPriceIRR   *int64  `json:"compare_at_price_irr,omitempty"`
	NetWeightGrams      *int    `json:"net_weight_grams,omitempty"`
	ShippingWeightGrams *int    `json:"shipping_weight_grams,omitempty"`
	Media               []ProductMediaInput `json:"media,omitempty"`
}

type ProductMediaInput struct {
	URL       string `json:"url"`
	AltFA     string `json:"alt_fa"`
	IsPrimary bool   `json:"is_primary"`
	SortOrder int    `json:"sort_order"`
}

type DemoSeedRecord struct {
	SeedKey     string    `json:"seed_key"`
	SeedVersion int       `json:"seed_version"`
	EntityType  string    `json:"entity_type"`
	EntityID    uuid.UUID `json:"entity_id"`
	CreatedAt   time.Time `json:"created_at"`
}

