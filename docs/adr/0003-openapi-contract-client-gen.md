# ADR 0003: OpenAPI Contract Driven Client Generation

## Context
As the API evolves, manual TypeScript API client definitions in the frontend easily drift from backend Go handlers, leading to runtime errors, field name mismatches, and broken contracts.

## Decision
1. Maintain `api-contract/openapi.yaml` as the single authoritative API contract specification.
2. Use OpenAPI generators to produce TypeScript API client types in `apps/web/lib/api-client/`.
3. Include CI check (`make openapi-generate`) to verify contract synchronization before merging code changes.

## Consequences
- **Positive**: Strict type safety end-to-end, early compile-time error detection on breaking API changes.
- **Negative**: Developers must update `openapi.yaml` whenever backend endpoint signatures change.
