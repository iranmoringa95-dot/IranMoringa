# Implementation Status - MoringaLab Commerce (`فروشگاه سبزینه`)

## Executive Summary
- **Completed Wave 0 Modules**: M22, M23, M21 (**100% COMPLETED**)
- **Completed Wave 1 Modules**: M19, M04, M03, M05 (**100% COMPLETED**)
- **Completed Wave 2 Modules**: M01, M02 (**100% COMPLETED**)
- **Completed Wave 3 Modules**:
  - **M06 — سبد خرید کاربر و مهمان**: **COMPLETED & VERIFIED**
  - **M07 — تسویه‌حساب (Checkout) و ثبت سفارش**: **COMPLETED & VERIFIED**
  - **M08 — درگاه پرداخت، IPN و سوابق مالی**: **COMPLETED & VERIFIED**
- **Date**: ۱۴۰۵/۰۵/۱۵ (۲۰۲۶-۰۸-۰۶)
- **Repository State**: Provider-agnostic `PaymentGateway` port interface, `FakeGateway` adapter, strict amount mismatch rejection (`ErrAmountMismatch`), callback replay protection, idempotency key deduplication, atomic inventory reservation rollbacks, guest checkout support, product/price/address snapshotting, customer account & address package, 20-goroutine competing concurrency test (zero overselling), and 100% clean Next.js production build (19 routes compiled cleanly with 0 errors).

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
| **M02** | **Customer Account & Address Portal** | Customer profile & address domain models, IDOR protection (`UserID` session scoping), 10-digit Iranian postal code validation (`ValidatePostalCode`), atomic default address toggles (`IsDefaultShipping`/`IsDefaultBilling`), REST API. | **COMPLETED** |
| **M06** | **Guest & Customer Cart Engine** | Guest cart generation with secure tokens, deterministic cart merging after login (`MergeGuestCartToUser`), atomic quantity stepping, backend price recalculation, discount coupon integration. | **COMPLETED** |
| **M07** | **Checkout & Order Engine** | Guest checkout placement, idempotency key deduplication (`seenOrders`), atomic inventory reservation rollbacks on order/payment failure, permanent order address & item snapshotting. | **COMPLETED** |
| **M08** | **Payment Gateways & Verification** | Provider-agnostic `PaymentGateway` port interface (`Initiate`, `Verify`), `FakeGateway` adapter, strict amount mismatch verification (`ErrAmountMismatch`), IPN callback replay protection. | **COMPLETED** |

---

## Verification & Test Results

1. **Go Unit Test Suite**:
   - `TestFakeGatewayAndPaymentVerification` (Fake gateway, amount mismatch rejection, callback replay protection): PASSED
   - `TestCheckoutIdempotencyAndGuestOrderPlacement`: PASSED
   - `TestGuestCartCreationAndMerging`: PASSED
   - `TestAddressIDORScopingAndDefaults`: PASSED
   - `TestGenerateOTPCode`: PASSED
   - `TestOTPFlowAndSessionRevocation`: PASSED
   - `TestStockReservationConcurrency20Routines`: PASSED
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

## M08 Definition of Done (DoD) Verification

- [x] Provider-agnostic `PaymentGateway` port interface (`Initiate`, `Verify`).
- [x] `FakeGateway` adapter implementation for dev/test environments.
- [x] Server-side verification strictly enforcing amount mismatch rejection (`ErrAmountMismatch`).
- [x] Duplicate IPN callback replay protection.
- [x] Clean Next.js static production build (`npm run build`).
