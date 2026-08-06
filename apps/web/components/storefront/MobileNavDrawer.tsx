'use client';

import Link from 'next/link';
import { X, ShoppingBag, User, BookOpen, Home, PhoneCall } from 'lucide-react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <Link href="/" onClick={onClose} className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              <span className="bg-emerald-600 text-white p-1 rounded-md text-xs">🌱</span>
              فروشگاه سبزینه
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-3 font-medium text-sm text-slate-800">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>صفحه اصلی</span>
            </Link>

            <Link
              href="/shop"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>محصولات ارگانیک</span>
            </Link>

            <Link
              href="/articles"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>مقالات تخصصی سلامت</span>
            </Link>

            <Link
              href="/contact"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>تماس با ما</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-100">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <User className="w-4 h-4" />
            <span>ورود / ثبت‌نام مشتری</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
