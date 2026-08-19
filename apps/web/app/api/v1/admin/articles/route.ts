import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export async function GET() {
  try {
    const res = await dbPool.query(`
      SELECT 
        a.id, a.slug, a.title_fa, a.summary_fa, a.content_fa, a.author_name_fa, 
        a.cover_image_url, a.status, a.reading_time_minutes, a.published_at, a.created_at,
        c.name_fa AS category_name_fa, c.slug AS category_slug
      FROM articles a
      LEFT JOIN article_categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
    `);

    return NextResponse.json({
      articles: res.rows,
      items: res.rows,
      total: res.rows.length,
    });
  } catch (error) {
    console.error('Error fetching admin articles:', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
