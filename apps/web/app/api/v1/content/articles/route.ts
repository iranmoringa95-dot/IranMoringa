import { NextResponse } from 'next/server';
import { ALL_MORINGA_ARTICLES } from '@/lib/articles-data';
import { dbPool } from '@/lib/db';

export async function GET() {
  try {
    const res = await dbPool.query(`
      SELECT 
        a.id, a.slug, a.title_fa, a.summary_fa, a.content_fa, a.author_name_fa, 
        a.cover_image_url, a.reading_time_minutes, a.published_at, a.disclaimers_fa,
        a.seo_title, a.seo_description, c.name_fa AS category_name_fa, c.slug AS category_slug
      FROM articles a
      LEFT JOIN article_categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC
    `);

    if (res.rows && res.rows.length > 0) {
      return NextResponse.json({
        articles: res.rows,
        items: res.rows,
        total: res.rows.length,
      });
    }
  } catch (error) {
    // Fallback to in-memory ALL_MORINGA_ARTICLES
  }

  return NextResponse.json({
    articles: ALL_MORINGA_ARTICLES,
    items: ALL_MORINGA_ARTICLES,
    total: ALL_MORINGA_ARTICLES.length,
  });
}
