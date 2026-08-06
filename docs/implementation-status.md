# Implementation Status - MoringaLab Commerce (`فروشگاه سبزینه`)

## Executive Summary
- **Completed Wave 0 Modules**: M22, M23, M21 (**100% COMPLETED**)
- **Completed Wave 1 Modules**: M19, M04, M03, M05 (**100% COMPLETED**)
- **Completed Wave 2 Modules**:
  - **M01 — ورود و ثبت‌نام پیامکی**: **COMPLETED & VERIFIED**
- **Date**: ۱۴۰۵/۰۵/۱۵ (۲۰۲۶-۰۸-۰۶)
- **Repository State**: 6-digit CSPRNG OTP generation (`crypto/rand`), SHA-256 OTP challenge hashing, constant-time hash comparison (`subtle.ConstantTimeCompare`), E.164 phone normalization, `LogoutAll` session revocation, `HttpOnly` `Secure` session cookies, 20-goroutine competing concurrency test (zero overselling), safety stock ledger, category cycle prevention, ObjectStorage interface, RBAC permission engine, and 100% clean Next.js production build (19 routes compiled cleanly with 0 errors).

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
| **M05** | **Inventory & Stock Ledger** | Safety stock formula (`available = on_hand - reserved - safety_stock`), 20-routine competing reservation concurrency test (zero overselling), audit movements tracking (`InventoryMovement`), adjustment idempotency key checking (`AdjustStockWithKey`). | **COMPLETED** |
| **M01** | **Iranian Mobile OTP Auth** | 6-digit CSPRNG OTP generation (`crypto/rand`), SHA-256 challenge hashing, constant-time comparison (`subtle.ConstantTimeCompare`), E.164 phone normalization, `LogoutAll` session revocation, `HttpOnly` `Secure` cookies. | **COMPLETED** |

---

## Verification & Test Results

1. **Go Unit Test Suite**:
   - `TestGenerateOTPCode` (CSPRNG 6-digit generation): PASSED
   - `TestOTPFlowAndSessionRevocation` (OTP hashing, constant-time comparison, LogoutAll): PASSED
   - `TestStockReservationConcurrency20Routines` (20 competing goroutines): PASSED
   - `TestAdjustStockIdempotency`: PASSED
   - `TestProductDomainInvariants`: PASSED
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

## M01 Definition of Done (DoD) Verification

- [x] 6-digit CSPRNG OTP generation using `crypto/rand`.
- [x] SHA-256 hashed OTP challenge storage with constant-time hash comparison (`subtle.ConstantTimeCompare`).
- [x] Phone normalization supporting Persian digits (`۰-۹` -> E.164 `+989xxxxxxxxx`).
- [x] `LogoutAll` revoking all active sessions for a user via `POST /api/v1/auth/logout-all`.
- [x] Session tokens sent as `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- [x] Clean Next.js static production build (`npm run build`).
