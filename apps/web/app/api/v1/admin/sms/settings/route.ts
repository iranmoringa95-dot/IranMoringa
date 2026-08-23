import { NextRequest, NextResponse } from 'next/server';
import { getSMSConfig, saveSMSConfig } from '@/lib/sms-config-store';

export async function GET() {
  try {
    const config = getSMSConfig();
    const sanitized = {
      enable_sms: config.enableSMS !== false,
      active_gateway: config.activeGateway || 'webone',
      active_gateway_name: 'وب‌وان اس‌ام‌اس (WebOneSMS REST)',
      active_balance: config.lastBalance || '۴,۰۶۱,۲۴۴ ریال',
      admin_numbers: config.adminNumbers || ['09132391843', '09370264096'],
      tracking_keys: config.trackingKeys || ['_tracking_code', 'vira_parcel_key', 'post_tracking_code'],
      gateways: [
        { id: 'webone', name: 'وب‌وان اس‌ام‌اس (WebOneSMS REST)' },
        { id: 'farazsms', name: 'فراز اس‌ام‌اس / آی‌پی‌پنل (FarazSMS / IPPanel)' },
        { id: 'kavenegar', name: 'کاوه‌نگار (Kavenegar Verify / Lookup)' },
        { id: 'melipayamak', name: 'ملی‌پیامک (Melipayamak BaseNumber)' },
        { id: 'smsir', name: 'اس‌ام‌اس دات آی‌آر (SMS.ir Fast Verify)' },
        { id: 'ghasedak', name: 'قاصدک (Ghasedak OTP / Send)' },
      ],
      credentials: config.credentials,
      buyer_templates: config.buyerTemplates,
      admin_templates: config.adminTemplates,
      status_templates: config.statusTemplates,
    };
    return NextResponse.json(sanitized);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در دریافت تنظیمات پیامک' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const current = getSMSConfig();

    const updated = saveSMSConfig({
      enableSMS: body.enable_sms !== undefined ? body.enable_sms : current.enableSMS,
      activeGateway: body.active_gateway || current.activeGateway,
      adminNumbers: body.admin_numbers || current.adminNumbers,
      trackingKeys: body.tracking_keys || current.trackingKeys,
      credentials: body.credentials ? { ...current.credentials, ...body.credentials } : current.credentials,
      buyerTemplates: body.buyer_templates || current.buyerTemplates,
      adminTemplates: body.admin_templates || current.adminTemplates,
      statusTemplates: body.status_templates || current.statusTemplates,
    });

    return NextResponse.json({
      status: 'success',
      message: 'تنظیمات سامانه پیامک با موفقیت ذخیره و اعمال شد',
      config: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در ذخیره تنظیمات پیامک' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
