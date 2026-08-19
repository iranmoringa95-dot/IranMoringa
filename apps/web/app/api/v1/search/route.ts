import { NextRequest, NextResponse } from 'next/server';
import { performUnifiedSearch } from '@/lib/search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const results = performUnifiedSearch(q);

  return NextResponse.json({
    query: results.query,
    total: results.totalMatches,
    products: results.products.slice(0, limit).map((p) => ({
      id: p.item.id,
      slug: p.item.slug,
      sku: p.item.sku,
      title_fa: p.item.title_fa,
      subtitle_fa: p.item.subtitle_fa,
      category_name_fa: p.item.category_name_fa,
      category_slug: p.item.category_slug,
      price_irr: p.item.price_irr,
      compare_at_price_irr: p.item.compare_at_price_irr,
      media: p.item.media,
      inventory_quantity: p.item.inventory_quantity,
      score: p.score,
    })),
    articles: results.articles.slice(0, limit).map((a) => ({
      id: a.item.id,
      slug: a.item.slug,
      title_fa: a.item.title_fa,
      summary_fa: a.item.summary_fa,
      category_name_fa: a.item.category_name_fa,
      category_slug: a.item.category_slug,
      cover_image_url: a.item.cover_image_url,
      reading_time_minutes: a.item.reading_time_minutes,
      tags: a.item.tags,
      score: a.score,
    })),
    categories: results.categories,
    suggestions: results.suggestions,
  });
}
