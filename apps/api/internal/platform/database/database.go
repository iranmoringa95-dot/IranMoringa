package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"moringalab/api/internal/platform/config"
)

type DB struct {
	Pool *pgxpool.Pool
}

// ConnectPool initializes pgxpool.Pool, tests connection with timeout ping, and logs sanitized connection info
func ConnectPool(ctx context.Context, connString string) (*DB, error) {
	sanitizedURL := config.SanitizeURL(connString)
	slog.Info("connecting to PostgreSQL database via pgxpool...", slog.String("url", sanitizedURL))

	poolConfig, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database pool configuration: %w", err)
	}

	poolConfig.MaxConns = 25
	poolConfig.MinConns = 2
	poolConfig.MaxConnIdleTime = 15 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create database connection pool: %w", err)
	}

	// Ping check with 5-second timeout
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("database connection ping failed for %s: %w", sanitizedURL, err)
	}

	slog.Info("successfully established and verified database connection via pgxpool", slog.String("url", sanitizedURL))
	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
		slog.Info("database connection pool closed")
	}
}
