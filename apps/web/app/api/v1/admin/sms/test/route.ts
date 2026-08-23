import { NextRequest, NextResponse } from 'next/server';
import { sendWebOneDirectSMS } from '@/lib/sms-config-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, message } = body;

    if (!mobile || !mobile.trim()) {
      return NextResponse.json({ error: 'شماره موبایل گیرنده تست الزامی است.' }, { status: 400 });
    }

    const testMsg = message || `این یک پیامک تست از فروشگاه ایران مورینگا است.\nزمان: ${new Date().toLocaleTimeString('fa-IR')}`;

    const result = await sendWebOneDirectSMS({
      to: mobile,
      message: testMsg,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          status: 'error',
          error: result.error || 'خطا در ارسال پیامک تست',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: `پیامک تست با موفقیت به شماره ${mobile} ارسال گردید.`,
      message_id: result.messageId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', error: err.message || 'خطای غیرمنتظره در ارسال پیامک تست' },
      { status: 500 }
    );
  }
}
