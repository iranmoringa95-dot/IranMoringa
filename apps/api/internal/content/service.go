package content

import (
	"errors"
	"sync"

	"github.com/google/uuid"
)

var (
	ErrArticleNotFound      = errors.New("مقاله مورد نظر یافت نشد")
	ErrUnapprovedPublish    = errors.New("مقاله قبل از انتشار باید توسط بازبین علمی تایید شود")
	ErrMissingDisclaimer    = errors.New("افزودن هشدار پزشکی برای مقالات سلامت الزامی است")
	DefaultHealthDisclaimer = "اطلاعات ارائه شده در این مقاله صرفاً جنبه آگاهی‌بخشی عمومی داشته و جایگزین توصیه، تشخیص یا درمان مستقیم پزشک متخصص نیست."
)

type Service struct {
	mu       sync.RWMutex
	articles map[uuid.UUID]*Article
	bySlug   map[string]*Article
	faqs     []*FAQ
}

func NewService() *Service {
	return &Service{
		articles: make(map[uuid.UUID]*Article),
		bySlug:   make(map[string]*Article),
		faqs:     make([]*FAQ, 0),
	}
}

func (s *Service) AddArticle(article *Article) error {
	if article.DisclaimersFA == "" {
		article.DisclaimersFA = DefaultHealthDisclaimer
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.articles[article.ID] = article
	s.bySlug[article.Slug] = article
	return nil
}

func (s *Service) AddFAQ(faq *FAQ) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.faqs = append(s.faqs, faq)
}

func (s *Service) ListArticles() []*Article {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*Article
	for _, a := range s.articles {
		if a.Status == StatusPublished {
			result = append(result, a)
		}
	}
	return result
}

func (s *Service) GetArticleBySlug(slug string) (*Article, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	a, exists := s.bySlug[slug]
	if !exists || a.Status != StatusPublished {
		return nil, ErrArticleNotFound
	}
	return a, nil
}

func (s *Service) ListFAQs() []*FAQ {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.faqs
}
