import { NextRequest, NextResponse } from 'next/server';
import { getSMSConfig, saveSMSConfig } from '@/lib/sms-config-store';

export async function GET() {
  try {
    const config = getSMSConfig();
    const sanitized = {
      ...config,
      password: config.password ? '••••••••' : '',
      apiKey: config.apiKey || '',
      hasPassword: Boolean(config.password),
      hasApiKey: Boolean(config.apiKey),
    };
    return NextResponse.json(sanitized);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = getSMSConfig();

    const toSave: any = {
      provider: body.provider || current.provider,
      authMethod: body.authMethod || current.authMethod,
      username: body.username !== undefined ? body.username : current.username,
      senderNumber: body.senderNumber !== undefined ? body.senderNumber : current.senderNumber,
      baseURL: body.baseURL !== undefined ? body.baseURL : current.baseURL,
      otpTemplateId: body.otpTemplateId !== undefined ? body.otpTemplateId : current.otpTemplateId,
      isActive: body.isActive !== undefined ? body.isActive : current.isActive,
    };

    // If password changed and not masked placeholder
    if (body.password && body.password !== '••••••••') {
      toSave.password = body.password;
    }

    // If apiKey changed and not masked
    if (body.apiKey && !body.apiKey.includes('...')) {
      toSave.apiKey = body.apiKey;
    }

    const updated = saveSMSConfig(toSave);

    return NextResponse.json({
      success: true,
      message: 'تنظیمات درگاه WebOneSMS با موفقیت ذخیره گردید.',
      config: {
        ...updated,
        password: updated.password ? '••••••••' : '',
        apiKey: updated.apiKey ? `${updated.apiKey.slice(0, 4)}...` : '',
        hasPassword: Boolean(updated.password),
        hasApiKey: Boolean(updated.apiKey),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}
