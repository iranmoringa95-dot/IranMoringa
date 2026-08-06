# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Milestone**: Milestone 7 (Shipping, Tracking, Account Portal & Returns) - **COMPLETED**
- **Next Milestone**: Milestone 8 (Complete Admin Operations Panel)
- **Repository State**: Weight & province based shipping calculator, public postal tracking code lookup, customer order history portal with timeline steppers, pre-shipment order cancellation with stock release, 7-day return request engine, and Next.js pages (`/tracking`, `/account/orders`, `/[orderNumber]`) built and verified.

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
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | **COMPLETED** | Yes |
| **Milestone 8** | Complete Admin Operations Panel | Pending | No |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | Pending | No |
| **Milestone 10**| Hardening, Performance, Accessibility & Release Candidate | Pending | No |

---

## Milestone 7 Gate Verification Evidence

- [x] **Shipping Rate Calculator**: `shipping.Service` calculates weight and province-based shipping fees. Unit tested in `shipping/service_test.go`.
- [x] **Public Order Tracking Lookup**: `LookupTracking` returns order status and timeline steps (`shipping/service_test.go`).
- [x] **Customer Order History Portal**: Next.js pages `/account/orders` and `/account/orders/[orderNumber]` with status badges and progress timelines.
- [x] **7-Day Return Eligibility Engine**: `returns.Service` validates return requests within 7 days of order placement. Unit tested in `returns/service_test.go`.
- [x] **Next.js Production Build**: `npm run build` compiled 15 static/dynamic routes cleanly with 0 errors.

---

## Next Milestone: Milestone 8 (Complete Admin Operations Panel)
- Admin RBAC enforcement & Audit Logging (`audit_logs`) for all admin mutations.
- Admin Product & Variant CRUD operations with image media manager.
- Admin Order Fulfillment Management (update status, assign postal tracking numbers).
- Admin Inventory Ledger Management (restock, adjust stock, manual reservation release).
- Admin Health Article Review Workflow (publish, assign scientific sources, reject).
- Admin Dashboard Overview (Sales analytics, recent orders, low stock alerts).
