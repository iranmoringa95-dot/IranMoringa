# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Milestone**: Milestone 6 (Inventory Reservation, Checkout, Orders & Payment Gateway) - **COMPLETED**
- **Next Milestone**: Milestone 7 (Shipping, Tracking, Account Portal & Returns)
- **Repository State**: Complete concurrency-safe stock reservation, checkout orchestrator, frozen order/address snapshots, `Idempotency-Key` submission caching, order state machine, Fake Payment Gateway adapter, and Next.js `/checkout` flow built and verified.

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
| **Milestone 6** | Inventory Reservation, Checkout, Orders & Payment Gateway | **COMPLETED** | Yes |
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | Pending | No |
| **Milestone 8** | Complete Admin Operations Panel | Pending | No |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | Pending | No |
| **Milestone 10**| Hardening, Performance, Accessibility & Release Candidate | Pending | No |

---

## Milestone 6 Gate Verification Evidence

- [x] **Concurrency-Safe Inventory Reservation**: `inventory.Service` reserves stock with mutex locks (`SELECT ... FOR UPDATE` pattern). Concurrency test in `inventory/service_test.go` verified zero overselling with 10 competing routines.
- [x] **Immutable Order & Address Snapshots**: Created frozen `order_items` & `order_addresses` snapshots at purchase time.
- [x] **Idempotent Order Placement**: `orders.Service` caches submissions via `Idempotency-Key` header (`orders/service_test.go`).
- [x] **Order State Machine**: Handled state transitions (`pending_payment` -> `paid` -> `processing` -> `packed` -> `shipped` -> `delivered`, `cancelled`, `refunded`). Invalid transitions rejected.
- [x] **Fake Payment Gateway Adapter**: `payments.Service` creates sandbox sessions, verifies callback reference numbers and exact order amounts.
- [x] **Frontend Checkout Flow**: Built `/checkout`, `/checkout/payment/[paymentId]`, `/checkout/result`. Verified (`npm run build` compiled 13 routes cleanly).

---

## Next Milestone: Milestone 7 (Shipping, Tracking, Account Portal & Returns)
- Shipping rate calculator (`shipping_zones` & `shipping_methods`).
- Tracking lookup endpoint (`POST /api/v1/order-tracking/lookup`) with postal tracking code.
- Customer Account Order History page (`/account/orders` and `/account/orders/[orderNumber]`) with timeline view.
- Order cancellation policy service for `pending_payment` and `paid` orders.
- Customer return request workflow (`/account/orders/[orderNumber]/returns`).
