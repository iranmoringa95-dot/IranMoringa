import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const gateway = searchParams.get('gateway') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(`(
        recipient ILIKE $${paramIndex} OR
        message ILIKE $${paramIndex} OR
        COALESCE(order_number, '') ILIKE $${paramIndex} OR
        COALESCE(sender_number, '') ILIKE $${paramIndex}
      )`);
      params.push(searchTerm);
      paramIndex++;
    }

    if (gateway !== 'all') {
      conditions.push(`gateway = $${paramIndex}`);
      params.push(gateway);
      paramIndex++;
    }

    if (status !== 'all') {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        id,
        order_id,
        order_number,
        recipient,
        sender_number,
        message,
        gateway,
        status,
        gateway_response,
        message_id,
        created_at,
        COUNT(*) OVER() as full_count
      FROM sms_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await dbPool.query(sql, params);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].full_count, 10) : 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Summary stats
    const statsRes = await dbPool.query(`
      SELECT 
        COUNT(*) as total_sms,
        COUNT(*) FILTER (WHERE status = 'success') as success_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(DISTINCT recipient) as unique_recipients,
        COUNT(order_number) as order_linked_count
      FROM sms_logs;
    `);

    const stats = statsRes.rows[0] || {};

    const items = result.rows.map((r, index) => {
      let displayPhone = r.recipient || '';
      if (displayPhone.startsWith('+98')) {
        displayPhone = '0' + displayPhone.slice(3);
      } else if (displayPhone.startsWith('98') && displayPhone.length === 12) {
        displayPhone = '0' + displayPhone.slice(2);
      }

      return {
        id: r.id,
        rowNumber: offset + index + 1,
        orderId: r.order_number || (r.order_id ? String(r.order_id) : '—'),
        recipient: displayPhone,
        rawPhone: r.recipient,
        sender: r.sender_number || '—',
        message: r.message,
        gateway: r.gateway,
        status: r.status,
        gatewayResponse: r.gateway_response || '',
        messageId: r.message_id || '',
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({
      items,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
      stats: {
        totalSms: parseInt(stats.total_sms || '0', 10),
        successCount: parseInt(stats.success_count || '0', 10),
        failedCount: parseInt(stats.failed_count || '0', 10),
        uniqueRecipients: parseInt(stats.unique_recipients || '0', 10),
        orderLinkedCount: parseInt(stats.order_linked_count || '0', 10),
      },
    });
  } catch (error: any) {
    console.error('Error fetching SMS logs:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آرشیو پیامک‌ها', detail: error?.message },
      { status: 500 }
    );
  }
}
