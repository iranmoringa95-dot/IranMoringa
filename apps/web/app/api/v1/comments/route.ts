import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';
import { getCommentsForArticle, CommentItem } from '@/lib/articles-comments-data';

export const dynamic = 'force-dynamic';

// In-memory store for newly posted comments during runtime
const IN_MEMORY_COMMENTS: Record<string, CommentItem[]> = {};

// UUID validator regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Common slug aliases to match legacy WordPress slugs and English slugs
const SLUG_ALIASES: Record<string, string[]> = {
  'moringa-tablets': ['قرص-مورینگا', 'قرص مورینگا اولیفرا خالص', 'moringa-tablets', 'moringa-capsules-60', 'کپسول مورینگا'],
  'moringa-powder-100g': ['پودر-برگ-مورینگا-اولیفیرا-آماده-ارسال', 'بسته پودر مورینگا', 'پودر مورینگا', 'moringa-leaf-powder-100g', 'moringa-powder-100g'],
  'moringa-leaf-powder-100g': ['پودر-برگ-مورینگا-اولیفیرا-آماده-ارسال', 'بسته پودر مورینگا', 'پودر مورینگا', 'moringa-leaf-powder-100g', 'moringa-powder-100g'],
  'moringa-leaf-powder-250g': ['پودر-برگ-مورینگا-اولیفیرا-آماده-ارسال', 'بسته پودر مورینگا', 'پودر مورینگا ۲۵۰ گرمی', 'moringa-leaf-powder-250g'],
  'moringa-bulk-leaves-1kg': ['برگ-کیلو', 'برگ یک کیلو', 'برگ خشک مورینگا ۱ کیلوگرمی', 'moringa-bulk-leaves-1kg'],
  'moringa-bulk-powder-1kg': ['پودر-یککیلو', 'پودریک‌کیلو', 'پودر خالص برگ مورینگا ۱ کیلوگرمی', 'moringa-bulk-powder-1kg'],
  'moringa-oil-20ml': ['روغن-خالص-مورینگا-شیشه-20-میل', 'روغن خالص مورینگا', 'moringa-oil-20ml'],
  'moringa-oil-30ml': ['روغن-مورینگا', 'روغن مورینگا خالص 30 میل', 'روغن مورینگا ۳۰ میلی‌لیتری', 'moringa-oil-30ml', 'moringa-oil'],
  'moringa-tea-100g': ['چای-مورینگا-اولیفیرا', 'چای مورینگا اولیفیرا(100gr)', 'چای مورینگا اولیفیرا ۱۰۰ گرمی', 'moringa-tea-100g'],
  'moringa-tea-50g': ['بسته-چای-مورینگا-50gr', 'بسته چای مورینگا (50gr)', 'بسته چای مورینگا ۵۰ گرمی', 'moringa-tea-50g'],
  'moringa-seeds-20': ['بذر-قابل-کشت-مورینگا-اولیفیرا20-عدد', 'بذر قابل کشت مورینگا اولیفیرا(20 عدد)', 'moringa-seeds-20', 'moringa-seeds-100g'],
  'moringa-seeds-100g': ['بذر-قابل-کشت-مورینگا-اولیفیرا20-عدد', 'دانه مورینگا ۱۰۰ گرمی', 'moringa-seeds-100g', 'moringa-seeds-20'],
  'moringa-lemon-tea-20': ['دمنوش مورینگا و لیمو ۲۰ عددی', 'دمنوش مورینگا و لیمو', 'moringa-lemon-tea-20'],
  'moringa-cinnamon-tea-20': ['دمنوش مورینگا و دارچین ۲۰ عددی', 'دمنوش مورینگا و دارچین', 'moringa-cinnamon-tea-20'],
  'moringa-starter-pack': ['بسته آشنایی با مورینگا', 'moringa-starter-pack'],
  'moringa-gift-box': ['بسته هدیه مورینگا', 'moringa-gift-box'],
  'moringa-book': ['کتاب-مورینگا-اعجاز-طبیعت', 'کتاب مورینگا اعجاز طبیعت', 'کتاب مورینگا', 'moringa-book'],
};

