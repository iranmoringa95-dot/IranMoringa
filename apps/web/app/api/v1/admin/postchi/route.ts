import { NextResponse } from 'next/server';
import {
  POSTCHI_SHIPMENTS,
  DEFAULT_POSTCHI_SETTINGS,
  createOrUpdatePostchiShipment,
  PostchiShipment,
  PostchiSettings,
} from '@/lib/postchi-data';

export async function GET(request: Request) {
  const stats = {
    total: POSTCHI_SHIPMENTS.length,
    accepted: POSTCHI_SHIPMENTS.filter((s) => s.status === 'accepted').length,
    in_transit: POSTCHI_SHIPMENTS.filter((s) => s.status === 'in_transit').length,
    out_for_delivery: POSTCHI_SHIPMENTS.filter((s) => s.status === 'out_for_delivery').length,
    delivered: POSTCHI_SHIPMENTS.filter((s) => s.status === 'delivered').length,
    returned: POSTCHI_SHIPMENTS.filter((s) => s.status === 'returned').length,
  };

  return NextResponse.json({
    shipments: POSTCHI_SHIPMENTS,
    stats,
    settings: DEFAULT_POSTCHI_SETTINGS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.order_number || !body.tracking_code) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', detail: 'شماره سفارش و کد رهگیری پستی الزامی هستند.' },
        { status: 400 }
      );
    }

    const updatedShipment = createOrUpdatePostchiShipment(body);

    // Simulate SMS and Messenger notifications
    const simulatedNotifications = {
      sms_sent: DEFAULT_POSTCHI_SETTINGS.sms_enabled,
      sms_text: `مورینگا ایران: سلام ${updatedShipment.recipient_name} عزیز، سفارش ${updatedShipment.order_number} شما با کد رهگیری پستی ${updatedShipment.tracking_code} ارسال شد. پیگیری: https://moringalab.ir/tracking?q=${updatedShipment.tracking_code}`,
      bale_sent: DEFAULT_POSTCHI_SETTINGS.bale_enabled,
      rubika_sent: DEFAULT_POSTCHI_SETTINGS.rubika_enabled,
    };

    return NextResponse.json({
      success: true,
      shipment: updatedShipment,
      notifications: simulatedNotifications,
      message: 'کد رهگیری پستی با موفقیت ثبت و پیامک/نوتیفیکیشن برای خریدار ارسال گردید.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: 'خطایی در ثبت مرسوله رخ داد.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<PostchiSettings>;
    Object.assign(DEFAULT_POSTCHI_SETTINGS, body);

    return NextResponse.json({
      success: true,
      settings: DEFAULT_POSTCHI_SETTINGS,
      message: 'تنظیمات سامانه پستچی و پنل پیامک/پیام‌رسان با موفقیت ذخیره شد.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: 'خطا در ذخیره تنظیمات.' },
      { status: 500 }
    );
  }
}
