'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, ShoppingBag, User } from 'lucide-react';
import { MobileNavDrawer } from './MobileNavDrawer';

export function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Right: Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setIsNavOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="باز کردن منوی موبایل"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="text-lg sm:text-xl font-black text-emerald-700 flex items-center gap-2 shrink-0">
              <span className="bg-emerald-600 text-white p-1.5 rounded-lg text-sm">🌱</span>
              فروشگاه سبزینه
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
              <Link href="/shop" className="hover:text-emerald-600 transition-colors">محصولات ارگانیک</Link>
              <Link href="/articles" className="hover:text-emerald-600 transition-colors">مقالات سلامت</Link>
              <Link href="/about" className="hover:text-emerald-600 transition-colors">درباره ما</Link>
              <Link href="/contact" className="hover:text-emerald-600 transition-colors">تماس با ما</Link>
            </nav>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="جست‌وجوی پودر مورینگا، دمنوش، روغن..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                aria-label="جست‌وجو"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Left: Cart & Account Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/cart"
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 relative"
              aria-label="سبد خرید"
            >
              <ShoppingBag className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">سبد خرید</span>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">۰</span>
            </Link>

            <Link
              href="/login"
              className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">ورود / ثبت‌نام</span>
            </Link>
          </div>
        </div>
      </header>

      <MobileNavDrawer isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </>
  );
}
