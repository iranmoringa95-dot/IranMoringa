'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, ShieldCheck, ExternalLink } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AdminUser } from '@/lib/admin-auth-store';
import { getPersianRoleTitle } from '@/config/admin-nav';

export interface AdminHeaderProps {
  session: AdminUser | null;
  onOpenMobileDrawer: () => void;
}

export function AdminHeader({ session, onOpenMobileDrawer }: AdminHeaderProps) {
  const roleTitle = getPersianRoleTitle(session?.role, session?.isSuperAdmin);

  return (
    <header className="bg-white dark:bg-[#08201a] border-b border-slate-200 dark:border-emerald-900/40 h-16 px-4 sm:px-6 flex items-center justify-between shadow-xs transition-colors duration-200 sticky top-0 z-20">
      {/* Right side: Mobile Menu Trigger + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          aria-label="باز کردن منوی مدیریت"
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-800 dark:text-white truncate">
          پیشخوان مدیریت فروشگاه ایران مورینگا
        </h1>
      </div>

      {/* Left side: Theme + Role Badge + Site View */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle />

        {/* User Role Badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-black">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{roleTitle}</span>
        </span>

        {/* Storefront Link */}
        <Link
          href="/"
          target="_blank"
          title="مشاهده فروشگاه در برگه جدید"
          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <span className="hidden xs:inline">نمایش سایت</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
