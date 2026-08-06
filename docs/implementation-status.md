# Implementation Status - MoringaLab Commerce (`فروشگاه سبزینه`)

## Executive Summary
- **Completed Modules**:
  - **M22 — بومی‌سازی کامل ایران، فارسی و RTL**: **COMPLETED & VERIFIED**
  - **M23 — زیرساخت، کارایی، امنیت و عملیات**: **COMPLETED & VERIFIED**
  - **M21 — پنل مدیریت، دسترسی و Audit**: **COMPLETED & VERIFIED**
  - **M19 — مدیریت رسانه، تصویر و اسناد**: **COMPLETED & VERIFIED**
  - **M04 — دسته، برند و ویژگی محصول**: **COMPLETED & VERIFIED**
  - **M03 — کاتالوگ محصول، Variant و مشخصات**: **COMPLETED & VERIFIED**
- **Date**: ۱۴۰۵/۰۵/۱۵ (۲۰۲۶-۰۸-۰۶)
- **Repository State**: Shipping weight invariant (`ShippingWeightGrams >= NetWeightGrams`), soft archive enforcement (`ArchiveProduct`), variant requirement (`ErrNoVariant`), price invariants, optimistic concurrency control (`Version`), category cycle prevention, ObjectStorage interface, RBAC permission engine, and 100% clean Next.js production build (19 routes compiled cleanly with 0 errors).

---

## Completed Modules Audit Matrix

| Module | Subsystem / Feature | Implementation Detail | Status |
| :--- | :--- | :--- | :--- |
| **M22** | **Localization Package** | `apps/api/internal/localization` & `apps/web/lib/localization/` (Persian digits, character unification `ي/ك`, E.164 phone `+98`, 10-digit postal code, 31 Iranian provinces, Toman currency math, Jalali calendar). | **COMPLETED** |
| **M23** | **Platform Infrastructure** | Header log redaction middleware, sliding window Rate Limiter (`429` + `Retry-After`), readiness health endpoints, root Makefile targets, and operational runbooks (`database-restore.md`, `incident.md`, `rollback.md`, `deployment.md`). | **COMPLETED** |
| **M21** | **Admin RBAC & Audit Trail** | Granular permission catalog (`catalog.manage`, `orders.fulfill`, `inventory.adjust`, `audit.read`), policy evaluator (`HasPermission`), append-only audit trail with secret redaction (`LogAction`), searchable Audit UI with Jalali date formatting. | **COMPLETED** |
| **M19** | **Media Library & Processing** | `ObjectStorage` port interface & `FakeStorage` adapter, Magic byte inspection (JPEG/PNG/WebP), SHA-256 checksums, mandatory Persian alt text validator, deletion guard (`media_usages`), `<MediaSelectorModal />` component. | **COMPLETED** |
| **M04** | **Taxonomy, Brand & Attributes** | Category tree cycle prevention (`DetectCategoryCycle`), `Brand` model & REST API (`GET /api/v1/catalog/brands`), `Tag`, `Attribute` (`DisplayType`: `select`/`button`/`color`/`image`) & `AttributeValue` (`ColorHex`, `MediaID`), REST API (`GET /api/v1/catalog/attributes`). | **COMPLETED** |
| **M03** | **Catalog Product & Variants** | Variant requirement (`ErrNoVariant`), weight invariant (`ShippingWeightGrams >= NetWeightGrams`), compare price validation, soft archiving (`ArchiveProduct`), optimistic concurrency locking (`Version`). | **COMPLETED** |

---

## Verification & Test Results

1. **Go Unit Test Suite**:
   - `TestProductDomainInvariants` (Weight invariants & soft archiving): PASSED
   - `TestCategoryCyclePrevention`: PASSED
   - `TestDetectMIMEFromBytes`: PASSED
   - `TestRegisterAssetAndAltTextRequirement`: PASSED
   - `TestHasPermission`: PASSED
   - `TestRedactHeaderValue`: PASSED
   - `TestRateLimiter`: PASSED
   - `TestNormalizeDigits`, `TestNormalizeIranianPhone`, `TestValidatePostalCode`, `TestCurrencyFormatting`, `TestJalaliConversion`: PASSED
2. **TypeScript Typecheck**:
   - `npm run typecheck` passed cleanly with code 0.
3. **Next.js Production Build**:
   - `npm run build` compiled 19 static/dynamic routes cleanly with 0 errors.

---

## M03 Definition of Done (DoD) Verification

- [x] Every sellable product has at least 1 active variant (`ErrNoVariant`).
- [x] Weight invariant enforced (`ShippingWeightGrams >= NetWeightGrams`).
- [x] Price invariants enforced (integer IRR; compare price strictly greater).
- [x] Physical deletion blocked for active products (`ErrProductInUse`); soft archiving (`ArchiveProduct`) enforced.
- [x] Clean Next.js static production build (`npm run build`).
