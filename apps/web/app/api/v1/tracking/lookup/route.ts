import { NextResponse } from 'next/server';
import { lookupPostchiShipment, POSTCHI_SHIPMENTS } from '@/lib/postchi-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || body.tracking_code || body.order_number;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_QUERY', detail: 'لطفاً کد رهگیری، شماره سفارش یا شماره تماس را وارد فرمایید.' },
        { status: 400 }
      );
    }

    const shipment = lookupPostchiShipment(query);

    if (!shipment) {
      // Fallback: If not found in mock list, generate a helpful structured response or 404
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          detail: 'مرسوله‌ای با این کد رهگیری یا شماره سفارش در سامانه ثبت نشده است. لطفاً دقت فرمایید.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(shipment, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'خطایی در استعلام وضعیت مرسوله رخ داد.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || searchParams.get('tracking_code') || searchParams.get('order_number');

  if (!q) {
    return NextResponse.json(
      { error: 'MISSING_QUERY', detail: 'پارامتر جستجو الزامی است.' },
      { status: 400 }
    );
  }

  const shipment = lookupPostchiShipment(q);
  if (!shipment) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: 'مرسوله‌ای با این مشخصات یافت نشد.' },
      { status: 404 }
    );
  }

  return NextResponse.json(shipment, { status: 200 });
}
