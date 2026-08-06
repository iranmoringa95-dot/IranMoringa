package media

import (
	"context"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/google/uuid"
)

type FakeStorage struct {
	mu      sync.RWMutex
	objects map[string]*ObjectHeader
}

func NewFakeStorage() *FakeStorage {
	return &FakeStorage{
		objects: make(map[string]*ObjectHeader),
	}
}

func (f *FakeStorage) CreateUploadSession(ctx context.Context, key string, intendedMIME string, maxSize int64) (*UploadSession, error) {
	sessionID := uuid.New().String()
	uploadURL := fmt.Sprintf("http://localhost:8080/api/v1/media/mock-upload/%s", sessionID)
	return &UploadSession{
		SessionID: sessionID,
		ObjectKey: key,
		UploadURL: uploadURL,
		ExpiresAt: time.Now().Add(15 * time.Minute),
	}, nil
}

func (f *FakeStorage) CompleteUpload(ctx context.Context, sessionID string) (*ObjectHeader, error) {
	return &ObjectHeader{
		ObjectKey:    sessionID,
		SizeBytes:    1024 * 250, // 250 KB
		DetectedMIME: "image/webp",
	}, nil
}

func (f *FakeStorage) GetSignedURL(ctx context.Context, key string, ttl time.Duration) (string, error) {
	return fmt.Sprintf("https://cdn.moringalab.local/%s", key), nil
}

func (f *FakeStorage) DeleteObject(ctx context.Context, key string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.objects, key)
	return nil
}

func (f *FakeStorage) HeadObject(ctx context.Context, key string) (*ObjectHeader, error) {
	f.mu.RLock()
	defer f.mu.RUnlock()
	obj, exists := f.objects[key]
	if !exists {
		return &ObjectHeader{
			ObjectKey:    key,
			SizeBytes:    1024 * 150,
			DetectedMIME: "image/webp",
		}, nil
	}
	return obj, nil
}

func (f *FakeStorage) PutObject(ctx context.Context, key string, content io.Reader, mime string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.objects[key] = &ObjectHeader{
		ObjectKey:    key,
		SizeBytes:    1024 * 200,
		DetectedMIME: mime,
	}
	return nil
}
