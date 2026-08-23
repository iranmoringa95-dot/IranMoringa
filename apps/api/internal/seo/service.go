package seo

import (
	"encoding/xml"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
	"moringalab/api/internal/reviews"
)

var (
	ErrRedirectLoop  = errors.New("ایجاد حلقه ریدایرکت (Loop) مجاز نیست")
	ErrRuleNotFound  = errors.New("قانون ریدایرکت یافت نشد")
	DefaultCanonical = "https://iranmoringa.ir"
)

// Sitemap XML Structs
type SitemapURL struct {
	XMLName    xml.Name `xml:"url"`
	Loc        string   `xml:"loc"`
	LastMod    string   `xml:"lastmod,omitempty"`
	ChangeFreq string   `xml:"changefreq,omitempty"`
	Priority   string   `xml:"priority,omitempty"`
}

type SitemapURLSet struct {
	XMLName xml.Name     `xml:"http://www.sitemaps.org/schemas/sitemap/0.9 urlset"`
	URLs    []SitemapURL `xml:"url"`
}

type Service struct {
	mu           sync.RWMutex
	canonicalURL string
	redirects    map[string]*RedirectRule // key: normalized source path
	rulesByID    map[uuid.UUID]*RedirectRule
	notFound     map[string]*NotFoundEvent // key: normalized path
	legacy       map[string]*LegacyURLMapping

	catalogSvc *catalog.Service
	contentSvc *content.Service
	reviewsSvc *reviews.Service
}

func NewService(canonicalBase string, catalogSvc *catalog.Service, contentSvc *content.Service, reviewsSvc *reviews.Service) *Service {
	if canonicalBase == "" {
		canonicalBase = DefaultCanonical
	}
	canonicalBase = strings.TrimRight(canonicalBase, "/")

	svc := &Service{
		canonicalURL: canonicalBase,
		redirects:    make(map[string]*RedirectRule),
		rulesByID:    make(map[uuid.UUID]*RedirectRule),
		notFound:     make(map[string]*NotFoundEvent),
		legacy:       make(map[string]*LegacyURLMapping),
		catalogSvc:   catalogSvc,
		contentSvc:   contentSvc,
		reviewsSvc:   reviewsSvc,
	}

	// Seed legacy URL redirects (moringa-iran.ir / iran-moringa.ir -> canonical)
	svc.AddRedirectRule(&RedirectRule{
		SourcePath: "/shop/old-moringa-oil",
		TargetURL:  "/product/moringa-oil-30ml",
		StatusCode: 301,
		IsActive:   true,
		CreatedBy:  "System Migration",
	})

	return svc
}

func (s *Service) GetCanonicalBase() string {
	return s.canonicalURL
}

func normalizePath(p string) string {
	p = strings.TrimSpace(p)
	p = strings.ToLower(p)
	if p != "/" {
		p = strings.TrimRight(p, "/")
	}
	if !strings.HasPrefix(p, "/") && !strings.HasPrefix(p, "http") {
		p = "/" + p
	}
	return p
}

// ─── Redirect Rules Engine (Loop & Chain Guard) ─────────────────────────────

func (s *Service) AddRedirectRule(rule *RedirectRule) (*RedirectRule, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	normSource := normalizePath(rule.SourcePath)
	normTarget := normalizePath(rule.TargetURL)

	// Loop Guard: Cannot redirect to self
	if normSource == normTarget {
		return nil, ErrRedirectLoop
	}

	// Chain Guard: If target is already a source in an existing rule, resolve to final destination
	if existingTarget, exists := s.redirects[normTarget]; exists {
		rule.TargetURL = existingTarget.TargetURL
	}

	if rule.ID == uuid.Nil {
		rule.ID = uuid.New()
	}
	rule.SourcePath = normSource
	rule.StatusCode = 301
	rule.IsActive = true
	rule.CreatedAt = time.Now()

	s.redirects[normSource] = rule
	s.rulesByID[rule.ID] = rule
	return rule, nil
}

func (s *Service) MatchRedirect(path string) (*RedirectRule, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	norm := normalizePath(path)
	rule, exists := s.redirects[norm]
	if !exists || !rule.IsActive {
		return nil, false
	}

	now := time.Now()
	rule.HitCount++
	rule.LastHitAt = &now
	return rule, true
}

func (s *Service) DeleteRedirectRule(id uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	rule, exists := s.rulesByID[id]
	if !exists {
		return ErrRuleNotFound
	}

	delete(s.redirects, rule.SourcePath)
	delete(s.rulesByID, id)
	return nil
}

func (s *Service) ListRedirectRules() []*RedirectRule {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*RedirectRule, 0, len(s.rulesByID))
	for _, r := range s.rulesByID {
		list = append(list, r)
	}
	return list
}

// ─── 404 Event Tracker ───────────────────────────────────────────────────────

func (s *Service) Record404Event(path string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	norm := normalizePath(path)
	now := time.Now()

	ev, exists := s.notFound[norm]
	if exists {
		ev.HitCount++
		ev.LastSeenAt = now
	} else {
		ev = &NotFoundEvent{
			ID:             uuid.New(),
			PathNormalized: norm,
			HitCount:       1,
			FirstSeenAt:    now,
			LastSeenAt:     now,
		}
		s.notFound[norm] = ev
	}
}

