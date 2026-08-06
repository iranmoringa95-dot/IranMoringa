package catalog

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrProductNotFound       = errors.New("محصول مورد نظر یافت نشد")
	ErrCategoryNotFound      = errors.New("دسته‌بندی مورد نظر یافت نشد")
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
}

func NewService() *Service {
	return &Service{
		categories: make(map[uuid.UUID]*Category),
		products:   make(map[uuid.UUID]*Product),
		bySlug:     make(map[string]*Product),
		brands:     make(map[uuid.UUID]*Brand),
	}
}

func (s *Service) AddCategory(cat *Category) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.categories[cat.ID] = cat
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
	q := strings.ToLower(strings.TrimSpace(filter.Query))

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
