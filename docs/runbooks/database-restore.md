# Operational Runbook - Database Restore & Recovery

## RPO & RTO Targets
- **Recovery Point Objective (RPO)**: < 15 minutes (wal-g / point-in-time recovery).
- **Recovery Time Objective (RTO)**: < 30 minutes.

---

## Pre-Restore Checklist
1. Verify target environment is isolated from production traffic.
2. Confirm backup file integrity (`pg_dump` tar.gz or encrypted WAL archive).
3. Ensure active connections to the target database are terminated.

---

## Restore Steps (Development & Staging)

```bash
# 1. Terminate active database sessions
docker-compose -f infra/docker-compose.yml exec -T postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'moringalab' AND pid <> pg_backend_pid();"

# 2. Drop and recreate target database
docker-compose -f infra/docker-compose.yml exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS moringalab;"
docker-compose -f infra/docker-compose.yml exec -T postgres psql -U postgres -c "CREATE DATABASE moringalab OWNER postgres;"

# 3. Restore schema & seed data from dump
cat backups/latest.sql | docker-compose -f infra/docker-compose.yml exec -T postgres psql -U postgres -d moringalab
```

---

## Verification After Restore
1. Check migration version status:
   `make migrate-status`
2. Verify record counts for critical tables (`users`, `products`, `orders`).
3. Run integration readiness check:
   `curl http://localhost:8080/health/ready`
