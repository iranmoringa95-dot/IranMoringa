import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Paginated list of comments with search & filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const targetType = searchParams.get('type') || 'all'; // 'all', 'product', 'article', 'page'
    const status = searchParams.get('status') || 'all'; // 'all', 'approved', 'pending', 'rejected', 'spam'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let pIdx = 1;

    if (q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(`(
        c.author_name ILIKE $${pIdx} OR
        c.author_email ILIKE $${pIdx} OR
        c.content ILIKE $${pIdx} OR
        c.target_title ILIKE $${pIdx}
      )`);
      params.push(searchTerm);
      pIdx++;
    }

    if (targetType !== 'all') {
      conditions.push(`c.target_type = $${pIdx}`);
      params.push(targetType);
      pIdx++;
    }

    if (status !== 'all') {
      conditions.push(`c.status = $${pIdx}`);
      params.push(status);
      pIdx++;
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
        c.author_email,
        c.author_phone,
        c.rating,
        c.content,
        c.status,
        c.is_buyer_verified,
        c.is_admin_reply,
        c.like_count,
        c.ip_address,
        c.created_at,
        p.author_name as parent_author_name,
        p.content as parent_content,
        COUNT(*) OVER() as full_count
      FROM comments c
      LEFT JOIN comments p ON p.id = c.parent_id
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    params.push(limit, offset);

    const result = await dbPool.query(sql, params);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].full_count, 10) : 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Summary stats
    const statsRes = await dbPool.query(`
      SELECT 
        COUNT(*) as total_comments,
        COUNT(*) FILTER (WHERE target_type = 'product') as product_reviews,
        COUNT(*) FILTER (WHERE target_type IN ('article', 'page')) as article_comments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
      FROM comments;
    `);

    const stats = statsRes.rows[0] || {};

    const items = result.rows.map((r, idx) => ({
      id: r.id,
      rowNumber: offset + idx + 1,
      targetType: r.target_type,
      targetId: r.target_id,
      targetTitle: r.target_title,
      parentId: r.parent_id,
      parentAuthor: r.parent_author_name,
      parentContent: r.parent_content,
      authorName: r.author_name,
      authorEmail: r.author_email || '',
      authorPhone: r.author_phone || '',
      rating: r.rating,
      content: r.content,
      status: r.status,
      isBuyerVerified: r.is_buyer_verified,
      isAdminReply: r.is_admin_reply,
      likeCount: r.like_count,
      ipAddress: r.ip_address,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      items,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
      stats: {
        totalComments: parseInt(stats.total_comments || '0', 10),
        productReviews: parseInt(stats.product_reviews || '0', 10),
        articleComments: parseInt(stats.article_comments || '0', 10),
        pendingCount: parseInt(stats.pending_count || '0', 10),
        approvedCount: parseInt(stats.approved_count || '0', 10),
        rejectedCount: parseInt(stats.rejected_count || '0', 10),
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست دیدگاه‌ها', detail: error?.message },
      { status: 500 }
    );
  }
}

// PATCH: Update comment status (approve, reject, spam) or content
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, content, rating } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه دیدگاه الزامی است' }, { status: 400 });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [id];
    let pIdx = 2;

    if (status) {
      updates.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (typeof content === 'string') {
      updates.push(`content = $${pIdx}`);
      params.push(content.trim());
      pIdx++;
    }

    if (typeof rating === 'number') {
      updates.push(`rating = $${pIdx}`);
      params.push(rating);
      pIdx++;
    }

    await dbPool.query(
      `UPDATE comments SET ${updates.join(', ')} WHERE id = $1;`,
      params
    );

    return NextResponse.json({
      success: true,
      message: 'وضعیت دیدگاه با موفقیت به‌روزرسانی شد.',
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر وضعیت دیدگاه', detail: error?.message },
      { status: 500 }
    );
  }
}

// POST: Admin reply to a comment or review
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      parent_id,
      target_type = 'article',
      target_id = null,
      target_title = '',
      admin_name = 'پشتیبانی ایران مورینگا',
      reply_content,
    } = body;

    if (!parent_id) {
      return NextResponse.json({ error: 'شناسه دیدگاه والد الزامی است' }, { status: 400 });
    }

    if (!reply_content || !reply_content.trim()) {
      return NextResponse.json({ error: 'متن پاسخ نمی‌تواند خالی باشد' }, { status: 400 });
    }

    const insertSql = `
      INSERT INTO comments (
        target_type, target_id, target_title, parent_id,
        author_name, content, status, is_buyer_verified, is_admin_reply, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'approved', false, true, NOW())
      RETURNING id;
    `;

    const res = await dbPool.query(insertSql, [
      target_type,
      target_id,
      target_title,
      parent_id,
      admin_name.trim(),
      reply_content.trim(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'پاسخ شما با موفقیت ثبت و منتشر گردید.',
      id: res.rows[0].id,
    });
  } catch (error: any) {
    console.error('Error replying to comment:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت پاسخ دیدگاه', detail: error?.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه دیدگاه الزامی است' }, { status: 400 });
    }

    await dbPool.query('DELETE FROM comments WHERE id = $1;', [id]);

    return NextResponse.json({
      success: true,
      message: 'دیدگاه مورد نظر با موفقیت حذف گردید.',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'خطا در حذف دیدگاه', detail: error?.message },
      { status: 500 }
    );
  }
}
