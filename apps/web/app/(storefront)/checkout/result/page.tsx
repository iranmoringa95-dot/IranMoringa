import Link from 'next/link';
import { CheckCircle2, XCircle, ShoppingBag, Truck, Package, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; status?: string; order_number?: string; total?: string }>;
}) {
  const { status, order_number, total } = await searchParams;
  const isSuccess = status === 'succeeded' || !status;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#06120e] dir-rtl text-slate-800 dark:text-slate-100 font-sans selection:bg-[#d0de41] selection:text-[#026251] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white dark:bg-[#08201a] p-6 sm:p-10 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xl text-center space-y-6">
          {isSuccess ? (
            <>
              {/* Celebratory Icon */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 animate-ping opacity-60" />
                <div className="w-16 h-16 bg-gradient-to-tr from-[#026251] to-[#22c55e] text-white rounded-full flex items-center justify-center text-3xl shadow-lg relative z-10">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-2">
                <span className="text-[11px] font-black tracking-wider text-emerald-600 dark:text-[#d0de41] uppercase bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                  سفارش با موفقیت ثبت شد
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white pt-1">
                  از خرید شما سپاسگزاریم!
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                  سفارش شما در سیستم ثبت و به واحد انبار و بسته‌بندی ارسال گردید. پیامک وضعیت و رهگیری پستی به شماره همراه شما ارسال شد.
                </p>
              </div>

              {/* Order Information Card */}
              <div className="bg-stone-50 dark:bg-[#061410] p-5 rounded-2xl border border-stone-200 dark:border-emerald-900/40 space-y-3 text-right">
                <div className="flex items-center justify-between text-xs border-b border-stone-200 dark:border-emerald-900/30 pb-2.5">
                  <span className="text-stone-500 dark:text-stone-400">شماره سفارش رسمی:</span>
                  <span className="font-mono font-bold text-sm text-[#026251] dark:text-[#d0de41]">
                    {order_number || 'MOR-1405-104'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-stone-200 dark:border-emerald-900/30 pb-2.5">
                  <span className="text-stone-500 dark:text-stone-400">روش ارسال مرسوله:</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    پست پیشتاز هوایی (سراسری)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">وضعیت سفارش:</span>
                  <span className="font-bold text-emerald-600 dark:text-[#d0de41] flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    در حال پردازش و آماده‌سازی مرسوله
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3.5 justify-center">
                <Link
                  href="/account"
                  className="px-6 py-3.5 bg-[#026251] hover:bg-[#024a3d] text-[#d0de41] rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>مشاهده سفارش و فاکتور در حساب کاربری</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <Link
                  href="/shop"
                  className="px-6 py-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center"
                >
                  بازگشت به فروشگاه
                </Link>
              </div>

              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center gap-2 text-[11px] text-emerald-900 dark:text-emerald-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>تمام سفارش‌ها با ضمانت ۱۰۰٪ تازگی و اصالت دست‌چین ارسال می‌شوند.</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-md">
                <XCircle className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">پرداخت ناموفق بود</h1>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                  تراکنش توسط کاربر لغو شد یا درگاه بانکی پاسخ ناموفق داد.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3.5 justify-center">
                <Link
                  href="/checkout"
                  className="px-6 py-3 bg-[#026251] text-[#d0de41] rounded-2xl text-xs sm:text-sm font-black transition-all shadow-sm"
                >
                  تلاش مجدد جهت ثبت سفارش
                </Link>
                <Link
                  href="/cart"
                  className="px-6 py-3 bg-stone-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl text-xs sm:text-sm font-medium transition-all"
                >
                  بازگشت به سبد خرید
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
