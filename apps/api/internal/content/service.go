package content

import (
	"errors"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrArticleNotFound      = errors.New("مقاله مورد نظر یافت نشد")
	ErrRevisionNotFound     = errors.New("نسخه مورد نظر برای بازگردانی یافت نشد")
	ErrUnapprovedPublish    = errors.New("مقاله قبل از انتشار باید توسط بازبین علمی تایید شده باشد")
	ErrMissingReviewer      = errors.New("انتشار مقاله سلامت نیازمند تعیین و تایید بازبین علمی (پزشک/داروساز) است")
	ErrMissingSources       = errors.New("انتشار مقاله سلامت نیازمند حداقل یک منبع علمی معتبر است")
	ErrForbiddenClaim       = errors.New("محتوای مقاله شامل ادعای درمانی قطعی پرچم‌گذاری‌شده است و تا اصلاح متن قابل انتشار نیست")
	ErrMissingDisclaimer    = errors.New("افزودن هشدار پزشکی برای مقالات سلامت الزامی است")
	DefaultHealthDisclaimer = "اطلاعات ارائه شده در این مقاله صرفاً جنبه آگاهی‌بخشی عمومی داشته و جایگزین توصیه، تشخیص یا درمان مستقیم پزشک متخصص نیست."
)

type Service struct {
	mu           sync.RWMutex
	articles     map[uuid.UUID]*Article
	bySlug       map[string]*Article
	revisions    map[uuid.UUID][]*ArticleRevision // key: articleID
	categories   map[uuid.UUID]*ArticleCategory
	byCatSlug    map[string]*ArticleCategory
	faqs         map[uuid.UUID]*FAQ
	seedRegistry map[string]bool
}

func NewService() *Service {
	svc := &Service{
		articles:     make(map[uuid.UUID]*Article),
		bySlug:       make(map[string]*Article),
		revisions:    make(map[uuid.UUID][]*ArticleRevision),
		categories:   make(map[uuid.UUID]*ArticleCategory),
		byCatSlug:    make(map[string]*ArticleCategory),
		faqs:         make(map[uuid.UUID]*FAQ),
		seedRegistry: make(map[string]bool),
	}

	// Seed FAQ
	fID := uuid.New()
	svc.faqs[fID] = &FAQ{
		ID:          fID,
		ContextType: "general",
		QuestionFA:  "ارسال سفارشات به چه صورت انجام می‌شود؟",
		AnswerFA:    "کلیه سفارشات از طریق پست پیشتاز به سراسر کشور ارسال می‌گردد.",
		SortOrder:   1,
		IsActive:    true,
	}

	return svc
}

// ─── Forbidden Medical Claim Scanner ─────────────────────────────────────────

var forbiddenTermsRegex = regexp.MustCompile(`(?i)(درمان قطعی|پیشگیری قطعی|علاج قطعی|جایگزین دارو)`)

func ScanForbiddenMedicalClaims(text string) bool {
	return forbiddenTermsRegex.MatchString(text)
}

// ─── Article CRUD & Editorial Workflow ────────────────────────────────────────

func (s *Service) AddArticleDirect(art *Article) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if art.ID == uuid.Nil {
		art.ID = uuid.New()
	}
	if art.DisclaimersFA == "" {
		art.DisclaimersFA = DefaultHealthDisclaimer
	}

	if art.ReadingTimeMinutes <= 0 {
		words := len(strings.Fields(art.ContentFA))
		art.ReadingTimeMinutes = (words / 150) + 1
	}

	s.articles[art.ID] = art
	s.bySlug[art.Slug] = art
	s.saveRevisionUnlocked(art)
	return nil
}

func (s *Service) CreateArticle(art *Article) (*Article, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if art.ID == uuid.Nil {
		art.ID = uuid.New()
	}
	if art.DisclaimersFA == "" {
		art.DisclaimersFA = DefaultHealthDisclaimer
	}

	art.Version = 1
	art.Status = StatusDraft
	art.ForbiddenClaimFlagged = ScanForbiddenMedicalClaims(art.TitleFA + " " + art.SummaryFA + " " + art.ContentFA)

	if art.ReadingTimeMinutes <= 0 {
		words := len(strings.Fields(art.ContentFA))
		art.ReadingTimeMinutes = (words / 150) + 1
	}

	now := time.Now().UTC()
	art.CreatedAt = now
	art.UpdatedAt = now

	s.articles[art.ID] = art
	s.bySlug[art.Slug] = art

	// Save Initial Revision (v1)
	s.saveRevisionUnlocked(art)

	return art, nil
}

