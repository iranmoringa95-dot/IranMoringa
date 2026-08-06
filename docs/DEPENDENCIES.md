# Dependency Policy & Version Registry - MoringaLab Commerce (`فروشگاه سبزینه`)

All external dependencies must be stable, pinned, and justified. Canary, beta, or release candidate (RC) packages are strictly prohibited.

## Backend Dependencies (Go `apps/api`)

| Package / Module | Version | Purpose & Justification |
| :--- | :--- | :--- |
| `go` | `1.22.0` | Stable Go toolchain with built-in structured logging (`log/slog`) and enhanced routing capabilities. |
| `github.com/go-chi/chi/v5` | `v5.0.12` | Lightweight, idiomatically compatible HTTP router (`http.Handler` compatible) with zero magic and low latency. |
| `github.com/jackc/pgx/v5` | `v5.5.5` | High-performance PostgreSQL driver and connection pool (`pgxpool`) natively supporting type scanning. |
| `github.com/kelseyhightower/envconfig` | `v1.4.0` | Struct-based environment variable loader with validation rules on application startup. |
| `github.com/google/uuid` | `v1.6.0` | Fast, standard UUID generation for internal primary keys. |
| `golang.org/x/crypto` | `v0.21.0` | Argon2id & Bcrypt password hashing utilities. |

---

## Frontend Dependencies (Next.js `apps/web`)

| Package / Library | Version | Purpose & Justification |
| :--- | :--- | :--- |
| `next` | `15.1.0` | Next.js App Router for Server Components, SSR, and BFF API routes. |
| `react` & `react-dom` | `19.0.0` | Stable React framework. |
| `typescript` | `^5.6.0` | Strict static typing across components, BFF API, and generated backend client. |
| `tailwindcss` | `^3.4.0` | Utility-first CSS styling system. |
| `clsx` & `tailwind-merge` | Latest Stable | Utility functions for conditional class merging. |
| `lucide-react` | Latest Stable | Accessible, consistent icon set. |
| `vazirmatn` | `^33.0.3` | Self-hosted Persian typography font. |
