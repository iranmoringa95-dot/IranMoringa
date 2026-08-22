import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
  // Articles
  'moringa-super-food': ['سوپرفود مورینگا', 'moringa-super-food'],
  'moringa-powder-2': ['پودر مورینگا', 'تفاوت پودر مورینگا و برگ خشک مورینگا', 'moringa-powder-2', 'moringa-powder-vs-dried-leaves'],
  'moringa-powder-vs-dried-leaves': ['تفاوت پودر مورینگا و برگ خشک مورینگا', 'پودر مورینگا', 'moringa-powder-vs-dried-leaves', 'moringa-powder-2'],
  'moringa-oil-storage-guide': ['روغن مورینگا چیست و چگونه نگهداری می‌شود؟', 'روغن مورینگا', 'moringa-oil-storage-guide', 'moringa-oil'],
  'moringa-sleep': ['چای مورینگا و خواب', 'moringa-sleep'],
  'moringa-for-weight-loss': ['فواید مورینگا برای چاقی', 'moringa-for-weight-loss'],
  'moringa-complications': ['عوارض گیاه مورینگا', 'moringa-complications'],
  'moringa-growing': ['کاشت درخت مورینگا', 'moringa-growing'],
  'moringa-skin-hair': ['گیاه مورینگا برای پوست و مو', 'moringa-skin-hair'],
  'moringa-for-diabetes': ['مورینگا و دیابت: چگونه درخت معجزه به کنترل قند خون شما کمک می‌کند؟', 'مورینگا و دیابت', 'moringa-for-diabetes'],
  'moringa-cancer': ['مورینگا در پیشگیری از سرطان', 'مورینگا سرطان را درمان می کند؟', 'مورینگا و پیشگیری از سرطان', 'moringa-cancer', 'does-moringa-treat-cancer'],
  'does-moringa-treat-cancer': ['مورینگا سرطان را درمان می کند؟', 'مورینگا در پیشگیری از سرطان', 'مورینگا و پیشگیری از سرطان', 'does-moringa-treat-cancer', 'moringa-cancer'],
  'moringa-amino-acids': ['نقش آمینو اسیدهای مورینگا در سلامت بدن و ساخت عضله – ایران مورینگا', 'نقش آمینو اسیدهای مورینگا', 'moringa-amino-acids'],
  'what-is-moringa': ['مورینگا چیست؟ آشنایی ساده با این گیاه', 'مورینگا چیست؟', 'what-is-moringa', 'what-is-moringa-1'],
  'moringa-tradtional-medicine': ['مورینگا در طب سنتی', 'moringa-tradtional-medicine'],
  'moringa-anti-oxidant': ['خواص آنتی‌اکسیدانی مورینگا – مکمل طبیعی ضد التهاب و ضد پیری', 'خواص آنتی‌اکسیدانی مورینگا', 'moringa-anti-oxidant'],
};

// GET: Fetch approved comments for an article or product
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('type') || ''; // 'article', 'product', 'page'
    const targetIdParam = searchParams.get('target_id') || '';
    const slug = (searchParams.get('slug') || '').trim();
    const title = (searchParams.get('title') || '').trim();

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
      // Build alias search list
      const aliases = SLUG_ALIASES[slug] || [];
      const slugConditions = [`c.target_title ILIKE $${pIdx}`];
      params.push(`%${title || slug}%`);
      pIdx++;

      // Also search target_id by matching against products/articles tables
      slugConditions.push(`c.target_id IN (
        SELECT id FROM articles WHERE slug = $${pIdx} OR title_fa ILIKE $${pIdx + 1}
        UNION
        SELECT id FROM products WHERE slug = $${pIdx} OR title_fa ILIKE $${pIdx + 1}
      )`);
      params.push(slug, `%${title || slug}%`);
      pIdx += 2;

      // Add alias matches if any
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

    // Build comment tree (parents and children)
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

    // Calculate rating stats if product
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
  } catch (error: any) {
    console.error('Error fetching public comments:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دیدگاه‌ها', detail: error?.message },
      { status: 500 }
    );
  }
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

    // Validate UUIDs
    let validTargetId: string | null = target_id && UUID_REGEX.test(target_id) ? target_id : null;
    const validParentId: string | null = parent_id && UUID_REGEX.test(parent_id) ? parent_id : null;

    // If target_id is not a valid UUID, look up matching product or article in DB
    if (!validTargetId && target_title) {
      const matchRes = await dbPool.query(
        `SELECT id FROM products WHERE title_fa ILIKE $1 LIMIT 1;`,
        [`%${target_title.trim()}%`]
      );
      if (matchRes.rows.length > 0) {
        validTargetId = matchRes.rows[0].id;
      } else {
        const artRes = await dbPool.query(
          `SELECT id FROM articles WHERE title_fa ILIKE $1 LIMIT 1;`,
          [`%${target_title.trim()}%`]
        );
        if (artRes.rows.length > 0) {
          validTargetId = artRes.rows[0].id;
        }
      }
    }

    const insertSql = `
      INSERT INTO comments (
        target_type, target_id, target_title, parent_id,
        author_name, author_email, author_phone, rating,
        content, status, is_buyer_verified, is_admin_reply, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', false, false, NOW())
      RETURNING id, created_at;
    `;

    const res = await dbPool.query(insertSql, [
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

    return NextResponse.json({
      success: true,
      message: 'دیدگاه شما با موفقیت ثبت و منتشر گردید.',
      comment: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating public comment:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت نظر', detail: error?.message },
      { status: 500 }
    );
  }
}
