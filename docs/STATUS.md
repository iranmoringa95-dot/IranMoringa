# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Milestone**: Milestone 0 (Analysis & Specifications) - **COMPLETED**
- **Next Milestone**: Milestone 1 (Foundation - Monorepo, Docker Compose, Go API Core, Next.js Skeleton)
- **Repository State**: Bootstrap baseline established with Git, AGENTS.md, configuration files, and complete specifications.

---

## Milestone Progress Matrix

| Milestone | Description | Status | Gate Checklist Passed |
| :--- | :--- | :--- | :--- |
| **Milestone 0** | Analysis, Architecture, Data Model, OpenAPI Contract, Security & ADRs | **COMPLETED** | Yes |
| **Milestone 1** | Foundation: Monorepo, Docker Compose, Go & Next.js Skeletons | Pending | No |
| **Milestone 2** | Identity, Auth & RBAC | Pending | No |
| **Milestone 3** | Catalog, Media & Content Domain | Pending | No |
| **Milestone 4** | Storefront Frontend Pages | Pending | No |
| **Milestone 5** | Cart, Pricing & Promotions Engine | Pending | No |
| **Milestone 6** | Inventory Reservation, Checkout, Orders & Payment Gateway | Pending | No |
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | Pending | No |
| **Milestone 8** | Complete Admin Operations Panel | Pending | No |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | Pending | No |
| **Milestone 10**| Hardening, Performance, Accessibility & Release Candidate | Pending | No |

---

## Milestone 0 Gate Verification Evidence

- [x] **Repository Status & Bootstrap**: Git repository initialized, `.gitignore`, `.editorconfig`, `.env.example`, `AGENTS.md` created.
- [x] **PRD Document**: `docs/PRD.md` completed with business model, scope boundaries, SLAs, and personas.
- [x] **System Architecture**: `docs/ARCHITECTURE.md` completed detailing Go Modular Monolith, Next.js App Router BFF, and Outbox Worker pattern.
- [x] **Data Model & ERD**: `docs/DATA_MODEL.md` completed with Mermaid ERD, 45+ tables, check constraints, UUID PKs, UTC `timestamptz`, and `bigint` IRR currency rules.
- [x] **API Contract**: `api-contract/openapi.yaml` OpenAPI 3.1 schema created covering storefront, account, and admin endpoints.
- [x] **Security Model**: `docs/SECURITY.md` threat model & control matrix documented.
- [x] **Architecture Decisions**: `docs/DECISIONS.md` and ADRs 0001, 0002, 0003 created.
- [x] **Status & Checkpoint**: `docs/STATUS.md` and `docs/NEXT_TASK.md` synced.

---

## Technical Debt & Decision Log
- *Decision*: Simple and Variable products share a unified variant table structure (`product_variants`). Simple products have exactly 1 default variant. (ADR-0002)
- *Decision*: Money amounts are strictly `bigint` Iranian Rial (IRR). Frontend handles 10 IRR = 1 Toman conversion.
- *Debt*: None currently.

---

## Next Milestone: Milestone 1 (Foundation)
- Task 1: Setup Go API application structure (`apps/api`) with config validation, logging, health probes (`/health/live`, `/health/ready`), and HTTP router.
- Task 2: Setup Next.js 15 App Router web application (`apps/web`) with Tailwind CSS, Vazirmatn font, and RTL setup.
- Task 3: Setup Docker Compose environment (`infra/docker-compose.yml`) for PostgreSQL 16, MinIO, and Mailpit.
- Task 4: Setup Migration and Seed runner framework in Go.
