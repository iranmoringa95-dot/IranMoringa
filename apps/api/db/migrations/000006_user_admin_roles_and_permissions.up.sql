-- Migration 000006: User Admin Roles & Permissions

CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'shop_manager',
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    allowed_sections TEXT[] NOT NULL DEFAULT '{}',
    custom_title VARCHAR(150),
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);

-- Ensure all admin sections list
-- ['products', 'inventory', 'orders', 'postchi', 'promotions', 'reviews', 'notifications', 'audit-logs', 'articles', 'seo', 'support', 'chatbot', 'reports', 'access']

-- Update or insert initial super admin users and link them to admin_roles

-- 1. Main Super Admin: 09132391843 (احسان پویا)
DO $$
DECLARE
    v_user_id UUID;
    v_sections TEXT[] := ARRAY['products', 'inventory', 'orders', 'postchi', 'promotions', 'reviews', 'notifications', 'audit-logs', 'articles', 'seo', 'support', 'chatbot', 'reports', 'access'];
BEGIN
    SELECT id INTO v_user_id FROM users WHERE phone = '+989132391843' OR phone = '09132391843' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        INSERT INTO users (phone, email, first_name, last_name, is_active, created_at, updated_at)
        VALUES ('+989132391843', 'pqehsan@gmail.com', 'احسان', 'پویا', true, NOW(), NOW())
        RETURNING id INTO v_user_id;
    ELSE
        UPDATE users 
        SET first_name = 'احسان', 
            last_name = 'پویا', 
            email = COALESCE(email, 'pqehsan@gmail.com'),
            is_active = true, 
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    INSERT INTO admin_roles (user_id, role, is_super_admin, allowed_sections, custom_title, must_change_password, created_at, updated_at)
    VALUES (v_user_id, 'super_admin', true, v_sections, 'احسان پویا (مدیر ارشد)', false, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'super_admin',
        is_super_admin = true,
        allowed_sections = v_sections,
        custom_title = 'احسان پویا (مدیر ارشد)',
        updated_at = NOW();

    -- Ensure credentials exist with initial password
    INSERT INTO user_credentials (user_id, password_hash, totp_enabled, failed_login_attempts)
    VALUES (v_user_id, '@KamalGeraei990', false, 0)
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- 2. Operations & Farm Admin: 09175929345 (مدیریت عملیات و مزرعه)
DO $$
DECLARE
    v_user_id UUID;
    v_sections TEXT[] := ARRAY['products', 'inventory', 'orders', 'postchi', 'promotions', 'reviews', 'notifications', 'audit-logs', 'articles', 'seo', 'support', 'chatbot', 'reports', 'access'];
BEGIN
    SELECT id INTO v_user_id FROM users WHERE phone = '+989175929345' OR phone = '09175929345' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        INSERT INTO users (phone, email, first_name, last_name, is_active, created_at, updated_at)
        VALUES ('+989175929345', 'info@iran-moringa.ir', 'مدیریت', 'عملیات و مزرعه', true, NOW(), NOW())
        RETURNING id INTO v_user_id;
    ELSE
        UPDATE users 
        SET first_name = 'مدیریت', 
            last_name = 'عملیات و مزرعه', 
            email = COALESCE(email, 'info@iran-moringa.ir'),
            is_active = true, 
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    INSERT INTO admin_roles (user_id, role, is_super_admin, allowed_sections, custom_title, must_change_password, created_at, updated_at)
    VALUES (v_user_id, 'super_admin', true, v_sections, 'مدیریت عملیات و مزرعه', true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'super_admin',
        is_super_admin = true,
        allowed_sections = v_sections,
        custom_title = 'مدیریت عملیات و مزرعه',
        updated_at = NOW();

    INSERT INTO user_credentials (user_id, password_hash, totp_enabled, failed_login_attempts)
    VALUES (v_user_id, '@KamalGeraei990', false, 0)
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- 3. Email Admin: pqehsan@gmail.com
DO $$
DECLARE
    v_user_id UUID;
    v_sections TEXT[] := ARRAY['products', 'inventory', 'orders', 'postchi', 'promotions', 'reviews', 'notifications', 'audit-logs', 'articles', 'seo', 'support', 'chatbot', 'reports', 'access'];
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'pqehsan@gmail.com' AND phone != '+989132391843' LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        UPDATE users 
        SET first_name = 'احسان', 
            last_name = 'پویا', 
            is_active = true, 
            updated_at = NOW()
        WHERE id = v_user_id;

        INSERT INTO admin_roles (user_id, role, is_super_admin, allowed_sections, custom_title, must_change_password, created_at, updated_at)
        VALUES (v_user_id, 'super_admin', true, v_sections, 'احسان پویا', true, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET role = 'super_admin',
            is_super_admin = true,
            allowed_sections = v_sections,
            custom_title = 'احسان پویا',
            updated_at = NOW();

        INSERT INTO user_credentials (user_id, password_hash, totp_enabled, failed_login_attempts)
        VALUES (v_user_id, '@KamalGeraei990', false, 0)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;
