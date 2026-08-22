-- SMS Gateways Config & Settings Table
CREATE TABLE IF NOT EXISTS sms_gateways_config (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150),
    password VARCHAR(250),
    api_key VARCHAR(250),
    sender_number VARCHAR(50),
    extra_config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SMS Order Status Notification Templates (Buyer & Admin)
CREATE TABLE IF NOT EXISTS sms_status_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('buyer', 'admin')),
    order_status VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    pattern_code VARCHAR(100),
    message_template TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recipient_type, order_status)
);

-- SMS Product Subscribers (Back in stock, On Sale, Price drop)
CREATE TABLE IF NOT EXISTS sms_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    mobile VARCHAR(20) NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('back_in_stock', 'on_sale', 'price_change')),
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ
);

-- SMS Logs & Archive Table
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    recipient VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'queued')),
    gateway_response TEXT,
    message_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_subscribers_product ON sms_subscribers(product_id, alert_type, is_notified);
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON sms_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
