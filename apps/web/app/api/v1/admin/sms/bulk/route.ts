import { NextRequest, NextResponse } from 'next/server';
import { sendWebOneDirectSMS } from '@/lib/sms-config-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobiles, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'متن پیامک الزامی است.' }, { status: 400 });
    }

    let phoneList: string[] = [];
    if (Array.isArray(mobiles)) {
      phoneList = mobiles;
    } else if (typeof mobiles === 'string') {
      phoneList = mobiles.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    }

    if (phoneList.length === 0) {
      return NextResponse.json({ error: 'هیچ شماره موبایلی یافت نشد.' }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;

    for (const phone of phoneList) {
      const res = await sendWebOneDirectSMS({
        to: phone,
        message,
      });
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    return NextResponse.json({
      status: 'success',
      success_count: successCount,
      failed_count: failedCount,
      total_count: phoneList.length,
      message: `عملیات ارسال گروهی پایان یافت. موفق: ${successCount} | ناموفق: ${failedCount}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', error: err.message || 'خطا در ارسال پیامک گروهی' },
      { status: 500 }
    );
  }
}
