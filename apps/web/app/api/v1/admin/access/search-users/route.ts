import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatPhoneDisplay(raw: string): string {
  if (!raw) return '';
  let p = raw.replace(/[^\d+]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  return p;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q.trim() || q.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const searchTerm = `%${q.trim()}%`;
    const sql = `
      SELECT 
        u.id,
        u.phone,
        u.email,
        COALESCE(u.first_name, '') as first_name,
        COALESCE(u.last_name, '') as last_name,
        u.is_active,
        ar.role as admin_role,
        ar.is_super_admin,
        CASE WHEN ar.id IS NOT NULL THEN true ELSE false END as is_admin
      FROM users u
      LEFT JOIN admin_roles ar ON ar.user_id = u.id
      WHERE 
        u.phone ILIKE $1 OR 
        u.email ILIKE $1 OR 
        u.first_name ILIKE $1 OR 
        u.last_name ILIKE $1
      ORDER BY is_admin DESC, u.created_at DESC
      LIMIT 15;
    `;

    const result = await dbPool.query(sql, [searchTerm]);

    const users = result.rows.map((r) => ({
      id: r.id,
      phone: formatPhoneDisplay(r.phone),
      rawPhone: r.phone,
      email: r.email || '',
      firstName: r.first_name,
      lastName: r.last_name,
      fullName: `${r.first_name} ${r.last_name}`.trim() || 'کاربر بدون نام',
      isActive: r.is_active,
      isAdmin: r.is_admin,
      adminRole: r.admin_role || null,
      isSuperAdmin: Boolean(r.is_super_admin),
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error searching users for admin promotion:', error);
    return NextResponse.json(
      { error: 'خطا در جستجوی کاربران', detail: error?.message },
      { status: 500 }
    );
  }
}
