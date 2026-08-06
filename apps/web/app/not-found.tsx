import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="text-5xl font-black text-emerald-600">404</div>
        <h2 className="text-xl font-bold text-slate-900">صفحه مورد نظر یافت نشد</h2>
        <p className="text-sm text-slate-600">
          آدرسی که وارد کرده‌اید وجود ندارد یا منتقل شده است.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
