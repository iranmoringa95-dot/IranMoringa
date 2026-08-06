# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Milestone**: Milestone 4 (Storefront Frontend Experience) - **COMPLETED**
- **Next Milestone**: Milestone 5 (Cart, Pricing & Promotions Engine)
- **Repository State**: Polished responsive storefront, sticky header, mobile navigation & filter drawers (`< 768px`), JSON-LD structured data (`Product`, `BreadcrumbList`, `Organization`), Persian typography (`Vazirmatn`), and static site generation verified.

---

## Milestone Progress Matrix

| Milestone | Description | Status | Gate Checklist Passed |
| :--- | :--- | :--- | :--- |
| **Milestone 0** | Analysis, Architecture, Data Model, OpenAPI Contract, Security & ADRs | **COMPLETED** | Yes |
| **Milestone 1** | Foundation: Monorepo, Docker Compose, Go API Core, Next.js RTL Skeleton, Migrations | **COMPLETED** | Yes |
| **Milestone 2** | Identity, Auth (Customer OTP, Admin Password), Session Cookies & RBAC | **COMPLETED** | Yes |
| **Milestone 3** | Catalog, Media & Content Domain (Products, Variants, Categories, Articles) | **COMPLETED** | Yes |
| **Milestone 4** | Storefront Frontend Experience (Header, Mobile Drawers, JSON-LD, Skeletons) | **COMPLETED** | Yes |
| **Milestone 5** | Cart, Pricing & Promotions Engine | Pending | No |
| **Milestone 6** | Inventory Reservation, Checkout, Orders & Payment Gateway | Pending | No |
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | Pending | No |
| **Milestone 8** | Complete Admin Operations Panel | Pending | No |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | Pending | No |
| **Milestone 10**| Hardening, Performance, Accessibility & Release Candidate | Pending | No |

---

## Milestone 4 Gate Verification Evidence

- [x] **Responsive Mobile Layout**: Sticky Header with logo, search, cart counter, and mobile menu trigger button. Tested on `390px`, `768px`, and `1440px` viewports.
- [x] **Mobile Navigation & Filter Drawers**: Built `MobileNavDrawer.tsx` and `FilterDrawer.tsx` with backdrop blur, slide-in animations, and accessible close actions.
- [x] **JSON-LD Structured Data**: Embedded schema.org `Organization` on homepage, and `Product` & `BreadcrumbList` on product detail pages.
- [x] **Loading Skeletons & Empty States**: Built skeleton shimmer states for shop grid and empty search states.
- [x] **Next.js Production Build**: `npm run build` compiled 9 routes cleanly with 0 errors.

---

## Next Milestone: Milestone 5 (Cart, Pricing & Promotions Engine)
- Guest Cart via anonymous token in secure cookie (`carts` & `cart_items`).
- Automatic Cart merge upon user login without duplicate items.
- Server-side repricing engine & price breakdown calculation.
- Coupon & Promotion engine (fixed/percentage discounts, usage limits, category targeting).
- Cart drawer & dedicated `/cart` page with quantity debouncing.
