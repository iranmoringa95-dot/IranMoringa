package media

import (
	"time"

	"github.com/google/uuid"
)

type AssetStatus string

const (
	StatusUploading AssetStatus = "uploading"
	StatusReady     AssetStatus = "ready"
	StatusFailed    AssetStatus = "failed"
	StatusDeleted   AssetStatus = "deleted"
)

type MediaAsset struct {
	ID           uuid.UUID   `json:"id"`
	UploaderID   string      `json:"uploader_id"`
	OriginalName string      `json:"original_name"`
	ObjectKey    string      `json:"object_key"`
	Bucket       string      `json:"bucket"`
	DetectedMIME string      `json:"detected_mime"`
	SizeBytes    int64       `json:"size_bytes"`
	Width        int         `json:"width"`
	Height       int         `json:"height"`
	ChecksumSHA  string      `json:"checksum_sha"`
	Status       AssetStatus `json:"status"`
	TitleFA      string      `json:"title_fa"`
	AltTextFA    string      `json:"alt_text_fa"`
	PublicURL    string      `json:"public_url"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

type MediaUsage struct {
	AssetID    uuid.UUID `json:"asset_id"`
	EntityType string    `json:"entity_type"`
	EntityID   string    `json:"entity_id"`
	FieldName  string    `json:"field_name"`
}
