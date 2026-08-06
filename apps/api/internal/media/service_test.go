package media

import (
	"context"
	"testing"
)

func TestDetectMIMEFromBytes(t *testing.T) {
	jpegHeader := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	mimeJpeg, errJpeg := DetectMIMEFromBytes(jpegHeader)
	if errJpeg != nil || mimeJpeg != "image/jpeg" {
		t.Errorf("expected image/jpeg, got %s, err %v", mimeJpeg, errJpeg)
	}

	pngHeader := []byte{0x89, 0x50, 0x4E, 0x47}
	mimePng, errPng := DetectMIMEFromBytes(pngHeader)
	if errPng != nil || mimePng != "image/png" {
		t.Errorf("expected image/png, got %s, err %v", mimePng, errPng)
	}

	invalidHeader := []byte{0x00, 0x00, 0x00, 0x00}
	_, errInvalid := DetectMIMEFromBytes(invalidHeader)
	if errInvalid != ErrInvalidMIME {
		t.Errorf("expected ErrInvalidMIME for fake bytes, got %v", errInvalid)
	}
}

func TestRegisterAssetAndAltTextRequirement(t *testing.T) {
	storage := NewFakeStorage()
	svc := NewService(storage)
	ctx := context.Background()

	// 1. Missing Alt Text -> Error
	_, errMissing := svc.RegisterAsset(ctx, "admin-1", "moringa.png", "media/key1", "image/png", 1024, "عنوان", "   ")
	if errMissing != ErrMissingAltText {
		t.Errorf("expected ErrMissingAltText when alt text is empty, got %v", errMissing)
	}

	// 2. Valid Asset Registration
	asset, errValid := svc.RegisterAsset(ctx, "admin-1", "moringa.png", "media/key1", "image/png", 1024, "عنوان", "پودر ارگانیک برگ مورینگا")
	if errValid != nil || asset == nil {
		t.Fatalf("unexpected error during valid asset registration: %v", errValid)
	}

	// 3. Attach Usage and Attempt Delete -> ErrAssetInUse
	svc.AttachUsage(asset.ID, "product", "prod-101", "gallery")
	errDeleteInUse := svc.DeleteAsset(ctx, asset.ID)
	if errDeleteInUse != ErrAssetInUse {
		t.Errorf("expected ErrAssetInUse when deleting used asset, got %v", errDeleteInUse)
	}
}
