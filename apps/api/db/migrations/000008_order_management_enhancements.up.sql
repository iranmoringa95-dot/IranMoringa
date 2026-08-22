-- Migration 000008: Order Management Enhancements, Tracking, Notes, and Timeline History

-- 1. Add extra columns to orders table if they do not exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(100) NOT NULL DEFAULT 'post_pishtaz',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) NOT NULL DEFAULT 'online_gateway',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'pending_payment';

-- 2. Create order_status_history table for timeline and audit tracking
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    actor_type VARCHAR(30) NOT NULL DEFAULT 'admin', -- 'admin', 'customer', 'system'
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    tracking_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);
