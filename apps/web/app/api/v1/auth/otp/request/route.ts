import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOTP } from '@/lib/auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone || '';

    if (!phone) {
      return NextResponse.json(
        { detail: 'شماره موبایل الزامی است.' },
        { status: 400 }
      );
    }

    const result = await createAndSendOTP(phone);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error || 'خطا در ارسال پیامک کد تایید' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'کد تایید ۶ رقمی با موفقیت ارسال شد.',
      dev_otp: result.devOtp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: 'خطای سرور در پردازش درخواست ورود' },
      { status: 500 }
    );
  }
}
