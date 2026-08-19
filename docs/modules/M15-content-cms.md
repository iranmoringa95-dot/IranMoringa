# M15 — Content CMS, Editorial Workflow & 10 Demo Seed Articles

## Overview
Module M15 implements the end-to-end content management system, editorial approval workflow, medical health claims compliance scanner, article revisions with history restoration, REST API endpoints, Next.js storefront blog pages (`/articles`, `/articles/[slug]`), Next.js admin management panel (`/admin/articles`), and 10 published demo seed articles.

## Core Features Implemented & Verified

### 1. Data Model & Database Migration
- **Tables**: `article_categories`, `article_tags`, `articles`, `article_revisions`, `article_product_relations`, `article_tag_relations`.
- **Migration**: `000003_content_articles.up.sql` / `000003_content_articles.down.sql`.
- **Domain Entity**: [Article](file:///E:/IRAN-MORINGA/apps/api/internal/content/domain.go#L58-L86) with UUID, slug, Persian title, summary, content, cover image URL, reading time, categories, tags, disclaimers, medical warnings, reviewer attribution, sources, and SEO metadata.

### 2. Editorial Workflow & Publication Gates
- **Status Transitions**: `draft` -> `in_review` -> (`changes_requested` | `approved`) -> `published` -> `archived`.
- **Forbidden Health Claims Scanner**: `ScanForbiddenMedicalClaims` checks text for unapproved claims (`درمان قطعی`, `پیشگیری قطعی`, `علاج قطعی`, `جایگزین دارو`).
- **Publication Gate Enforcement**: Articles with medical claims require medical reviewer attribution and scientific sources before publish.
- **Revision History**: Every update creates an immutable `ArticleRevision` snapshot (v1, v2, v3...), supporting version comparison and restoration.

### 3. API Contract & OpenAPI 3.1
- `GET /api/v1/content/articles` — Public published articles list.
- `GET /api/v1/content/articles/{slug}` — Public single article details.
- `GET /api/v1/content/article-categories` — Article categories hierarchy.
- `GET /api/v1/admin/articles` — Admin all articles list.
- `POST /api/v1/admin/articles` — Admin create article.
- `GET /api/v1/admin/articles/{id}` — Admin get article by ID.
- `PUT/PATCH /api/v1/admin/articles/{id}` — Admin update article.
- `POST /api/v1/admin/articles/{id}/submit-review` — Submit for medical review.
- `POST /api/v1/admin/articles/{id}/review` — Medical reviewer decision.
- `POST /api/v1/admin/articles/{id}/publish` — Publish article.
- `POST /api/v1/admin/articles/{id}/unpublish` — Unpublish article.
- `POST /api/v1/admin/articles/{id}/archive` — Archive article.
- `GET /api/v1/admin/articles/{id}/revisions` — Revision history list.
- `POST /api/v1/admin/articles/{id}/revisions/{revId}/restore` — Restore historical revision.

### 4. Exactly 10 Published Demo Seed Articles
Seed command `make seed-demo-articles` populates 10 educational Persian articles in development/testing, registered in `demo_seed_registry` for idempotency:
1. `what-is-moringa` — مورینگا چیست؟ آشنایی ساده با این گیاه
2. `moringa-powder-vs-dried-leaves` — تفاوت پودر مورینگا و برگ خشک مورینگا
3. `how-to-store-moringa-powder` — راهنمای نگهداری صحیح پودر مورینگا
4. `how-to-prepare-moringa-tea` — روش ساده آماده‌کردن دمنوش مورینگا
5. `moringa-buying-guide` — هنگام خرید محصولات مورینگا به چه نکاتی توجه کنیم؟
6. `moringa-seeds-guide` — آشنایی با دانه مورینگا و شیوه نگهداری آن
7. `moringa-oil-storage-guide` — روغن مورینگا چیست و چگونه نگهداری می‌شود؟
8. `read-moringa-product-labels` — راهنمای خواندن برچسب محصولات مورینگا
9. `net-weight-vs-shipping-weight` — تفاوت وزن خالص و وزن ارسال در فروشگاه آنلاین
10. `moringa-order-faq` — پرسش‌های متداول درباره سفارش محصولات مورینگا

### 5. Frontend Implementation
- **Admin Management Panel**: [`apps/web/app/admin/articles/page.tsx`](file:///E:/IRAN-MORINGA/apps/web/app/admin/articles/page.tsx) with search, filter, creation/edit modals, workflow action buttons, and revision history drawer.
- **Storefront Blog Index**: [`apps/web/app/(storefront)/articles/page.tsx`](file:///E:/IRAN-MORINGA/apps/web/app/(storefront)/articles/page.tsx) with card grid, reading time, and categories.
- **Storefront Detail Page**: [`apps/web/app/(storefront)/articles/[slug]/page.tsx`](file:///E:/IRAN-MORINGA/apps/web/app/(storefront)/articles/[slug]/page.tsx) with JSON-LD `Article` structured data, medical disclaimer box, tags, and related products grid.

## Verification
- `npx tsc --noEmit`: Passed (0 errors)
- `npm run build`: Compiled 28/28 Next.js pages successfully
- `TestSeedDemoArticlesIdempotencyAndProductionGuard`: Passed (1st run = 10 articles, 2nd run = 10 articles, production guard enforced)