// GET: Fetch approved comments for an article or product
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('type') || ''; // 'article', 'product', 'page'
  const targetIdParam = searchParams.get('target_id') || '';
  const slug = (searchParams.get('slug') || '').trim();
  const title = (searchParams.get('title') || '').trim();

  try {
    const isUUID = targetIdParam && UUID_REGEX.test(targetIdParam);

    const conditions: string[] = ["c.status = 'approved'"];
    const params: any[] = [];
    let pIdx = 1;

    if (targetType) {
      conditions.push(`c.target_type = $${pIdx}`);
      params.push(targetType);
      pIdx++;
    }

    if (isUUID) {
      conditions.push(`(
        c.target_id = $${pIdx} OR
        c.target_id IN (
          SELECT id FROM articles WHERE slug = $${pIdx + 1} OR title_fa ILIKE $${pIdx + 2}
          UNION
          SELECT id FROM products WHERE slug = $${pIdx + 1} OR title_fa ILIKE $${pIdx + 2}
        )
      )`);
      params.push(targetIdParam, slug || '', `%${title || slug}%`);
      pIdx += 3;
    } else if (slug || title) {
      const aliases = SLUG_ALIASES[slug] || [];
      const slugConditions = [`c.target_title ILIKE $${pIdx}`];
      params.push(`%${title || slug}%`);
      pIdx++;

      slugConditions.push(`c.target_id IN (
        SELECT id FROM articles WHERE slug = $${pIdx} OR title_fa ILIKE $${pIdx + 1}
        UNION
        SELECT id FROM products WHERE slug = $${pIdx} OR title_fa ILIKE $${pIdx + 1}
      )`);
      params.push(slug, `%${title || slug}%`);
      pIdx += 2;

      for (const alias of aliases) {
        slugConditions.push(`c.target_title ILIKE $${pIdx}`);
        params.push(`%${alias}%`);
        pIdx++;

        slugConditions.push(`c.target_id IN (
          SELECT id FROM articles WHERE slug = $${pIdx} OR title_fa ILIKE $${pIdx + 1}
          UNION
          SELECT id FROM products WHERE slug = $${pIdx} OR title_fa ILIKE $${pIdx + 1}
        )`);
        params.push(alias, `%${alias}%`);
        pIdx += 2;
      }

      conditions.push(`(${slugConditions.join(' OR ')})`);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        c.id,
        c.target_type,
        c.target_id,
        c.target_title,
        c.parent_id,
        c.author_name,
        c.rating,
        c.content,
        c.status,
        c.is_buyer_verified,
        c.is_admin_reply,
        c.like_count,
        c.created_at
      FROM comments c
      WHERE ${whereClause}
      ORDER BY c.created_at ASC;
    `;

    const result = await dbPool.query(sql, params);

    if (result.rows && result.rows.length > 0) {
      const allComments = result.rows;
      const parentComments: any[] = [];
      const childrenMap: Record<string, any[]> = {};

      allComments.forEach((c) => {
        if (c.parent_id) {
          if (!childrenMap[c.parent_id]) {
            childrenMap[c.parent_id] = [];
          }
          childrenMap[c.parent_id].push(c);
        } else {
          parentComments.push(c);
        }
      });

      const structured = parentComments.map((p) => ({
        ...p,
        replies: childrenMap[p.id] || [],
      }));

      let avgRating = 0;
      const rated = allComments.filter((c) => c.rating && c.rating > 0);
      if (rated.length > 0) {
        avgRating = Number((rated.reduce((acc, c) => acc + c.rating, 0) / rated.length).toFixed(1));
      }

      return NextResponse.json({
        comments: structured,
        totalCount: allComments.length,
        averageRating: avgRating,
        ratedCount: rated.length,
      });
    }
  } catch (dbError) {
    // Database offline or query error, fall through to static & in-memory comments
  }

  // Fallback to static & in-memory comments
  const staticComments = getCommentsForArticle(slug || targetIdParam, title);
  const runtimeComments = IN_MEMORY_COMMENTS[slug] || IN_MEMORY_COMMENTS[targetIdParam] || [];
  
  const merged = [...staticComments, ...runtimeComments];

  // Count total including replies
  let totalCount = 0;
  merged.forEach((c) => {
    totalCount += 1 + (c.replies?.length || 0);
  });

  return NextResponse.json({
    comments: merged,
    totalCount,
    averageRating: 5,
    ratedCount: merged.length,
  });
}

// POST: Submit a new comment or review from website visitors
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      target_type = 'article',
      target_id = null,
      target_title = 'بدون عنوان',
      parent_id = null,
      author_name,
      author_email,
      author_phone,
      rating,
      content,
    } = body;

    if (!author_name || !author_name.trim()) {
      return NextResponse.json({ error: 'لطفاً نام خود را وارد کنید.' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'متن دیدگاه نمی‌تواند خالی باشد.' }, { status: 400 });
    }

    const cleanRating = rating ? Math.max(1, Math.min(5, parseInt(rating, 10))) : null;

    // In-memory comment creation for instant reflection
    const newComment: CommentItem = {
      id: `cm-user-${Date.now()}`,
      target_type,
      target_id: target_id || undefined,
      target_title: target_title.trim(),
      parent_id: parent_id || undefined,
      author_name: author_name.trim(),
      rating: cleanRating,
      content: content.trim(),
      status: 'approved',
      is_buyer_verified: false,
      is_admin_reply: false,
      like_count: 0,
      created_at: new Date().toISOString(),
      replies: [],
    };

    const key = (body.slug || target_id || target_title).trim();
    if (!IN_MEMORY_COMMENTS[key]) {
      IN_MEMORY_COMMENTS[key] = [];
    }
    IN_MEMORY_COMMENTS[key].push(newComment);

    // Try saving to DB as well if connection exists
    try {
      let validTargetId: string | null = target_id && UUID_REGEX.test(target_id) ? target_id : null;
      const validParentId: string | null = parent_id && UUID_REGEX.test(parent_id) ? parent_id : null;

      const insertSql = `
        INSERT INTO comments (
          target_type, target_id, target_title, parent_id,
          author_name, author_email, author_phone, rating,
          content, status, is_buyer_verified, is_admin_reply, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', false, false, NOW())
        RETURNING id, created_at;
      `;

      await dbPool.query(insertSql, [
        target_type,
        validTargetId,
        target_title.trim(),
        validParentId,
        author_name.trim(),
        author_email?.trim() || null,
        author_phone?.trim() || null,
        cleanRating,
        content.trim(),
      ]);
    } catch (dbSaveError) {
      // Handled in memory
    }

    return NextResponse.json({
      success: true,
      message: 'دیدگاه شما با موفقیت ثبت و منتشر گردید.',
      comment: newComment,
    });
  } catch (error: any) {
    console.error('Error creating public comment:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت نظر', detail: error?.message },
      { status: 500 }
    );
  }
}

