# 12-Factor Deployment Guide - MoringaLab Commerce (`فروشگاه سبزینه`)

## Environment Variables

| Variable | Description | Default | Sensitivity |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | Environment stage (`development`, `staging`, `production`) | `development` | Public |
| `APP_PORT` | Go API server HTTP port | `8080` | Public |
| `DB_HOST` | PostgreSQL hostname | `localhost` | Secret |
| `DB_PORT` | PostgreSQL port | `5432` | Public |
| `DB_USER` | PostgreSQL user | `postgres` | Secret |
| `DB_PASSWORD` | PostgreSQL password | `postgres` | Secret |
| `DB_NAME` | PostgreSQL database name | `moringalab` | Public |
| `SESSION_SECRET` | 32-byte secret for session token HMAC | Required | Confidential |
| `MELIPAYAMAK_API_KEY` | Production SMS Gateway Key | Optional (Fake SMS default) | Confidential |
| `BEHPAYAM_MERCHANT_ID` | Production Bank Gateway ID | Optional (Fake Gateway default) | Confidential |

---

## Local Development Spin-Up
```bash
# 1. Clone & setup environment
cp .env.example .env

# 2. Start infra containers
make up

# 3. Run migrations & seeds
make seed

# 4. Verify monorepo static checks
make check
```
## Cloudflare storefront and Go API routing

The storefront deployment in `apps/web` is a static-assets Worker. Dynamic `/api/*` requests must be handled by `worker.mjs` and proxied to the separately deployed Go API; Next.js route handlers are not included in `cf-dist`.

Before deploying the Worker, configure `API_ORIGIN` in the Cloudflare Worker settings (or with `npx wrangler secret put API_ORIGIN`). Its value must be the HTTPS origin only, for example `https://api.example.com`, without `/api/v1`. Then deploy from `apps/web` after running the web build.

The Go API production environment must also set:

- `APP_ENV=production`
- `SMS_PROVIDER=webonesms`
- `WEBONESMS_API_KEY`
- `WEBONESMS_SENDER`
- `WEBONESMS_BASE_URL`
- optionally `WEBONESMS_OTP_TEMPLATE_ID`

Do not put WebOneSMS credentials in Wrangler variables or browser-visible `NEXT_PUBLIC_*` variables. They belong only on the Go API server.
