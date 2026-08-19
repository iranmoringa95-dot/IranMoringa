-- Article Categories table
CREATE TABLE IF NOT EXISTS article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_fa VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description_fa TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article Tags table
CREATE TABLE IF NOT EXISTS article_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_fa VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Articles main table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name_fa VARCHAR(150) NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_name_fa VARCHAR(150),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title_fa VARCHAR(250) NOT NULL,
    summary_fa TEXT NOT NULL,
    content_fa TEXT NOT NULL,
    cover_image_url TEXT,
    status VARCHAR(25) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'changes_requested', 'approved', 'scheduled', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    forbidden_claim_flagged BOOLEAN NOT NULL DEFAULT false,
    disclaimers_fa TEXT NOT NULL,
    medical_warnings JSONB,
    sources JSONB,
    rejection_notes TEXT,
    reading_time_minutes INT NOT NULL DEFAULT 3,
    seo_title VARCHAR(250),
    seo_description TEXT,
    canonical_url TEXT,
    last_reviewed_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article Revisions table for history and restore
CREATE TABLE IF NOT EXISTS article_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    version INT NOT NULL,
    title_fa VARCHAR(250) NOT NULL,
    summary_fa TEXT NOT NULL,
    content_fa TEXT NOT NULL,
    disclaimers_fa TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article Product Relations table
CREATE TABLE IF NOT EXISTS article_product_relations (
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, product_id)
);

-- Article Tag Relations table
CREATE TABLE IF NOT EXISTS article_tag_relations (
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES article_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);