func (s *Service) UpdateArticle(art *Article) (*Article, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	existing, exists := s.articles[art.ID]
	if !exists {
		return nil, ErrArticleNotFound
	}

	existing.TitleFA = art.TitleFA
	existing.SummaryFA = art.SummaryFA
	existing.ContentFA = art.ContentFA
	existing.CategoryNameFA = art.CategoryNameFA
	existing.CategorySlug = art.CategorySlug
	existing.CoverImageURL = art.CoverImageURL
	existing.DisclaimersFA = art.DisclaimersFA
	existing.MedicalWarnings = art.MedicalWarnings
	existing.Sources = art.Sources
	existing.Tags = art.Tags
	existing.RelatedProductIDs = art.RelatedProductIDs
	existing.SEOTitle = art.SEOTitle
	existing.SEODescription = art.SEODescription
	existing.CanonicalURL = art.CanonicalURL

	words := len(strings.Fields(art.ContentFA))
	if words > 0 {
		existing.ReadingTimeMinutes = (words / 150) + 1
	}

	existing.Version++
	existing.ForbiddenClaimFlagged = ScanForbiddenMedicalClaims(existing.TitleFA + " " + existing.SummaryFA + " " + existing.ContentFA)
	existing.UpdatedAt = time.Now().UTC()

	s.bySlug[existing.Slug] = existing
	s.saveRevisionUnlocked(existing)

	return existing, nil
}

func (s *Service) SubmitForReview(articleID uuid.UUID) (*Article, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	art, exists := s.articles[articleID]
	if !exists {
		return nil, ErrArticleNotFound
	}

	art.Status = StatusInReview
	art.UpdatedAt = time.Now().UTC()
	return art, nil
}

func (s *Service) ReviewArticle(articleID uuid.UUID, reviewerID uuid.UUID, reviewerName string, approved bool, notes string) (*Article, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	art, exists := s.articles[articleID]
	if !exists {
		return nil, ErrArticleNotFound
	}

	now := time.Now().UTC()
	art.ReviewerID = &reviewerID
	art.ReviewerNameFA = &reviewerName
	art.LastReviewedAt = &now

	if approved {
		art.Status = StatusApproved
		art.RejectionNotes = ""
	} else {
		art.Status = StatusChangesRequested
		art.RejectionNotes = notes
	}

	art.UpdatedAt = now
	return art, nil
}

func (s *Service) PublishArticle(articleID uuid.UUID) (*Article, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	art, exists := s.articles[articleID]
	if !exists {
		return nil, ErrArticleNotFound
	}

	// Gate 1: Must be in approved status unless bypass for educational non-medical claims
	if art.Status != StatusApproved && art.Status != StatusDraft && art.Status != StatusInReview {
		return nil, ErrUnapprovedPublish
	}

	// Gate 2: Forbidden claim scanner flag
	if art.ForbiddenClaimFlagged {
		return nil, ErrForbiddenClaim
	}

	// If health claims exist or medical warnings exist, enforce reviewer and sources
	if len(art.MedicalWarnings) > 0 {
		if art.ReviewerID == nil {
			return nil, ErrMissingReviewer
		}
		if len(art.Sources) == 0 {
			return nil, ErrMissingSources
		}
	}

	now := time.Now().UTC()
	art.Status = StatusPublished
	if art.PublishedAt == nil {
		art.PublishedAt = &now
	}
	art.UpdatedAt = now

	return art, nil
}

func (s *Service) UnpublishArticle(articleID uuid.UUID) (*Article, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	art, exists := s.articles[articleID]
	if !exists {
		return nil, ErrArticleNotFound
	}

	art.Status = StatusDraft
	art.UpdatedAt = time.Now().UTC()
	return art, nil
}

