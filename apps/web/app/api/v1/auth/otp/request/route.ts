import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOTP, isPhoneRegistered, normalizePhone } from '@/lib/auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone || '';
    const action = body.action || 'login'; // 'login' | 'check' | 'register'
    const fullName = body.fullName || '';

    const normPhone = normalizePhone(phone);
    if (!normPhone || !/^09\d{9}$/.test(normPhone)) {
      return NextResponse.json(
        { detail: 'شماره موبایل وارد شده معتبر نیست. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹' },
        { status: 400 }
      );
    }

    // 1. Check if user is registered
    const { registered, name } = await isPhoneRegistered(normPhone);

    // If only checking or if login requested without force, notify unregistered user
    if (action === 'check') {
      return NextResponse.json({
        success: true,
        is_registered: registered,
        phone: normPhone,
        name,
      });
    }

    if (!registered && action === 'login' && !body.forceSend) {
      return NextResponse.json({
        success: true,
        is_registered: false,
        phone: normPhone,
        message: 'با این شماره تا حالا ثبت‌نام نکردی، می‌خوای ثبت‌نام کنی؟',
      });
    }

    // Send OTP (for login or registration)
    const result = await createAndSendOTP(normPhone, {
      fullName: fullName || name,
      isNewUser: !registered,
      forceSend: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { detail: result.error || 'خطا در ارسال پیامک کد تایید' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      is_registered: registered,
      phone: normPhone,
      message: 'کد تایید ۶ رقمی با موفقیت ارسال شد.',
      dev_otp: result.devOtp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: 'خطای سرور در پردازش درخواست پیامک' },
      { status: 500 }
    );
  }
}
