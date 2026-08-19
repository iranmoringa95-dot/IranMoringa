'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Heart,
  Award,
  Zap,
  Leaf,
  ShieldCheck,
  Star,
  ShoppingBag,
  Clock,
  ChevronLeft,
  Users,
  Sun,
  Globe2,
  Search,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { CleanEnergySection } from '@/components/storefront/CleanEnergySection';
import { NutrientWheelSection } from '@/components/storefront/NutrientWheelSection';
import { InteractivePackageSlider } from '@/components/storefront/InteractivePackageSlider';
import { ALL_MORINGA_PRODUCTS } from '@/lib/products-data';
import { ALL_MORINGA_ARTICLES } from '@/lib/articles-data';

export default function HomePage() {
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [newsletterInput, setNewsletterInput] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);

  const featuredProducts = ALL_MORINGA_PRODUCTS.slice(0, 4);
  const featuredArticles = ALL_MORINGA_ARTICLES.slice(0, 3);

  const recipes = [
    {
      title: 'اسموتی بمب سبز صبحگاهی',
      badge: 'آماده‌سازی ۳ دقیقه‌ای',
      ingredients: ['۱ قاشق چای‌خوری پودر مورینگا', '۱ عدد موز یخ‌زده', '۱ لیوان شیر بادام یا جو دوسر', '۱ قاشق عسل طبیعی'],
      benefit: 'تامین انرژی مداوم، تقویت تمرکز و سیری تا ظهر',
      emoji: '🥑',
    },
    {
      title: 'لاته گرم سبز و دارچین',
      badge: 'آرام‌بخش عصرگاهی',
      ingredients: ['۱ قاشق چای‌خوری پودر برگ مورینگا', '۱ فنجان شیر گرم فوم‌گرفته', 'نصف قاشق چای‌خوری دارچین', 'کمی هل ساییده'],
      benefit: 'کاهش استرس روزانه، تقویت مفاصل و خواب راحت',
      emoji: '☕',
    },
    {
      title: 'ماسک شاداب‌کننده پوست مورینگا',
      badge: 'مراقبت طبیعی هفتگی',
      ingredients: ['۱ قاشق پودر مورینگا', '۳ قطره روغن خالص مورینگا', '۱ قاشق ماست پروبیوتیک', '۱ قاشق ژل آلوئه‌ورا'],
      benefit: 'روشن‌کننده فوری، درمان لک و کلاژن‌سازی پوست',
      emoji: '✨',
    },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterInput.trim()) {
      setNewsletterSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-800 dir-rtl font-sans selection:bg-[#d0de41] selection:text-[#026251] overflow-x-hidden w-full">
      <Header />

      <main className="flex-1">
        {/* ── 1. HERO SECTION (Kuli Kuli Style Vibrant Forest Green & Lime) ── */}
        <section className="bg-[#026251] text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background Decorative Rings */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#d0de41]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Right Column: Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 bg-[#d0de41] text-[#026251] px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-md">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>سوپرفود شماره یک جهان؛ غنی‌تر از کلم کِیل و ماچا</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.15] text-white tracking-tight">
                مورینگا؛ انرژی پاکِ گیاهی <br />
                <span className="text-[#d0de41]">بیشتر از اسفناج، مقوی‌تر از شیر!</span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-2xl font-medium">
                تغذیه‌بخش برای شما، حیات‌بخش برای زمین. پودر خالص، روغن پرس سرد و دمنوش‌های ارگانیک مورینگا اولیفرا برداشت‌شده از مزارع پایدار جنوب ایران برای نشاط و شادابی هر روز شما.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/shop"
                  className="px-8 py-4 bg-[#d0de41] hover:bg-[#b8c634] text-[#026251] text-base font-black rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>خرید آنلاین سوپرفودها</span>
                </Link>
                <Link
                  href="#why-moringa"
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white text-base font-bold rounded-full border border-white/25 transition-all"
                >
                  چرا مورینگا معجزه طبیعت است؟
                </Link>
              </div>

              {/* ── Quick Smart Search Trigger Bar in Hero ── */}
              <div className="pt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (heroSearchQuery.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(heroSearchQuery.trim())}`;
                    } else {
                      window.location.href = '/search';
                    }
                  }}
                  className="relative max-w-xl flex items-center"
                >
                  <Search className="w-5 h-5 text-emerald-800 absolute right-4 pointer-events-none" />
                  <input
                    type="text"
                    value={heroSearchQuery}
                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                    placeholder="جستجوی سریع میان محصولات، پودر، روغن، خواص دیابت و لاغری..."
                    className="w-full pr-12 pl-28 py-3.5 bg-white/95 hover:bg-white focus:bg-white text-slate-900 placeholder:text-stone-400 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#d0de41]/40 shadow-xl transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute left-2 px-4 py-2 bg-[#024a3d] hover:bg-[#01382e] text-[#d0de41] text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>جستجو</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Trending quick tags */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-emerald-100/90 font-medium">
                  <span className="text-[#d0de41] font-bold">بیشترین جستجو:</span>
                  {[
                    { label: 'پودر خالص', url: '/shop?category=powders' },
                    { label: 'روغن پرس سرد', url: '/shop?category=oils' },
                    { label: 'لاغری و متابولیسم', url: '/articles/weight-loss-metabolism' },
                    { label: 'دیابت و قند خون', url: '/articles/diabetes-blood-sugar' },
                    { label: 'دستور اسموتی', url: '#smoothies' },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.url}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Trust Micro-Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#d0de41]" />
                  ۱۰۰٪ ارگانیک و دست‌چین
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#d0de41]" />
                  بدون شکر، بدون افزودنی
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#d0de41]" />
                  ضمانت بازگشت و اصالت
                </span>
              </div>
            </div>

            {/* Left Column: Hero Lifestyle Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-4 border-[#d0de41]/30 shadow-2xl bg-emerald-950 group">
                <img
                  src="/images/kuli-lifestyle.jpg"
                  alt="اسموتی شاداب‌کننده پودر مورینگا"
                  className="w-full h-[440px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Floating Sticker 1 */}
                <div className="absolute top-4 right-4 bg-[#d0de41] text-[#026251] p-3 rounded-2xl shadow-xl font-black text-xs space-y-0.5 animate-bounce">
                  <span className="block text-sm">⚡ ۲۵ برابر</span>
                  <span>آهن بیشتر از اسفناج!</span>
                </div>

                {/* Floating Sticker 2 */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md text-slate-900 p-3.5 rounded-2xl shadow-xl font-bold text-xs space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {'★'.repeat(5)}
                  </div>
                  <span className="block text-[11px] text-slate-600">بیش از ۴,۵۰۰ مشتری راضی در سراسر ایران</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. NUTRITIONAL COMPARISON WHEEL (From moringa-iran.ir) ── */}
        <NutrientWheelSection />

        {/* ── 3. CLEAN ENERGY WITHOUT CAFFEINE (From moringa-iran.ir) ── */}
        <CleanEnergySection />

        {/* ── 4. INTERACTIVE STEP PACKAGE SLIDER (Inspired by SevenHost Package Selector) ── */}
        <InteractivePackageSlider />

        {/* ── 3. FEATURED PRODUCTS SHOWCASE ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 dark:border-emerald-950 pb-6">
            <div>
              <span className="text-xs font-black text-[#026251] bg-[#d0de41] px-3 py-1 rounded-full uppercase">
                ویترین پرفروش‌ترین‌ها
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
                سوپرفودهای محبوب جامعه مورینگا ایران
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-[#026251] dark:text-[#d0de41] font-bold text-sm hover:underline flex items-center gap-1 shrink-0"
            >
              <span>مشاهده همه کاتالوگ</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const priceToman = Math.round(product.price_irr / 10);
              const compareToman = product.compare_at_price_irr ? Math.round(product.compare_at_price_irr / 10) : null;
              const discountPercent = compareToman ? Math.round(((compareToman - priceToman) / compareToman) * 100) : null;
              const primaryMedia = product.media?.[0];

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-[#091e18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-5 group"
                >
                  <div className="space-y-3">
                    {/* Image Box */}
                    <div className="w-full h-52 bg-[#faf8f5] dark:bg-[#051410] rounded-2xl overflow-hidden relative flex items-center justify-center border border-stone-100 dark:border-emerald-900/50 p-2">
                      {primaryMedia ? (
                        <img
                          src={primaryMedia.url}
                          alt={product.title_fa}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl">🌱</span>
                      )}
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#026251] text-white text-[10px] font-bold rounded-full">
                        {product.category_name_fa}
                      </span>
                      {discountPercent && discountPercent > 0 && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full">
                          {discountPercent}٪ تخفیف
                        </span>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <span>{'★'.repeat(5)}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] mr-1">(۵.۰)</span>
                    </div>

                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug group-hover:text-[#026251] dark:group-hover:text-[#d0de41] transition-colors">
                      <Link href={`/product/${product.slug}`}>{product.title_fa}</Link>
                    </h3>

                    {product.subtitle_fa && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{product.subtitle_fa}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-100 dark:border-emerald-950 flex items-center justify-between mt-4">
                    <div>
                      {compareToman && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 line-through">
                          {compareToman.toLocaleString('fa-IR')}
                        </div>
                      )}
                      <div>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{priceToman.toLocaleString('fa-IR')}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">تومان</span>
                      </div>
                    </div>

                    <Link
                      href={`/product/${product.slug}`}
                      className="px-4 py-2.5 bg-[#026251] hover:bg-[#024a3d] text-white rounded-full text-xs font-black transition-all shadow-sm"
                    >
                      خرید سریع
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. INTERACTIVE SMOOTHIE & RECIPE STUDIO ── */}
        <section id="smoothies" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#026251] dark:bg-[#032a22] text-white relative overflow-hidden transition-colors duration-200">
          <div className="max-w-7xl mx-auto space-y-12 relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-black text-[#026251] bg-[#d0de41] px-3 py-1 rounded-full uppercase">
                طعم سلامتی و لذت
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                چگونه مورینگا را خوشمزه میل کنیم؟
              </h2>
              <p className="text-sm text-emerald-100">
                پودر مورینگا طعمی ملایم شبیه چای سبز و اسفناج دارد. با این دستورهای ساده روز خود را سرشار از انرژی کنید:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recipes.map((recipe, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRecipeIndex(idx)}
                  className={`bg-emerald-950/80 rounded-3xl p-6 border transition-all cursor-pointer space-y-4 ${
                    selectedRecipeIndex === idx
                      ? 'border-[#d0de41] shadow-2xl scale-[1.02]'
                      : 'border-emerald-700/60 shadow-lg hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{recipe.emoji}</span>
                    <span className="px-3 py-1 bg-[#d0de41] text-[#026251] text-xs font-black rounded-full">
                      {recipe.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{recipe.title}</h3>
                  <div className="space-y-1.5 text-xs text-emerald-100">
                    <span className="font-bold text-[#d0de41] block mb-1">مواد لازم:</span>
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-[#d0de41]">•</span>
                        <span>{ing}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-emerald-800 text-xs text-emerald-200">
                    <span className="font-bold text-white">نتیجه: </span>
                    {recipe.benefit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. OUR PURPOSE & IMPACT (Kuli Kuli Farmers Mission) ── */}
        <section id="impact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-white dark:bg-[#091e18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 p-8 sm:p-14 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Image */}
            <div className="lg:col-span-6 order-2 lg:order-1 relative">
              <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-[#d0de41] bg-stone-100 dark:bg-stone-900">
                <img
                  src="/images/kuli-farmers.jpg"
                  alt="مزرعه پایدار مورینگا در جنوب ایران"
                  className="w-full h-[380px] object-cover"
                />
              </div>
            </div>

            {/* Right Mission Text */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2 text-right">
              <span className="text-xs font-black text-[#026251] bg-[#d0de41] px-3 py-1 rounded-full uppercase">
                داستان مزارع و هدف ما
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                تغذیه‌بخش برای شما، حیات‌بخش برای زمین
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                درخت مورینگا اولیفرا با ریشه‌های عمیق خود در برابر کم‌آبی شدید مقاومت می‌کند و خاک‌های فرسوده را احیا می‌نماید. با هر خرید شما از ایران مورینگا:
              </p>

              <div className="space-y-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-3 p-3 bg-[#faf8f5] dark:bg-[#051410] rounded-2xl border border-stone-100 dark:border-emerald-900/50">
                  <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>حمایت پایدار از بیش از ۴۵ خانواده کشاورز در جنوب کشور</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#faf8f5] dark:bg-[#051410] rounded-2xl border border-stone-100 dark:border-emerald-900/50">
                  <Globe2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>کاشت بیش از ۱۲,۰۰۰ اصله درخت جهت مهار پدیده گردوغبار و بیابان‌زایی</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#faf8f5] dark:bg-[#051410] rounded-2xl border border-stone-100 dark:border-emerald-900/50">
                  <Award className="w-5 h-5 text-[#026251] dark:text-[#d0de41] shrink-0" />
                  <span>تضمین کیفیت ۱۰۰٪ ارگانیک، بدون آفت‌کش و قیمت مستقیم مزرعه</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5.5 REFINED BRAND IDENTITY & LOGOTYPE SHOWCASE (Kuli Kuli Superfood Standards) ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#faf8f5] via-[#f0f7f3] to-[#faf8f5] border-t border-b border-emerald-900/10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* Section Header */}
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-[#026251] text-[#d0de41] px-4 py-1.5 rounded-full text-xs font-black shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>هویت بصری و استانداردهای جهانی سوپرفود</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                داستان لوگوتایپ و اصالت برند «ایران مورینگا»
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
                تلفیق فرم طبیعی برگچه‌های بیضوی درخت معجزه مورینگا اولیفرا و تایپوگرافی اصیل فارسی، با الهام از استانداردهای برتر برند پیشگام <strong className="text-[#026251]">Kuli Kuli Foods</strong> آمریکا.
              </p>
            </div>

            {/* Hero Split Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Right Column: Brand Logo Showcase in Dark Emerald Box */}
              <div className="lg:col-span-7 bg-gradient-to-br from-[#024a3d] via-[#026251] to-[#01382e] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-700/40 flex flex-col justify-between relative overflow-hidden">
                {/* Glow circle */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d0de41]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-6 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/15">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#d0de41] uppercase tracking-wider font-mono">OFFICIAL LOGOTYPE</span>
                      <h3 className="text-base sm:text-lg font-black text-white">نشان تجاری و هویت بصری اختصاصی</h3>
                    </div>
                    <span className="px-3 py-1 bg-white/10 text-emerald-200 border border-white/20 rounded-full text-xs font-bold">
                      ضمانت ۱۰۰٪ ارگانیک
                    </span>
                  </div>

                  {/* Logo Main Box */}
                  <div className="p-6 sm:p-8 bg-black/25 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                    <BrandLogo
                      variant="horizontal"
                      theme="light"
                      size="lg"
                      showSubtext={true}
                      subtextLang="both"
                      animated={true}
                    />
                    <div className="text-center sm:text-left text-xs font-mono text-[#d0de41] bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 shrink-0 font-black">
                      MORINGA OLEIFERA
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed text-justify">
                    این نشان تجاری با تلفیق ساختار طبیعی برگچه مرکب مورینگا اولیفرا (Pinnate Compound Leaflets) و رسم‌الخط پویا و مدرن فارسی خلق شده است. رنگ سبز جنگلی نماد طبیعت بکر و رنگ لیمویی نماد انرژی، شادابی و حیات روزانه است.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 relative z-10 flex flex-wrap items-center gap-4">
                  <Link
                    href="/shop"
                    className="px-6 py-3.5 bg-[#d0de41] hover:bg-[#b8c634] text-[#026251] rounded-full text-xs sm:text-sm font-black transition-all shadow-lg hover:scale-105 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>خرید مستقیم محصولات ارگانیک</span>
                  </Link>
                  <Link
                    href="/articles"
                    className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs sm:text-sm font-bold border border-white/20 transition-all flex items-center gap-1.5"
                  >
                    <span>دانشنامه علمی و مقالات</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Left Column: Packaging & Quality Standards */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-md border-2 border-[#d0de41] relative group">
                    <img
                      src="/images/brand-showcase.jpg"
                      alt="بسته‌بندی سوپرفود ایران مورینگا با الهام از Kuli Kuli Foods"
                      className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-[#026251] text-[#d0de41] px-3 py-1 rounded-full text-[11px] font-black shadow-md">
                      الگوی Kuli Kuli Foods
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <h4 className="font-black text-base text-slate-900">
                      فناوری فرآوری بدون حرارت و بسته‌بندی ضد UV
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      خشک‌کردن استاندارد در سایه تحت دمای کنترل‌شده باعث حفظ ۹۸٪ کلروفیل فعال و ویتامین‌های محلول در آب می‌گردد.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>فاقد قند و گلوتن</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>آنالیز آزمایشگاهی خلوص</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition-shadow space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#026251] flex items-center justify-center font-black text-xl shadow-xs">
                  <Leaf className="w-6 h-6 text-[#026251]" />
                </div>
                <h4 className="font-black text-sm text-slate-900">نشان برگچه مورینگا</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  چینش متقارن برگچه‌های بیضوی درخت اولیفرا؛ نماد غنای ۹۲ ماده مغذی، ۴۶ نوع آنتی‌اکسیدان و اسیدهای آمینه ضروری.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition-shadow space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-lime-100 text-lime-800 flex items-center justify-center font-black text-xl shadow-xs">
                  <Sparkles className="w-6 h-6 text-lime-700" />
                </div>
                <h4 className="font-black text-sm text-slate-900">تایپوگرافی مدرن فارسی</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  طراحی هندسی و اختصاصی حروف با انحناهای چشم‌نواز و المان برگچه روی نقاط حروف، تداعی‌کننده حس سرزندگی و نشاط.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition-shadow space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl shadow-xs">
                  <Globe2 className="w-6 h-6 text-amber-700" />
                </div>
                <h4 className="font-black text-sm text-slate-900">الهام از Kuli Kuli Foods</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  پایبندی به استانداردهای برترین برند سوپرفود مورینگا در جهان با حفظ خلوص صددرصدی و بسته‌بندی زیپ‌کیپ محافظ نور.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition-shadow space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xl shadow-xs">
                  <Sun className="w-6 h-6 text-teal-700" />
                </div>
                <h4 className="font-black text-sm text-slate-900">کشت ارگانیک جنوب ایران</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  برداشت تازه و مستقیم از نخلستان‌ها و مزارع آفتاب‌گیر هرمزگان و فارس بدون واسطه و با تضمین بالاترین کیفیت دارویی.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. REAL CUSTOMER REVIEWS (Community Love) ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#f2eee5] border-t border-b border-stone-200">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs font-black text-[#026251] bg-[#d0de41] px-3 py-1 rounded-full uppercase">
                تجربه خریداران
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
                حس سرزندگی با مورینگا ایران
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: '«من حدود ۲ ماهه پودر مورینگا رو صبح‌ها با ماست می‌خورم. خستگی مزمن بعدازظهرم کاملاً از بین رفته و پوستم خیلی شفاف‌تر شده.»',
                  author: 'دکتر مریم رادمنش',
                  role: 'پزشک عمومی، تهران',
                  stars: 5,
                },
                {
                  quote: '«روغن ۳۰ میل مورینگا برای درمان لک‌های بعد از جوش فوق‌العاده بود. اصلاً چربی سنگین نداره و خیلی سریع جذب میشه.»',
                  author: 'سارا کاظمی',
                  role: 'اصفهان',
                  stars: 5,
                },
                {
                  quote: '«پدرم قند خونش نوسان داشت، با مصرف دمنوش و پودر مورینگا همراه ناهار، قند بعد از غذایش خیلی متعادل‌تر شده.»',
                  author: 'مهدی خسروی',
                  role: 'شیراز',
                  stars: 5,
                },
              ].map((rev, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#091e18] p-6 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-sm space-y-4 text-right flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="text-amber-500 font-bold text-sm">{'★'.repeat(rev.stars)}</div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{rev.quote}</p>
                  </div>
                  <div className="pt-3 border-t border-stone-100 dark:border-emerald-950">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">{rev.author}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{rev.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. RECENT KNOWLEDGE ARTICLES ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 dark:border-emerald-950 pb-6">
            <div>
              <span className="text-xs font-black text-[#026251] bg-[#d0de41] px-3 py-1 rounded-full uppercase">
                دانشنامه و مقالات سلامت
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                جدیدترین راهنماهای علمی مورینگا
              </h2>
            </div>
            <Link
              href="/articles"
              className="text-[#026251] dark:text-[#d0de41] font-bold text-sm hover:underline flex items-center gap-1 shrink-0"
            >
              <span>مشاهده هر ۱۸ مقاله دانشنامه</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white dark:bg-[#091e18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="h-44 bg-stone-100 dark:bg-stone-900 overflow-hidden">
                    <img
                      src={art.cover_image_url}
                      alt={art.title_fa}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-bold text-[#026251] dark:text-[#d0de41] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                      {art.category_name_fa}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-[#026251] dark:group-hover:text-[#d0de41] transition-colors">
                      <Link href={`/articles/${art.slug}`}>{art.title_fa}</Link>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{art.summary_fa}</p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-stone-100 dark:border-emerald-950 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {art.reading_time_minutes} دقیقه
                  </span>
                  <Link
                    href={`/articles/${art.slug}`}
                    className="text-[#026251] dark:text-[#d0de41] font-bold hover:underline"
                  >
                    مطالعه کامل ←
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── 8. NEWSLETTER / SUPERFOOD CLUB ── */}
        <section className="bg-[#026251] dark:bg-[#032a22] text-white py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="w-14 h-14 bg-[#d0de41] text-[#026251] rounded-2xl mx-auto flex items-center justify-center text-2xl font-black shadow-lg">
              💌
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              عضویت در باشگاه سرزندگی ایران مورینگا
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto leading-relaxed">
              شماره موبایل یا ایمیل خود را وارد کنید تا کد تخفیف ۱۵٪ به همراه کتابچه الکترونیکی رایگان «۲۵ دستور غذایی مقوی با مورینگا» برای شما ارسال شود.
            </p>

            {newsletterSuccess ? (
              <div className="p-4 bg-[#d0de41] text-[#026251] font-black rounded-2xl text-sm max-w-md mx-auto shadow-md">
                🎉 ثبت‌نام شما با موفقیت انجام شد! کد تخفیف اختصاصی شما: <span className="font-mono text-base">MORINGA15</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="شماره موبایل یا ایمیل..."
                  required
                  value={newsletterInput}
                  onChange={(e) => setNewsletterInput(e.target.value)}
                  className="flex-1 px-5 py-3.5 bg-white dark:bg-[#051410] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d0de41] border border-transparent dark:border-emerald-800"
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-[#d0de41] hover:bg-[#b8c634] text-[#026251] font-black text-xs sm:text-sm rounded-full shadow-lg transition-all shrink-0"
                >
                  دریافت تخفیف ۱۵٪
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Shared Storefront Footer */}
      <Footer />
    </div>
  );
}
