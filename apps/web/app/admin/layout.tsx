import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col gap-6 shrink-0">
        <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
          <span>⚙️</span> پنل مدیریت سبزینه
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/admin" className="px-3 py-2 bg-slate-800 text-emerald-400 font-medium rounded-lg">داشبورد</Link>
          <Link href="/admin/products" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">محصولات</Link>
          <Link href="/admin/inventory" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">موجودی و انبار</Link>
          <Link href="/admin/orders" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">سفارش‌ها</Link>
          <Link href="/admin/articles" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">مقالات و محتوا</Link>
          <Link href="/admin/settings/general" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">تنظیمات فروشگاه</Link>
        </nav>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">پیشخوان مدیریت</h2>
          <div className="text-sm text-slate-600">مدیر سیستم (Super Admin)</div>
        </header>
        <main className="p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
