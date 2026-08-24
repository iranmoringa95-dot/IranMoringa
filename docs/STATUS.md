# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Status**: **PROJECT COMPLETED & PRODUCTION DEPLOYED (RELEASE CANDIDATE v1.0.0)**
- **All Milestones (0 through 10)**: **100% COMPLETED & VERIFIED**
- **Repository State**: Full Go Modular Monolith backend on Render (`https://iranmoringa.onrender.com`), Next.js 15 App Router RTL storefront & admin panel on Cloudflare Workers (`iranmoringa1`), and Native Java Android Order Manager.
- **Production API Routing**: Cloudflare Worker proxies `/api/*` to Render HTTPS Go origin (`API_ORIGIN`); WebOneSMS delivery configured and OTP values protected.
- **Production Database**: PostgreSQL (Neon Frankfurt `eu-central-1`) connected and all 8 migrations applied.
- **Security Gate**: Server-side session & RBAC authorization (`RequireAdminAuth`) enforced on all `/admin/*` endpoints.
- **Android Admin APK**: Native Java APK tracked and distributed via `/downloads/moringano-order-manager-java-debug.apk`.

## Android Admin App (2026-08-24)

- [x] Native Java project in `apps/android-admin` (Android 8.0+, target SDK 35).
- [x] OTP flow, encrypted session cookie, dashboard, order list/search/filter/detail, status transitions, notes, timeline, manual-order cart, and SSE notifications.
- [x] Debug APK built, tracked, and published to `/downloads/moringano-order-manager-java-debug.apk`.
- [x] Android Lint completed with 0 errors (110 non-blocking localization/hardcoded-text warnings).
- [x] Live device end-to-end routing connected via Cloudflare `API_ORIGIN` to Go HTTPS origin with server-side admin authorization.

---

## Final Milestone Progress Matrix

| Milestone | Description | Status | Gate Checklist Passed |
| :--- | :--- | :--- | :--- |
| **Milestone 0** | Analysis, Architecture, Data Model, OpenAPI Contract, Security & ADRs | **COMPLETED** | Yes |
| **Milestone 1** | Foundation: Monorepo, Docker Compose, Go API Core, Next.js RTL Skeleton, Migrations | **COMPLETED** | Yes |
| **Milestone 2** | Identity, Auth (Customer OTP, Admin Password), Session Cookies & RBAC | **COMPLETED** | Yes |
| **Milestone 3** | Catalog, Media & Content Domain (Products, Variants, Categories, Articles) | **COMPLETED** | Yes |
| **Milestone 4** | Storefront Frontend Experience (Header, Search Spotlight, Cart, Mobile Drawers, JSON-LD) | **COMPLETED** | Yes |
| **Milestone 5** | Cart, Pricing & Promotions Engine (Interactive Cart, merge, Coupons `MORINGA15`, `/cart`) | **COMPLETED** | Yes |
| **Milestone 6** | Inventory Reservation, Checkout, Orders & Payment Gateway | **COMPLETED** | Yes |
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | **COMPLETED** | Yes |
| **Milestone 8** | Complete Admin Operations Panel (Fulfillment, Tracking, Inventory, Audit Logs) | **COMPLETED** | Yes |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | **COMPLETED** | Yes |
| **Milestone 10**| Hardening, Unified Smart Search, Performance & Release Candidate | **COMPLETED** | Yes |

---

## Final Quality Gate & Invariant Audit

- [x] **Money & Currency Invariant**: All DB money fields use `bigint` IRR; 10 IRR = 1 Toman for UI display.
- [x] **Catalog Invariant**: Every sellable product has at least 1 variant. Simple products have 1 default variant.
- [x] **Inventory Invariant**: Stock ledger (`available = on_hand - reserved`) tested under high concurrency (zero overselling).
- [x] **Order Snapshot Invariant**: Product title, variant title, SKU, price, and address frozen in immutable `order_items` & `order_addresses` tables at purchase time.
- [x] **Idempotency Invariant**: Checkout requires `Idempotency-Key` header; payment callbacks verified server-side before state change.
- [x] **Audit Log Invariant**: All admin mutations record immutable audit log entries in `audit_logs`.
- [x] **Medical Disclaimer Invariant**: Health articles append mandatory scientific source attribution and medical disclaimers.
- [x] **Next.js Production Build**: `npm run build` compiled 19 routes cleanly with 0 errors.
