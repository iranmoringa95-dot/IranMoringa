'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Activity,
  HeartPulse,
} from 'lucide-react';

export function NutrientWheelSection() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const nutrients = [
    {
      id: 'calcium',
      multiplier: '۱۷ برابر',
      multiplierEn: '17x',
      nutrient: 'کلسیم',
      foodSource: 'بیشتر از شیر گاو',
      foodSourceEn: '17x Calcium of Milk',
      emoji: '🥛',
      color: '#f97316',
      benefits: 'تراکم و استحکام استخوان‌ها، جلوگیری از پوکی استخوان، سلامت مینای دندان',
    },
    {
      id: 'potassium',
      multiplier: '۱۵ برابر',
      multiplierEn: '15x',
      nutrient: 'پتاسیم',
      foodSource: 'بیشتر از موز تازه',
      foodSourceEn: '15x Potassium of Banana',
      emoji: '🍌',
      color: '#ff9800',
      benefits: 'تنظیم طبیعی فشار خون، رفع گرفتگی عضلات، تعادل الکترولیت‌های قلب',
    },
    {
      id: 'magnesium',
      multiplier: '۳۶ برابر',
      multiplierEn: '36x',
      nutrient: 'منیزیم',
      foodSource: 'بیشتر از تخم‌مرغ',
      foodSourceEn: '36x Magnesium of Egg',
      emoji: '🥚',
      color: '#22c55e',
      benefits: 'کاهش استرس و تنش عصبی، بهبود عمیق کیفیت خواب، آرام‌بخشی عضلانی',
    },
    {
      id: 'protein',
      multiplier: '۹ برابر',
      multiplierEn: '9x',
      nutrient: 'پروتئین گیاهی کامل',
      foodSource: 'بیشتر از ماست غلیظ',
      foodSourceEn: '9x Protein of Yogurt',
      emoji: '🥣',
      color: '#16a34a',
      benefits: 'حاوی تمام ۹ اسید آمینه ضروری برای عضله‌سازی و ترمیم بافت‌های بدن',
    },
    {
      id: 'iron',
      multiplier: '۲۵ برابر',
      multiplierEn: '25x',
      nutrient: 'آهن آلی زودجذب',
      foodSource: 'بیشتر از اسفناج تازه',
      foodSourceEn: '25x Iron of Spinach',
      emoji: '🥬',
      color: '#ea580c',
      benefits: 'افزایش تولید هموگلوبین خون، درمان کم‌خونی، رفع خستگی و کسالت مفرط',
    },
    {
      id: 'vitamin_a',
      multiplier: '۱۰ برابر',
      multiplierEn: '10x',
      nutrient: 'ویتامین A (بتاکاروتن)',
      foodSource: 'بیشتر از هویج',
      foodSourceEn: '10x Vitamin A of Carrots',
      emoji: '🥕',
      color: '#f97316',
      benefits: 'تقویت چشمگیر بینایی و دید در شب، محافظت از قرنیه و درخشش پوست',
    },
    {
      id: 'vitamin_e',
      multiplier: '۱۲ برابر',
      multiplierEn: '12x',
      nutrient: 'ویتامین E (توکوفرول)',
      foodSource: 'بیشتر از بادام درختی',
      foodSourceEn: '12x Vitamin E of Almonds',
      emoji: '🥜',
      color: '#22c55e',
      benefits: 'اکسیر جوان‌سازی سلولی، مبارزه با رادیکال‌های آزاد، کلاژن‌سازی پوست',
    },
    {
      id: 'vitamin_c',
      multiplier: '۷ برابر',
      multiplierEn: '7x',
      nutrient: 'ویتامین C خالص',
      foodSource: 'بیشتر از پرتقال تامسون',
      foodSourceEn: '7x Vitamin C of Orange',
      emoji: '🍊',
      color: '#ff9800',
      benefits: 'تقویت فوق‌العاده سیستم ایمنی، تسریع ترمیم زخم‌ها، جذب بهتر آهن',
    },
    {
      id: 'chlorophyll',
      multiplier: '۴ برابر',
      multiplierEn: '4x',
      nutrient: 'کلروفیل خالص',
      foodSource: 'بیشتر از جوانه گندم',
      foodSourceEn: '4x Chlorophyll of Wheatgrass',
      emoji: '🌾',
      color: '#15803d',
      benefits: 'سم‌زدایی قدرتمند کبد، پاک‌سازی خون و سیستم لنفاوی، شادابی عمومی',
    },
  ];

  const current = nutrients[selectedIdx];

  return (
    <section id="why-moringa" className="py-16 sm:py-24 bg-white dark:bg-[#061410] border-y border-slate-200/80 dark:border-emerald-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-[#d0de41] text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>چرا مورینگا معجزه طبیعت نامیده می‌شود؟</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-snug sm:leading-normal">
            چرخ مقایسه ارزش غذایی <span className="bg-gradient-to-r from-[#22c55e] to-[#15803d] bg-clip-text text-transparent">مورینگا اولیفرا</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            تنها ۱۰۰ گرم پودر خالص برگ مورینگا چندین برابر منابع غذایی مشهور، ویتامین و مواد معدنی ضروری بدن را تأمین می‌کند.
          </p>
        </div>

        {/* ── Visual Comparison Wheel & Interactive Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ── Interactive 9-Nutrient Cards Grid (Left 7 Cols) ── */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {nutrients.map((item, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`p-3.5 rounded-2xl border text-right transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#026251] to-[#01382e] text-white border-transparent shadow-lg scale-102 ring-2 ring-[#d0de41]'
                      : 'bg-slate-50 dark:bg-[#08201a] border-slate-200 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-[#d0de41] text-[#026251]'
                          : 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                      }`}
                    >
                      {item.multiplier}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs sm:text-sm line-clamp-1 mb-0.5">
                      {item.nutrient}
                    </h4>
                    <p
                      className={`text-[11px] ${
                        isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.foodSource}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Right Column: Selected Nutrient Focus Showcase ── */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#024a3d] via-[#026251] to-[#01382e] text-white shadow-xl border border-emerald-700/60 relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-3xl shadow-sm">
                    {current.emoji}
                  </div>
                  <div>
                    <span className="text-[10px] text-[#d0de41] font-mono tracking-wider font-black uppercase">
                      {current.foodSourceEn}
                    </span>
                    <h3 className="text-xl font-black text-white">{current.nutrient}</h3>
                  </div>
                </div>

                <div className="text-center bg-[#d0de41] text-[#026251] px-4 py-2 rounded-2xl shadow-md">
                  <span className="text-xl font-black block leading-none">{current.multiplier}</span>
                  <span className="text-[9px] font-bold mt-0.5 block">قدرت جذب</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[#d0de41] text-xs font-black">
                  <HeartPulse className="w-4 h-4" />
                  <span>تأثیر و فواید زیستی در بدن:</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/95 leading-relaxed">
                  {current.benefits}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="text-emerald-200 text-[11px]">
                  برگ‌های دست‌چین و ارگانیک ایران مورینگا
                </span>
                <Link
                  href="/shop"
                  className="px-4 py-2 bg-[#d0de41] hover:bg-[#b8c634] text-[#026251] rounded-xl font-black text-xs transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>سفارش محصول</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
