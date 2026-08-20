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
  const [searchQuery, setSearchQuery] = useState('');
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
      {/* Top Notification Banner */}
      <div className="bg-[#01382e] dark:bg-[#021f19] text-[#d0de41] text-[10px] sm:text-xs py-1.5 px-4 text-center font-bold tracking-tight transition-colors duration-200 border-b border-emerald-900/40">
        <span className="inline-block animate-pulse ml-1.5">🌿</span>
        <span>تضمین ۱۰۰٪ خلوص و اصالت ارگانیک برگ‌های سایه‌خشک مورینگا اولیفرا</span>
        <span className="hidden md:inline text-white/70 mr-2">• ارسال سریع به سراسر ایران</span>
      </div>

      <header className="sticky top-0 z-40 bg-[#026251] dark:bg-[#031d17] text-white border-b border-emerald-800/80 dark:border-emerald-950/80 shadow-md backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Right: Hamburger Menu (Mobile) + Brand Logo + Desktop Nav */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <button
              onClick={() => setIsNavOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-white/90 hover:text-[#d0de41] rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all active:scale-95"
              aria-label="باز کردن منو"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo */}
            <BrandLogo
              variant="horizontal"
              theme="light"
              size="md"
              showSubtext={true}
              subtextLang="en"
              href="/"
            />

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 text-xs sm:text-sm font-bold text-emerald-100 mr-3">
              <Link href="/shop" className="hover:text-[#d0de41] transition-colors flex items-center gap-1">
                <span>محصولات سوپرفود</span>
                <span className="bg-[#d0de41] text-[#026251] text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  ویژه
                </span>
              </Link>
              <Link href="/articles" className="hover:text-[#d0de41] transition-colors">
                دانشنامه و مقالات
              </Link>
              <Link href="/#why-moringa" className="hover:text-[#d0de41] transition-colors">
                چرا مورینگا؟
              </Link>
              <Link href="/#smoothies" className="hover:text-[#d0de41] transition-colors">
                دستورهای اسموتی
              </Link>
            </nav>
          </div>

          {/* Left Actions: Pure, Balanced & Meta/Apple Clean */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Theme Toggle (Day / Night) */}
            <ThemeToggle />

            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 text-white/90 hover:text-[#d0de41] bg-white/10 hover:bg-white/20 rounded-2xl sm:rounded-full transition-all flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer text-xs font-bold active:scale-95"
              aria-label="جستجو در سایت"
            >
              <Search className="w-4 h-4 text-[#d0de41]" />
              <span className="hidden md:inline">جستجو</span>
            </button>

            {/* Desktop-only Cart Button (Mobile is in Bottom Nav) */}
            <Link
              href="/cart"
              className="hidden sm:flex px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs sm:text-sm font-bold transition-all items-center justify-center gap-1.5 border border-white/15 relative"
              aria-label="سبد خرید"
            >
              <ShoppingBag className="w-4 h-4 text-[#d0de41]" />
              <span className="hidden md:inline text-xs">سبد خرید</span>
              <span className="bg-[#d0de41] text-[#026251] text-[10px] font-black px-1.5 py-0.2 rounded-full leading-none">
                {cartCount.toLocaleString('fa-IR')}
              </span>
            </Link>

            {/* Admin Direct Access Button */}
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden lg:flex px-3.5 py-2 bg-[#d0de41] text-[#026251] hover:bg-[#b8c634] rounded-full text-xs font-black items-center justify-center gap-1.5 shadow-md hover:scale-105 transition-all"
                title="ورود مستقیم به پنل مدیریت"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>پنل مدیریت 🛡️</span>
              </Link>
            )}

            {/* Desktop-only User Button (Mobile is in Bottom Nav) */}
            <div className="hidden sm:block">
              {isLoggedIn ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white hover:text-[#d0de41] rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 relative"
                    aria-label="حساب کاربری"
                  >
                    <User className="w-4 h-4 text-[#d0de41]" />
                    <span className="max-w-[85px] truncate font-bold">{userName}</span>
                    <ChevronDown className="w-3 h-3 text-[#d0de41]" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#071d17] text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-emerald-900/60 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                      <div className="p-3 border-b border-slate-100 dark:border-emerald-900/40 space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 font-mono">{userPhone}</p>
                      </div>

                      <div className="py-1 space-y-0.5 font-bold">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-black hover:bg-amber-100 transition-colors mb-1"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>ورود به پنل مدیریت 🛡️</span>
                          </Link>
                        )}

                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <User className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
                          <span>پیشخوان حساب کاربری</span>
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <Package className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
                          <span>سفارش‌ها و سوابق خرید</span>
                        </Link>

                        <Link
                          href="/account/addresses"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
                          <span>آدرس‌های من</span>
                        </Link>

                        <Link
                          href="/account/wishlist"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
                          <span>علاقه‌مندی‌ها</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100 dark:border-emerald-900/40">
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
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white hover:text-[#d0de41] rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                  aria-label="ورود به حساب"
                >
                  <User className="w-4 h-4 text-[#d0de41]" />
                  <span>ورود / حساب</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Smart Search Spotlight Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialQuery={searchQuery}
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

      {/* Meta/Apple-style Floating Bottom Navigation Tab Bar (Mobile only) */}
      <BottomNav onOpenSearch={() => setIsSearchOpen(true)} />
    </>
  );
}
