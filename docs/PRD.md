# Product Requirements Document (PRD) - MoringaLab Commerce (`فروشگاه سبزینه`)

## 1. Executive Summary & Vision

**MoringaLab Commerce** (`فروشگاه سبزینه`) is a specialized, modern Persian e-commerce platform dedicated to health-oriented and herbal products (Moringa powder, herbal teas, health oils, plant seeds, etc.). 

The platform combines an **e-commerce storefront** with an **authoritative content repository**, eliminating common usability and technical pain points of legacy Persian e-commerce platforms.

### Core Objectives:
1. **Speed & Reliability**: Sub-second page response times with server-side rendered pages and efficient database indexing.
2. **Business Accuracy**: Strong transactional guarantees for inventory, pricing, checkout, and payment with float-less currency representation.
3. **Persian-First Design System**: Fully RTL, responsive design adhering to WCAG accessibility, clear hierarchy, and trustworthy visuals.
4. **Professional Management**: Rich, high-density Admin dashboard with full audit logging, RBAC, state machine order management, and stock movement ledger.

---

## 2. System Architecture & Components

The solution consists of three primary modules:
1. **Public Storefront**: Visitor product discovery, search, filtering, content reading, cart management, and guest/authenticated checkout.
2. **Customer Account Portal**: Profile, address book, order history & timeline tracking, refund requests, wishlist, and back-in-stock subscriptions.
3. **Admin Operations Panel**: Product catalog management, inventory movements, order fulfillment state machine, finance/refund processing, article review workflow, RBAC management, audit log viewing, and reporting.

---

## 3. Scope Boundaries (Version 1.0)

### 3.1 In-Scope Features
- **Storefront & UX**: Fully Persian & RTL responsive web layout (390px to 1440px+ screens), Vazirmatn font.
- **Product Catalog**: Simple & Variable products, hierarchical categories, attributes, media gallery, structured specifications.
- **Pricing & Currency**: `int64` IRR database representation, 10 IRR = 1 Toman frontend display conversion, itemized order discounts.
- **Inventory Ledger**: Real-time stock tracking (`on_hand`, `reserved`, `available`), transactional reservation at checkout with expiration TTL, stock movement ledger.
- **Cart & Checkout**: Guest cart in secure cookie, automatic cart merge upon login, guest checkout option, coupon application, server-side address validation and shipping calculation.
- **Order & Payment Lifecycle**: Idempotent order placement (`Idempotency-Key`), state machine order status flow, Fake Payment Gateway adapter for sandbox testing, refund request workflow.
- **Health Content Engine**: Herbal articles with reviewer workflow, source attribution, medical disclaimers, and structured data schemas.
- **Reviews & Q&A**: Verified buyer reviews (calculated server-side from order history), product questions & answers.
- **Admin Panel**: Data tables with server-side sorting/filtering/pagination, bulk actions, audit log recording for sensitive operations, RBAC permissions matrix.

### 3.2 Out-of-Scope Features for V1.0
- Marketplace / Multi-vendor seller settlement.
- Multi-currency / International shipping.
- Native Mobile App (iOS / Android binaries).
- Subscription / Recurring purchase models.
- Customer loyalty points / Digital wallet balances.
- AI automated medical diagnosis/recommendation engines.
- Microservice decomposition (Monolith architecture is strictly enforced).

---

## 4. User Personas & Roles

| Persona / Role | Responsibilities & Capabilities |
| :--- | :--- |
| **Guest Visitor** | Browses storefront, searches catalog, reads articles, adds items to cart, checks out as guest. |
| **Registered Customer** | Manages saved addresses, views order history & tracking timelines, manages wishlist and back-in-stock alerts. |
| **Super Admin** | Full system control, role assignment, system setting configuration, irreversible system actions. |
| **Catalog Manager** | Manages products, categories, variants, attributes, and media assets. |
| **Warehouse Manager** | Performs inventory adjustments, logs stock receipts, views stock alerts and movements. |
| **Order Support** | Processes order fulfillments, updates shipment tracking codes, manages return requests. |
| **Finance Manager** | Views sales reports, inspects payment attempts, issues approved refunds. |
| **Content Editor & Reviewer** | Editors draft health articles; Reviewers verify scientific sources before approving publication. |

---

## 5. Non-Functional Requirements & Performance SLAs

- **Page Load Time**: First Contentful Paint (FCP) < 1.2s, Largest Contentful Paint (LCP) < 2.5s on 4G connections.
- **Database Consistency**: Zero overselling (ACID concurrency tests on last remaining stock unit), `bigint` IRR precision without floating-point errors.
- **Security SLAs**: Rate limiting on OTP requests and search endpoints, CSRF protection on cookie-based mutations, server-side permission checks on every API endpoint.
- **Availability**: Health check endpoints (`/health/live` and `/health/ready`) with deep dependency status verification.
