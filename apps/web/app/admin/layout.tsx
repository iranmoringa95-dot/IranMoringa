import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row dir-rtl">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col gap-6 shrink-0">
        <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
          <span>⚙️</span> پنل مدیریت سبزینه
        </div>
        <nav className="flex flex-col gap-1.5 text-xs sm:text-sm">
          <Link href="/admin" className="px-3 py-2 bg-slate-800 text-emerald-400 font-medium rounded-lg">داشبورد</Link>
          <Link href="/admin/products" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">محصولات</Link>
          <Link href="/admin/inventory" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">موجودی و انبار</Link>
          <Link href="/admin/orders" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">سفارش‌ها</Link>
          <Link href="/admin/postchi" className="px-3 py-2 bg-[#026251] text-[#d0de41] font-bold rounded-lg transition-colors flex items-center justify-between">
            <span>📮 پستچی و مرسولات</span>
            <span className="text-[10px] bg-[#d0de41] text-[#026251] px-1.5 py-0.2 rounded-full font-black">جدید</span>
          </Link>
          <Link href="/admin/promotions" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">پروموشن و کوپن‌ها</Link>
          <Link href="/admin/reviews" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">دیدگاه‌ها و پرسش‌ها</Link>
          <Link href="/admin/notifications" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">پیامک و اعلان‌ها</Link>
          <Link href="/admin/audit-logs" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">سوابق امنیتی (Audit)</Link>
          <Link href="/admin/articles" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">مقالات و محتوا</Link>
          <Link href="/admin/seo" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">سئو و ریدایرکت‌ها</Link>
          <Link href="/admin/support" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">مرکز پشتیبانی</Link>
          <Link href="/admin/chatbot" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">چت‌بات دانش‌محور</Link>
          <Link href="/admin/reports" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">گزارش‌ها و تحلیل مالی</Link>
        </nav>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">پیشخوان مدیریت فروشگاه</h2>
          <div className="text-xs sm:text-sm text-slate-600">مدیر سیستم (Super Admin)</div>
        </header>
        <main className="p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
