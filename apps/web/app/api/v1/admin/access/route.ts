import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALL_SECTIONS = [
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
];

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

function formatPhoneDisplay(raw: string): string {
  if (!raw) return '';
  let p = raw.replace(/[^\d+]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  return p;
}

// GET: Fetch all admin users linked to users table and admin_roles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const params: any[] = [];
    let whereClause = '1=1';

    if (q.trim()) {
      whereClause = `(
        u.phone ILIKE $1 OR 
        u.email ILIKE $1 OR 
        u.first_name ILIKE $1 OR 
        u.last_name ILIKE $1 OR 
        ar.custom_title ILIKE $1 OR 
        ar.role ILIKE $1
      )`;
      params.push(`%${q.trim()}%`);
    }

    const sql = `
      SELECT 
        u.id as user_id,
        u.phone,
        u.email,
        COALESCE(u.first_name, '') as first_name,
        COALESCE(u.last_name, '') as last_name,
        u.is_active,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at,
        ar.id as role_id,
        ar.role,
        ar.is_super_admin,
        ar.allowed_sections,
        ar.custom_title,
        ar.must_change_password,
        ar.created_at as role_created_at,
        ar.updated_at as role_updated_at,
        CASE WHEN uc.password_hash IS NOT NULL AND uc.password_hash != '' THEN true ELSE false END as has_password
      FROM admin_roles ar
      JOIN users u ON u.id = ar.user_id
      LEFT JOIN user_credentials uc ON uc.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ar.is_super_admin DESC, ar.created_at ASC;
    `;

    const result = await dbPool.query(sql, params);

    const items = result.rows.map((r) => {
      const displayPhone = formatPhoneDisplay(r.phone);
      const computedName = `${r.first_name} ${r.last_name}`.trim() || r.custom_title || 'مدیر سیستم';
      const sections = Array.isArray(r.allowed_sections)
        ? r.allowed_sections
        : typeof r.allowed_sections === 'string'
        ? r.allowed_sections.replace(/[{}]/g, '').split(',')
        : [];

      return {
        id: r.user_id,
        userId: r.user_id,
        roleId: r.role_id,
        phone: displayPhone,
        rawPhone: r.phone,
        email: r.email || '',
        firstName: r.first_name,
        lastName: r.last_name,
        fullName: computedName,
        customTitle: r.custom_title || computedName,
        role: r.role || 'shop_manager',
        isSuperAdmin: Boolean(r.is_super_admin),
        allowedSections: r.is_super_admin ? ALL_SECTIONS : sections,
        mustChangePassword: Boolean(r.must_change_password),
        isActive: Boolean(r.is_active),
        hasPassword: Boolean(r.has_password),
        createdAt: new Intl.DateTimeFormat('fa-IR').format(new Date(r.role_created_at || r.user_created_at)),
        updatedAt: r.role_updated_at,
      };
    });

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error: any) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست مدیران', detail: error?.message },
      { status: 500 }
    );
  }
}

