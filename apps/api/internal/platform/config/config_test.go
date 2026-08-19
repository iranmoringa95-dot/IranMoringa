package config

import (
	"os"
	"strings"
	"testing"
)

func TestConfigLoadInDevelopmentAndProduction(t *testing.T) {
	// Test 1: Development mode
	t.Setenv("APP_ENV", "development")
	t.Setenv("DATABASE_URL", "postgresql://moringa_app:secret123@127.0.0.1:5432/moringa_dev?sslmode=disable")

	cfgDev, err := Load()
	if err != nil {
		t.Fatalf("Load() failed in development: %v", err)
	}

	if cfgDev.AppEnv != "development" {
		t.Errorf("Expected AppEnv development, got: %s", cfgDev.AppEnv)
	}

	if strings.Contains(cfgDev.SanitizedDatabaseURL(), "secret123") {
		t.Errorf("SanitizedDatabaseURL leaked password in dev mode")
	}

	// Test 2: Production mode (must only read system env vars, not .env file)
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgresql://prod_user:prod_pass@prod-db.internal:5432/moringa_prod?sslmode=disable")

	cfgProd, err := Load()
	if err != nil {
		t.Fatalf("Load() failed in production: %v", err)
	}

	if cfgProd.AppEnv != "production" {
		t.Errorf("Expected AppEnv production, got: %s", cfgProd.AppEnv)
	}

	if strings.Contains(cfgProd.SanitizedDatabaseURL(), "prod_pass") {
		t.Errorf("SanitizedDatabaseURL leaked password in production mode")
	}
}
