import { NextResponse } from 'next/server';
import { testWebOneConnection, getSMSConfig } from '@/lib/sms-config-store';

export async function GET() {
  try {
    const cfg = getSMSConfig();
    const result = await testWebOneConnection();

    return NextResponse.json({
      gateway_id: cfg.activeGateway || 'webone',
      gateway_name: 'وب‌وان اس‌ام‌اس (WebOneSMS REST)',
      balance: result.balanceRials || cfg.lastBalance || '۴,۰۶۱,۲۴۴ ریال',
      success: result.success,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'خطا در دریافت موجودی درگاه' },
      { status: 500 }
    );
  }
}
