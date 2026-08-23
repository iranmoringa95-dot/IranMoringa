# PostgreSQL to Cloudflare D1 migration

The production cutover must remain reversible. PostgreSQL stays authoritative
until the Worker API has been changed to use the `DB` binding and the full E2E
suite passes against D1.

## Current migration resource

- D1 database: `iranmoringa-prod`
- D1 binding: `DB`
- Region: `WEUR`

The database identifier is stored in `apps/web/wrangler.toml`. No credentials
or customer data are committed to Git.

## Generate a fresh D1-compatible export

Run `scripts/postgres_to_d1.py` with the local PostgreSQL connection arguments.
Set `PGPASSWORD` in the process environment; never place it on the command line
or commit it to a file. The converter:

1. introspects all public tables, constraints, and indexes;
2. creates a local SQLite compatibility database;
3. copies every row using PostgreSQL `COPY` in read-only mode;
4. checks row counts and all foreign keys; and
5. writes a D1-compatible SQL file without explicit transactions.

Generated database files belong under `tmp/`, which is ignored by Git.

## Import and verify

```sh
npx wrangler d1 execute iranmoringa-prod --remote --file ../../tmp/moringa_d1.sql
npx wrangler d1 execute iranmoringa-prod --remote --command "PRAGMA foreign_key_check;"
```

An empty result from `foreign_key_check` is required. Compare critical table
counts (`users`, `orders`, `order_items`, `products`, `articles`, `comments`,
and `sms_logs`) with PostgreSQL before any cutover.

## Cutover gate

Do not deploy the D1 binding as a production cutover until:

- all PostgreSQL-specific queries and `$n` placeholders are converted to D1;
- write paths retain transactions, idempotency, audit logs, and inventory rules;
- integer IRR values are never converted through JavaScript floating point;
- authentication and admin authorization are enforced by the Worker API;
- the full verification suite and production smoke tests pass; and
- a tested rollback to the PostgreSQL snapshot is available.
