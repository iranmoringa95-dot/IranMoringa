'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  ShoppingBag,
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { MobileNavDrawer } from './MobileNavDrawer';
import { SearchModal } from './SearchModal';
import { BottomNav } from './BottomNav';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { getStoredCart, getCartItemsCount } from '@/lib/cart';
import { isCustomerLoggedIn, customerLogout, getCustomerProfile } from '@/lib/customer-store';
import { isUserSuperAdmin, getActiveAdminSession } from '@/lib/admin-auth-store';

export function Header() {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // User Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('احسان پویا');
  const [userPhone, setUserPhone] = useState('09132391843');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync cart count & auth state
  useEffect(() => {
    const checkAuth = () => {
      const logged = isCustomerLoggedIn();
      setIsLoggedIn(logged);
      const admin = getActiveAdminSession();
      if (logged) {
        const profile = getCustomerProfile();
        setUserName(profile.fullName || 'احسان پویا');
        setUserPhone(profile.phone || '09132391843');
        setIsAdmin(isUserSuperAdmin(profile.phone || '') || Boolean(admin));
      } else {
        setIsAdmin(Boolean(admin));
      }
    };

    const updateCount = () => {
      const items = getStoredCart();
      setCartCount(getCartItemsCount(items));
    };

    updateCount();
    checkAuth();

    window.addEventListener('moringalab_cart_updated', updateCount);
    window.addEventListener('storage', updateCount);
    window.addEventListener('moringalab_auth_changed', checkAuth);
    window.addEventListener('moringa_auth_changed', checkAuth);

    return () => {
      window.removeEventListener('moringalab_cart_updated', updateCount);
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('moringalab_auth_changed', checkAuth);
      window.removeEventListener('moringa_auth_changed', checkAuth);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut: Ctrl+K or Cmd+K or Slash (/) to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    customerLogout();
    setIsLoggedIn(false);
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* ── Top Notification Banner (32px - 36px) ── */}
      <div className="bg-[#f2f9f4] dark:bg-[#072714] text-[#176b39] dark:text-[#97d2a7] text-[11px] sm:text-xs h-8 sm:h-9 px-4 flex items-center justify-center font-bold border-b border-[#e1f2e6] dark:border-[#14552f] transition-colors">
        <div className="flex items-center gap-2 max-w-7xl mx-auto truncate">
          <span>🌿</span>
          <span className="truncate">تضمین ۱۰۰٪ خلوص و اصالت ارگانیک مورینگا</span>
          <span className="hidden md:inline text-stone-400 dark:text-stone-600">•</span>
          <span className="hidden md:inline">ارسال سریع به سراسر ایران</span>
        </div>
      </div>

      {/* ── Main Sticky Header (Desktop: ~70px, Mobile: ~58px) ── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#072714]/95 text-slate-800 dark:text-slate-100 border-b border-[#e5e8de] dark:border-[#14552f] shadow-xs backdrop-blur-md transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-[70px] flex items-center justify-between gap-3">
          {/* Right Section: Mobile Menu Trigger + Brand Logo + Desktop Nav */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <button
              onClick={() => setIsNavOpen(true)}
              className="lg:hidden w-11 h-11 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#176b39] dark:hover:text-[#2ea355] rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all active:scale-95"
              aria-label="باز کردن منوی ناوبری"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo */}
            <BrandLogo
              variant="horizontal"
              theme="light"
              size="md"
              showSubtext={true}
              subtextLang="fa"
              href="/"
            />

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mr-2">
              <Link
                href="/shop"
                className="hover:text-[#176b39] dark:hover:text-[#2ea355] transition-colors flex items-center gap-1.5 py-1"
              >
                <span>محصولات سوپرفود</span>
                <span className="bg-[#fff8f1] dark:bg-[#7a3013]/40 text-[#f47a24] text-[10px] px-1.5 py-0.2 rounded-md font-black border border-[#feeddc] dark:border-[#943813]/60">
                  تخفیف‌دار
                </span>
              </Link>
              <Link
                href="/articles"
                className="hover:text-[#176b39] dark:hover:text-[#2ea355] transition-colors py-1"
              >
                دانشنامه و مقالات
              </Link>
              <Link
                href="/#why-moringa"
                className="hover:text-[#176b39] dark:hover:text-[#2ea355] transition-colors py-1"
              >
                چرا مورینگا؟
              </Link>
              <Link
                href="/#smoothies"
                className="hover:text-[#176b39] dark:hover:text-[#2ea355] transition-colors py-1"
              >
                دستور مصرف و اسموتی
              </Link>
            </nav>
          </div>

          {/* Left Section: Search, Cart, Account, Admin */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="h-10 px-3 sm:px-3.5 text-slate-700 dark:text-slate-200 hover:text-[#176b39] dark:hover:text-[#97d2a7] bg-stone-100 dark:bg-white/5 hover:bg-[#f2f9f4] dark:hover:bg-[#113820] rounded-xl transition-all flex items-center justify-center gap-2 border border-stone-200/80 dark:border-white/10 cursor-pointer text-xs font-bold active:scale-95"
              aria-label="جستجو در محصولات و مقالات"
            >
              <Search className="w-4 h-4 text-[#176b39] dark:text-[#2ea355] shrink-0" />
              <span className="hidden sm:inline text-stone-600 dark:text-stone-300">جستجو در سایت...</span>
              <span className="hidden md:inline-flex text-[10px] bg-white dark:bg-black/40 border border-stone-200 dark:border-white/15 rounded-md px-1.5 py-0.5 text-stone-400 dark:text-stone-400 font-mono">
                Ctrl + K
              </span>
            </button>

            {/* Cart Button with Live Badge */}
            <Link
              href="/cart"
              className="relative h-10 px-3 sm:px-3.5 bg-stone-100 dark:bg-white/5 hover:bg-[#f2f9f4] dark:hover:bg-[#113820] text-slate-800 dark:text-slate-100 hover:text-[#176b39] dark:hover:text-[#97d2a7] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-stone-200/80 dark:border-white/10 active:scale-95 shrink-0"
              aria-label="سبد خرید"
            >
              <ShoppingBag className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
              <span className="hidden md:inline text-xs">سبد خرید</span>
              {cartCount > 0 && (
                <span className="bg-[#f47a24] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 h-4 flex items-center justify-center leading-none shadow-xs">
                  {cartCount.toLocaleString('fa-IR')}
                </span>
              )}
            </Link>

            {/* Admin Access Button */}
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden lg:flex h-10 px-3.5 bg-[#f2f9f4] dark:bg-[#113820] text-[#176b39] dark:text-[#97d2a7] border border-[#c3e5cd] dark:border-[#1e8240] hover:bg-[#e1f2e6] rounded-xl text-xs font-bold items-center justify-center gap-1.5 transition-all shrink-0"
                title="ورود مستقیم به پنل مدیریت"
              >
                <ShieldCheck className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                <span>مدیریت</span>
              </Link>
            )}

            {/* User Account Button & Dropdown */}
            <div className="hidden sm:block">
              {isLoggedIn ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="h-10 px-3.5 bg-stone-100 dark:bg-white/5 hover:bg-stone-200/70 dark:hover:bg-white/10 border border-stone-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                    aria-label="حساب کاربری"
                  >
                    <User className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                    <span className="max-w-[90px] truncate">{userName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-[#0a331b] text-slate-800 dark:text-slate-100 rounded-2xl shadow-float border border-[#e5e8de] dark:border-[#14552f] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                      <div className="p-3 border-b border-stone-100 dark:border-stone-800 space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">{userPhone}</p>
                      </div>

                      <div className="py-1 space-y-0.5 font-bold">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#fff8f1] dark:bg-[#7a3013]/30 text-[#ba470e] dark:text-[#fbbf89] border border-[#feeddc] dark:border-[#943813]/40 font-black hover:bg-[#feeddc] transition-colors mb-1"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#f47a24]" />
                            <span>پنل مدیریت 🛡️</span>
                          </Link>
                        )}

                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
                        >
                          <User className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                          <span>پیشخوان حساب کاربری</span>
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
                        >
                          <Package className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                          <span>سفارش‌ها و سوابق خرید</span>
                        </Link>

                        <Link
                          href="/account/addresses"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                          <span>آدرس‌های من</span>
                        </Link>

                        <Link
                          href="/account/wishlist"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                          <span>علاقه‌مندی‌ها</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold transition-colors text-right"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>خروج از حساب</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-[#176b39] hover:bg-[#14552f] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                  aria-label="ورود به حساب"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>ورود / عضویت</span>
                </Link>
              )}
            </div>

            {/* Theme Toggle Button (Light/Dark/System) */}
            <ThemeToggle variant="button" />
          </div>
        </div>
      </header>

      {/* Smart Search Spotlight Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        onOpenSearch={() => {
          setIsNavOpen(false);
          setIsSearchOpen(true);
        }}
      />

      {/* Mobile-only Bottom Navigation */}
      <BottomNav onOpenSearch={() => setIsSearchOpen(true)} />
    </>
  );
}

export default Header;

