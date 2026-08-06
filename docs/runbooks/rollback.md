# Operational Runbook - Deployment Rollback Procedure

## Rollback Principles
1. Database migrations are Append-only (`expand/migrate/contract`). Code must support both old and new schema columns during transition.
2. Production deployments are tagged with Git commit SHA hashes.

---

## Procedure
1. Identify last stable Git commit SHA:
   `git log --oneline -n 5`
2. Rollback web storefront & Go API containers:
   `docker-compose -f infra/docker-compose.yml up -d --build --no-deps api web`
3. Verify liveness and readiness:
   `curl http://localhost:8080/health/live`
   `curl http://localhost:8080/health/ready`
