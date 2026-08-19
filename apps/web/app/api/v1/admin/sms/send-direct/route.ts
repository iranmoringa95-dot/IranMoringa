import { NextRequest, NextResponse } from 'next/server';
import { sendWebOneDirectSMS } from '@/lib/sms-config-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message, senderNumber, isOtp, otpCode, templateId } = body;

    if (!to || !to.trim()) {
      return NextResponse.json({ error: 'شماره موبایل گیرنده الزامی است.' }, { status: 400 });
    }

    if (!message && !otpCode) {
      return NextResponse.json({ error: 'متن پیامک یا کد اعتبارسنجی الزامی است.' }, { status: 400 });
    }

    const result = await sendWebOneDirectSMS({
      to,
      message: message || `کد تایید شما: ${otpCode}`,
      senderNumber,
      isOtp,
      otpCode,
      templateId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'خطا در ارسال پیامک از طریق درگاه WebOneSMS',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `پیامک با موفقیت از طریق سامانه WebOneSMS به شماره ${to} ارسال گردید.`,
      data: result.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'خطای غیرمنتظره در ارسال پیامک' },
      { status: 500 }
    );
  }
}
