import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOTP } from '@/lib/auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = (body.fullName || '').trim();
    const phone = (body.phone || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const referralCode = (body.referralCode || '').trim();

    if (!fullName) {
      return NextResponse.json(
        { detail: 'نام و نام خانوادگی الزامی است.' },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { detail: 'شماره موبایل الزامی است.' },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { detail: 'کلمه عبور باید حداقل ۶ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    // Trigger OTP sending to verify phone number via WebOneSMS
    const otpResult = await createAndSendOTP(phone);
    if (!otpResult.success) {
      return NextResponse.json(
        { detail: otpResult.error || 'خطا در ارسال پیامک فعال‌سازی' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'کد فعال‌سازی با موفقیت ارسال شد.',
      dev_otp: otpResult.devOtp,
      user_draft: {
        fullName,
        phone,
        email,
        referralCode,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: 'خطای سرور در ثبت‌نام مشتری' },
      { status: 500 }
    );
  }
}
