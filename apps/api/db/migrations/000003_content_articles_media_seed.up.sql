-- Article Categories table
CREATE TABLE IF NOT EXISTS content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_fa VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
    author_name_fa VARCHAR(150) NOT NULL DEFAULT 'تیم تحریریه مورینگا ایران',
    slug VARCHAR(200) UNIQUE NOT NULL,
    title_fa VARCHAR(250) NOT NULL,
    summary_fa TEXT NOT NULL,
    content_fa TEXT NOT NULL,
    cover_image_url TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'in_review', 'changes_requested', 'approved', 'scheduled', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    disclaimers_fa TEXT NOT NULL DEFAULT 'این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.',
    seo_title VARCHAR(250),
    seo_description TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article Revisions history table
CREATE TABLE IF NOT EXISTS article_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    version INT NOT NULL,
    title_fa VARCHAR(250) NOT NULL,
    summary_fa TEXT NOT NULL,
    content_fa TEXT NOT NULL,
    disclaimers_fa TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
