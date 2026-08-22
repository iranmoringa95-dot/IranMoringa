-- Migration 000008 Down: Order Management Enhancements Rollback

DROP TABLE IF EXISTS order_status_history CASCADE;

ALTER TABLE orders
DROP COLUMN IF EXISTS tracking_code,
DROP COLUMN IF EXISTS admin_notes,
DROP COLUMN IF EXISTS customer_notes,
DROP COLUMN IF EXISTS shipping_method,
DROP COLUMN IF EXISTS payment_method,
DROP COLUMN IF EXISTS payment_status;
