'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900">مشکلی در بارگذاری صفحه پیش آمد</h2>
        <p className="text-sm text-slate-600">
          خطایی در برقراری ارتباط رخ داده است. لطفاً مجدداً تلاش کنید.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}
