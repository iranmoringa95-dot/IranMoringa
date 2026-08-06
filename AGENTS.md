# Project architecture

- Backend is a Go modular monolith (`apps/api`).
- Web storefront and admin use Next.js App Router (`apps/web`).
- Business rules live only in Go services.
- OpenAPI (`api-contract/openapi.yaml`) is the contract between Go and TypeScript.
- PostgreSQL is the transactional source of truth.
- Interfaces are created only at external boundaries (SMS, Payment, Storage, Shipping, Mail).

# Domain invariants

- Money is stored as int64 IRR; never use float.
- Display conversion: 10 IRR = 1 Toman.
- Every sellable product has at least one variant.
- Inventory cannot become negative (`available = on_hand - reserved`).
- Every stock change must be traceable in `inventory_movements`.
- Order items snapshot product, price, and address data at checkout time.
- Checkout, payment callbacks, and refunds are idempotent.
- Admin mutations must create audit records in `audit_logs`.
- Health claims require source attribution and review workflow.

# Engineering rules

- Read the nearest documentation before changing a module.
- Do not edit an applied migration; add a new one.
- Update OpenAPI when an endpoint changes.
- Regenerate clients and commit generated code according to project policy.
- Do not add dependencies without a concrete need.
- Preserve unrelated user changes.
- Never commit secrets or production data.

# Verification

Before declaring a coding task complete, run the relevant subset and finally:

- `make fmt`
- `make lint`
- `make test`
- `make test-integration`
- `make web-lint`
- `make web-typecheck`
- `make web-test`
- `make web-build`
- `make e2e`
- `make check`

# Done means

- Requested behavior works end to end.
- Failure and edge states are handled.
- Tests cover critical paths.
- API contract and migrations are updated.
- Security and authorization are enforced server-side.
- Documentation and STATUS are current.
- No unrelated changes or hidden blockers remain.