// POST: Add new admin (either promote existing user or create brand new user and assign admin role)
export async function POST(request: Request) {
  const client = await dbPool.connect();
  try {
    const body = await request.json();
    const {
      userId, // If promoting existing user
      phone,
      email,
      firstName = '',
      lastName = '',
      customTitle = '',
      role = 'shop_manager',
      allowedSections = ['products', 'orders', 'inventory', 'postchi'],
      password = '@KamalGeraei990',
      mustChangePassword = true,
      isActive = true,
    } = body;

    await client.query('BEGIN');

    let targetUserId = userId;

    if (targetUserId) {
      // Promoting an existing user
      const userRes = await client.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
      if (userRes.rows.length === 0) {
        throw new Error('کاربر مورد نظر یافت نشد.');
      }
      const existingUser = userRes.rows[0];

      // Update user name/email if provided
      await client.query(
        `
        UPDATE users 
        SET first_name = COALESCE(NULLIF($1, ''), first_name),
            last_name = COALESCE(NULLIF($2, ''), last_name),
            email = COALESCE(NULLIF($3, ''), email),
            is_active = $4,
            updated_at = NOW()
        WHERE id = $5;
      `,
        [firstName?.trim(), lastName?.trim(), email?.trim()?.toLowerCase(), isActive, targetUserId]
      );
    } else {
      // Creating a new user
      if (!phone && !email) {
        return NextResponse.json(
          { error: 'حداقل شماره موبایل یا ایمیل مدیر جدید را وارد نمایید.' },
          { status: 400 }
        );
      }

      let normalizedPhone: string | null = null;
      if (phone) {
        normalizedPhone = normalizeIranianPhone(phone);
        if (!normalizedPhone) {
          return NextResponse.json(
            { error: 'شماره موبایل وارد شده نامعتبر است. شماره ۱۱ رقمی معتبر (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.' },
            { status: 400 }
          );
        }
      }

      const cleanEmail = email?.trim()?.toLowerCase() || null;

      // Check if user already exists with this phone/email
      const checkSql = normalizedPhone
        ? 'SELECT id FROM users WHERE phone = $1 OR (email IS NOT NULL AND email = $2) LIMIT 1'
        : 'SELECT id FROM users WHERE email = $1 LIMIT 1';
      const checkParams = normalizedPhone ? [normalizedPhone, cleanEmail] : [cleanEmail];

      const existingCheck = await client.query(checkSql, checkParams);
      if (existingCheck.rows.length > 0) {
        targetUserId = existingCheck.rows[0].id;
        // Update user fields
        await client.query(
          `
          UPDATE users 
          SET first_name = COALESCE(NULLIF($1, ''), first_name),
              last_name = COALESCE(NULLIF($2, ''), last_name),
              is_active = $3,
              updated_at = NOW()
          WHERE id = $4;
        `,
          [firstName?.trim(), lastName?.trim(), isActive, targetUserId]
        );
      } else {
        // Create new user record
        const insertUser = await client.query(
          `
          INSERT INTO users (phone, email, first_name, last_name, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id;
        `,
          [
            normalizedPhone || `+980000${Date.now().toString().slice(-7)}`,
            cleanEmail,
            firstName?.trim() || 'مدیر',
            lastName?.trim() || '',
            isActive,
          ]
        );
        targetUserId = insertUser.rows[0].id;

        // Create profile
        await client.query(
          `
          INSERT INTO customer_profiles (user_id, created_at)
          VALUES ($1, NOW())
          ON CONFLICT (user_id) DO NOTHING;
        `,
          [targetUserId]
        );
      }
    }

    const isSuper = role === 'super_admin';
    const finalSections = isSuper ? ALL_SECTIONS : allowedSections;
    const finalTitle = customTitle?.trim() || `${firstName} ${lastName}`.trim() || 'مدیر سیستم';

    // Insert or Update admin_roles
    await client.query(
      `
      INSERT INTO admin_roles (user_id, role, is_super_admin, allowed_sections, custom_title, must_change_password, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET role = $2,
          is_super_admin = $3,
          allowed_sections = $4,
          custom_title = $5,
          must_change_password = $6,
          updated_at = NOW();
    `,
      [targetUserId, role, isSuper, finalSections, finalTitle, mustChangePassword]
    );

    // Set Credentials
    if (password) {
      await client.query(
        `
        INSERT INTO user_credentials (user_id, password_hash, totp_enabled, failed_login_attempts)
        VALUES ($1, $2, false, 0)
        ON CONFLICT (user_id) DO UPDATE
        SET password_hash = $2,
            failed_login_attempts = 0,
            locked_until = NULL;
      `,
        [targetUserId, password]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `دسترسی مدیریت با موفقیت برای «${finalTitle}» ثبت گردید.`,
      userId: targetUserId,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating/promoting admin:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت مدیر جدید', detail: error?.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PATCH: Edit an existing admin (Name, Phone, Email, Role, Allowed Sections, Status, Password)
export async function PATCH(request: Request) {
  const client = await dbPool.connect();
  try {
    const body = await request.json();
    const {
      id, // user_id
      userId,
      firstName,
      lastName,
      customTitle,
      phone,
      email,
      role,
      allowedSections,
      isActive,
      mustChangePassword,
      password,
    } = body;

    const targetUserId = id || userId;
    if (!targetUserId) {
      return NextResponse.json({ error: 'شناسه مدیر / کاربر الزامی است.' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Check if user exists
    const checkUser = await client.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (checkUser.rows.length === 0) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }
    const currentUser = checkUser.rows[0];

    // Protect primary super admin from disabling
    const isPrimaryAdmin =
      currentUser.phone === '+989132391843' ||
      currentUser.phone === '09132391843' ||
      currentUser.email === 'pqehsan@gmail.com';

    // 2. Update Users table
    const userUpdates: string[] = ['updated_at = NOW()'];
    const userParams: any[] = [targetUserId];
    let pIdx = 2;

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
      userParams.push(email.trim().toLowerCase() || null);
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

    if (typeof isActive === 'boolean') {
      if (isPrimaryAdmin && !isActive) {
        throw new Error('امکان غیرفعال‌سازی حساب مدیر ارشد اصلی سیستم وجود ندارد.');
      }
      userUpdates.push(`is_active = $${pIdx}`);
      userParams.push(isActive);
      pIdx++;
    }

    await client.query(
      `
      UPDATE users 
      SET ${userUpdates.join(', ')}
      WHERE id = $1;
    `,
      userParams
    );

    // 3. Update admin_roles table
    const isSuper = role === 'super_admin' || (isPrimaryAdmin && (!role || role === 'super_admin'));
    const finalSections = isSuper ? ALL_SECTIONS : allowedSections || [];
    const finalTitle =
      customTitle?.trim() ||
      `${firstName !== undefined ? firstName : currentUser.first_name || ''} ${
        lastName !== undefined ? lastName : currentUser.last_name || ''
      }`.trim() ||
      'مدیر سیستم';

    await client.query(
      `
      INSERT INTO admin_roles (user_id, role, is_super_admin, allowed_sections, custom_title, must_change_password, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET role = COALESCE($2, admin_roles.role),
          is_super_admin = COALESCE($3, admin_roles.is_super_admin),
          allowed_sections = COALESCE($4, admin_roles.allowed_sections),
          custom_title = COALESCE($5, admin_roles.custom_title),
          must_change_password = COALESCE($6, admin_roles.must_change_password),
          updated_at = NOW();
    `,
      [
        targetUserId,
        role || 'shop_manager',
        isSuper,
        finalSections,
        finalTitle,
        typeof mustChangePassword === 'boolean' ? mustChangePassword : null,
      ]
    );

    // 4. Update password in user_credentials if specified
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        throw new Error('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      }
      await client.query(
        `
        INSERT INTO user_credentials (user_id, password_hash, totp_enabled, failed_login_attempts)
        VALUES ($1, $2, false, 0)
        ON CONFLICT (user_id) DO UPDATE
        SET password_hash = $2,
            failed_login_attempts = 0,
            locked_until = NULL;
      `,
        [targetUserId, password.trim()]
      );

      // Reset must_change_password if new password set
      await client.query(
        'UPDATE admin_roles SET must_change_password = false, updated_at = NOW() WHERE user_id = $1',
        [targetUserId]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `مشخصات و سطح دسترسی مدیر «${finalTitle}» با موفقیت به‌روزرسانی شد.`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش مدیر', detail: error?.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE: Revoke admin role from user (keeps the user record, removes from admin_roles)
export async function DELETE(request: Request) {
  const client = await dbPool.connect();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('userId');

    if (!id) {
      return NextResponse.json({ error: 'شناسه مدیر الزامی است.' }, { status: 400 });
    }

    const check = await client.query('SELECT phone, email FROM users WHERE id = $1', [id]);
    if (check.rows.length > 0) {
      const u = check.rows[0];
      if (u.phone === '+989132391843' || u.phone === '09132391843' || u.email === 'pqehsan@gmail.com') {
        return NextResponse.json(
          { error: 'امکان حذف یا لغو دسترسی مدیر ارشد اصلی سیستم وجود ندارد.' },
          { status: 403 }
        );
      }
    }

    await client.query('DELETE FROM admin_roles WHERE user_id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'دسترسی مدیریت کاربر با موفقیت لغو شد و کاربر به سطح مشتری عادی تغییر یافت.',
    });
  } catch (error: any) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { error: 'خطا در لغو دسترسی مدیریت', detail: error?.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
