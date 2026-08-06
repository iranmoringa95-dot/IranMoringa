package media

import (
	"context"
	"io"
	"time"
)

type UploadSession struct {
	SessionID string    `json:"session_id"`
	ObjectKey string    `json:"object_key"`
	UploadURL string    `json:"upload_url"`
	ExpiresAt time.Time `json:"expires_at"`
}

type ObjectHeader struct {
	ObjectKey    string `json:"object_key"`
	SizeBytes    int64  `json:"size_bytes"`
	DetectedMIME string `json:"detected_mime"`
}

type ObjectStorage interface {
	CreateUploadSession(ctx context.Context, key string, intendedMIME string, maxSize int64) (*UploadSession, error)
	CompleteUpload(ctx context.Context, sessionID string) (*ObjectHeader, error)
	GetSignedURL(ctx context.Context, key string, ttl time.Duration) (string, error)
	DeleteObject(ctx context.Context, key string) error
	HeadObject(ctx context.Context, key string) (*ObjectHeader, error)
	PutObject(ctx context.Context, key string, content io.Reader, mime string) error
}
