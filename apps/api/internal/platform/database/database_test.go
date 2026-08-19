package database

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"moringalab/api/internal/platform/config"
)

func TestDatabaseURLSanitizationNoPasswordLeak(t *testing.T) {
	rawURL := "postgresql://moringa_app:@KamalGeraei990@127.0.0.1:5432/moringa_dev?sslmode=disable"
	sanitized := config.SanitizeURL(rawURL)

	if strings.Contains(sanitized, "@KamalGeraei990") {
		t.Fatalf("SECURITY ERROR: Password leaked in sanitized URL: %s", sanitized)
	}

	if !strings.Contains(sanitized, "*****") {
		t.Errorf("Expected password to be masked with *****, got: %s", sanitized)
	}

	if !strings.Contains(sanitized, "moringa_dev") {
		t.Errorf("Expected database name 'moringa_dev' in sanitized URL, got: %s", sanitized)
	}
}

func TestMoringaTestDatabaseConnectionPing(t *testing.T) {
	testURL := os.Getenv("TEST_DATABASE_URL")
	if testURL == "" {
		testURL = "postgresql://moringa_app:%40KamalGeraei990@127.0.0.1:5432/moringa_test?sslmode=disable"
	}

	sanitizedTestURL := config.SanitizeURL(testURL)
	t.Logf("Testing connection to test database: %s", sanitizedTestURL)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	db, err := ConnectPool(ctx, testURL)
	if err != nil {
		t.Logf("Notice: Connection to local test PostgreSQL database '%s' failed (Is PostgreSQL running on port 5432?): %v", sanitizedTestURL, err)
		return
	}
	defer db.Close()

	if db.Pool == nil {
		t.Fatal("Expected pool to be non-nil")
	}

	pingCtx, pingCancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer pingCancel()

	if err := db.Pool.Ping(pingCtx); err != nil {
		t.Fatalf("Ping to test database failed: %v", err)
	}

	t.Logf("SUCCESS: Connected and pinged moringa_test database via pgxpool successfully")
}
