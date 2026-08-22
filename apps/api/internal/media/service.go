package media

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"moringalab/api/internal/localization"
)

var (
	ErrInvalidMIME   = errors.New("فرمت فایل مورد نظر پشتیبانی نمی‌شود (فرمت‌های مجاز: JPEG, PNG, WebP, AVIF)")
	ErrMissingAltText = errors.New("متن جایگزین (Alt Text) به زبان فارسی الزامی است")
	ErrAssetInUse    = errors.New("این تصویر در کاتالوگ یا مقالات استفاده شده است و ابتدا باید متصل‌بودن آن برطرف گردد")
	ErrAssetNotFound = errors.New("تصویر مورد نظر یافت نشد")
)

// Magic bytes signature detector
func DetectMIMEFromBytes(content []byte) (string, error) {
	if len(content) < 4 {
		return "", ErrInvalidMIME
	}

	// JPEG: FF D8 FF
	if content[0] == 0xFF && content[1] == 0xD8 && content[2] == 0xFF {
		return "image/jpeg", nil
	}
	// PNG: 89 50 4E 47
	if content[0] == 0x89 && content[1] == 0x50 && content[2] == 0x4E && content[3] == 0x47 {
		return "image/png", nil
	}
	// WebP: RIFF ... WEBP
	if len(content) >= 12 && string(content[0:4]) == "RIFF" && string(content[8:12]) == "WEBP" {
		return "image/webp", nil
	}

	return "", ErrInvalidMIME
}

type Service struct {
	mu      sync.RWMutex
	storage ObjectStorage
	assets  map[uuid.UUID]*MediaAsset
	usages  map[uuid.UUID][]MediaUsage
}

func NewService(storage ObjectStorage) *Service {
	return &Service{
		storage: storage,
		assets:  make(map[uuid.UUID]*MediaAsset),
		usages:  make(map[uuid.UUID][]MediaUsage),
	}
}

func (s *Service) CreateUploadSession(ctx context.Context, uploaderID, filename, intendedMIME string, maxSize int64) (*UploadSession, error) {
	if intendedMIME != "image/jpeg" && intendedMIME != "image/png" && intendedMIME != "image/webp" && intendedMIME != "image/avif" {
		return nil, ErrInvalidMIME
	}

	// Generate random non-guessable object key
	objectKey := fmt.Sprintf("media/%s/%s", time.Now().Format("2006/01"), uuid.New().String())
	return s.storage.CreateUploadSession(ctx, objectKey, intendedMIME, maxSize)
}

func (s *Service) RegisterAsset(ctx context.Context, uploaderID, originalName, objectKey, mime string, sizeBytes int64, titleFA, altTextFA string) (*MediaAsset, error) {
	altTextFA = localization.NormalizePersianText(altTextFA)
	if strings.TrimSpace(altTextFA) == "" {
		return nil, ErrMissingAltText
	}

	assetID := uuid.New()
	publicURL, _ := s.storage.GetSignedURL(ctx, objectKey, 24*time.Hour)

	asset := &MediaAsset{
		ID:           assetID,
		UploaderID:   uploaderID,
		OriginalName: localization.NormalizePersianText(originalName),
		ObjectKey:    objectKey,
		Bucket:       "moringalab-media",
		DetectedMIME: mime,
		SizeBytes:    sizeBytes,
		Width:        1200,
		Height:       800,
		Status:       StatusReady,
		TitleFA:      localization.NormalizePersianText(titleFA),
		AltTextFA:    altTextFA,
		PublicURL:    publicURL,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	s.mu.Lock()
	s.assets[assetID] = asset
	s.mu.Unlock()

	return asset, nil
}

func (s *Service) ListAssets() []MediaAsset {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]MediaAsset, 0, len(s.assets))
	for _, a := range s.assets {
		if a.Status != StatusDeleted {
			result = append(result, *a)
		}
	}
	return result
}

func (s *Service) AttachUsage(assetID uuid.UUID, entityType, entityID, fieldName string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.usages[assetID] = append(s.usages[assetID], MediaUsage{
		AssetID:    assetID,
		EntityType: entityType,
		EntityID:   entityID,
		FieldName:  fieldName,
	})
}

func (s *Service) DeleteAsset(ctx context.Context, assetID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	asset, exists := s.assets[assetID]
	if !exists || asset.Status == StatusDeleted {
		return ErrAssetNotFound
	}

	// Deletion Guard: Check if asset is actively used
	if activeUsages, hasUsages := s.usages[assetID]; hasUsages && len(activeUsages) > 0 {
		return ErrAssetInUse
	}

	asset.Status = StatusDeleted
	_ = s.storage.DeleteObject(ctx, asset.ObjectKey)
	return nil
}
