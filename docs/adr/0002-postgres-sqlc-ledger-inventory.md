# ADR 0002: PostgreSQL + sqlc & Ledger Inventory

## Context
E-commerce systems frequently suffer from overselling bugs, race conditions during flash sales, untraceable stock adjustments, and floating point currency errors.

## Decision
1. **PostgreSQL 16** is our transactional single source of truth.
2. **sqlc** generates compile-time type-safe Go code from pure SQL queries. Generic repositories or dynamic ORMs are avoided.
3. **Currency Invariant**: All prices and money calculations are stored as `bigint` Iranian Rial (IRR).
4. **Ledger Inventory**: Stock tracking separates `on_hand` and `reserved`. Stock mutations create immutable `inventory_movements` ledger records.

## Consequences
- **Positive**: Compile-time SQL verification, zero ORM performance overhead, complete auditability of stock movements, zero overselling under high concurrency.
- **Negative**: Schema changes require running migration scripts and regenerating `sqlc` code.
