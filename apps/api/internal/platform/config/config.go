package config

import (
	"bufio"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	AppName         string `envconfig:"APP_NAME" default:"MoringaLab Commerce"`
	AppEnv          string `envconfig:"APP_ENV" default:"development"`
	AppPort         int    `envconfig:"APP_PORT" default:"8080"`
	DatabaseURL     string `envconfig:"DATABASE_URL" default:"postgresql://moringa_app:@KamalGeraei990@127.0.0.1:5432/moringa_dev?sslmode=disable"`
	TestDatabaseURL string `envconfig:"TEST_DATABASE_URL" default:"postgresql://moringa_app:@KamalGeraei990@127.0.0.1:5432/moringa_test?sslmode=disable"`
	DBHost          string `envconfig:"DB_HOST" default:"127.0.0.1"`
	DBPort          int    `envconfig:"DB_PORT" default:"5432"`
	DBUser          string `envconfig:"DB_USER" default:"moringa_app"`
	DBPassword      string `envconfig:"DB_PASSWORD" default:""`
	DBName          string `envconfig:"DB_NAME" default:"moringa_dev"`
	DBSSLMode       string `envconfig:"DB_SSLMODE" default:"disable"`
}

// Load reads config from .env (in development) and environment variables
func Load() (*Config, error) {
	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	// In development, load .env file if present
	if appEnv != "production" {
		loadDotEnvFiles()
	}

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, fmt.Errorf("failed to process environment variables: %w", err)
	}

	return &cfg, nil
}

// loadDotEnvFiles checks current working directory and parent directories (where go.mod lives) for .env
func loadDotEnvFiles() {
	cwd, err := os.Getwd()
	if err != nil {
		return
	}

	envPaths := []string{
		filepath.Join(cwd, ".env"),
		filepath.Join(cwd, "..", ".env"),
		filepath.Join(cwd, "..", "..", ".env"),
	}

	for _, p := range envPaths {
		if _, err := os.Stat(p); err == nil {
			parseAndSetDotEnv(p)
			break
		}
	}
}

func parseAndSetDotEnv(filePath string) {
	file, err := os.Open(filePath)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)

			// Only set if not already present in environment
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
}

// SanitizedDatabaseURL returns the connection URL with sensitive passwords masked for safe logging
func (c *Config) SanitizedDatabaseURL() string {
	return SanitizeURL(c.DatabaseURL)
}

// SanitizedTestDatabaseURL returns the test connection URL with sensitive passwords masked
func (c *Config) SanitizedTestDatabaseURL() string {
	return SanitizeURL(c.TestDatabaseURL)
}

// SanitizeURL replaces password in postgresql connection string with *****
func SanitizeURL(rawURL string) string {
	if rawURL == "" {
		return "[EMPTY]"
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "[INVALID URL]"
	}

	if parsed.User != nil {
		username := parsed.User.Username()
		if _, hasPassword := parsed.User.Password(); hasPassword {
			parsed.User = url.UserPassword(username, "*****")
		} else {
			parsed.User = url.User(username)
		}
	}

	return parsed.String()
}
