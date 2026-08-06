export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">فروش امروز</p>
          <p className="text-2xl font-black text-slate-900 mt-2">۰ تومان</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">سفارش‌های جدید</p>
          <p className="text-2xl font-black text-slate-900 mt-2">۰</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">هشدار موجودی پایین</p>
          <p className="text-2xl font-black text-amber-600 mt-2">۰ کالا</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">مقالات در انتظار بازبینی</p>
          <p className="text-2xl font-black text-slate-900 mt-2">۰</p>
        </div>
      </div>
    </div>
  );
}
