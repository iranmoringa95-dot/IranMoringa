import { NextRequest, NextResponse } from 'next/server';
import { testWebOneConnection } from '@/lib/sms-config-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await testWebOneConnection(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'خطا در احراز هویت با وب وان پیامک',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: result.balance,
      currency: result.currency,
      message: result.message || 'اتصال موفقیت‌آمیز بود.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'خطای غیرمنتظره در تست اتصال' },
      { status: 500 }
    );
  }
}
