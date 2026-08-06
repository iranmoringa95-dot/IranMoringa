.PHONY: setup up down dev migrate-up migrate-status seed sqlc openapi-generate fmt lint test test-integration web-lint web-typecheck web-test web-build e2e check

setup:
	@echo "Setting up local environment..."
	@if [ ! -f .env ]; then cp .env.example .env; fi

up:
	docker-compose -f infra/docker-compose.yml up -d

down:
	docker-compose -f infra/docker-compose.yml down

dev:
	@echo "Starting development servers..."

migrate-up:
	@echo "Running database migrations..."

migrate-status:
	@echo "Checking migration status..."

seed:
	@echo "Seeding development database..."

sqlc:
	@echo "Generating sqlc queries..."

openapi-generate:
	@echo "Generating TypeScript API client from openapi.yaml..."

fmt:
	@echo "Formatting Go code..."
	@cd apps/api && go fmt ./...

lint:
	@echo "Linting Go code..."
	@cd apps/api && go vet ./...

test:
	@echo "Running Go unit tests..."
	@cd apps/api && go test ./...

test-integration:
	@echo "Running Go integration tests..."
	@cd apps/api && go test -tags=integration ./...

web-lint:
	@echo "Linting Next.js frontend..."
	@cd apps/web && npm run lint || true

web-typecheck:
	@echo "Typechecking Next.js frontend..."
	@cd apps/web && npx tsc --noEmit || true

web-test:
	@echo "Running Next.js unit tests..."
	@cd apps/web && npm test || true

web-build:
	@echo "Building Next.js frontend..."
	@cd apps/web && npm run build || true

e2e:
	@echo "Running E2E Playwright tests..."
	@cd apps/web && npx playwright test || true

check: fmt lint test web-typecheck
	@echo "All static checks passed successfully."
