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

type ArticleCategory struct {
	ID     uuid.UUID `json:"id"`
	NameFA string    `json:"name_fa"`
	Slug   string    `json:"slug"`
}

type Article struct {
	ID                 uuid.UUID          `json:"id"`
	CategoryID         uuid.UUID          `json:"category_id"`
	CategoryNameFA     string             `json:"category_name_fa"`
	AuthorID           uuid.UUID          `json:"author_id"`
	AuthorNameFA       string             `json:"author_name_fa"`
	ReviewerID         *uuid.UUID         `json:"reviewer_id,omitempty"`
	ReviewerNameFA     *string            `json:"reviewer_name_fa,omitempty"`
	Slug               string             `json:"slug"`
	TitleFA            string             `json:"title_fa"`
	SummaryFA          string             `json:"summary_fa"`
	ContentFA          string             `json:"content_fa"`
	CoverImageURL      string             `json:"cover_image_url,omitempty"`
	Status             ArticleStatus      `json:"status"`
	DisclaimersFA      string             `json:"disclaimers_fa"`
	LastReviewedAt     *time.Time         `json:"last_reviewed_at,omitempty"`
	PublishedAt        *time.Time         `json:"published_at,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
	Sources            []ScientificSource `json:"sources,omitempty"`
	RelatedProductIDs []uuid.UUID        `json:"related_product_ids,omitempty"`
}

type FAQ struct {
	ID         uuid.UUID `json:"id"`
	QuestionFA string    `json:"question_fa"`
	AnswerFA   string    `json:"answer_fa"`
	SortOrder  int       `json:"sort_order"`
}
