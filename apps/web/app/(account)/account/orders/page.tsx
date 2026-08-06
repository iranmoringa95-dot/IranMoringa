import Link from 'next/link';
import { Package, ArrowLeft } from 'lucide-react';

export default function CustomerOrdersPage() {
  const sampleOrders = [
    {
      orderNumber: 'ML-1405-000001',
      date: '۱۶ مرداد ۱۴۰۵',
      status: 'پرداخت شده',
      statusColor: 'bg-emerald-100 text-emerald-700',
      totalToman: 430000,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">سفارش‌های من</h1>
          <p className="text-xs text-slate-500">تاریخچه خریدهای انجام‌شده و وضعیت پیگیری</p>
        </div>
      </div>

      {sampleOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-700">هنوز هیچ سفارشی ثبت نکرده‌اید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sampleOrders.map((ord) => (
            <div key={ord.orderNumber} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{ord.orderNumber}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ord.statusColor}`}>
                    {ord.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">تاریخ ثبت: {ord.date}</p>
                <p className="text-xs text-slate-700 font-semibold pt-1">
                  مبلغ کل: {ord.totalToman.toLocaleString('fa-IR')} تومان
                </p>
              </div>

              <Link
                href={`/account/orders/${ord.orderNumber}`}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
              >
                <span>مشاهده جزئیات</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
