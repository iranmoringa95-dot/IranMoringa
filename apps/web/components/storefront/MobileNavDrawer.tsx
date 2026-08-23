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
  ShieldCheck,
  Globe,
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
    <div className="fixed inset-0 z-50 lg:hidden dir-rtl" role="dialog" aria-modal="true" aria-label="منوی سایت">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-[#072714] text-slate-900 dark:text-slate-100 shadow-2xl p-5 flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200 border-l border-[#e5e8de] dark:border-[#14552f] overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#14552f] pb-3">
            <div onClick={onClose}>
              <BrandLogo
                variant="horizontal"
                theme="light"
                size="sm"
                showSubtext={true}
                subtextLang="fa"
                href="/"
              />
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account Card (if logged in) or Login Card */}
          {isLoggedIn ? (
            <div className="bg-[#f2f9f4] dark:bg-[#0a331b] text-slate-900 dark:text-white p-4 rounded-2xl border border-[#c3e5cd] dark:border-[#14552f] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#176b39] text-white flex items-center justify-center text-xs font-black">
                    {userName ? userName.slice(0, 1) : 'اح'}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#17251c] dark:text-white">{userName}</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">{userPhone}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-[#fff8f1] dark:bg-[#7a3013]/40 text-[#f47a24] text-[10px] font-black rounded-md border border-[#feeddc] dark:border-[#943813]/60">
                  عضو رسمی
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#c3e5cd]/60 dark:border-[#14552f] text-xs font-bold">
                <Link
                  href="/account"
                  onClick={onClose}
                  className="min-h-[40px] flex items-center justify-center rounded-xl bg-white dark:bg-stone-900 text-[#176b39] dark:text-[#97d2a7] border border-stone-200 dark:border-stone-800"
                >
                  پیشخوان
                </Link>
                <Link
                  href="/account/orders"
                  onClick={onClose}
                  className="min-h-[40px] flex items-center justify-center rounded-xl bg-white dark:bg-stone-900 text-[#176b39] dark:text-[#97d2a7] border border-stone-200 dark:border-stone-800"
                >
                  سفارش‌ها
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="w-full min-h-[48px] flex items-center justify-between px-4 py-3 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl text-xs font-bold transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>ورود به حساب یا ثبت‌نام</span>
              </div>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}

          {/* Search Trigger inside Mobile Drawer */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800/80 hover:bg-[#f2f9f4] dark:hover:bg-[#0d3d21] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold transition-all text-right"
            >
              <Search className="w-4 h-4 text-[#176b39] dark:text-[#2ea355] shrink-0" />
              <span>جستجو در مقالات و محصولات...</span>
            </button>
          )}

          {/* Navigation Links (min 44px touch target) */}
          <nav className="flex flex-col gap-1 font-medium text-xs text-slate-800 dark:text-slate-200">
            <Link
              href="/"
              onClick={onClose}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#f2f9f4] dark:hover:bg-stone-800/60 hover:text-[#176b39] transition-colors font-bold"
            >
              <Home className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
              <span>صفحه اصلی</span>
            </Link>

            <Link
              href="/shop"
              onClick={onClose}
              className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#f2f9f4] dark:hover:bg-stone-800/60 hover:text-[#176b39] transition-colors font-bold"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                <span>محصولات سوپرفود</span>
              </div>
              <span className="bg-[#fff8f1] dark:bg-[#7a3013]/40 text-[#f47a24] text-[10px] px-2 py-0.5 rounded-md font-black border border-[#feeddc] dark:border-[#943813]/60">
                فروشگاه
              </span>
            </Link>

            <Link
              href="/articles"
              onClick={onClose}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#f2f9f4] dark:hover:bg-stone-800/60 hover:text-[#176b39] transition-colors font-bold"
            >
              <BookOpen className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
              <span>دانشنامه و مقالات علمی</span>
            </Link>

            <Link
              href="/#why-moringa"
              onClick={onClose}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#f2f9f4] dark:hover:bg-stone-800/60 hover:text-[#176b39] transition-colors font-bold"
            >
              <Sparkles className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
              <span>چرا مورینگا؟ (ارزش‌های تغذیه‌ای)</span>
            </Link>

            <Link
              href="/tracking"
              onClick={onClose}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#f2f9f4] dark:hover:bg-stone-800/60 hover:text-[#176b39] transition-colors font-bold"
            >
              <PhoneCall className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
              <span>رهگیری سفارشات پستی</span>
            </Link>

            {isLoggedIn && (
              <>
                <Link
                  href="/account/addresses"
                  onClick={onClose}
                  className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#f2f9f4] dark:hover:bg-stone-800/60 hover:text-[#176b39] transition-colors font-bold"
                >
                  <MapPin className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                  <span>آدرس‌های من</span>
                </Link>

                <Link
                  href="/account/wishlist"
                  onClick={onClose}
                  className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#f2f9f4] dark:hover:bg-stone-800/60 hover:text-[#176b39] transition-colors font-bold"
                >
                  <Heart className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
                  <span>علاقه‌مندی‌ها</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="space-y-3.5 pt-4 border-t border-stone-100 dark:border-[#14552f]">
          {/* Theme Selector */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">حالت نمایش:</span>
            <ThemeToggle variant="segmented" />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Globe className="w-3.5 h-3.5" />
              <span>زبان: فارسی (FA)</span>
            </span>
            <span className="text-[11px] font-mono">Iran Moringa v1.0</span>
          </div>

          {isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب کاربری</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileNavDrawer;

