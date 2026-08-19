import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'ایمیل و رمز عبور الزامی هستند.' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { detail: 'فرمت ایمیل نامعتبر است.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { detail: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      token: `moringa_token_${Date.now()}`,
      user: {
        email,
        name: email.split('@')[0],
        role: 'customer',
      },
    });

    response.cookies.set('moringa_auth_session', 'authenticated', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { detail: 'خطای سرور در ورود با ایمیل' },
      { status: 500 }
    );
  }
}
