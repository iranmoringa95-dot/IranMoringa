import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'شناسه کاربر و رمز عبور جدید الزامی هستند.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    await dbPool.query(
      `
      INSERT INTO user_credentials (user_id, password_hash, totp_enabled, failed_login_attempts)
      VALUES ($1, $2, false, 0)
      ON CONFLICT (user_id) DO UPDATE
      SET password_hash = $2,
          failed_login_attempts = 0,
          locked_until = NULL;
    `,
      [userId, newPassword]
    );

    // Reset must_change_password flag
    await dbPool.query(
      'UPDATE admin_roles SET must_change_password = false, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'رمز عبور مدیر با موفقیت تغییر یافت.',
    });
  } catch (error: any) {
    console.error('Error changing admin password:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر رمز عبور', detail: error?.message },
      { status: 500 }
    );
  }
}
