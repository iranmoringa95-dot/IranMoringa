# Operational Runbook - Incident Management & Response

## Severity Classification

| Level | Impact Description | Initial Response Time | On-Call Lead |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Total outage of Checkout, Payment Gateway, or Database. | < 15 minutes | Lead DevOps & Backend Engineer |
| **SEV-2 (High)** | Degradation of OTP login, Media storage, or Admin panel. | < 1 hour | Backend Engineer |
| **SEV-3 (Medium)** | Non-critical UI glitch or delayed background notification outbox. | < 4 hours | Fullstack Engineer |

---

## Triage Procedure
1. Inspect JSON error logs:
   `docker-compose -f infra/docker-compose.yml logs --tail=200 api`
2. Check readiness health endpoint:
   `curl -i http://localhost:8080/health/ready`
3. Inspect rate limit / HTTP 429 metrics.
4. Execute emergency mitigation or deployment rollback if regression introduced in recent release.
