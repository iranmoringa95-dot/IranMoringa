# ADR 0001: Modular Monolith Architecture

## Context
We need a robust, scalable, and manageable architecture for MoringaLab Commerce. A distributed microservices architecture introduces high operational complexity, distributed transaction overhead (Sagas, eventual consistency edge cases in checkout/inventory), and network latency.

## Decision
We adopt a **Go Modular Monolith** architecture for the backend (`apps/api`), coupled with a **Next.js 15 App Router** frontend (`apps/web`).

### Key Invariants:
- Go packages under `internal/` represent clear domain boundaries (e.g. `catalog`, `inventory`, `orders`).
- Database calls across domain package boundaries are strictly prohibited.
- Communication between modules happens through Go package function calls or domain event structures.

## Consequences
- **Positive**: Simplified deployment, strong single-database ACID transactions for inventory and checkout, fast build times, zero network hop latency between domain services.
- **Negative**: Requires strict discipline to prevent package dependency coupling (enforced via linting and code reviews).
