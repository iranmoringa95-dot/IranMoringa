package content

import (
	"time"

	"github.com/google/uuid"
)

type ArticleStatus string

const (
	StatusDraft            ArticleStatus = "draft"
	StatusInReview         ArticleStatus = "in_review"
	StatusChangesRequested ArticleStatus = "changes_requested"
	StatusApproved         ArticleStatus = "approved"
	StatusScheduled        ArticleStatus = "scheduled"
	StatusPublished        ArticleStatus = "published"
	StatusArchived         ArticleStatus = "archived"
)

type Author struct {
	ID        uuid.UUID `json:"id"`
	NameFA    string    `json:"name_fa"`
	TitleFA   string    `json:"title_fa"`
	AvatarURL string    `json:"avatar_url,omitempty"`
}

type ScientificSource struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"title"`
	URL       string    `json:"url,omitempty"`
	Publisher string    `json:"publisher,omitempty"`
	Year      int       `json:"year,omitempty"`
}

type MedicalWarning struct {
	Condition     string `json:"condition"` // e.g. "pregnancy", "diabetes_blood_pressure", "allergy"
	WarningTextFA string `json:"warning_text_fa"`
}

type ArticleCategory struct {
	ID          uuid.UUID `json:"id"`
	NameFA      string    `json:"name_fa"`
	Slug        string    `json:"slug"`
	Description string    `json:"description,omitempty"`
	SortOrder   int       `json:"sort_order"`
}

type ArticleTag struct {
	ID     uuid.UUID `json:"id"`
	NameFA string    `json:"name_fa"`
	Slug   string    `json:"slug"`
}

type ArticleRevision struct {
	ID            uuid.UUID `json:"id"`
	ArticleID     uuid.UUID `json:"article_id"`
	Version       int       `json:"version"`
	TitleFA       string    `json:"title_fa"`
	SummaryFA     string    `json:"summary_fa"`
	ContentFA     string    `json:"content_fa"`
	DisclaimersFA string    `json:"disclaimers_fa"`
	AuthorID      uuid.UUID `json:"author_id"`
	CreatedAt     time.Time `json:"created_at"`
}

type Article struct {
	ID                    uuid.UUID          `json:"id"`
	CategoryID            uuid.UUID          `json:"category_id"`
	CategoryNameFA        string             `json:"category_name_fa"`
	CategorySlug          string             `json:"category_slug,omitempty"`
	AuthorID              uuid.UUID          `json:"author_id"`
	AuthorNameFA          string             `json:"author_name_fa"`
	ReviewerID            *uuid.UUID         `json:"reviewer_id,omitempty"`
	ReviewerNameFA        *string            `json:"reviewer_name_fa,omitempty"`
	Slug                  string             `json:"slug"`
	TitleFA               string             `json:"title_fa"`
	SummaryFA             string             `json:"summary_fa"`
	ContentFA             string             `json:"content_fa"`
	CoverImageURL         string             `json:"cover_image_url,omitempty"`
	Status                ArticleStatus      `json:"status"`
	Version               int                `json:"version"`
	ForbiddenClaimFlagged bool               `json:"forbidden_claim_flagged"`
	DisclaimersFA         string             `json:"disclaimers_fa"`
	MedicalWarnings       []MedicalWarning   `json:"medical_warnings,omitempty"`
	RejectionNotes        string             `json:"rejection_notes,omitempty"`
	ReadingTimeMinutes    int                `json:"reading_time_minutes"`
	SEOTitle              string             `json:"seo_title,omitempty"`
	SEODescription        string             `json:"seo_description,omitempty"`
	CanonicalURL          string             `json:"canonical_url,omitempty"`
	LastReviewedAt        *time.Time         `json:"last_reviewed_at,omitempty"`
	ScheduledAt           *time.Time         `json:"scheduled_at,omitempty"`
	PublishedAt           *time.Time         `json:"published_at,omitempty"`
	CreatedAt             time.Time          `json:"created_at"`
	UpdatedAt             time.Time          `json:"updated_at"`
	Sources               []ScientificSource `json:"sources,omitempty"`
	Tags                  []string           `json:"tags,omitempty"`
	RelatedProductIDs    []uuid.UUID        `json:"related_product_ids,omitempty"`
}

type FAQ struct {
	ID          uuid.UUID  `json:"id"`
	ContextType string     `json:"context_type"` // "general", "product", "article"
	ContextID   *uuid.UUID `json:"context_id,omitempty"`
	QuestionFA  string     `json:"question_fa"`
	AnswerFA    string     `json:"answer_fa"`
	SortOrder   int        `json:"sort_order"`
	IsActive    bool       `json:"is_active"`
}

