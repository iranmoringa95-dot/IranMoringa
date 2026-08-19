'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  ShoppingBag,
  User,
  BookOpen,
  Home,
  PhoneCall,
  Search,
  Sparkles,
  Package,
  MapPin,
  Heart,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { isCustomerLoggedIn, customerLogout, getCustomerProfile } from '@/lib/customer-store';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
}

export function MobileNavDrawer({ isOpen, onClose, onOpenSearch }: MobileNavDrawerProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('احسان پویا');
  const [userPhone, setUserPhone] = useState('09132391843');

  useEffect(() => {
    if (isOpen) {
      const logged = isCustomerLoggedIn();
      setIsLoggedIn(logged);
      if (logged) {
        const profile = getCustomerProfile();
        setUserName(profile.fullName || 'احسان پویا');
        setUserPhone(profile.phone || '09132391843');
      }
    }
  }, [isOpen]);

  const handleLogout = () => {
    customerLogout();
    setIsLoggedIn(false);
    onClose();
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden dir-rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-[#081b16] text-slate-900 dark:text-slate-100 shadow-2xl p-5 flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200 border-l border-stone-200 dark:border-emerald-950 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-emerald-950/80 pb-3">
            <div onClick={onClose}>
              <BrandLogo
                variant="horizontal"
                theme="colored"
                size="sm"
                showSubtext={true}
                subtextLang="fa"
                href="/"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
              aria-label="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account Card (if logged in) or Login Card */}
          {isLoggedIn ? (
            <div className="bg-gradient-to-br from-[#024a3d] to-[#01382e] text-white p-4 rounded-2xl shadow-xs space-y-2 border border-emerald-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#d0de41] text-[#026251] flex items-center justify-center text-xs font-black">
                    {userName ? userName.slice(0, 1) : 'اح'}
                  </div>
                  <div>
                    <p className="font-black text-xs text-white">{userName}</p>
                    <p className="text-[10px] text-emerald-200/80 font-mono">{userPhone}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-[#d0de41] text-[#026251] text-[9px] font-black rounded-full">
                  طلایی
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[11px] font-bold">
                <Link
                  href="/account"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-center text-emerald-100"
                >
                  پیشخوان
                </Link>
                <Link
                  href="/account/orders"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-center text-emerald-100"
                >
                  سفارش‌ها
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="w-full flex items-center justify-between p-3 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl text-xs font-bold transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#d0de41]" />
                <span>ورود به حساب یا ثبت‌نام</span>
              </div>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}

          {/* Search Trigger inside Mobile Drawer */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-stone-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold transition-all text-right shadow-xs"
            >
              <Search className="w-4 h-4 text-[#026251] dark:text-[#d0de41] shrink-0" />
              <span>جستجو در مقالات و سوپرفودها...</span>
            </button>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 font-medium text-xs text-slate-800 dark:text-slate-200">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-bold"
            >
              <Home className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
              <span>صفحه اصلی</span>
            </Link>

            <Link
              href="/shop"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-bold"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
                <span>محصولات سوپرفود</span>
              </div>
              <span className="bg-[#d0de41] text-[#026251] text-[9px] px-1.5 py-0.2 rounded-full font-black">
                ویژه
              </span>
            </Link>

            <Link
              href="/articles"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-bold"
            >
              <BookOpen className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
              <span>دانشنامه و مقالات علمی</span>
            </Link>

            <Link
              href="/#why-moringa"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-bold"
            >
              <Sparkles className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
              <span>چرا مورینگا؟ (خواص معجزه‌آسا)</span>
            </Link>

            <Link
              href="/tracking"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-bold"
            >
              <PhoneCall className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
              <span>پیگیری سریع سفارشات پستی</span>
            </Link>

            {isLoggedIn && (
              <>
                <Link
                  href="/account/addresses"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-bold"
                >
                  <MapPin className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
                  <span>آدرس‌های من</span>
                </Link>

                <Link
                  href="/account/wishlist"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-bold"
                >
                  <Heart className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
                  <span>علاقه‌مندی‌ها</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Drawer Footer with Theme Toggle & Logout */}
        <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-emerald-950">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">حالت نمایش:</span>
            <ThemeToggle variant="pill" />
          </div>

          {isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از حساب کاربری</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
