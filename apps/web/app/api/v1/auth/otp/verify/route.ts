import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone || '';
    const code = body.code || '';

    if (!phone || !code) {
      return NextResponse.json(
        { detail: 'شماره موبایل و کد تایید الزامی هستند.' },
        { status: 400 }
      );
    }

    const verification = await verifyOTP(phone, code);
    if (!verification.valid || !verification.user) {
      return NextResponse.json(
        { detail: verification.error || 'کد تایید واردشده نامعتبر است.' },
        { status: 400 }
      );
    }

    const user = verification.user;

    const response = NextResponse.json({
      success: true,
      token: `moringa_token_${Date.now()}`,
      user: {
        phone: user.phone,
        name: user.name,
        isNew: user.isNew,
        role: 'customer',
      },
    });

    const cookieMaxAge = 30 * 24 * 60 * 60; // 30 days

    // Set auth session cookies
    response.cookies.set('moringa_auth_session', 'authenticated', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    response.cookies.set('moringa_user_phone', user.phone, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    response.cookies.set('moringa_user_name', encodeURIComponent(user.name), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { detail: 'خطای سرور در تایید کد' },
      { status: 500 }
    );
  }
}
