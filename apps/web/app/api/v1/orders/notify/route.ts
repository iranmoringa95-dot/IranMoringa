import { NextRequest, NextResponse } from 'next/server';
import { sendOrderStatusNotification } from '@/lib/sms-config-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderNumber,
      customerName,
      customerPhone,
      totalToman,
      orderStatus,
      trackingCode,
    } = body;

    const effectiveOrderId = orderNumber || orderId || `MOR-${Date.now()}`;
    const effectivePhone = customerPhone || '';
    const effectiveName = customerName || 'مشتری';
    const effectiveTotal = typeof totalToman === 'number' ? totalToman.toLocaleString('fa-IR') : (totalToman || '۰');
    const effectiveStatus = orderStatus || 'order_placed';

    const data = {
      first_name: effectiveName,
      last_name: '',
      order_id: effectiveOrderId,
      order_total: effectiveTotal,
      order_status: effectiveStatus === 'paid' ? 'پرداخت شده' : 'ثبت شده',
      tracking_code: trackingCode || '—',
      tracking_url: `https://moringano.ir/tracking/${effectiveOrderId}`,
    };

    // 1. Send SMS to Buyer
    let buyerResult = { success: true };
    if (effectivePhone) {
      buyerResult = await sendOrderStatusNotification({
        recipientType: 'buyer',
        status: effectiveStatus,
        to: effectivePhone,
        data,
      });
    }

    // 2. Send SMS to Admin
    const adminResult = await sendOrderStatusNotification({
      recipientType: 'admin',
      status: effectiveStatus,
      data,
    });

    return NextResponse.json({
      status: 'success',
      message: 'پیامک‌های اطلاع‌رسانی سفارش با موفقیت ارسال شدند',
      buyer: buyerResult,
      admin: adminResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', error: err.message || 'خطا در ارسال پیامک سفارش' },
      { status: 500 }
    );
  }
}
