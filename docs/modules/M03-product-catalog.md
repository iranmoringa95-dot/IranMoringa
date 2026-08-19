# M03 — Product Catalog, Variants, Admin Panel & Demo Seed Data

## Executive Summary
This document details the completed implementation of **PROMPT A: Product Catalog Module & 10 Demo Published Seed Products** for MoringaLab Commerce (`فروشگاه مورینگا / سبزینه`).

- **Architecture**: Modular monolith in Go (`apps/api/internal/catalog`), Next.js App Router admin (`apps/web/app/admin/products`), and public storefront (`apps/web/app/(storefront)`).
- **Transactional DB Schema**: PostgreSQL migration `000002_product_catalog_media_seed.up.sql` (`product_categories`, `product_media`, `demo_seed_registry`).
- **Demo Seed Data**: Exactly 10 published demo products with unique Persian titles, short & full descriptions, disclaimers, local media, stock ledger counts, default variants, integer IRR pricing, and Toman display conversion.

---

## Domain & System Invariants
1. **Integer IRR Currency**: Money is strictly stored as `int64` IRR in database and API. Display conversion to Toman (`1 Toman = 10 IRR`) is handled at the UI presentation boundary.
2. **Default Variant**: Every sellable product must have at least one active variant.
3. **Weight Invariant**: Shipping weight must always be greater than or equal to net weight (`shipping_weight_g >= net_weight_g`).
4. **Publish Constraints**: Publishing a product requires at least one active variant, positive price, non-empty SKU, assigned category, and primary media image.
5. **Idempotent Seed Runner**: Executing `make seed-demo-products` uses `demo_seed_registry` to prevent duplicate seeding or stock doubling.
6. **Production Environment Guard**: Running seed logic in `APP_ENV=production` fails immediately with fatal error.
7. **Soft Archive**: Physical deletion of products with existing orders/inventory is prohibited; soft archive is enforced.
8. **Optimistic Concurrency**: Entity versioning (`version`) prevents concurrent overwrites during admin edits.

---

## The 10 Demo Seed Products Table

| # | Product Name (Title FA) | Slug | SKU | Category | Price (IRR) | Compare Price (IRR) | Net Wt | Ship Wt | Stock |
|---|---|---|---|---|---:|---:|---:|---:|---:|
| 1 | پودر برگ مورینگا ۱۰۰ گرمی | `moringa-leaf-powder-100g` | `MIR-PWD-100` | پودر و برگ | 2,450,000 | 2,750,000 | 100g | 130g | 40 |
| 2 | پودر برگ مورینگا ۲۵۰ گرمی | `moringa-leaf-powder-250g` | `MIR-PWD-250` | پودر و برگ | 5,450,000 | 5,950,000 | 250g | 290g | 30 |
| 3 | برگ خشک مورینگا ۵۰ گرمی | `dried-moringa-leaves-50g` | `MIR-LEAF-050` | پودر و برگ | 1,650,000 | null | 50g | 80g | 35 |
| 4 | دمنوش مورینگا و لیمو ۲۰ عددی | `moringa-lemon-tea-20` | `MIR-TEA-LEM-20` | دمنوش | 2,850,000 | 3,100,000 | 40g | 90g | 25 |
| 5 | دمنوش مورینگا و دارچین ۲۰ عددی | `moringa-cinnamon-tea-20` | `MIR-TEA-CIN-20` | دمنوش | 2,950,000 | 3,200,000 | 40g | 90g | 25 |
| 6 | کپسول مورینگا ۶۰ عددی | `moringa-capsules-60` | `MIR-CAP-060` | کپسول | 4,950,000 | 5,400,000 | 45g | 85g | 20 |
| 7 | روغن مورینگا ۳۰ میلی‌لیتری | `moringa-oil-30ml` | `MIR-OIL-030` | روغن | 6,750,000 | 7,250,000 | 30g | 85g | 18 |
| 8 | دانه مورینگا ۱۰۰ گرمی | `moringa-seeds-100g` | `MIR-SEED-100` | دانه | 3,250,000 | null | 100g | 140g | 22 |
| 9 | بسته آشنایی با مورینگا | `moringa-starter-pack` | `MIR-PACK-START` | بسته‌ها | 7,900,000 | 8,600,000 | 290g | 380g | 15 |
| 10 | بسته هدیه مورینگا | `moringa-gift-box` | `MIR-PACK-GIFT` | بسته‌ها | 12,500,000 | 13,500,000 | 520g | 700g | 10 |

---

## Admin & Storefront API Endpoints Registered
```
GET    /api/v1/catalog/products               - Public: Search & filter published products
GET    /api/v1/catalog/products/{slug}        - Public: Get single product by slug
GET    /api/v1/admin/products                 - Admin: Search & filter all products (status, stock, category)
POST   /api/v1/admin/products                 - Admin: Create new product draft
GET    /api/v1/admin/products/{id}            - Admin: Get product details with audit & variants
PATCH  /api/v1/admin/products/{id}            - Admin: Update product with optimistic version lock
POST   /api/v1/admin/products/{id}/publish    - Admin: Validate & publish product
POST   /api/v1/admin/products/{id}/unpublish  - Admin: Unpublish product
POST   /api/v1/admin/products/{id}/archive    - Admin: Soft archive product
```
