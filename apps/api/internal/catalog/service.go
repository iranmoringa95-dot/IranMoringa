package catalog

import (
	"errors"
	"strings"
	"sync"

	"github.com/google/uuid"
	"moringalab/api/internal/localization"
)

var (
	ErrProductNotFound       = errors.New("محصول مورد نظر یافت نشد")
	ErrCategoryNotFound      = errors.New("دسته‌بندی مورد نظر یافت نشد")
	ErrCategoryCycle         = errors.New("ایجاد رابطه چرخه‌ای (دور) در دسته‌بندی‌ها امکان‌پذیر نیست")
	ErrNegativePrice         = errors.New("قیمت محصول نمی‌تواند منفی باشد")
	ErrInvalidCompareAtPrice = errors.New("قیمت قبل از تخفیف باید از قیمت اصلی بیشتر باشد")
	ErrNoVariant             = errors.New("هر محصول قابل فروش باید حداقل یک متغیر فعال داشته باشد")
)

type Service struct {
	mu         sync.RWMutex
	categories map[uuid.UUID]*Category
	products   map[uuid.UUID]*Product
	bySlug     map[string]*Product
	brands     map[uuid.UUID]*Brand
	attributes map[uuid.UUID]*Attribute
}

func NewService() *Service {
	return &Service{
		categories: make(map[uuid.UUID]*Category),
		products:   make(map[uuid.UUID]*Product),
		bySlug:     make(map[string]*Product),
		brands:     make(map[uuid.UUID]*Brand),
		attributes: make(map[uuid.UUID]*Attribute),
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
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	prod.TitleFA = localization.NormalizePersianText(prod.TitleFA)
	s.products[prod.ID] = prod
	s.bySlug[prod.Slug] = prod
	return nil
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

		if filter.CategorySlug != "" {
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
