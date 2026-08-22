import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const res = await dbPool.query(
      `SELECT id, order_id, old_status, new_status, actor_type, note, tracking_code, created_at
       FROM order_status_history
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return NextResponse.json({
      events: res.rows,
    });
  } catch (error: any) {
    console.error('Error fetching order timeline:', error);
    return NextResponse.json({ error: 'خطا در دریافت تاریخچه سفارش', detail: error?.message }, { status: 500 });
  }
}
