import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // 1. Get user details
    const userRes = await dbPool.query(
      `
      SELECT 
        u.id, u.phone, u.email, u.first_name, u.last_name,
        u.is_active, u.created_at, u.updated_at,
        cp.id as profile_id, cp.national_id, cp.birth_date
      FROM users u
      LEFT JOIN customer_profiles cp ON cp.user_id = u.id
      WHERE u.id = $1;
    `,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // 2. Get all addresses
    const addrRes = await dbPool.query(
      `
      SELECT 
        id, title, recipient_name, recipient_phone,
        province, city, postal_address, postal_code, is_default, created_at
      FROM addresses
      WHERE customer_id = $1
      ORDER BY is_default DESC, created_at DESC;
    `,
      [user.profile_id]
    );

    // 3. Get all orders with items
    const ordersRes = await dbPool.query(
      `
      SELECT 
        o.id, o.order_number, o.status,
        o.subtotal_irr, o.discount_irr, o.shipping_fee_irr, o.total_irr,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_title', oi.product_title,
              'variant_title', oi.variant_title,
              'sku', oi.sku,
              'unit_price_irr', oi.unit_price_irr,
              'quantity', oi.quantity,
              'subtotal_irr', oi.subtotal_irr
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC;
    `,
      [userId]
    );

    let totalSpentIrr = 0;
    const orders = ordersRes.rows.map((ord) => {
      const orderTotalIrr = parseInt(ord.total_irr || '0', 10);
      totalSpentIrr += orderTotalIrr;
      return {
        id: ord.id,
        orderNumber: ord.order_number,
        status: ord.status,
        subtotalIrr: parseInt(ord.subtotal_irr || '0', 10),
        discountIrr: parseInt(ord.discount_irr || '0', 10),
        shippingFeeIrr: parseInt(ord.shipping_fee_irr || '0', 10),
        totalIrr: orderTotalIrr,
        totalToman: Math.floor(orderTotalIrr / 10),
        createdAt: ord.created_at,
        items: ord.items,
      };
    });

    const totalOrders = orders.length;
    const totalSpentToman = Math.floor(totalSpentIrr / 10);

    let tier: 'gold' | 'silver' | 'bronze' = 'bronze';
    if (totalSpentToman >= 3000000 || totalOrders >= 5) {
      tier = 'gold';
    } else if (totalSpentToman >= 1000000 || totalOrders >= 2) {
      tier = 'silver';
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'مشتری بدون نام';

    return NextResponse.json({
      customer: {
        id: user.id,
        phone: user.phone,
        email: user.email || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        fullName,
        nationalId: user.national_id || '',
        isActive: user.is_active,
        status: user.is_active ? 'active' : 'inactive',
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        tier,
        totalOrders,
        totalSpentIrr,
        totalSpentToman,
        addresses: addrRes.rows.map((a) => ({
          id: a.id,
          title: a.title,
          recipientName: a.recipient_name,
          recipientPhone: a.recipient_phone,
          province: a.province,
          city: a.city,
          postalAddress: a.postal_address,
          postalCode: a.postal_code,
          isDefault: a.is_default,
          createdAt: a.created_at,
        })),
        orders,
      },
    });
  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پرونده مشتری', detail: error?.message },
      { status: 500 }
    );
  }
}