func (s *Service) List404Events() []*NotFoundEvent {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*NotFoundEvent, 0, len(s.notFound))
	for _, ev := range s.notFound {
		list = append(list, ev)
	}
	return list
}

// ─── Dynamic XML Sitemap Generator ──────────────────────────────────────────

func (s *Service) GenerateSitemapXML() ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	nowStr := time.Now().Format("2006-01-02")
	urls := []SitemapURL{
		{Loc: s.canonicalURL + "/", LastMod: nowStr, ChangeFreq: "daily", Priority: "1.0"},
		{Loc: s.canonicalURL + "/shop", LastMod: nowStr, ChangeFreq: "daily", Priority: "0.9"},
		{Loc: s.canonicalURL + "/articles", LastMod: nowStr, ChangeFreq: "weekly", Priority: "0.8"},
		{Loc: s.canonicalURL + "/tracking", LastMod: nowStr, ChangeFreq: "monthly", Priority: "0.5"},
	}

	// Add Published Products
	if s.catalogSvc != nil {
		products, _ := s.catalogSvc.SearchProducts(catalog.ProductFilter{Limit: 1000})
		for _, p := range products {
			urls = append(urls, SitemapURL{
				Loc:        fmt.Sprintf("%s/product/%s", s.canonicalURL, p.Slug),
				LastMod:    nowStr,
				ChangeFreq: "daily",
				Priority:   "0.8",
			})
		}
	}

	// Add Published Articles
	if s.contentSvc != nil {
		articles := s.contentSvc.ListArticles()
		for _, a := range articles {
			modStr := nowStr
			if a.PublishedAt != nil {
				modStr = a.PublishedAt.Format("2006-01-02")
			}
			urls = append(urls, SitemapURL{
				Loc:        fmt.Sprintf("%s/articles/%s", s.canonicalURL, a.Slug),
				LastMod:    modStr,
				ChangeFreq: "weekly",
				Priority:   "0.7",
			})
		}
	}

	urlset := SitemapURLSet{URLs: urls}
	xmlHeader := []byte(xml.Header)
	xmlData, err := xml.MarshalIndent(urlset, "", "  ")
	if err != nil {
		return nil, err
	}

	return append(xmlHeader, xmlData...), nil
}

// ─── Dynamic Robots.txt Generator ───────────────────────────────────────────

func (s *Service) GenerateRobotsTxt() string {
	return fmt.Sprintf(`User-agent: *
Allow: /
Allow: /shop
Allow: /product/
Allow: /articles/
Disallow: /admin/
Disallow: /account/
Disallow: /cart
Disallow: /checkout
Disallow: /api/

Sitemap: %s/sitemap.xml
`, s.canonicalURL)
}

// ─── JSON-LD Structured Data Builder ─────────────────────────────────────────

func (s *Service) BuildProductJSONLD(prod *catalog.Product, reviewsSummary *reviews.ProductReviewSummary) map[string]interface{} {
	productURL := fmt.Sprintf("%s/product/%s", s.canonicalURL, prod.Slug)

	var desc string
	if prod.ShortDescriptionFA != nil {
		desc = *prod.ShortDescriptionFA
	} else if prod.FullDescriptionFA != nil {
		desc = *prod.FullDescriptionFA
	}

	var sku string
	var priceIRR int64
	if len(prod.Variants) > 0 {
		sku = prod.Variants[0].SKU
		priceIRR = prod.Variants[0].PriceIRR
	}

	schema := map[string]interface{}{
		"@context":    "https://schema.org/",
		"@type":       "Product",
		"name":        prod.TitleFA,
		"description": desc,
		"sku":         sku,
		"url":         productURL,
		"offers": map[string]interface{}{
			"@type":         "Offer",
			"priceCurrency": "IRR",
			"price":         priceIRR,
			"availability":  "https://schema.org/InStock",
			"url":           productURL,
		},
	}

	if len(prod.Media) > 0 {
		schema["image"] = prod.Media[0].URL
	}

	// AggregateRating ONLY if approved reviews > 0
	if reviewsSummary != nil && reviewsSummary.TotalReviews > 0 {
		schema["aggregateRating"] = map[string]interface{}{
			"@type":       "AggregateRating",
			"ratingValue": fmt.Sprintf("%.1f", reviewsSummary.AverageRating),
			"reviewCount": reviewsSummary.TotalReviews,
		}
	}

	return schema
}

func (s *Service) BuildArticleJSONLD(art *content.Article) map[string]interface{} {
	articleURL := fmt.Sprintf("%s/articles/%s", s.canonicalURL, art.Slug)

	schema := map[string]interface{}{
		"@context":      "https://schema.org",
		"@type":         "Article",
		"headline":      art.TitleFA,
		"description":   art.SummaryFA,
		"url":           articleURL,
		"datePublished": art.CreatedAt.Format(time.RFC3339),
		"dateModified":  art.UpdatedAt.Format(time.RFC3339),
		"author": map[string]interface{}{
			"@type": "Person",
			"name":  art.AuthorNameFA,
		},
	}

	if art.ReviewerNameFA != nil {
		schema["reviewedBy"] = map[string]interface{}{
			"@type": "Person",
			"name":  *art.ReviewerNameFA,
		}
	}

	return schema
}
