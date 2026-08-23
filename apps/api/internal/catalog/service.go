package catalog

import (
	"errors"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"moringalab/api/internal/localization"
)

var (
	ErrProductNotFound                  = errors.New("محصول مورد نظر یافت نشد")
	ErrCategoryNotFound                 = errors.New("دسته‌بندی مورد نظر یافت نشد")
	ErrCategoryCycle                    = errors.New("ایجاد رابطه چرخه‌ای (دور) در دسته‌بندی‌ها امکان‌پذیر نیست")
	ErrNegativePrice                    = errors.New("قیمت محصول نمی‌تواند منفی باشد")
	ErrInvalidCompareAtPrice            = errors.New("قیمت قبل از تخفیف باید از قیمت اصلی بیشتر باشد")
	ErrNoVariant                        = errors.New("هر محصول قابل فروش باید حداقل یک متغیر فعال داشته باشد")
	ErrShippingWeightTooSmall           = errors.New("وزن ارسال نمی‌تواند از وزن خالص محصول کمتر باشد")
	ErrProductInUse                     = errors.New("محصول دارای سابقه سفارش یا موجودی فعال است و امکان حذف فیزیکی ندارد (از آرشیو استفاده کنید)")
	ErrSlugExists                       = errors.New("شناسه آدرس (Slug) تکراری است")
	ErrSKUExists                        = errors.New("کد کالا (SKU) تکراری است")
	ErrOptimisticLock                   = errors.New("تغییرات هم‌زمان رخ داده است، لطفاً اطلاعات را مجدداً دریافت و ویرایش کنید")
	ErrCannotPublishMissingVariant      = errors.New("محصول منتشرشده حداقل یک متغیر فعال لازم دارد")
	ErrCannotPublishMissingPrice        = errors.New("قیمت محصول منتشرشده باید بزرگتر از صفر باشد")
	ErrCannotPublishMissingSKU          = errors.New("کد کالا (SKU) برای انتشار الزامی است")
	ErrCannotPublishMissingCategory     = errors.New("انتخاب حداقل یک دسته‌بندی برای انتشار الزامی است")
	ErrCannotPublishMissingPrimaryMedia = errors.New("انتخاب تصویر اصلی برای انتشار الزامی است")
)

type Service struct {
	mu           sync.RWMutex
	categories   map[uuid.UUID]*Category
	products     map[uuid.UUID]*Product
	bySlug       map[string]*Product
	brands       map[uuid.UUID]*Brand
	attributes   map[uuid.UUID]*Attribute
	seedRegistry map[string]*DemoSeedRecord
}

func NewService() *Service {
	return &Service{
		categories:   make(map[uuid.UUID]*Category),
		products:     make(map[uuid.UUID]*Product),
		bySlug:       make(map[string]*Product),
		brands:       make(map[uuid.UUID]*Brand),
		attributes:   make(map[uuid.UUID]*Attribute),
		seedRegistry: make(map[string]*DemoSeedRecord),
	}
}

// Seed Registry Methods
func (s *Service) IsSeedExecuted(seedKey string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, exists := s.seedRegistry[seedKey]
	return exists
}

func (s *Service) RecordSeedExecution(seedKey string, seedVersion int, entityType string, entityID uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.seedRegistry[seedKey] = &DemoSeedRecord{
		SeedKey:     seedKey,
		SeedVersion: seedVersion,
		EntityType:  entityType,
		EntityID:    entityID,
		CreatedAt:   time.Now(),
	}
}

// DetectCategoryCycle ensures assigning parentID as parent of categoryID will not cause a cycle.
func (s *Service) DetectCategoryCycle(categoryID, parentID uuid.UUID) error {
	if categoryID == parentID {
		return ErrCategoryCycle
	}

	curr := parentID
	for {
		parentCat, exists := s.categories[curr]
		if !exists || parentCat.ParentID == nil {
			break
		}
		if *parentCat.ParentID == categoryID {
			return ErrCategoryCycle
		}
		curr = *parentCat.ParentID
	}
	return nil
}

