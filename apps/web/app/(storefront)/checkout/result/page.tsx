import Link from 'next/link';
import { CheckCircle2, XCircle, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/storefront/Header';

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; status?: string; order_number?: string }>;
}) {
  const { status, order_number } = await searchParams;
  const isSuccess = status === 'succeeded';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
          {isSuccess ? (
            <>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-900">پرداخت با موفقیت انجام شد</h1>
                <p className="text-sm text-slate-600">سفارش شما با موفقیت ثبت شد و در مرحله پردازش انبار قرار گرفت.</p>
              </div>

              {order_number && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block text-center space-y-1">
                  <span className="text-xs text-slate-500">شماره سفارش شما</span>
                  <div className="text-lg font-mono font-bold text-emerald-700">{order_number}</div>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/account/orders"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  مشاهده سفارش در حساب کاربری
                </Link>
                <Link
                  href="/shop"
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  بازگشت به فروشگاه
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                <XCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-900">پرداخت ناموفق بود</h1>
                <p className="text-sm text-slate-600">تراکنش توسط کاربر لغو شد یا درگاه بانک پاسخ ناموفق داد.</p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/checkout"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  تلاش مجدد جهت پرداخت
                </Link>
                <Link
                  href="/cart"
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  بازگشت به سبد خرید
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
