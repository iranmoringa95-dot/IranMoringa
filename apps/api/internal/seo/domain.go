package seo

import (
	"time"

	"github.com/google/uuid"
)

type RedirectRule struct {
	ID         uuid.UUID  `json:"id"`
	SourcePath string     `json:"source_path"`
	TargetURL  string     `json:"target_url"`
	StatusCode int        `json:"status_code"` // 301 or 302
	IsActive   bool       `json:"is_active"`
	HitCount   int        `json:"hit_count"`
	LastHitAt  *time.Time `json:"last_hit_at,omitempty"`
	CreatedBy  string     `json:"created_by"`
	CreatedAt  time.Time  `json:"created_at"`
}

type NotFoundEvent struct {
	ID                 uuid.UUID `json:"id"`
	PathNormalized     string    `json:"path_normalized"`
	HitCount           int       `json:"hit_count"`
	FirstSeenAt        time.Time `json:"first_seen_at"`
	LastSeenAt         time.Time `json:"last_seen_at"`
	SuggestedTargetURL string    `json:"suggested_target_url,omitempty"`
}

type LegacyURLMapping struct {
	ID               uuid.UUID `json:"id"`
	SourceDomain     string    `json:"source_domain"` // "moringa-iran.ir" or "iran-moringa.ir"
	SourcePath       string    `json:"source_path"`
	TargetEntityPath string    `json:"target_entity_path"`
	IsMigrated       bool      `json:"is_migrated"`
}

type SEOMetadata struct {
	Title         string      `json:"title"`
	Description   string      `json:"description"`
	CanonicalURL  string      `json:"canonical_url"`
	Robots        string      `json:"robots"`
	OGTitle       string      `json:"og_title"`
	OGDescription string      `json:"og_description"`
	OGImage       string      `json:"og_image,omitempty"`
	JSONLDSchema  interface{} `json:"json_ld_schema,omitempty"`
}