func (s *Service) AddCategory(cat *Category) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if cat.ParentID != nil {
		if err := s.DetectCategoryCycle(cat.ID, *cat.ParentID); err != nil {
			return err
		}
	}

	cat.NameFA = localization.NormalizePersianText(cat.NameFA)
	s.categories[cat.ID] = cat
	return nil
}

func (s *Service) AddBrand(brand *Brand) {
	s.mu.Lock()
	defer s.mu.Unlock()
	brand.NameFA = localization.NormalizePersianText(brand.NameFA)
	s.brands[brand.ID] = brand
}

func (s *Service) ListBrands() []*Brand {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*Brand, 0, len(s.brands))
	for _, b := range s.brands {
		result = append(result, b)
	}
	return result
}

func (s *Service) AddAttribute(attr *Attribute) {
	s.mu.Lock()
	defer s.mu.Unlock()
	attr.NameFA = localization.NormalizePersianText(attr.NameFA)
	s.attributes[attr.ID] = attr
}

func (s *Service) ListAttributes() []*Attribute {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*Attribute, 0, len(s.attributes))
	for _, a := range s.attributes {
		result = append(result, a)
	}
	return result
}

func (s *Service) AddProduct(prod *Product) error {
	if len(prod.Variants) == 0 {
		return ErrNoVariant
	}

	for _, v := range prod.Variants {
		if v.PriceIRR < 0 {
			return ErrNegativePrice
		}
		if v.CompareAtPriceIRR != nil && *v.CompareAtPriceIRR <= v.PriceIRR {
			return ErrInvalidCompareAtPrice
		}
		if v.ShippingWeightGrams < v.NetWeightGrams {
			return ErrShippingWeightTooSmall
		}
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Check Slug uniqueness
	if existing, exists := s.bySlug[prod.Slug]; exists && existing.ID != prod.ID {
		return ErrSlugExists
	}

	// Check SKU uniqueness
	for _, existingProd := range s.products {
		if existingProd.ID == prod.ID {
			continue
		}
		for _, existingVar := range existingProd.Variants {
			for _, newVar := range prod.Variants {
				if existingVar.SKU == newVar.SKU {
					return ErrSKUExists
				}
			}
		}
	}

	prod.TitleFA = localization.NormalizePersianText(prod.TitleFA)
	if prod.Version == 0 {
		prod.Version = 1
	}
	s.products[prod.ID] = prod
	s.bySlug[prod.Slug] = prod
	return nil
}

func (s *Service) AdminGetProductByID(id uuid.UUID) (*Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	prod, exists := s.products[id]
	if !exists {
		return nil, ErrProductNotFound
	}
	return prod, nil
}

func (s *Service) AdminCreateProduct(input CreateProductInput) (*Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	slug := strings.TrimSpace(strings.ToLower(input.Slug))
	if slug == "" {
		slug = strings.ReplaceAll(strings.ToLower(input.TitleFA), " ", "-")
	}

	if _, exists := s.bySlug[slug]; exists {
		return nil, ErrSlugExists
	}

	// Check SKU
	for _, p := range s.products {
		for _, v := range p.Variants {
			if v.SKU == input.SKU {
				return nil, ErrSKUExists
			}
		}
	}

	if input.PriceIRR < 0 {
		return nil, ErrNegativePrice
	}
	if input.CompareAtPriceIRR != nil && *input.CompareAtPriceIRR <= input.PriceIRR {
		return nil, ErrInvalidCompareAtPrice
	}
	if input.ShippingWeightGrams < input.NetWeightGrams {
		return nil, ErrShippingWeightTooSmall
	}

	now := time.Now()
	productID := uuid.New()
	variantID := uuid.New()

	var categories []Category
	for _, catID := range input.CategoryIDs {
		if cat, ok := s.categories[catID]; ok {
			categories = append(categories, *cat)
		}
	}

	var brandName *string
	if input.BrandID != nil {
		if b, ok := s.brands[*input.BrandID]; ok {
			brandName = &b.NameFA
		}
	}

	var media []ProductMedia
	for i, m := range input.Media {
		media = append(media, ProductMedia{
			ID:        uuid.New(),
			ProductID: productID,
			URL:       m.URL,
			AltFA:     m.AltFA,
			IsPrimary: m.IsPrimary,
			SortOrder: i + 1,
		})
	}

	prod := &Product{
		ID:                  productID,
		BrandID:             input.BrandID,
		BrandNameFA:         brandName,
		Slug:                slug,
		TitleFA:             localization.NormalizePersianText(input.TitleFA),
		ShortDescriptionFA:  input.ShortDescriptionFA,
		FullDescriptionFA:   input.FullDescriptionFA,
		ProductType:         input.ProductType,
		Status:              StatusDraft,
		IsFeatured:          input.IsFeatured,
		UsageInstructionsFA: input.UsageInstructionsFA,
		IngredientsFA:       input.IngredientsFA,
		WarningsFA:          input.WarningsFA,
		StorageConditionsFA: input.StorageConditionsFA,
		CountryOfOrigin:     input.CountryOfOrigin,
		LicenseNumber:       input.LicenseNumber,
		SEOTitle:            input.SEOTitle,
		SEODescription:      input.SEODescription,
		Version:             1,
		CreatedAt:           now,
		UpdatedAt:           now,
		AvailableStock:      input.InitialStock,
		Categories:          categories,
		Variants: []ProductVariant{
			{
				ID:                  variantID,
				ProductID:           productID,
				SKU:                 input.SKU,
				Barcode:             input.Barcode,
				TitleFA:             input.TitleFA,
				PriceIRR:            input.PriceIRR,
				CompareAtPriceIRR:   input.CompareAtPriceIRR,
				NetWeightGrams:      input.NetWeightGrams,
				ShippingWeightGrams: input.ShippingWeightGrams,
				IsActive:            true,
				Version:             1,
				CreatedAt:           now,
			},
		},
		Media: media,
	}

	s.products[productID] = prod
	s.bySlug[slug] = prod
	return prod, nil
}

func (s *Service) AdminUpdateProduct(id uuid.UUID, input UpdateProductInput) (*Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	prod, exists := s.products[id]
	if !exists {
		return nil, ErrProductNotFound
	}

	// Optimistic Concurrency check
	if input.Version > 0 && prod.Version != input.Version {
		return nil, ErrOptimisticLock
	}

	if input.TitleFA != nil {
		prod.TitleFA = localization.NormalizePersianText(*input.TitleFA)
	}
	if input.ShortDescriptionFA != nil {
		prod.ShortDescriptionFA = input.ShortDescriptionFA
	}
	if input.FullDescriptionFA != nil {
		prod.FullDescriptionFA = input.FullDescriptionFA
	}
	if input.IsFeatured != nil {
		prod.IsFeatured = *input.IsFeatured
	}
	if input.UsageInstructionsFA != nil {
		prod.UsageInstructionsFA = input.UsageInstructionsFA
	}
	if input.IngredientsFA != nil {
		prod.IngredientsFA = input.IngredientsFA
	}
	if input.WarningsFA != nil {
		prod.WarningsFA = input.WarningsFA
	}
	if input.StorageConditionsFA != nil {
		prod.StorageConditionsFA = input.StorageConditionsFA
	}
	if input.SEOTitle != nil {
		prod.SEOTitle = input.SEOTitle
	}
	if input.SEODescription != nil {
		prod.SEODescription = input.SEODescription
	}
	if input.BrandID != nil {
		prod.BrandID = input.BrandID
		if b, ok := s.brands[*input.BrandID]; ok {
			prod.BrandNameFA = &b.NameFA
		}
	}

	if input.CategoryIDs != nil {
		var categories []Category
		for _, catID := range input.CategoryIDs {
			if cat, ok := s.categories[catID]; ok {
				categories = append(categories, *cat)
			}
		}
		prod.Categories = categories
	}

	// Update default variant
	if len(prod.Variants) > 0 {
		v := &prod.Variants[0]
		if input.SKU != nil {
			// Check SKU conflict
			for _, p := range s.products {
				if p.ID == id {
					continue
				}
				for _, ev := range p.Variants {
					if ev.SKU == *input.SKU {
						return nil, ErrSKUExists
					}
				}
			}
			v.SKU = *input.SKU
		}
		if input.PriceIRR != nil {
			if *input.PriceIRR < 0 {
				return nil, ErrNegativePrice
			}
			v.PriceIRR = *input.PriceIRR
		}
		if input.CompareAtPriceIRR != nil {
			if *input.CompareAtPriceIRR <= v.PriceIRR {
				return nil, ErrInvalidCompareAtPrice
			}
			v.CompareAtPriceIRR = input.CompareAtPriceIRR
		}
		if input.NetWeightGrams != nil {
			v.NetWeightGrams = *input.NetWeightGrams
		}
		if input.ShippingWeightGrams != nil {
			if *input.ShippingWeightGrams < v.NetWeightGrams {
				return nil, ErrShippingWeightTooSmall
			}
			v.ShippingWeightGrams = *input.ShippingWeightGrams
		}
	}

	if input.Media != nil {
		var media []ProductMedia
		for i, m := range input.Media {
			media = append(media, ProductMedia{
				ID:        uuid.New(),
				ProductID: id,
				URL:       m.URL,
				AltFA:     m.AltFA,
				IsPrimary: m.IsPrimary,
				SortOrder: i + 1,
			})
		}
		prod.Media = media
	}

	prod.Version++
	prod.UpdatedAt = time.Now()
	return prod, nil
}

func (s *Service) AdminPublishProduct(id uuid.UUID) (*Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	prod, exists := s.products[id]
	if !exists {
		return nil, ErrProductNotFound
	}

	// Validate publication invariants
	if len(prod.Variants) == 0 {
		return nil, ErrCannotPublishMissingVariant
	}

	hasActiveVariant := false
	hasPositivePrice := false
	hasSKU := false
	for _, v := range prod.Variants {
		if v.IsActive {
			hasActiveVariant = true
		}
		if v.PriceIRR > 0 {
			hasPositivePrice = true
		}
		if strings.TrimSpace(v.SKU) != "" {
			hasSKU = true
		}
	}

	if !hasActiveVariant {
		return nil, ErrCannotPublishMissingVariant
	}
	if !hasPositivePrice {
		return nil, ErrCannotPublishMissingPrice
	}
	if !hasSKU {
		return nil, ErrCannotPublishMissingSKU
	}
	if len(prod.Categories) == 0 {
		return nil, ErrCannotPublishMissingCategory
	}

	hasPrimaryMedia := false
	for _, m := range prod.Media {
		if m.IsPrimary || len(prod.Media) == 1 {
			hasPrimaryMedia = true
			break
		}
	}
	if !hasPrimaryMedia && len(prod.Media) == 0 {
		return nil, ErrCannotPublishMissingPrimaryMedia
	}

	now := time.Now()
	prod.Status = StatusPublished
	prod.PublishedAt = &now
	prod.UpdatedAt = now
	prod.Version++
	return prod, nil
}

func (s *Service) AdminUnpublishProduct(id uuid.UUID) (*Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	prod, exists := s.products[id]
	if !exists {
		return nil, ErrProductNotFound
	}

	prod.Status = StatusUnpublished
	prod.UpdatedAt = time.Now()
	prod.Version++
	return prod, nil
}

func (s *Service) ArchiveProduct(id uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	prod, exists := s.products[id]
	if !exists {
		return ErrProductNotFound
	}

	prod.Status = StatusArchived
	prod.UpdatedAt = time.Now()
	prod.Version++
	return nil
}

func (s *Service) DeleteProduct(id uuid.UUID) error {
	// Invariant: Physical deletion forbidden for active/ordered products; soft archive enforced
	return ErrProductInUse
}

func (s *Service) ListCategories() []*Category {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*Category
	for _, c := range s.categories {
		if c.ParentID == nil {
			result = append(result, c)
		}
	}
	return result
}

func (s *Service) AdminListProducts(filter AdminProductFilter) ([]*Product, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var matched []*Product
	q := localization.NormalizeSearchQuery(filter.Query)

	for _, p := range s.products {
		if filter.Status != "" && filter.Status != "all" && string(p.Status) != filter.Status {
			continue
		}

		if filter.StockStatus == "in_stock" && p.AvailableStock <= 0 {
			continue
		}
		if filter.StockStatus == "out_of_stock" && p.AvailableStock > 0 {
			continue
		}

		if q != "" {
			titleMatch := strings.Contains(strings.ToLower(p.TitleFA), q)
			descMatch := p.ShortDescriptionFA != nil && strings.Contains(strings.ToLower(*p.ShortDescriptionFA), q)
			skuMatch := false
			for _, v := range p.Variants {
				if strings.Contains(strings.ToLower(v.SKU), q) {
					skuMatch = true
					break
				}
			}
			if !titleMatch && !descMatch && !skuMatch {
				continue
			}
		}

		if filter.CategorySlug != "" && filter.CategorySlug != "all" {
			catMatch := false
			for _, cat := range p.Categories {
				if cat.Slug == filter.CategorySlug {
					catMatch = true
					break
				}
			}
			if !catMatch {
				continue
			}
		}

		matched = append(matched, p)
	}

	// Sort
	sort.Slice(matched, func(i, j int) bool {
		if filter.Sort == "price_asc" && len(matched[i].Variants) > 0 && len(matched[j].Variants) > 0 {
			return matched[i].Variants[0].PriceIRR < matched[j].Variants[0].PriceIRR
		}
		if filter.Sort == "price_desc" && len(matched[i].Variants) > 0 && len(matched[j].Variants) > 0 {
			return matched[i].Variants[0].PriceIRR > matched[j].Variants[0].PriceIRR
		}
		return matched[i].CreatedAt.After(matched[j].CreatedAt)
	})

	total := len(matched)
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 10
	}

	start := (page - 1) * limit
	if start >= total {
		return []*Product{}, total
	}
	end := start + limit
	if end > total {
		end = total
	}

	return matched[start:end], total
}

