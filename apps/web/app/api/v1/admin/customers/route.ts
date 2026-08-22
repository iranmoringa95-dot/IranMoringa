import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

function normalizeIranianPhone(raw: string): string | null {
  if (!raw) return null;
  const persianToEng: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  let cleaned = raw.replace(/[۰-۹٠-٩]/g, (w) => persianToEng[w] || w);
  cleaned = cleaned.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '0' + cleaned;
  }

  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return '+98' + cleaned.slice(1);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'all';
    const orderFilter = searchParams.get('order_filter') || 'all';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = (searchParams.get('sort_order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(`(
        u.phone ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        COALESCE(cp.national_id, '') ILIKE $${paramIndex} OR
        COALESCE(a.city, '') ILIKE $${paramIndex} OR
        COALESCE(a.province, '') ILIKE $${paramIndex} OR
        COALESCE(a.postal_address, '') ILIKE $${paramIndex}
      )`);
      params.push(searchTerm);
      paramIndex++;
    }

    if (status === 'active') {
      conditions.push('u.is_active = true');
    } else if (status === 'inactive') {
      conditions.push('u.is_active = false');
    }

    const roleFilter = searchParams.get('role_filter') || 'all';
    if (roleFilter === 'admin') {
      conditions.push('ar.id IS NOT NULL');
    } else if (roleFilter === 'customer') {
      conditions.push('ar.id IS NULL');
    }

    if (orderFilter === 'with_orders') {
      conditions.push('COALESCE(ord.total_orders, 0) > 0');
    } else if (orderFilter === 'no_orders') {
      conditions.push('COALESCE(ord.total_orders, 0) = 0');
    }

    let orderClause = 'u.created_at DESC';
    if (sortBy === 'total_orders') {
      orderClause = `COALESCE(ord.total_orders, 0) ${sortOrder}, u.created_at DESC`;
    } else if (sortBy === 'total_spent') {
      orderClause = `COALESCE(ord.total_spent_irr, 0) ${sortOrder}, u.created_at DESC`;
    } else if (sortBy === 'name') {
      orderClause = `COALESCE(u.last_name, '') ${sortOrder}, COALESCE(u.first_name, '') ${sortOrder}`;
    } else {
      orderClause = `u.created_at ${sortOrder}`;
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        u.id,
        u.phone,
        u.email,
        COALESCE(u.first_name, '') as first_name,
        COALESCE(u.last_name, '') as last_name,
        u.is_active,
        u.created_at,
        u.updated_at,
        cp.id as profile_id,
        COALESCE(cp.national_id, '') as national_id,
        cp.birth_date::text as birth_date,
        COALESCE(a.id::text, '') as address_id,
        COALESCE(a.title, 'آدرس اصلی') as address_title,
        COALESCE(a.recipient_name, '') as recipient_name,
        COALESCE(a.recipient_phone, '') as recipient_phone,
        COALESCE(a.city, 'نامشخص') as city,
        COALESCE(a.province, 'نامشخص') as province,
        COALESCE(a.postal_address, '') as postal_address,
        COALESCE(a.postal_code, '') as postal_code,
        COALESCE(ord.total_orders, 0)::int as total_orders,
        COALESCE(ord.total_spent_irr, 0)::bigint as total_spent_irr,
        ord.last_order_date,
        ar.id as admin_role_id,
        ar.role as admin_role,
        ar.is_super_admin,
        ar.custom_title as admin_custom_title,
        ar.allowed_sections as admin_allowed_sections,
        CASE WHEN ar.id IS NOT NULL THEN true ELSE false END as is_admin,
        COUNT(*) OVER() as full_count
      FROM users u
      LEFT JOIN customer_profiles cp ON cp.user_id = u.id
      LEFT JOIN admin_roles ar ON ar.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT id, title, recipient_name, recipient_phone, city, province, postal_address, postal_code
        FROM addresses
        WHERE customer_id = cp.id
        ORDER BY is_default DESC, created_at DESC
        LIMIT 1
      ) a ON true
      LEFT JOIN (
        SELECT 
          customer_id,
          COUNT(id) as total_orders,
          SUM(total_irr) as total_spent_irr,
          MAX(created_at) as last_order_date
        FROM orders
        GROUP BY customer_id
      ) ord ON ord.customer_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await dbPool.query(sql, params);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].full_count, 10) : 0;
    const totalPages = Math.ceil(totalCount / limit);

    const statsRes = await dbPool.query(`
      SELECT 
        COUNT(u.id) as total_users,
        COUNT(u.id) FILTER (WHERE u.is_active = true) as active_users,
        COUNT(DISTINCT o.customer_id) as users_with_orders,
        COALESCE(SUM(o.total_irr), 0) as total_revenue_irr,
        COUNT(o.id) as total_orders_count
      FROM users u
      LEFT JOIN orders o ON o.customer_id = u.id;
    `);

    const stats = statsRes.rows[0] || {};
    const totalRevenueIrr = parseInt(stats.total_revenue_irr || '0', 10);

    const customers = result.rows.map((r) => {
      const totalSpentIrr = parseInt(r.total_spent_irr || '0', 10);
      const totalSpentToman = Math.floor(totalSpentIrr / 10);
      const totalOrders = r.total_orders || 0;

      let tier: 'gold' | 'silver' | 'bronze' = 'bronze';
      if (totalSpentToman >= 3000000 || totalOrders >= 5) {
        tier = 'gold';
      } else if (totalSpentToman >= 1000000 || totalOrders >= 2) {
        tier = 'silver';
      }

      const fullName = `${r.first_name} ${r.last_name}`.trim() || 'مشتری بدون نام';

      return {
        id: r.id,
        phone: r.phone,
        email: r.email || '',
        firstName: r.first_name,
        lastName: r.last_name,
        fullName,
        nationalId: r.national_id || '',
        birthDate: r.birth_date || '',
        isActive: r.is_active,
        status: r.is_active ? 'active' : 'inactive',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        addressId: r.address_id,
        addressTitle: r.address_title,
        recipientName: r.recipient_name,
        recipientPhone: r.recipient_phone,
        city: r.city,
        province: r.province,
        postalAddress: r.postal_address,
        postalCode: r.postal_code,
        totalOrders,
        totalSpentIrr,
        totalSpentToman,
        lastOrderDate: r.last_order_date || null,
        tier,
        isAdmin: Boolean(r.is_admin),
        adminRole: r.admin_role || null,
        isSuperAdmin: Boolean(r.is_super_admin),
        adminCustomTitle: r.admin_custom_title || null,
      };
    });

    return NextResponse.json({
      items: customers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
      stats: {
        totalCustomers: parseInt(stats.total_users || '0', 10),
        activeCustomers: parseInt(stats.active_users || '0', 10),
        customersWithOrders: parseInt(stats.users_with_orders || '0', 10),
        totalOrdersCount: parseInt(stats.total_orders_count || '0', 10),
        totalRevenueToman: Math.floor(totalRevenueIrr / 10),
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست مشتریان', detail: error?.message },
      { status: 500 }
    );
  }
}

// POST: Create a new Customer / User with complete profile and address
export async function POST(request: Request) {
  const client = await dbPool.connect();
  try {
    const body = await request.json();
    const {
      phone,
      firstName,
      lastName,
      email,
      nationalId,
      birthDate,
      isActive = true,
      addressTitle = 'آدرس اصلی',
      recipientName,
      recipientPhone,
      province,
      city,
      postalAddress,
      postalCode,
    } = body;

    const normalizedPhone = normalizeIranianPhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'شماره موبایل وارد شده معتبر نیست. لطفاً یک شماره ۱۱ رقمی معتبر (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existing = await client.query('SELECT id FROM users WHERE phone = $1 LIMIT 1', [normalizedPhone]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'کاربری با این شماره موبایل از قبل در سامانه وجود دارد.' },
        { status: 409 }
      );
    }

    await client.query('BEGIN');

    // 1. Insert into users
    const userRes = await client.query(
      `
      INSERT INTO users (phone, email, first_name, last_name, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id;
    `,
      [normalizedPhone, email?.trim() || null, firstName?.trim() || '', lastName?.trim() || '', isActive]
    );

    const userId = userRes.rows[0].id;

    // 2. Insert customer profile
    const cleanNationalId = nationalId ? nationalId.replace(/\D/g, '').slice(0, 10) : null;
    const cleanBirthDate = birthDate ? birthDate : null;

    const profRes = await client.query(
      `
      INSERT INTO customer_profiles (user_id, national_id, birth_date, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id;
    `,
      [userId, cleanNationalId, cleanBirthDate]
    );

    const profileId = profRes.rows[0].id;

    // 3. Insert address if address details provided
    if (postalAddress && postalAddress.trim()) {
      const finalRecipName = (recipientName || `${firstName || ''} ${lastName || ''}`).trim() || 'مشتری';
      const finalRecipPhone = normalizeIranianPhone(recipientPhone) || normalizedPhone;
      const cleanPostCode = postalCode ? postalCode.replace(/\D/g, '').slice(0, 10) : '0000000000';

      await client.query(
        `
        INSERT INTO addresses (
          customer_id, title, recipient_name, recipient_phone,
          province, city, postal_address, postal_code, is_default, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW());
      `,
        [
          profileId,
          addressTitle.trim() || 'آدرس اصلی',
          finalRecipName,
          finalRecipPhone,
          province?.trim() || 'نامشخص',
          city?.trim() || 'نامشخص',
          postalAddress.trim(),
          cleanPostCode,
        ]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'کاربر جدید با تمامی مشخصات و آدرس با موفقیت ثبت شد',
      id: userId,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت مشتری جدید', detail: error?.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PATCH / PUT: Update ALL Customer details (User, Profile, Address, Status)
export async function PATCH(request: Request) {
  const client = await dbPool.connect();
  try {
    const body = await request.json();
    const {
      id,
      phone,
      firstName,
      lastName,
      email,
      nationalId,
      birthDate,
      isActive,
      addressId,
      addressTitle,
      recipientName,
      recipientPhone,
      province,
      city,
      postalAddress,
      postalCode,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Update Users Table
    const userUpdates: string[] = ['updated_at = NOW()'];
    const userParams: any[] = [id];
    let pIdx = 2;

    if (typeof isActive === 'boolean') {
      userUpdates.push(`is_active = $${pIdx}`);
      userParams.push(isActive);
      pIdx++;
    }

    if (typeof firstName === 'string') {
      userUpdates.push(`first_name = $${pIdx}`);
      userParams.push(firstName.trim());
      pIdx++;
    }

    if (typeof lastName === 'string') {
      userUpdates.push(`last_name = $${pIdx}`);
      userParams.push(lastName.trim());
      pIdx++;
    }

    if (typeof email === 'string') {
      userUpdates.push(`email = $${pIdx}`);
      userParams.push(email.trim() || null);
      pIdx++;
    }

    if (phone) {
      const normalized = normalizeIranianPhone(phone);
      if (normalized) {
        userUpdates.push(`phone = $${pIdx}`);
        userParams.push(normalized);
        pIdx++;
      }
    }

    await client.query(
      `
      UPDATE users 
      SET ${userUpdates.join(', ')}
      WHERE id = $1;
    `,
      userParams
    );

    // 2. Ensure or Update Customer Profile
    const profRes = await client.query(
      `
      INSERT INTO customer_profiles (user_id, national_id, birth_date)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE 
      SET national_id = COALESCE($2, customer_profiles.national_id),
          birth_date = COALESCE($3, customer_profiles.birth_date)
      RETURNING id;
    `,
      [
        id,
        nationalId ? nationalId.replace(/\D/g, '').slice(0, 10) : null,
        birthDate ? birthDate : null,
      ]
    );

    const profileId = profRes.rows[0].id;

    // 3. Update or Insert Address
    if (postalAddress && postalAddress.trim()) {
      const cleanPostCode = postalCode ? postalCode.replace(/\D/g, '').slice(0, 10) : '0000000000';
      const finalRecipName = (recipientName || `${firstName || ''} ${lastName || ''}`).trim() || 'مشتری';
      const finalRecipPhone = normalizeIranianPhone(recipientPhone) || normalizeIranianPhone(phone) || '09000000000';

      if (addressId) {
        await client.query(
          `
          UPDATE addresses
          SET title = $1,
              recipient_name = $2,
              recipient_phone = $3,
              province = $4,
              city = $5,
              postal_address = $6,
              postal_code = $7
          WHERE id = $8 AND customer_id = $9;
        `,
          [
            addressTitle || 'آدرس اصلی',
            finalRecipName,
            finalRecipPhone,
            province || 'نامشخص',
            city || 'نامشخص',
            postalAddress.trim(),
            cleanPostCode,
            addressId,
            profileId,
          ]
        );
      } else {
        await client.query(
          `
          INSERT INTO addresses (
            customer_id, title, recipient_name, recipient_phone,
            province, city, postal_address, postal_code, is_default
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true);
        `,
          [
            profileId,
            addressTitle || 'آدرس اصلی',
            finalRecipName,
            finalRecipPhone,
            province || 'نامشخص',
            city || 'نامشخص',
            postalAddress.trim(),
            cleanPostCode,
          ]
        );
      }
    }

    // 4. Update Admin Roles if specified in body
    const { isAdmin, adminRole, adminAllowedSections, adminCustomTitle } = body;
    if (typeof isAdmin === 'boolean') {
      if (isAdmin) {
        const isSuper = adminRole === 'super_admin';
        const finalSections = isSuper
          ? [
              'products',
              'inventory',
              'orders',
              'postchi',
              'promotions',
              'reviews',
              'notifications',
              'audit-logs',
              'articles',
              'seo',
              'support',
              'chatbot',
              'reports',
              'access',
            ]
          : adminAllowedSections || ['products', 'orders', 'inventory', 'postchi'];

        const finalTitle =
          adminCustomTitle || `${firstName || ''} ${lastName || ''}`.trim() || 'مدیر سیستم';

        await client.query(
          `
          INSERT INTO admin_roles (user_id, role, is_super_admin, allowed_sections, custom_title, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (user_id) DO UPDATE
          SET role = $2,
              is_super_admin = $3,
              allowed_sections = $4,
              custom_title = $5,
              updated_at = NOW();
        `,
          [id, adminRole || 'shop_manager', isSuper, finalSections, finalTitle]
        );
      } else {
        // Protect primary super admin
        const check = await client.query('SELECT phone, email FROM users WHERE id = $1', [id]);
        if (check.rows.length > 0) {
          const u = check.rows[0];
          if (
            u.phone !== '+989132391843' &&
            u.phone !== '09132391843' &&
            u.email !== 'pqehsan@gmail.com'
          ) {
            await client.query('DELETE FROM admin_roles WHERE user_id = $1', [id]);
          }
        }
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'کلیه مشخصات، اطلاعات هویتی، آدرس و سطوح دسترسی کاربر با موفقیت به‌روزرسانی شد.',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش اطلاعات کاربر', detail: error?.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
