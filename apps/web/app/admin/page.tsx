import Link from 'next/link';
import { ShoppingBag, TrendingUp, AlertTriangle, Package, ShieldCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">داشبورد مدیریت فروشگاه</h1>
        <p className="text-xs sm:text-sm text-slate-600">خلاصه وضعیت فروش، سفارشات اخیر و هشدارهای انبار</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">فروش کل (تومان)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">۴۳۰,۰۰۰</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">تعداد کل سفارشات</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">۱</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">سفارشات نیازمند ارسال</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">۱</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">کالاهای کم‌موجود انبار</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">۲</div>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/orders" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">مدیریت سفارشات و ارسال</h3>
          <p className="text-xs text-slate-500">بررسی سفارش‌های جدید و ثبت کد رهگیری پستی.</p>
        </Link>

        <Link href="/admin/inventory" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">مدیریت موجودی انبار</h3>
          <p className="text-xs text-slate-500">افزایش موجودی کالاها و اصلاح دستی موجودی.</p>
        </Link>

        <Link href="/admin/audit-logs" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">لاگ‌های امنیتی (Audit Logs)</h3>
          <p className="text-xs text-slate-500">ثبت شفاف تمامی تغییرات مدیریتی سیستم.</p>
        </Link>
      </div>
    </div>
  );
}
