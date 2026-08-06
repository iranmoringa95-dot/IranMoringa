# Security Threat Model & Control Matrix - MoringaLab Commerce (`فروشگاه سبزینه`)

## 1. Threat Model & Mitigation Matrix

| Threat Vector | Risk Level | Mitigation Strategy | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| **OTP Brute Force & Abuse** | High | Max 3 verification attempts per OTP challenge; 120-second cooldown per phone number; SHA256 hashed OTP in database; IP & Phone rate limiting. | `internal/identity` & Platform Middleware |
| **Session Theft & Fixation** | Critical | Secure `HttpOnly`, `SameSite=Lax` cookies; Session tokens stored only as SHA256 hashes in PostgreSQL; Token rotation on privilege escalation. | `internal/identity` Session Service |
| **Cross-Site Request Forgery (CSRF)** | High | Anti-CSRF token validation header (`X-CSRF-Token`) required on all state-mutating HTTP methods for cookie-authenticated clients. | Middleware |
| **Cross-Site Scripting (XSS)** | High | Content sanitization (bluemonday/DOMPurify) on all user/admin rich text input; React automatic escaping; strict Content-Security-Policy headers. | Frontend & API Handler |
| **SQL Injection** | Critical | 100% parameterized queries generated via `sqlc` and `pgx/v5`. No dynamic string concatenation in raw SQL statements. | Database / Repository Layer |
| **Insecure Direct Object Reference (IDOR)** | Critical | Strict ownership validation (`WHERE customer_id = $1`) on order lookup, address mutation, wishlist, and profile endpoints. | Backend Service Layer |
| **Admin Privilege Escalation** | Critical | Server-side RBAC validation (`permission.Check(ctx, "inventory.adjust")`) on every admin handler. UI hiding is strictly visual. | `internal/identity` & RBAC Middleware |
| **Overselling Race Condition** | High | PostgreSQL `SELECT ... FOR UPDATE` row locks inside explicit database transactions. Stock reservation TTL worker releases abandoned checkouts. | `internal/inventory` Service |
| **Payment / Webhook Forgery** | Critical | Backend-to-Backend verification call to gateway before marking any payment `succeeded`. Amount and reference verification against original order. | `internal/payments` Service |
| **Sensitive Data Exposure in Logs** | High | Automated structured log redaction (`slog` middleware) for phone numbers, OTP codes, session tokens, passwords, and user addresses. | `internal/platform/observability` |

---

## 2. Secrets Management & Environment Isolation

- No production secrets, API keys, credentials, or actual customer data are stored in version control.
- `.env.example` provides template variables with safe local development placeholders.
- Frontend public environment variables (`NEXT_PUBLIC_*`) strictly contain non-sensitive configuration (API URLs, site branding). Secrets are restricted to backend environment runtime.
