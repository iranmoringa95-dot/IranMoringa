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
