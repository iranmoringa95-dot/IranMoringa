-- Migration 000007: Shipping Methods, Dimensions & Dynamic Postal Tariffs

-- 1. Add physical dimensions to product_variants
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS length_cm INT NOT NULL DEFAULT 10 CHECK (length_cm >= 0),
ADD COLUMN IF NOT EXISTS width_cm INT NOT NULL DEFAULT 10 CHECK (width_cm >= 0),
ADD COLUMN IF NOT EXISTS height_cm INT NOT NULL DEFAULT 5 CHECK (height_cm >= 0);

-- 2. Add shipping method tracking to orders if not existing
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50) NOT NULL DEFAULT 'post_pishtaz',
ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100);

-- 3. Create table for dynamic shipping tariffs and settings
CREATE TABLE IF NOT EXISTS shipping_tariff_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier VARCHAR(50) NOT NULL DEFAULT 'post', -- 'post', 'courier'
    service_code VARCHAR(50) NOT NULL UNIQUE, -- 'post_pishtaz', 'courier_isfahan'
    title_fa VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    base_fee_irr BIGINT NOT NULL,
    per_extra_kg_fee_irr BIGINT NOT NULL DEFAULT 0,
    free_shipping_threshold_irr BIGINT NOT NULL DEFAULT 15000000, -- 1.5m Toman
    intra_province_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    neighbor_province_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.25,
    non_neighbor_province_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.50,
    packaging_fee_tier1_irr BIGINT NOT NULL DEFAULT 80000,
    packaging_fee_tier2_irr BIGINT NOT NULL DEFAULT 140000,
    packaging_fee_tier3_irr BIGINT NOT NULL DEFAULT 220000,
    insurance_fee_irr BIGINT NOT NULL DEFAULT 80000,
    vat_percent INT NOT NULL DEFAULT 10,
    api_endpoint VARCHAR(255),
    api_key VARCHAR(255),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Seed initial tariff rules
INSERT INTO shipping_tariff_rules (
    carrier, service_code, title_fa, is_active, base_fee_irr, per_extra_kg_fee_irr, 
    free_shipping_threshold_irr, intra_province_multiplier, neighbor_province_multiplier, 
    non_neighbor_province_multiplier, packaging_fee_tier1_irr, packaging_fee_tier2_irr, 
    packaging_fee_tier3_irr, insurance_fee_irr, vat_percent
) VALUES 
(
    'post', 'post_pishtaz', 'پست پیشتاز سراسری (شرکت ملی پست)', true, 
    380000, 120000, 15000000, 1.00, 1.25, 1.55, 
    80000, 140000, 220000, 80000, 10
),
(
    'courier', 'courier_isfahan', 'پیک موتوری فوری (ویژه شهر اصفهان)', true, 
    550000, 0, 0, 1.00, 1.00, 1.00, 
    0, 0, 0, 0, 0
)
ON CONFLICT (service_code) DO NOTHING;
