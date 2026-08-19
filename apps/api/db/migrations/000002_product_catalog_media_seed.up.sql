-- Product Categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Product Media table for role-based images
CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'gallery' CHECK (role IN ('primary', 'gallery')),
    position INT NOT NULL DEFAULT 0,
    alt_fa TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demo Seed Registry table for idempotent seed execution
CREATE TABLE IF NOT EXISTS demo_seed_registry (
    seed_key VARCHAR(150) PRIMARY KEY,
    seed_version INT NOT NULL DEFAULT 1,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
