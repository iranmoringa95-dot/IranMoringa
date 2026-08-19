'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Truck,
  Heart,
  ChevronLeft,
} from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { ALL_MORINGA_PRODUCTS } from '@/lib/products-data';

export interface MoringaPackage {
  id: string;
  stepNumber: number;
  name: string;
  badge: string;
  duration: string;
  weight: string;
  servings: string;
  targetGoal: string;
  priceToman: number;
  originalPriceToman?: number;
  discountPercent?: number;
  freeShipping: boolean;
  color: string;
  features: string[];
  productSlug: string;
}

export function InteractivePackageSlider() {
  const [activeStep, setActiveStep] = useState<number>(2); // Default to Step 3 (index 2 - Most Popular)
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  const packages: MoringaPackage[] = [
    {
      id: 'pkg-1',
      stepNumber: 1,
      name: 'بسته شروع و آشنایی',
      badge: 'آزمایشی و تست',
      duration: '۳۰ روز',
      weight: '۱۰۰ گرم',
      servings: '۳۰ وعده',
      targetGoal: 'افزایش انرژی اولیه و پاک‌سازی بدن',
      priceToman: 245000,
      freeShipping: false,
      color: '#10b981',
      features: ['۱۰۰٪ پودر خالص برگ اولیفرا', 'مناسب تست طعم و حساسیت', 'تأمین انرژی پایدار روزانه'],
      productSlug: 'moringa-leaf-powder-100g',
    },
    {
      id: 'pkg-2',
      stepNumber: 2,
      name: 'بسته روتین سلامت فردی',
      badge: 'پرفروش فردی',
      duration: '۷۵ روز',
      weight: '۲۵۰ گرم',
      servings: '۷۵ وعده',
      targetGoal: 'کنترل قند، شادابی و تقویت ایمنی',
      priceToman: 540000,
      originalPriceToman: 600000,
      discountPercent: 10,
      freeShipping: true,
      color: '#059669',
      features: ['۲۵۰ گرم پودر خالص دست‌چین', 'ارسال رایگان پست پیشتاز', 'تنظیم متابولیسم و خواب راحت'],
      productSlug: 'moringa-leaf-powder-250g',
    },
    {
      id: 'pkg-3',
      stepNumber: 3,
      name: 'پکیج طلایی خانواده و جوانسازی',
      badge: 'محبوب‌ترین انتخاب ⭐️',
      duration: '۱۲۰ روز',
      weight: '۵۰۰ گرم + روغن اکسیر',
      servings: '۱۵۰ وعده',
      targetGoal: 'کلاژن‌سازی، سلامت مفاصل و کبد',
      priceToman: 975000,
      originalPriceToman: 1150000,
      discountPercent: 15,
      freeShipping: true,
      color: '#026251',
      features: ['۵۰۰ گرم پودر خالص + روغن اکسیر ۳۰ml', 'ارسال رایگان + ضمانت کیفیت', 'کلاژن‌سازی پوست و تقویت مفاصل'],
      productSlug: 'moringa-family-powder-500g',
    },
    {
      id: 'pkg-4',
      stepNumber: 4,
      name: 'پکیج ورزشکاران و لاغری پرو',
      badge: 'ویژه ورزش و چربی‌سوزی',
      duration: '۱۸۰ روز',
      weight: '۱ کیلوگرم + دمنوش',
      servings: '۳۰۰ وعده',
      targetGoal: 'عضله‌سازی BCAA و چربی‌سوزی',
      priceToman: 1750000,
      originalPriceToman: 2180000,
      discountPercent: 20,
      freeShipping: true,
      color: '#f97316',
      features: ['۱۰۰۰ گرم پودر میکرونیزه + دمنوش پیرامیدی', 'حاوی تمام ۱۸ آمینواسید ضروری', 'ارسال فوری و رایگان هوایی'],
      productSlug: 'moringa-athlete-pro-1kg',
    },
    {
      id: 'pkg-5',
      stepNumber: 5,
      name: 'بسته جامع سالانه VIP',
      badge: 'بیشترین تخفیف اقتصادی',
      duration: '۳۶۵ روز',
      weight: '۲ کیلوگرم + ۲ روغن + عسل',
      servings: '۶۰۰ وعده',
      targetGoal: 'سلامت پایدار و پیشگیری جامع',
      priceToman: 3200000,
      originalPriceToman: 4260000,
      discountPercent: 25,
      freeShipping: true,
      color: '#ea580c',
      features: ['۲۰۰۰ گرم پودر + ۲ روغن بن + عسل کوهی', 'مشاوره اختصاصی رایگان تغذیه', 'حداکثر صرفه‌جویی مالی در سال'],
      productSlug: 'moringa-vip-annual-pack',
    },
  ];

  const currentPkg = packages[activeStep];

  const handleAddToCart = () => {
    // Find matching product or create cart item
    const matched = ALL_MORINGA_PRODUCTS.find((p) => p.slug === currentPkg.productSlug) || ALL_MORINGA_PRODUCTS[0];
    addToCart(matched, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-[#06120e] dark:via-[#081a15] dark:to-[#06120e] relative overflow-hidden transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-[#d0de41] text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#d0de41]" />
            <span>انتخاب‌گر هوشمند و دوره‌ای سوپرفود</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            بسته سلامت متناسب با <span className="bg-gradient-to-r from-[#026251] via-[#22c55e] to-[#d0de41] bg-clip-text text-transparent">نیاز و بودجه خود</span> را انتخاب کنید
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            با حرکت دادن اسلایدر، مشخصات، دوره مصرف و تخفیف ویژه هر بسته را به صورت زنده مقایسه نمایید.
          </p>
        </div>

        {/* ── 1. Interactive Step Slider Bar ── */}
        <div className="space-y-4 pt-4">
          {/* Step Labels on Top */}
          <div className="grid grid-cols-5 text-center">
            {packages.map((pkg, idx) => {
              const isSelected = activeStep === idx;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'text-[#026251] dark:text-[#d0de41] font-black scale-105'
                      : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
                  }`}
                >
                  <span className="block text-[11px] sm:text-xs">بسته {pkg.stepNumber}</span>
                  {isSelected && (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Continuous Range Bar with draggable handle */}
          <div className="relative flex items-center px-4 sm:px-6">
            {/* Background Track */}
            <div className="w-full h-3 sm:h-3.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-600 to-blue-700 dark:from-emerald-600 dark:via-teal-700 dark:to-blue-800 p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-[#22c55e] transition-all duration-300"
                style={{ width: `${(activeStep / (packages.length - 1)) * 100}%` }}
              />
            </div>

            {/* Step Tick Circles on the track */}
            <div className="absolute inset-x-4 sm:inset-x-6 flex justify-between pointer-events-none">
              {packages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    idx <= activeStep
                      ? 'bg-white border-emerald-600 scale-110 shadow-xs'
                      : 'bg-stone-300 border-white opacity-80'
                  }`}
                />
              ))}
            </div>

            {/* Large Interactive Handle Thumb */}
            <input
              type="range"
              min="0"
              max={packages.length - 1}
              step="1"
              value={activeStep}
              onChange={(e) => setActiveStep(parseInt(e.target.value))}
              aria-label="انتخاب بسته مورینگا"
              className="absolute inset-x-2 w-[calc(100%-1rem)] opacity-0 h-8 cursor-pointer z-20"
            />
          </div>
        </div>

        {/* ── 2. Dynamic Spec Card (Matching SevenHost Architecture) ── */}
        <div className="relative pt-3">
          {/* Active Arrow Pointer */}
          <div
            className="absolute -top-1 w-6 h-6 bg-white dark:bg-[#08201a] border-t border-r border-stone-200 dark:border-emerald-900/60 rotate-45 z-10 transition-all duration-300 hidden sm:block shadow-xs"
            style={{
              left: `${(activeStep / (packages.length - 1)) * 80 + 10}%`,
              transform: 'translateX(-50%) rotate(45deg)',
            }}
          />

          <div className="bg-white dark:bg-[#08201a] rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xl p-6 sm:p-8 space-y-6 transition-all duration-300 relative z-0">
            {/* Top Bar inside Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-emerald-900/30 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#d0de41] flex items-center justify-center font-black text-sm">
                  {currentPkg.stepNumber}
                </span>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    {currentPkg.name}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-[#d0de41] font-bold">
                    هدف: {currentPkg.targetGoal}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-black border border-orange-200 dark:border-orange-900">
                  {currentPkg.badge}
                </span>
                {currentPkg.freeShipping && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    ارسال رایگان
                  </span>
                )}
              </div>
            </div>

            {/* Main Specs Grid (4 Columns) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-2 text-center">
              {/* Spec 1: Weight */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#061410] border border-stone-100 dark:border-emerald-900/30 space-y-1">
                <span className="text-xl sm:text-2xl font-black text-[#026251] dark:text-[#d0de41] block">
                  {currentPkg.weight}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold block">
                  وزن خالص محصول
                </span>
              </div>

              {/* Spec 2: Duration */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#061410] border border-stone-100 dark:border-emerald-900/30 space-y-1">
                <span className="text-xl sm:text-2xl font-black text-[#026251] dark:text-[#d0de41] block">
                  {currentPkg.duration}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold block">
                  دوره مصرف استاندارد
                </span>
              </div>

              {/* Spec 3: Servings */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#061410] border border-stone-100 dark:border-emerald-900/30 space-y-1">
                <span className="text-xl sm:text-2xl font-black text-[#026251] dark:text-[#d0de41] block">
                  {currentPkg.servings}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold block">
                  تعداد وعده مصرفی
                </span>
              </div>

              {/* Spec 4: Purity */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#061410] border border-stone-100 dark:border-emerald-900/30 space-y-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                  ۱۰۰٪ خالص
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold block">
                  بدون افزودنی و شکر
                </span>
              </div>
            </div>

            {/* Features Bullet List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {currentPkg.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#d0de41] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Bottom Price & Add to Cart Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-stone-100 dark:border-emerald-900/30">
              {/* Pricing Box */}
              <div className="space-y-1 text-center sm:text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 dark:text-stone-400">قیمت نهایی بسته:</span>
                  {currentPkg.originalPriceToman && (
                    <span className="text-xs text-stone-400 line-through">
                      {currentPkg.originalPriceToman.toLocaleString('fa-IR')} تومان
                    </span>
                  )}
                  {currentPkg.discountPercent && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-black">
                      {currentPkg.discountPercent}٪ تخفیف
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
                  <span className="text-2xl sm:text-3xl font-black text-[#026251] dark:text-[#d0de41]">
                    {currentPkg.priceToman.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-stone-300 font-bold">تومان</span>
                </div>
              </div>

              {/* Order / Add to Cart CTA */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 sm:flex-initial px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ${
                    addedAnimation
                      ? 'bg-emerald-600 text-white scale-105'
                      : 'bg-[#22c55e] hover:bg-[#16a34a] text-white hover:scale-[1.02]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{addedAnimation ? 'به سبد خرید افزوده شد! ✓' : `سفارش آنلاین بسته ${currentPkg.stepNumber}`}</span>
                </button>

                <Link
                  href="/cart"
                  className="px-5 py-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs transition-all shrink-0"
                >
                  مشاهده سبد
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Technical & Quality Guarantees Bar (Like SevenHost Features) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-center">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#08201a] border border-stone-200 dark:border-emerald-900/40 space-y-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">تضمین اصالت و تازگی</h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">خشک‌شده در سایه با حداکثر حفظ کلروفیل و ویتامین‌ها</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#08201a] border border-stone-200 dark:border-emerald-900/40 space-y-1">
            <Truck className="w-5 h-5 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">ارسال سریع پست پیشتاز</h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">تحویل ۲ تا ۳ روزه در سراسر کشور با بسته‌بندی نفوذناپذیر</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#08201a] border border-stone-200 dark:border-emerald-900/40 space-y-1">
            <Zap className="w-5 h-5 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">پشتیبانی و مشاوره مصرف</h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">پاسخگویی به سوالات مصرف و تداخلات دارویی</p>
          </div>
        </div>
      </div>
    </section>
  );
}