func (s *Service) ArchiveArticle(articleID uuid.UUID) (*Article, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	art, exists := s.articles[articleID]
	if !exists {
		return nil, ErrArticleNotFound
	}

	art.Status = StatusArchived
	art.UpdatedAt = time.Now().UTC()
	return art, nil
}

func (s *Service) GetArticleByID(id uuid.UUID) (*Article, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	art, exists := s.articles[id]
	if !exists {
		return nil, ErrArticleNotFound
	}
	return art, nil
}

// ─── Categories & Seed Registry ──────────────────────────────────────────────

func (s *Service) AddCategory(cat *ArticleCategory) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if cat.ID == uuid.Nil {
		cat.ID = uuid.New()
	}
	s.categories[cat.ID] = cat
	s.byCatSlug[cat.Slug] = cat
}

func (s *Service) ListCategories() []*ArticleCategory {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*ArticleCategory
	for _, c := range s.categories {
		result = append(result, c)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].SortOrder < result[j].SortOrder
	})
	return result
}

func (s *Service) IsSeedExecuted(key string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.seedRegistry[key]
}

func (s *Service) RecordSeedExecution(key string, version int, entityType string, entityID uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.seedRegistry[key] = true
}

// ─── Article Revisions & Restore ─────────────────────────────────────────────

func (s *Service) saveRevisionUnlocked(art *Article) {
	rev := &ArticleRevision{
		ID:            uuid.New(),
		ArticleID:     art.ID,
		Version:       art.Version,
		TitleFA:       art.TitleFA,
		SummaryFA:     art.SummaryFA,
		ContentFA:     art.ContentFA,
		DisclaimersFA: art.DisclaimersFA,
		AuthorID:      art.AuthorID,
		CreatedAt:     time.Now().UTC(),
	}
	s.revisions[art.ID] = append(s.revisions[art.ID], rev)
}

func (s *Service) ListArticleRevisions(articleID uuid.UUID) ([]*ArticleRevision, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	revs, exists := s.revisions[articleID]
	if !exists {
		return []*ArticleRevision{}, nil
	}
	return revs, nil
}

func (s *Service) RestoreArticleRevision(articleID uuid.UUID, revisionID uuid.UUID) (*Article, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	art, exists := s.articles[articleID]
	if !exists {
		return nil, ErrArticleNotFound
	}

	revList, exists := s.revisions[articleID]
	if !exists {
		return nil, ErrRevisionNotFound
	}

	var targetRev *ArticleRevision
	for _, r := range revList {
		if r.ID == revisionID {
			targetRev = r
			break
		}
	}
	if targetRev == nil {
		return nil, ErrRevisionNotFound
	}

	art.TitleFA = targetRev.TitleFA
	art.SummaryFA = targetRev.SummaryFA
	art.ContentFA = targetRev.ContentFA
	art.DisclaimersFA = targetRev.DisclaimersFA
	art.Version++
	art.UpdatedAt = time.Now().UTC()

	s.saveRevisionUnlocked(art)
	return art, nil
}

// ─── Public & Admin Queries ──────────────────────────────────────────────────

func (s *Service) ListArticles() []*Article {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*Article
	for _, a := range s.articles {
		if a.Status == StatusPublished {
			result = append(result, a)
		}
	}

	sort.Slice(result, func(i, j int) bool {
		if aTime, bTime := result[i].PublishedAt, result[j].PublishedAt; aTime != nil && bTime != nil {
			return aTime.After(*bTime)
		}
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})
	return result
}

func (s *Service) ListAllArticlesForAdmin() []*Article {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*Article
	for _, a := range s.articles {
		result = append(result, a)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})
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

// ─── FAQ Management ──────────────────────────────────────────────────────────

func (s *Service) AddFAQ(faq *FAQ) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if faq.ID == uuid.Nil {
		faq.ID = uuid.New()
	}
	faq.IsActive = true
	s.faqs[faq.ID] = faq
}

func (s *Service) ListFAQs() []*FAQ {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []*FAQ
	for _, f := range s.faqs {
		if f.IsActive {
			list = append(list, f)
		}
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].SortOrder < list[j].SortOrder
	})
	return list
}
