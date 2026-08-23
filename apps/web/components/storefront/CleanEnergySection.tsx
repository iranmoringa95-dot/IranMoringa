'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Coffee,
  CheckCircle2,
  ArrowLeft,
  Flame,
  Leaf,
} from 'lucide-react';
import { MoringaAnimatedLeaf } from '@/components/brand/BrandLogo';

export function CleanEnergySection() {
  const points = [
    {
      icon: '🥄',
      title: 'فقط یک قاشق چای‌خوری!',
      desc: 'نشاط پایدار و انرژی سلولی را در تمام طول روز بدون افت ناگهانی افزایش می‌دهد.',
      badge: 'جذب سریع',
      gradient: 'from-amber-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
    },
    {
      icon: '🥬',
      title: 'پروتئین، آهن، فیبر و کلسیم بیشتر از کلم',
      desc: 'حاوی ۲ برابر کلسیم و ۴ برابر فیبر نسبت به کلم‌پیچ و اسفناج جهت تغذیه کامل بافت‌ها.',
      badge: 'تغذیه کامل',
      gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    },
    {
      icon: '🌿',
      title: 'بسیار قوی‌تر و مؤثرتر از زردچوبه',
      desc: 'قدرت آنتی‌اکسیدانی (ORAC) بی‌نظیر جهت سرکوب التهاب‌های مزمن و محافظت از DNA.',
      badge: 'ضد التهاب',
      gradient: 'from-lime-500/20 to-green-500/20 text-green-600 dark:text-[#d0de41] border-green-200 dark:border-green-900/50',
    },
    {
      icon: '🍵',
      title: 'طعم شبیه چای ماچا، اما کاملاً بدون کافئین',
      desc: 'مناسب افراد حساس به قهوه و شب‌کاران؛ بدون ایجاد تپش قلب، اضطراب یا وابستگی.',
      badge: '۱۰۰٪ بدون کافئین',
      gradient: 'from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-300 border-teal-200 dark:border-teal-900/50',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-[#f8faf9] via-white to-[#f0f7f3] dark:from-[#061410] dark:via-[#071d17] dark:to-[#04100c] relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#22c55e]/10 dark:bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#f97316]/10 dark:bg-[#f97316]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* ── Left Column: Editorial & Advantage Highlights ── */}
          <div className="lg:col-span-6 space-y-6 text-right">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-700 dark:text-orange-300 text-xs font-black">
              <Zap className="w-3.5 h-3.5 text-[#f97316]" />
              <span>انرژی خالص و طبیعی از دل طبیعت</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-snug sm:leading-normal tracking-tight">
              انرژی پاک <span className="bg-gradient-to-r from-[#f97316] to-[#ff9800] bg-clip-text text-transparent">بدون کافئین</span>، تغذیه کامل بدون افت انرژی
            </h2>

            {/* Core Narrative Paragraph (from moringa-iran.ir) */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              مورینگا به راحتی کلم بی‌نظیر را از نظر خواص تغذیه‌ای پشت سر می‌گذارد و دیگر رقیب سرسخت خود، زردچوبه را در خواص ضد التهابی و آنتی‌اکسیدانی قوی با قدرت شکست می‌دهد.
              این محافظ طبیعی را به وعده غذایی یا اسموتی خود اضافه کنید تا این راهکار سریع و بدون کافئین، انرژی پایدار و تمامی ریزمغذی‌های مورد نیاز بدنتان را در طول روز تأمین کند.
            </p>

            {/* 4 Advantage Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {points.map((pt, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl bg-white dark:bg-[#08201a] border transition-all duration-200 hover:shadow-md group ${pt.gradient}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{pt.icon}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                      {pt.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1 leading-snug">
                    {pt.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {pt.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="px-7 py-3.5 bg-gradient-to-r from-[#026251] to-[#01473b] hover:from-[#024a3d] hover:to-[#01382e] text-[#d0de41] rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <span>خرید پودر خالص مورینگا</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <Link
                href="/articles"
                className="px-5 py-3.5 bg-white dark:bg-[#09221c] hover:bg-slate-50 dark:hover:bg-[#0c2b23] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs sm:text-sm font-bold transition-all"
              >
                دانشنامه و مقالات علمی ←
              </Link>
            </div>
          </div>

          {/* ── Right Column: High-End Botanical Visual Card ── */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-900/10 via-white dark:via-[#08201a] to-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xl overflow-hidden">
              {/* Decorative Top Accent Leaf */}
              <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/40 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#026251] text-[#d0de41] flex items-center justify-center font-black text-lg shadow-sm">
                    🌿
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">پودر برگ خالص مورینگا اولیفرا</h3>
                    <p className="text-[11px] text-emerald-700 dark:text-[#d0de41] font-bold">Moringa Oleifera Superfood Powder</p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-[#22c55e]/15 text-[#16a34a] dark:text-[#4ade80] rounded-full text-xs font-black">
                  ۱۰۰٪ ارگانیک
                </span>
              </div>

              {/* Central Infographic Botanical Presentation */}
              <div className="relative py-4 flex flex-col items-center justify-center text-center space-y-4">
                {/* Visual Leaf & Superfood Powder Centerpiece */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#22c55e]/20 via-[#d0de41]/20 to-transparent animate-pulse" />
                  
                  {/* Glowing Inner Ring */}
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-emerald-950/80 dark:bg-emerald-900/50 border-2 border-[#d0de41] flex flex-col items-center justify-center p-4 text-center shadow-lg relative z-10">
                    <span className="text-3xl sm:text-4xl mb-1">🍃</span>
                    <span className="text-xs font-black text-[#d0de41]">سوپرفود مورینگا</span>
                    <span className="text-[10px] text-emerald-200 mt-0.5">اکسیر سبز سلامت</span>
                  </div>

                  {/* Floating Micro Highlights */}
                  <div className="absolute -top-2 right-2 px-3 py-1 rounded-xl bg-white dark:bg-[#071d17] border border-emerald-200 dark:border-emerald-800 shadow-md text-[10px] font-bold text-slate-800 dark:text-emerald-200 animate-bounce">
                    ⚡ انرژی پایدار سلولی
                  </div>
                  <div className="absolute -bottom-2 left-2 px-3 py-1 rounded-xl bg-white dark:bg-[#071d17] border border-orange-200 dark:border-orange-900 shadow-md text-[10px] font-bold text-orange-600 dark:text-orange-300">
                    🚫 بدون کافئین
                  </div>
                </div>

                {/* Quick Nutritional Punchlines */}
                <div className="grid grid-cols-3 gap-2 w-full pt-4 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/40 border border-slate-100 dark:border-emerald-900/30">
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">آنتی‌اکسیدان</span>
                    <span className="font-black text-sm text-[#026251] dark:text-[#d0de41]">۴۶ نوع</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/40 border border-slate-100 dark:border-emerald-900/30">
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">اسید آمینه</span>
                    <span className="font-black text-sm text-[#026251] dark:text-[#d0de41]">۱۸ اسید</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/40 border border-slate-100 dark:border-emerald-900/30">
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">ریزمغذی</span>
                    <span className="font-black text-sm text-[#026251] dark:text-[#d0de41]">۹۲ ماده</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
