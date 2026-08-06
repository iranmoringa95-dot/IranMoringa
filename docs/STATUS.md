# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Milestone**: Milestone 1 (Foundation) - **COMPLETED**
- **Next Milestone**: Milestone 2 (Identity, Authentication & RBAC)
- **Repository State**: Executable foundation established with Makefile, Docker Compose, Go API Core with health probes, Next.js 15 App Router RTL skeleton, and initial PostgreSQL migrations.

---

## Milestone Progress Matrix

| Milestone | Description | Status | Gate Checklist Passed |
| :--- | :--- | :--- | :--- |
| **Milestone 0** | Analysis, Architecture, Data Model, OpenAPI Contract, Security & ADRs | **COMPLETED** | Yes |
| **Milestone 1** | Foundation: Monorepo, Docker Compose, Go API Core, Next.js RTL Skeleton, Migrations | **COMPLETED** | Yes |
| **Milestone 2** | Identity, Auth (Customer OTP, Admin Password) & RBAC | Pending | No |
| **Milestone 3** | Catalog, Media & Content Domain | Pending | No |
| **Milestone 4** | Storefront Frontend Pages | Pending | No |
| **Milestone 5** | Cart, Pricing & Promotions Engine | Pending | No |
| **Milestone 6** | Inventory Reservation, Checkout, Orders & Payment Gateway | Pending | No |
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | Pending | No |
| **Milestone 8** | Complete Admin Operations Panel | Pending | No |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | Pending | No |
| **Milestone 10**| Hardening, Performance, Accessibility & Release Candidate | Pending | No |

---

## Milestone 1 Gate Verification Evidence

- [x] **Monorepo & Makefile**: Root `Makefile` created with target rules (`fmt`, `lint`, `test`, `web-typecheck`, `web-build`, `check`).
- [x] **Dependencies Registry**: `docs/DEPENDENCIES.md` created with pinned versions and technical justifications.
- [x] **Infrastructure**: `infra/docker-compose.yml` configured for PostgreSQL 16, MinIO, and Mailpit with health checks.
- [x] **Go API Core**: Go module (`apps/api/go.mod`), config loader, `slog` logger, middleware, and `/health/live` & `/health/ready` endpoints built and unit tested.
- [x] **Database Schema**: `000001_init_schema.up.sql` and `down.sql` migrations created covering foundational identity, customer, catalog, inventory, and order tables.
- [x] **Next.js App Router**: Storefront and Admin RTL layout built with Tailwind CSS, Vazirmatn Persian typography, `dir="rtl"`, `lang="fa-IR"`, error boundaries, and static page generation verified (`npm run build` passed cleanly).

---

## Next Milestone: Milestone 2 (Identity & RBAC)
- Customer OTP authentication flow (Request OTP, Hash storage, Verify OTP, Session issuing).
- Admin password login with Argon2id/Bcrypt.
- Session cookie handling (`HttpOnly`, `SameSite=Lax`) & CSRF middleware.
- Role-Based Access Control (RBAC) permissions matrix for Admin endpoints.
- Admin protected layout & customer auth portal pages.
