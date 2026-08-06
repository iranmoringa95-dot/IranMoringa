# Project Status & Milestone Tracker - MoringaLab Commerce (`فروشگاه سبزینه`)

## Overall Status Summary
- **Current Milestone**: Milestone 3 (Catalog, Media & Content Domain) - **COMPLETED**
- **Next Milestone**: Milestone 4 (Storefront Frontend Experience)
- **Repository State**: Complete catalog domain, variants, category tree, health articles engine with scientific disclaimers, seed data generator, and storefront pages (`/shop`, `/product/[slug]`, `/articles`) implemented and verified.

---

## Milestone Progress Matrix

| Milestone | Description | Status | Gate Checklist Passed |
| :--- | :--- | :--- | :--- |
| **Milestone 0** | Analysis, Architecture, Data Model, OpenAPI Contract, Security & ADRs | **COMPLETED** | Yes |
| **Milestone 1** | Foundation: Monorepo, Docker Compose, Go API Core, Next.js RTL Skeleton, Migrations | **COMPLETED** | Yes |
| **Milestone 2** | Identity, Auth (Customer OTP, Admin Password), Session Cookies & RBAC | **COMPLETED** | Yes |
| **Milestone 3** | Catalog, Media & Content Domain (Products, Variants, Categories, Articles) | **COMPLETED** | Yes |
| **Milestone 4** | Storefront Frontend Experience (Home, Filter Drawer, Responsive RTL, Structured Data) | Pending | No |
| **Milestone 5** | Cart, Pricing & Promotions Engine | Pending | No |
| **Milestone 6** | Inventory Reservation, Checkout, Orders & Payment Gateway | Pending | No |
| **Milestone 7** | Shipping, Tracking, Account Portal & Returns | Pending | No |
| **Milestone 8** | Complete Admin Operations Panel | Pending | No |
| **Milestone 9** | Reviews, Wishlist, Back-in-Stock & Outbox Notifications | Pending | No |
| **Milestone 10**| Hardening, Performance, Accessibility & Release Candidate | Pending | No |

---

## Milestone 3 Gate Verification Evidence

- [x] **Catalog Domain Invariants**: Enforced single/multiple variants per product, `PriceIRR >= 0`, `CompareAtPriceIRR > PriceIRR` with unit tests (`catalog/service_test.go`).
- [x] **Health Content Engine**: Articles support scientific sources, reviewers, and mandatory medical disclaimers.
- [x] **Public Catalog & Content APIs**: Endpoints `/api/v1/catalog/categories`, `/api/v1/catalog/products`, `/api/v1/catalog/products/{slug}`, `/api/v1/content/articles`, `/api/v1/content/articles/{slug}`, `/api/v1/content/faqs`.
- [x] **Seed Data Generator**: `seeds.PopulateSeedData` creates realistic categories, 12 herbal products with variants, 5 health articles, FAQs.
- [x] **Storefront Frontend Pages**: `/shop`, `/product/[slug]`, `/articles` built and verified (`npm run build` compiled 9 routes cleanly).

---

## Next Milestone: Milestone 4 (Storefront Frontend Experience)
- Mobile-first responsive storefront navigation drawer & sticky search bar.
- Storefront homepage polished with hero section, category cards, bestsellers, and trust badges.
- Filter drawer for mobile viewport (`390px` to `1440px`).
- Valid JSON-LD Structured Data (`Product`, `BreadcrumbList`, `Organization`).