func (s *Service) SearchProducts(filter ProductFilter) ([]*Product, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var matched []*Product
	q := localization.NormalizeSearchQuery(filter.Query)

	for _, p := range s.products {
		if p.Status != StatusPublished {
			continue
		}

		if q != "" {
			titleMatch := strings.Contains(strings.ToLower(p.TitleFA), q)
			descMatch := p.ShortDescriptionFA != nil && strings.Contains(strings.ToLower(*p.ShortDescriptionFA), q)
			if !titleMatch && !descMatch {
				continue
			}
		}

		if filter.CategorySlug != "" && filter.CategorySlug != "all" {
			catMatch := false
			for _, cat := range p.Categories {
				if cat.Slug == filter.CategorySlug {
					catMatch = true
					break
				}
			}
			if !catMatch {
				continue
			}
		}

		matched = append(matched, p)
	}

	// Sort
	sort.Slice(matched, func(i, j int) bool {
		if filter.Sort == "price_asc" && len(matched[i].Variants) > 0 && len(matched[j].Variants) > 0 {
			return matched[i].Variants[0].PriceIRR < matched[j].Variants[0].PriceIRR
		}
		if filter.Sort == "price_desc" && len(matched[i].Variants) > 0 && len(matched[j].Variants) > 0 {
			return matched[i].Variants[0].PriceIRR > matched[j].Variants[0].PriceIRR
		}
		return matched[i].CreatedAt.After(matched[j].CreatedAt)
	})

	total := len(matched)
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 12
	}

	start := (page - 1) * limit
	if start >= total {
		return []*Product{}, total
	}
	end := start + limit
	if end > total {
		end = total
	}

	return matched[start:end], total
}

func (s *Service) GetProductBySlug(slug string) (*Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, exists := s.bySlug[slug]
	if !exists || p.Status != StatusPublished {
		return nil, ErrProductNotFound
	}
	return p, nil
}
