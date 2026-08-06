# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Milestone**: Milestone 2 (Identity, Auth & RBAC) - **COMPLETED**
- **Next Milestone**: Milestone 3 (Catalog, Media & Content Domain)
- **Repository State**: Full identity domain, Iranian phone OTP authentication flow, secure session cookies, RBAC matrix, and Next.js Auth UI implemented and verified.

---

## Milestone Progress Matrix

| Milestone | Description | Status | Gate Checklist Passed |
| :--- | :--- | :--- | :--- |
| **Milestone 0** | Analysis, Architecture, Data Model, OpenAPI Contract, Security & ADRs | **COMPLETED** | Yes |
| **Milestone 1** | Foundation: Monorepo, Docker Compose, Go API Core, Next.js RTL Skeleton, Migrations | **COMPLETED** | Yes |
| **Milestone 2** | Identity, Auth (Customer OTP, Admin Password), Session Cookies & RBAC | **COMPLETED** | Yes |
| **Milestone 3** | Catalog, Media & Content Domain (Products, Variants, Categories, Articles) | Pending | No |
| **Milestone 4** | Storefront Frontend Pages (Home, Catalog Search/Filter, Product Page) | Pending | No |
| **Milestone 5** | Cart, Pricing & Promotions Engine | Pending | No |
| **Milestone 6** | Inventory Reservation, Checkout, Orders & Payment Gateway | Pending | No |
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | Pending | No |
| **Milestone 8** | Complete Admin Operations Panel | Pending | No |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | Pending | No |
| **Milestone 10**| Hardening, Performance, Accessibility & Release Candidate | Pending | No |

---

## Milestone 2 Gate Verification Evidence

- [x] **Iranian Mobile Normalization**: `NormalizeIranianPhone` utility created converting `09123456789`, `+989123456789`, `00989123456789` to canonical format with unit tests (`phone_test.go`).
- [x] **OTP Security**: OTP challenge codes stored exclusively as SHA256 hashes (`otp_challenges`); 3 attempt max limit & 5-minute expiration enforced.
- [x] **Session Cookie Security**: Cryptographically random 32-byte session tokens stored exclusively as SHA256 hashes in database; cookies set with `HttpOnly` and `SameSite=Lax`.
- [x] **RBAC Permissions Matrix**: Granular permission matrix seeded (`super_admin`, `catalog_manager`, `warehouse_manager`, `order_support`, `finance_manager`, `customer`); server-side permission checks built.
- [x] **Go API Auth Endpoints**: `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`, `POST /api/v1/auth/logout`, `GET /api/v1/me`.
- [x] **Frontend Auth UI**: Persian 2-step OTP login page (`/login`) and customer account dashboard (`/account`) built and verified (`npm run build` compiled 7 static pages cleanly).

---

## Next Milestone: Milestone 3 (Catalog, Media & Content Domain)
- Product & Variant models, SKU handling, price representation (`bigint` IRR).
- Hierarchical category tree & brand management.
- Admin product management API & media asset storage upload adapter (MinIO/S3).
- Content blog article workflow (Draft, Scientific Review, Approved, Published).
- Storefront catalog read APIs.
- Seed data fixture generation.
