package config

import (
	"fmt"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	AppName    string `envconfig:"APP_NAME" default:"MoringaLab Commerce"`
	AppEnv     string `envconfig:"APP_ENV" default:"development"`
	AppPort    int    `envconfig:"APP_PORT" default:"8080"`
	DBHost     string `envconfig:"DB_HOST" default:"localhost"`
	DBPort     int    `envconfig:"DB_PORT" default:"5432"`
	DBUser     string `envconfig:"DB_USER" default:"moringalab"`
	DBPassword string `envconfig:"DB_PASSWORD" default:"moringalab_dev_pass"`
	DBName     string `envconfig:"DB_NAME" default:"moringalab_db"`
	DBSSLMode  string `envconfig:"DB_SSLMODE" default:"disable"`
}

func Load() (*Config, error) {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, fmt.Errorf("failed to process environment variables: %w", err)
	}
	return &cfg, nil
}
