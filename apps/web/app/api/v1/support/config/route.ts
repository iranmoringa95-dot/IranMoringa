import { NextRequest, NextResponse } from 'next/server';
import { getSupportConfig, saveSupportConfig, SupportWidgetConfig } from '@/lib/support-config-store';

export async function GET() {
  try {
    const config = getSupportConfig();
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت تنظیمات پشتیبان' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<SupportWidgetConfig> = await req.json();
    const updated = saveSupportConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ذخیره تنظیمات پشتیبان' }, { status: 500 });
  }
}
