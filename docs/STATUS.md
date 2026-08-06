# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Milestone**: Milestone 5 (Cart, Pricing & Promotions Engine) - **COMPLETED**
- **Next Milestone**: Milestone 6 (Inventory Reservation, Checkout, Orders & Payment Gateway)
- **Repository State**: Complete cart service, anonymous guest cart cookies, guest-to-user cart merge, server-side repricing breakdown engine (int64 IRR), promotion coupon validator, and Next.js `/cart` page built and verified.

---

## Milestone Progress Matrix

| Milestone | Description | Status | Gate Checklist Passed |
| :--- | :--- | :--- | :--- |
| **Milestone 0** | Analysis, Architecture, Data Model, OpenAPI Contract, Security & ADRs | **COMPLETED** | Yes |
| **Milestone 1** | Foundation: Monorepo, Docker Compose, Go API Core, Next.js RTL Skeleton, Migrations | **COMPLETED** | Yes |
| **Milestone 2** | Identity, Auth (Customer OTP, Admin Password), Session Cookies & RBAC | **COMPLETED** | Yes |
| **Milestone 3** | Catalog, Media & Content Domain (Products, Variants, Categories, Articles) | **COMPLETED** | Yes |
| **Milestone 4** | Storefront Frontend Experience (Header, Mobile Drawers, JSON-LD, Skeletons) | **COMPLETED** | Yes |
| **Milestone 5** | Cart, Pricing & Promotions Engine (Guest/User Carts, Cart Merge, Coupons, `/cart`) | **COMPLETED** | Yes |
| **Milestone 6** | Inventory Reservation, Checkout, Orders & Payment Gateway | Pending | No |
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | Pending | No |
| **Milestone 8** | Complete Admin Operations Panel | Pending | No |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | Pending | No |
| **Milestone 10**| Hardening, Performance, Accessibility & Release Candidate | Pending | No |

---

## Milestone 5 Gate Verification Evidence

- [x] **Int64 IRR Pricing Engine**: `pricing.CalculateBreakdown` computes itemized subtotal, item discounts, cart promo discounts, shipping fees, and grand total in `int64` IRR without float errors. Unit tested in `pricing/service_test.go`.
- [x] **Guest/User Cart & Merge**: `carts.Service` handles anonymous guest cookie tokens (`cart_token`) and merges guest items into user cart upon login without creating duplicate rows. Unit tested in `carts/service_test.go`.
- [x] **Coupon & Promotion Validator**: `promotions.ValidateAndCalculate` validates codes case-insensitively, enforces minimum order thresholds, usage limits, and expiration windows. Unit tested in `promotions/service_test.go`.
- [x] **Go Cart APIs**: Endpoints `GET /api/v1/carts/current` and `POST /api/v1/carts/current/items`.
- [x] **Frontend Cart Page**: `/cart` page renders item list, quantity indicators, coupon input box, and price summary. Verified (`npm run build` compiled 10 routes cleanly).

---

## Next Milestone: Milestone 6 (Inventory Reservation, Checkout, Orders & Payment Gateway)
- Transactional Inventory Reservation with expiration TTL worker (`stock_reservations`).
- Concurrency-safe stock reservation using PostgreSQL row locking (`SELECT ... FOR UPDATE`).
- Checkout quote service & guest checkout without forced registration.
- Order snapshot creation (`orders`, `order_items`, `order_addresses`) with `Idempotency-Key` header requirement.
- Order State Machine transitions (`pending_payment`, `paid`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`).
- Fake Payment Gateway adapter & idempotent callback/webhook verification.
