'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Smartphone,
  CheckCircle,
  Wifi,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Share2,
  Package,
  Layers,
  Users,
  ShoppingBag,
} from 'lucide-react';

export default function DownloadAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      alert('برای نصب روی گوشی، در منوی مرورگر کروم گزینه «افزودن به صفحه اصلی» (Add to Home screen) یا «نصب برنامه» (Install app) را انتخاب نمایید.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16" dir="rtl">
      {/* Top Header */}
      <header className="bg-emerald-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-emerald-200 hover:text-white bg-emerald-800/60 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowRight size={16} />
            <span>بازگشت به پنل مدیریت</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">اپلیکیشن مدیریت سفارشات سبزینه</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center">
              <Smartphone size={18} className="text-emerald-300" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-600/50 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-3">
              <Sparkles size={14} className="text-amber-400" />
              <span>نسخه اختصاصی اندروید ۱.۰.۰</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
              مدیریت فروشگاه و سفارشات سبزینه همیشه در جیب شما
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed mb-6">
              ثبت سریع سفارش‌های تلفنی و حضوری، پیگیری وضعیت ارسال، تعریف کالا و مشخصات فنی، و دسترسی به اطلاعات مشتریان با پشتیبانی کامل از کارکرد آفلاین.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/downloads/moringalab-store-manager.apk"
                download="moringalab-store-manager.apk"
                className="inline-flex items-center gap-2 bg-white text-emerald-900 font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-emerald-50 active:scale-95 transition text-sm"
              >
                <Download size={18} className="text-emerald-700" />
                <span>دانلود مستقیم فایل نصب APK</span>
              </a>

              <button
                onClick={handleInstallPWA}
                className="inline-flex items-center gap-2 bg-emerald-700/80 border border-emerald-500 text-white font-semibold px-4 py-3 rounded-xl hover:bg-emerald-600 active:scale-95 transition text-sm"
              >
                <Smartphone size={18} />
                <span>{installSuccess ? 'اپلیکیشن نصب شد ✓' : 'نصب نسخه وب پیشرو (PWA)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <ShoppingBag size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">ثبت و مدیریت سفارشات</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ثبت سفارش جدید با محاسبه تخفیف و شیوه ارسال، و ثبت کد رهگیری پستی
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Wifi size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">معماری آفلاین (Offline-First)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              مشاهده و جستجوی کلیه سفارشات و مشتریان حتی بدون دسترسی به اینترنت
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">بانک مشتریان و تماس مستقیم</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              مشاهده سوابق خرید و امکان تماس تلفنی یا ارسال پیامک با یک لمس
            </p>
          </div>
        </div>

        {/* Installation Methods */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <HelpCircle size={20} className="text-emerald-700" />
            <span>روش‌های نصب و راه‌اندازی روی گوشی اندروید</span>
          </h2>

          <div className="space-y-6">
            {/* Option A */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm">
                ۱
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1">
                  روش اول: دانلود و نصب مستقیم فایل APK
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
                  روی دکمه «دانلود مستقیم فایل نصب APK» در بالای صفحه کلیک کنید. پس از دانلود، فایل را باز کرده و در صورت درخواست سیستم، اجازه نصب برنامه‌های ناشناس (Install Unknown Apps) را در تنظیمات گوشی تایید نمایید.
                </p>
                <a
                  href="/downloads/moringalab-store-manager.apk"
                  download="moringalab-store-manager.apk"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                >
                  <Download size={14} />
                  <span>دانلود فایل نصبی (حجم: ۵ مگابایت)</span>
                </a>
              </div>
            </div>

            {/* Option B */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm">
                ۲
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1">
                  روش دوم: نصب آسان با مرورگر کروم (PWA / WebAPK)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-2 leading-relaxed">
                  هنگامی که این صفحه را در مرورگر Google Chrome گوشی اندروید باز می‌کنید:
                </p>
                <ol className="text-xs sm:text-sm text-slate-600 list-decimal list-inside space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <li>روی منوی سه‌نقطه (⋮) در بالای سمت راست مرورگر کلیک کنید.</li>
                  <li>گزینه <strong>«نصب برنامه» (Install app)</strong> یا <strong>«افزودن به صفحه اصلی» (Add to Home screen)</strong> را انتخاب کنید.</li>
                  <li>آیکون برنامه در کنار سایر برنامه‌های گوشی شما اضافه شده و بدون نوار آدرس مرورگر اجرا می‌شود.</li>
                </ol>
              </div>
            </div>

            {/* Option C */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm">
                ۳
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1">
                  اتصال به سرور کلودفلر و همگام‌سازی اطلاعات
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  اپلیکیشن به صورت خودکار به سرور ابری کلودفلر متصل می‌گردد. در صورت نیاز به تغییر آدرس سرور، می‌توانید در صفحه «تنظیمات» اپلیکیشن، آدرس سرور را تنظیم یا دکمه سرور ابری کلودفلر را لمس کنید. تمام داده‌ها در حافظه گوشی ذخیره شده و بدون اینترنت نیز پایدار خواهند ماند.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400">
          سامانه یکپارچه فروشگاه سبزینه | طراحی اختصاصی مدیران فروشگاه
        </div>
      </main>
    </div>
  );
}
