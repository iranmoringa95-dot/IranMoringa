import Link from 'next/link';

export default function CustomerAccountDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">حساب کاربری من</h1>
          <p className="text-sm text-slate-600">مدیریت آدرس‌ها، سفارش‌ها و اطلاعات حساب</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">
          بازگشت به فروشگاه
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">📦 سفارش‌های اخیر</h3>
          <p className="text-sm text-slate-500">مشاهده و پیگیری سفارش‌های ثبت‌شده</p>
          <div className="pt-2">
            <Link href="/account/orders" className="text-sm text-emerald-600 font-semibold hover:underline">
              مشاهده لیست سفارش‌ها ←
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">📍 آدرس‌های ارسال</h3>
          <p className="text-sm text-slate-500">مدیریت آدرس‌های منتخب جهت تحویل سفارش</p>
          <div className="pt-2">
            <Link href="/account/addresses" className="text-sm text-emerald-600 font-semibold hover:underline">
              مدیریت آدرس‌ها ←
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">💚 علاقه‌مندی‌ها</h3>
          <p className="text-sm text-slate-500">محصولات نشان‌شده جهت خرید بعدی</p>
          <div className="pt-2">
            <Link href="/account/wishlist" className="text-sm text-emerald-600 font-semibold hover:underline">
              مشاهده علاقه‌مندی‌ها ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
