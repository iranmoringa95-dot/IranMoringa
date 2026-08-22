import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function normalizePhone(raw?: string): string {
  if (!raw) return '';
  const persianToEng: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  let cleaned = raw.replace(/[۰-۹٠-٩]/g, (w) => persianToEng[w] || w).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+98')) cleaned = '0' + cleaned.slice(3);
  else if (cleaned.startsWith('0098')) cleaned = '0' + cleaned.slice(4);
  else if (cleaned.startsWith('98') && cleaned.length === 12) cleaned = '0' + cleaned.slice(2);
  else if (cleaned.length === 10 && cleaned.startsWith('9')) cleaned = '0' + cleaned;

  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return '+98' + cleaned.slice(1);
  }
  return raw.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const q = searchParams.get('q');
    const datePreset = searchParams.get('date_preset'); // today, yesterday, last_7_days, last_30_days, last_90_days, this_year
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sortBy = searchParams.get('sort_by') || 'created_at_desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || searchParams.get('page_size') || '20', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIdx = 1;

    // Filter Status
    if (status && status !== 'all') {
      conditions.push(`o.status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }

    // Filter Search Query
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(`(
        o.order_number ILIKE $${paramIdx} OR
        COALESCE(u.phone, o.guest_phone, '') ILIKE $${paramIdx} OR
        COALESCE(u.first_name, '') ILIKE $${paramIdx} OR
        COALESCE(u.last_name, '') ILIKE $${paramIdx} OR
        COALESCE(a.recipient_name, '') ILIKE $${paramIdx} OR
        COALESCE(a.city, '') ILIKE $${paramIdx} OR
        COALESCE(a.province, '') ILIKE $${paramIdx} OR
        COALESCE(o.tracking_code, '') ILIKE $${paramIdx}
      )`);
      params.push(searchTerm);
      paramIdx++;
    }

    // Filter Date Range Preset
    const now = new Date();
    if (datePreset === 'today') {
      conditions.push(`o.created_at >= CURRENT_DATE`);
    } else if (datePreset === 'yesterday') {
      conditions.push(`o.created_at >= CURRENT_DATE - INTERVAL '1 day' AND o.created_at < CURRENT_DATE`);
    } else if (datePreset === 'last_7_days') {
      conditions.push(`o.created_at >= NOW() - INTERVAL '7 days'`);
    } else if (datePreset === 'last_30_days') {
      conditions.push(`o.created_at >= NOW() - INTERVAL '30 days'`);
    } else if (datePreset === 'last_90_days') {
      conditions.push(`o.created_at >= NOW() - INTERVAL '90 days'`);
    } else if (datePreset === 'this_year') {
      conditions.push(`o.created_at >= date_trunc('year', NOW())`);
    } else if (dateFrom || dateTo) {
      if (dateFrom) {
        conditions.push(`o.created_at >= $${paramIdx}`);
        params.push(new Date(dateFrom).toISOString());
        paramIdx++;
      }
      if (dateTo) {
        conditions.push(`o.created_at <= $${paramIdx}`);
        params.push(new Date(dateTo).toISOString());
        paramIdx++;
      }
    }

    // Order By
    let orderByClause = 'o.created_at DESC';
    if (sortBy === 'created_at_asc') orderByClause = 'o.created_at ASC';
    else if (sortBy === 'total_desc') orderByClause = 'o.total_irr DESC';
    else if (sortBy === 'total_asc') orderByClause = 'o.total_irr ASC';

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.subtotal_irr,
        o.discount_irr,
        o.shipping_fee_irr,
        o.total_irr,
        o.created_at,
        o.tracking_code,
        o.admin_notes,
        o.customer_notes,
        o.shipping_method,
        o.payment_method,
        o.payment_status,
        u.id as customer_user_id,
        COALESCE(u.phone, o.guest_phone, '') as recipient_phone,
        COALESCE(u.first_name, '') as customer_first_name,
        COALESCE(u.last_name, '') as customer_last_name,
        COALESCE(u.email, '') as customer_email,
        COALESCE(a.recipient_name, CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')), 'مشتری گرامی') as recipient_name,
        COALESCE(a.province, 'نامشخص') as province,
        COALESCE(a.city, 'نامشخص') as city,
        COALESCE(a.postal_address, '') as postal_address,
        COALESCE(a.postal_code, '') as postal_code,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'variant_id', oi.variant_id,
              'product_title', oi.product_title,
              'variant_title', oi.variant_title,
              'sku', oi.sku,
              'unit_price_irr', oi.unit_price_irr,
              'quantity', oi.quantity,
              'subtotal_irr', oi.subtotal_irr
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items,
        COUNT(*) OVER() as full_count
      FROM orders o
      LEFT JOIN users u ON u.id = o.customer_id
      LEFT JOIN customer_profiles cp ON cp.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT recipient_name, province, city, postal_address, postal_code
        FROM addresses
        WHERE customer_id = cp.id
        ORDER BY is_default DESC, created_at DESC
        LIMIT 1
      ) a ON true
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE ${whereClause}
      GROUP BY o.id, u.id, a.recipient_name, a.province, a.city, a.postal_address, a.postal_code
      ORDER BY ${orderByClause}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
    `;

    params.push(limit, offset);

    const res = await dbPool.query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;

    const orders = res.rows.map((row) => {
      const recipientName = (row.recipient_name || `${row.customer_first_name} ${row.customer_last_name}`).trim() || 'مشتری گرامی';
      return {
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        subtotal_irr: parseInt(row.subtotal_irr || '0', 10),
        discount_irr: parseInt(row.discount_irr || '0', 10),
        shipping_fee_irr: parseInt(row.shipping_fee_irr || '0', 10),
        total_irr: parseInt(row.total_irr || '0', 10),
        total_toman: Math.floor(parseInt(row.total_irr || '0', 10) / 10),
        created_at: row.created_at,
        tracking_code: row.tracking_code || '',
        admin_notes: row.admin_notes || '',
        customer_notes: row.customer_notes || '',
        shipping_method: row.shipping_method || 'post_pishtaz',
        payment_method: row.payment_method || 'online_gateway',
        payment_status: row.payment_status || 'pending_payment',
        customer: {
          id: row.customer_user_id,
          first_name: row.customer_first_name,
          last_name: row.customer_last_name,
          phone: row.recipient_phone,
          email: row.customer_email,
        },
        address: {
          recipient_name: recipientName,
          recipient_phone: row.recipient_phone,
          province: row.province,
          city: row.city,
          postal_code: row.postal_code,
          postal_address: row.postal_address,
        },
        items: row.items || [],
      };
    });

    // Also get status count summary
    const statusSummaryRes = await dbPool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status;
    `);
    const statusCounts: Record<string, number> = {};
    statusSummaryRes.rows.forEach(r => {
      statusCounts[r.status] = parseInt(r.count, 10);
    });

    return NextResponse.json({
      items: orders,
      orders,
      total,
      total_count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      status_counts: statusCounts,
    });
  } catch (err: any) {
    console.error('Error fetching admin orders:', err);
    return NextResponse.json({ error: 'خطا در دریافت سفارش‌ها', detail: err?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await dbPool.connect();
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      province,
      city,
      postal_address,
      postal_code,
      items,
      shipping_method = 'post_pishtaz',
      shipping_fee_irr = 0,
      discount_irr = 0,
      payment_method = 'card_to_card',
      payment_status = 'paid',
      status = 'processing',
      admin_notes = '',
      customer_notes = '',
      tracking_code = '',
    } = body;

    if (!customer_phone || !customer_phone.trim()) {
      return NextResponse.json({ error: 'شماره تماس مشتری الزامی است.' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'حداقل یک محصول باید در سفارش انتخاب شود.' }, { status: 400 });
    }

    const normPhone = normalizePhone(customer_phone);
    const fullName = (customer_name || 'مشتری حضوری/تلفنی').trim();
    const parts = fullName.split(' ');
    const firstName = parts[0] || 'مشتری';
    const lastName = parts.slice(1).join(' ') || '';

    await client.query('BEGIN');

    // 1. Find or create user
    let userId: string;
    let profileId: string;

    const userRes = await client.query(`SELECT id FROM users WHERE phone = $1 LIMIT 1`, [normPhone]);
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      // update names if empty
      await client.query(
        `UPDATE users SET first_name = COALESCE(NULLIF(first_name, ''), $1), last_name = COALESCE(NULLIF(last_name, ''), $2), updated_at = NOW() WHERE id = $3`,
        [firstName, lastName, userId]
      );
      const profRes = await client.query(`SELECT id FROM customer_profiles WHERE user_id = $1 LIMIT 1`, [userId]);
      if (profRes.rows.length > 0) {
        profileId = profRes.rows[0].id;
      } else {
        const newProf = await client.query(`INSERT INTO customer_profiles (user_id) VALUES ($1) RETURNING id`, [userId]);
        profileId = newProf.rows[0].id;
      }
    } else {
      const newUser = await client.query(
        `INSERT INTO users (phone, first_name, last_name, email, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [normPhone, firstName, lastName, customer_email || null]
      );
      userId = newUser.rows[0].id;
      const newProf = await client.query(`INSERT INTO customer_profiles (user_id) VALUES ($1) RETURNING id`, [userId]);
      profileId = newProf.rows[0].id;
    }

    // 2. Save Address
    if (postal_address || city || province) {
      await client.query(
        `INSERT INTO addresses (customer_id, title, recipient_name, recipient_phone, province, city, postal_address, postal_code, is_default)
         VALUES ($1, 'آدرس ثبت سفارش', $2, $3, $4, $5, $6, $7, true)`,
        [
          profileId,
          fullName,
          normPhone,
          province || 'نامشخص',
          city || 'نامشخص',
          postal_address || '',
          (postal_code || '').replace(/\D/g, '').slice(0, 10) || '0000000000',
        ]
      );
    }

    // 3. Calculate Totals
    let subtotalIrr = 0;
    const sanitizedItems = items.map((it: any) => {
      const qty = Math.max(1, parseInt(it.quantity || '1', 10));
      const unitPriceIrr = Math.max(0, parseInt(it.unit_price_irr || '0', 10));
      const lineSubtotal = unitPriceIrr * qty;
      subtotalIrr += lineSubtotal;

      return {
        product_id: it.product_id || null,
        variant_id: it.variant_id || null,
        product_title: (it.product_title || 'محصول مورینگا').slice(0, 250),
        variant_title: (it.variant_title || '').slice(0, 200),
        sku: (it.sku || `SKU-${Date.now()}`).slice(0, 100),
        unit_price_irr: unitPriceIrr,
        quantity: qty,
        subtotal_irr: lineSubtotal,
      };
    });

    const parsedShippingFee = Math.max(0, parseInt(shipping_fee_irr || '0', 10));
    const parsedDiscount = Math.max(0, parseInt(discount_irr || '0', 10));
    const totalIrr = Math.max(0, subtotalIrr + parsedShippingFee - parsedDiscount);

    // 4. Generate Order Number
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `ORD-ADM-${randomSuffix}`;
    const idempotencyKey = `adm-${Date.now()}-${randomSuffix}`;

    // 5. Insert Order
    const orderRes = await client.query(
      `INSERT INTO orders (
        order_number, customer_id, guest_phone, status, subtotal_irr,
        discount_irr, shipping_fee_irr, total_irr, idempotency_key,
        tracking_code, admin_notes, customer_notes, shipping_method,
        payment_method, payment_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *`,
      [
        orderNumber,
        userId,
        normPhone,
        status,
        subtotalIrr,
        parsedDiscount,
        parsedShippingFee,
        totalIrr,
        idempotencyKey,
        tracking_code || null,
        admin_notes || null,
        customer_notes || null,
        shipping_method,
        payment_method,
        payment_status,
      ]
    );
    const createdOrder = orderRes.rows[0];

    // 6. Insert Order Items
    for (const it of sanitizedItems) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, variant_id, product_title, variant_title,
          sku, unit_price_irr, quantity, subtotal_irr, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          createdOrder.id,
          it.product_id,
          it.variant_id,
          it.product_title,
          it.variant_title,
          it.sku,
          it.unit_price_irr,
          it.quantity,
          it.subtotal_irr,
        ]
      );
    }

    // 7. Insert Timeline History Event
    await client.query(
      `INSERT INTO order_status_history (
        order_id, old_status, new_status, actor_type, note, tracking_code, created_at
      ) VALUES ($1, NULL, $2, 'admin', 'ثبت سفارش دستی توسط مدیر سیستم', $3, NOW())`,
      [createdOrder.id, status, tracking_code || null]
    );

    // 8. Log in audit_logs
    await client.query(
      `INSERT INTO audit_logs (
        action, entity_type, entity_id, changes, reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        'CREATE_MANUAL_ORDER',
        'orders',
        createdOrder.id,
        JSON.stringify({ order_number: orderNumber, total_irr: totalIrr, items_count: items.length }),
        'ثبت سفارش دستی از پنل ادمین',
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت ثبت شد',
      order: createdOrder,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating manual order:', error);
    return NextResponse.json({ error: 'خطا در ثبت سفارش دستی', detail: error?.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      order_id,
      order_ids, // for bulk updates
      status,
      tracking_code,
      admin_notes,
      shipping_method,
      payment_status,
      note,
      address,
    } = body;

    // Bulk Status Update
    if (order_ids && Array.isArray(order_ids) && order_ids.length > 0 && status) {
      for (const oid of order_ids) {
        const prev = await dbPool.query(`SELECT status FROM orders WHERE id = $1`, [oid]);
        const oldStatus = prev.rows[0]?.status || null;
        await dbPool.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, oid]);
        await dbPool.query(
          `INSERT INTO order_status_history (order_id, old_status, new_status, actor_type, note, created_at)
           VALUES ($1, $2, $3, 'admin', 'تغییر وضعیت گروهی توسط مدیر', NOW())`,
          [oid, oldStatus, status]
        );
      }
      return NextResponse.json({ success: true, message: `${order_ids.length} سفارش با موفقیت به‌روزرسانی شدند` });
    }

    // Single Order Update
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const currentOrderRes = await dbPool.query(`SELECT * FROM orders WHERE id = $1`, [order_id]);
    if (currentOrderRes.rows.length === 0) {
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }
    const currentOrder = currentOrderRes.rows[0];

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status && status !== currentOrder.status) {
      updates.push(`status = $${idx}`);
      params.push(status);
      idx++;

      // Log status transition
      await dbPool.query(
        `INSERT INTO order_status_history (order_id, old_status, new_status, actor_type, note, tracking_code, created_at)
         VALUES ($1, $2, $3, 'admin', $4, $5, NOW())`,
        [order_id, currentOrder.status, status, note || admin_notes || 'تغییر وضعیت سفارش', tracking_code || currentOrder.tracking_code || null]
      );
    }

    if (tracking_code !== undefined) {
      updates.push(`tracking_code = $${idx}`);
      params.push(tracking_code.trim() || null);
      idx++;
    }

    if (admin_notes !== undefined || note !== undefined) {
      const finalNote = (admin_notes || note || '').trim();
      updates.push(`admin_notes = $${idx}`);
      params.push(finalNote || null);
      idx++;
    }

    if (shipping_method !== undefined) {
      updates.push(`shipping_method = $${idx}`);
      params.push(shipping_method);
      idx++;
    }

    if (payment_status !== undefined) {
      updates.push(`payment_status = $${idx}`);
      params.push(payment_status);
      idx++;
    }

    if (updates.length > 0) {
      params.push(order_id);
      await dbPool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${idx}`, params);
    }

    // Update address if provided
    if (address && currentOrder.customer_id) {
      const profRes = await dbPool.query(`SELECT id FROM customer_profiles WHERE user_id = $1 LIMIT 1`, [currentOrder.customer_id]);
      if (profRes.rows.length > 0) {
        const profId = profRes.rows[0].id;
        if (address.recipient_name || address.province || address.city || address.postal_address) {
          await dbPool.query(
            `INSERT INTO addresses (customer_id, title, recipient_name, recipient_phone, province, city, postal_address, postal_code, is_default)
             VALUES ($1, 'آدرس اصلاح‌شده', $2, $3, $4, $5, $6, $7, true)`,
            [
              profId,
              address.recipient_name || 'مشتری',
              address.recipient_phone || currentOrder.guest_phone || '',
              address.province || 'نامشخص',
              address.city || 'نامشخص',
              address.postal_address || '',
              address.postal_code || '0000000000',
            ]
          );
        }
      }
    }

    return NextResponse.json({ success: true, message: 'سفارش با موفقیت به‌روزرسانی شد' });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی سفارش', detail: error?.message }, { status: 500 });
  }
}
