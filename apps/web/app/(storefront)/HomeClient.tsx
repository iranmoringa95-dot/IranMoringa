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
  ChevronDown,
  Users,
  Sun,
  Globe2,
  Search,
  Check,
  Truck,
  HelpCircle,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ALL_MORINGA_PRODUCTS, ProductItem } from '@/lib/products-data';
import { ALL_MORINGA_ARTICLES } from '@/lib/articles-data';
import { addToCart } from '@/lib/cart';

export function HomeClient() {
  const [newsletterInput, setNewsletterInput] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const featuredProducts = ALL_MORINGA_PRODUCTS.slice(0, 4);
  const secondaryProducts = ALL_MORINGA_PRODUCTS.slice(4, 8);
  const featuredArticles = ALL_MORINGA_ARTICLES.slice(0, 3);

  const categories = [
    {
      slug: 'powders',
      title: 'پودر برگ خالص',
      desc: 'سایه‌خشک و میکرونیزه ۱۰۰٪ ارگانیک',
      icon: '🍃',
      href: '/shop?category=powders',
    },
    {
      slug: 'oils',
      title: 'روغن پرس سرد',
      desc: 'جوان‌ساز پوست و تقویت ریشه مو',
      icon: '✨',
      href: '/shop?category=oils',
    },
    {
      slug: 'teas',
      title: 'دمنوش و تی‌بگ',
      desc: 'ترکیب طبیعی با لیمو و دارچین',
      icon: '☕',
      href: '/shop?category=teas',
    },
    {
      slug: 'supplements',
      title: 'مکمل و کپسول',
      desc: 'مصرف آسان روزانه بدون طعم گیاهی',
      icon: '💊',
      href: '/shop?category=supplements',
    },
    {
      slug: 'seeds',
      title: 'بذر و نهال',
      desc: 'بذر روغنی و نهال سازگار با اقلیم ایران',
      icon: '🌱',
      href: '/shop?category=seeds',
    },
  ];

  const recipes = [
    {
      title: 'اسموتی انرژی‌بخش صبحگاهی',
      badge: 'آماده‌سازی ۳ دقیقه‌ای',
      ingredients: ['۱ قاشق چای‌خوری پودر مورینگا', '۱ عدد موز', '۱ لیوان شیر گیاهی یا معمولی', '۱ قاشق عسل طبیعی'],
      benefit: 'تأمین انرژی پایدار، پروتئین گیاهی و رفع خستگی در طول روز',
      emoji: '🥑',
    },
    {
      title: 'دمنوش آرامش‌بخش عصرانه',
      badge: 'آرامش و تقویت ایمنی',
      ingredients: ['۱ عدد تی‌بگ دمنوش مورینگا یا ۱ قاشق برگ خشک', '۱ فنجان آب جوش (۸۰ درجه)', 'چند قطره لیمو ترش تازه'],
      benefit: 'سرشار از آنتی‌اکسیدان، کمک به هضم غذا و کاهش استرس',
      emoji: '🍵',
    },
    {
      title: 'ماسک شاداب‌کننده پوست',
      badge: 'مراقبت طبیعی هفتگی',
      ingredients: ['نصف قاشق پودر مورینگا', '۳ قطره روغن خالص مورینگا', '۱ قاشق ماست پروبیوتیک'],
      benefit: 'تغذیه‌کننده عمیق پوست، پاکسازی منافذ و شفافیت طبیعی',
      emoji: '🌿',
    },
  ];

  const faqs = [
    {
      q: 'مورینگا چیست و چه خواصی دارد؟',
      a: 'مورینگا اولیفرا (Moringa Oleifera) گیاهی غنی از ۹۲ ماده مغذی، ۴۶ نوع آنتی‌اکسیدان، اسیدهای آمینه ضروری، کلسیم، آهن و ویتامین‌های A و C است که برای افزایش سطح انرژی طبیعی، تقویت سیستم ایمنی، لاغری و شادابی پوست کاربرد دارد.',
    },
    {
      q: 'نحوه مصرف پودر مورینگا چگونه است؟',
      a: 'می‌توانید روزانه نصف تا یک قاشق چای‌خوری (حدود ۲ تا ۵ گرم) از پودر مورینگا را به آب گرم، ماست، اسموتی، آب‌میوه یا سالاد اضافه کرده و میل نمایید.',
    },
    {
      q: 'آیا محصولات ایران مورینگا دارای ضمانت اصالت هستند؟',
      a: 'بله، تمامی محصولات از مزارع تحت نظارت جنوب ایران بدون هیچ‌گونه افزودنی، نگه‌دارنده یا ماده شیمیایی برداشت شده و پس از فرآوری استاندارد در دمای ملایم، با ضمانت بازگشت وجه ارائه می‌شوند.',
    },
    {
      q: 'سفارش‌ها چگونه و در چه مدتی ارسال می‌شوند؟',
      a: 'سفارش‌ها از طریق پست پیشتاز و سامانه‌های ارسال سریع بسته‌بندی شده و ظرف ۲ الی ۴ روز کاری در سراسر کشور تحویل داده می‌شوند.',
    },
  ];

  const handleQuickAdd = (product: ProductItem) => {
    addToCart(product, 1);
    setAddedToast(product.title_fa);
    setTimeout(() => {
      setAddedToast(null);
    }, 3000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterInput.trim()) {
      setNewsletterSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbf8] dark:bg-[#072714] text-[#17251c] dark:text-[#f2f9f4] dir-rtl font-sans selection:bg-[#c3e5cd] selection:text-[#176b39] overflow-x-hidden w-full transition-colors duration-200">
      <Header />

      {/* Floating Add to Cart Toast Feedback */}
      {addedToast && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-[#176b39] text-white p-4 rounded-2xl shadow-float border border-[#2ea355] flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-[#176b39] rounded-xl flex items-center justify-center font-bold shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold truncate max-w-[200px]">{addedToast}</p>
              <p className="text-[11px] text-emerald-100">به سبد خرید شما افزوده شد.</p>
            </div>
          </div>
          <Link
            href="/cart"
            className="px-3 py-1.5 bg-white hover:bg-stone-100 text-[#176b39] text-xs font-black rounded-lg transition-colors shrink-0"
          >
            مشاهده سبد
          </Link>
        </div>
      )}

      <main className="flex-1 space-y-16 sm:space-y-24">
        {/* ── 1. HERO SECTION ── */}
        <section className="relative pt-6 sm:pt-14 pb-8 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Right Column: Hero Copy */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-right">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#f2f9f4] dark:bg-[#113820] text-[#176b39] dark:text-[#97d2a7] px-4 py-1.5 rounded-full text-xs font-bold border border-[#c3e5cd] dark:border-[#1e8240] shadow-2xs">
                <Leaf className="w-4 h-4 text-[#2ea355] shrink-0" />
                <span>مرجع تخصصی خرید مستقیم مورینگا در ایران</span>
              </div>

              {/* H1 Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-black leading-snug sm:leading-[1.38] lg:leading-[1.38] text-[#17251c] dark:text-white tracking-tight">
                خرید مورینگا اصل، پودر برگ خالص و روغن پرس سرد
                <span className="block text-[#176b39] dark:text-[#5eba7a] text-xl sm:text-3xl lg:text-[34px] font-extrabold mt-2 sm:mt-3">
                  با تضمین ۱۰۰٪ کیفیت مزارع ایران مورینگا
                </span>
              </h1>

              {/* Short Description */}
              <p className="text-sm sm:text-base text-[#46503f] dark:text-stone-300 leading-[1.85] sm:leading-[1.9] max-w-xl font-normal text-justify sm:text-right">
                تأمین‌کننده مستقیم پودر خالص برگ، روغن پرس سرد و دمنوش‌های ارگانیک مورینگا اولیفرا با حفظ بالاترین درجه مواد مغذی، ۹۲ ماده معدنی، آنتی‌اکسیدان‌ها و اسیدهای آمینه ضروری.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  href="/shop"
                  className="min-h-[50px] px-8 py-3.5 bg-[#176b39] hover:bg-[#14552f] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-card hover:shadow-float transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>مشاهده و خرید محصولات</span>
                </Link>
                <Link
                  href="/articles/what-is-moringa"
                  className="min-h-[50px] px-6 py-3.5 bg-white dark:bg-stone-900 hover:bg-[#f2f9f4] dark:hover:bg-stone-800 text-[#176b39] dark:text-[#97d2a7] text-xs sm:text-sm font-bold rounded-2xl border border-[#e5e8de] dark:border-stone-700 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>مورینگا چیست؟ (دانشنامه علمی)</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>

              {/* 3 Trust Signals */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-6 border-t border-[#e5e8de] dark:border-stone-800 text-xs font-bold text-[#555e4d] dark:text-stone-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#f2f9f4] dark:bg-[#113820] flex items-center justify-center text-[#176b39] dark:text-[#2ea355] shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>۱۰۰٪ برگ ارگانیک</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#f2f9f4] dark:bg-[#113820] flex items-center justify-center text-[#176b39] dark:text-[#2ea355] shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span>ارسال به سراسر کشور</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#f2f9f4] dark:bg-[#113820] flex items-center justify-center text-[#176b39] dark:text-[#2ea355] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>ضمانت اصالت و سلامت</span>
                </div>
              </div>
            </div>

            {/* Left Column: Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-[2rem] overflow-hidden border border-[#e5e8de] dark:border-stone-800 shadow-card bg-white dark:bg-stone-900 group">
                <img
                  src="/images/brand-showcase.jpg"
                  alt="خرید مورینگا اصل - فروشگاه ایران مورینگا"
                  className="w-full h-80 sm:h-[440px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-5 right-5 left-5 p-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl border border-white/30 dark:border-white/10 text-right shadow-md flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-[#17251c] dark:text-white">فرآوری استاندارد در سایه</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">حفظ ۹۸٪ کلروفیل و ویتامین‌های فعال گیاه</p>
                  </div>
                  <span className="px-3 py-1 bg-[#176b39] text-white rounded-xl text-[11px] font-bold shrink-0 shadow-xs">
                    ۱۰۰٪ ارگانیک
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. CATEGORIES GRID ── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e8de] dark:border-stone-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#17251c] dark:text-white">
                دسته‌بندی‌های محصولات مورینگا
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                تنوع کامل فرآورده‌های طبیعی برای مصارف تغذیه‌ای، درمانی و پوستی
              </p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-[#176b39] dark:text-[#2ea355] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>مشاهده همه</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.href}
                className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-[#e5e8de] dark:border-stone-800 hover:border-[#c3e5cd] dark:hover:border-[#1e8240] hover:shadow-card transition-all text-right group flex flex-col justify-between space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-[#f2f9f4] dark:bg-[#0d3d21] text-[#176b39] dark:text-[#97d2a7] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#17251c] dark:text-white group-hover:text-[#176b39] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {cat.desc}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-[#176b39] dark:text-[#2ea355] flex items-center gap-1 pt-1">
                  <span>مشاهده محصولات</span>
                  <ChevronLeft className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 3. BESTSELLER PRODUCTS SHOWCASE ── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#e5e8de] dark:border-stone-800 pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#176b39] bg-[#f2f9f4] dark:bg-[#0d3d21] px-2.5 py-0.5 rounded-md">
                ویترین پرفروش‌ترین‌ها
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-[#17251c] dark:text-white mt-1.5">
                محبوب‌ترین محصولات ارگانیک
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-[#176b39] dark:text-[#2ea355] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>مشاهده تمام محصولات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => {
              const priceToman = Math.round(product.price_irr / 10);
              const compareToman = product.compare_at_price_irr ? Math.round(product.compare_at_price_irr / 10) : null;
              const discountPercent = compareToman ? Math.round(((compareToman - priceToman) / compareToman) * 100) : null;
              const primaryMedia = product.media?.[0];

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-[#e5e8de] dark:border-stone-800 p-4 flex flex-col justify-between hover:border-[#c3e5cd] dark:hover:border-[#1e8240] hover:shadow-card transition-all group min-w-[160px]"
                >
                  <div className="space-y-3">
                    <Link
                      href={`/product/${product.slug}`}
                      className="w-full aspect-square bg-[#fafbf8] dark:bg-stone-800/50 rounded-xl overflow-hidden relative flex items-center justify-center p-3 block border border-stone-100 dark:border-stone-800"
                    >
                      {primaryMedia ? (
                        <img
                          src={primaryMedia.url}
                          alt={product.title_fa}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl">🌱</span>
                      )}

                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 text-[10px] font-bold rounded-md shadow-xs border border-stone-200/60 dark:border-stone-700">
                        {product.category_name_fa}
                      </span>

                      {discountPercent && discountPercent > 0 && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#f47a24] text-white text-[10px] font-bold rounded-md shadow-xs">
                          {discountPercent}٪ تخفیف
                        </span>
                      )}
                    </Link>

                    <h3 className="font-bold text-sm text-[#17251c] dark:text-white leading-snug line-clamp-2 min-h-[2.5rem]">
                      <Link href={`/product/${product.slug}`} className="hover:text-[#176b39] transition-colors">
                        {product.title_fa}
                      </Link>
                    </h3>

                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      بسته‌بندی: {product.weight_grams} گرمی
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 mt-3 flex items-center justify-between">
                    <div>
                      {compareToman && (
                        <span className="text-[11px] text-stone-400 line-through block">
                          {compareToman.toLocaleString('fa-IR')}
                        </span>
                      )}
                      <div className="font-black text-sm text-[#176b39] dark:text-[#2ea355]">
                        {priceToman.toLocaleString('fa-IR')}{' '}
                        <span className="text-[10px] font-normal text-stone-500">تومان</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product)}
                      className="px-3.5 py-2 bg-[#176b39] hover:bg-[#14552f] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95"
                      aria-label={`افزودن ${product.title_fa} به سبد خرید`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>خرید سریع</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. BRAND VALUES & TRUST PILLARS ── */}
        <section id="why-moringa" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-[#f2f9f4] dark:bg-[#0a331b] rounded-3xl p-6 sm:p-10 border border-[#c3e5cd] dark:border-[#14552f] space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-bold text-[#176b39] dark:text-[#97d2a7] bg-white dark:bg-stone-900 px-3 py-1 rounded-full border border-[#c3e5cd] dark:border-[#1e8240]">
                چرا ایران مورینگا؟
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-[#17251c] dark:text-white">
                تعهد ما به کیفیت، اصالت و طبیعت
              </h2>
              <p className="text-xs sm:text-sm text-[#3f4638] dark:text-stone-300">
                فرآیندی استاندارد و شفاف از کاشت ارگانیک در مزارع جنوب تا رسیدن محصول تازه به دست شما
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2.5 text-right">
                <div className="w-10 h-10 rounded-xl bg-[#e1f2e6] text-[#176b39] flex items-center justify-center">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#17251c] dark:text-white">۱۰۰٪ خالص و بدون افزودنی</h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  برگ‌های تازه مورینگا اولیفرا بدون هیچ‌گونه فیلر، نشاسته، رنگ، شکر یا نگه‌دارنده شیمیایی.
                </p>
              </div>

              <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2.5 text-right">
                <div className="w-10 h-10 rounded-xl bg-[#e1f2e6] text-[#176b39] flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#17251c] dark:text-white">خشک‌کردن استاندارد در سایه</h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  فرآوری تحت دمای کنترل‌شده بدون تماس مستقیم با نور خورشید جهت حفظ رنگ سبز و ویتامین‌ها.
                </p>
              </div>

              <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2.5 text-right">
                <div className="w-10 h-10 rounded-xl bg-[#e1f2e6] text-[#176b39] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#17251c] dark:text-white">آنالیز آزمایشگاهی خلوص</h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  بررسی کیفیت میکروبی و سلامت هر پارت تولیدی به همراه ضمانت کامل اصالت و سلامت کالا.
                </p>
              </div>

              <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2.5 text-right">
                <div className="w-10 h-10 rounded-xl bg-[#e1f2e6] text-[#176b39] flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#17251c] dark:text-white">بسته‌بندی محافظ نور و رطوبت</h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  استفاده از زیپ‌کیپ‌های فویل آلومینیومی چندلایه ضد UV جهت ماندگاری حداکثری خواص گیاه.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. PRACTICAL RECIPES & USAGE GUIDE ── */}
        <section id="smoothies" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#e5e8de] dark:border-stone-800 pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#176b39] bg-[#f2f9f4] dark:bg-[#0d3d21] px-2.5 py-0.5 rounded-md">
                دستورهای کاربردی
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-[#17251c] dark:text-white mt-1.5">
                چگونه مورینگا را در رژیم روزانه مصرف کنیم؟
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              طعم ملایم گیاهی شبیه چای سبز و اسفناج
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {recipes.map((recipe, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedRecipeIndex(idx)}
                className={`bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 border transition-all cursor-pointer space-y-4 ${
                  selectedRecipeIndex === idx
                    ? 'border-[#176b39] ring-2 ring-[#176b39]/20 shadow-card'
                    : 'border-[#e5e8de] dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{recipe.emoji}</span>
                  <span className="px-2.5 py-1 bg-[#f2f9f4] dark:bg-[#0d3d21] text-[#176b39] dark:text-[#97d2a7] text-xs font-bold rounded-lg">
                    {recipe.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#17251c] dark:text-white">{recipe.title}</h3>
                <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                  <span className="font-bold text-[#176b39] dark:text-[#2ea355] block">مواد لازم:</span>
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-[#176b39]">•</span>
                      <span>{ing}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-[#3f4638] dark:text-stone-300">
                  <span className="font-bold text-[#17251c] dark:text-white">نتیجه: </span>
                  {recipe.benefit}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. SCIENTIFIC ARTICLES FROM KNOWLEDGE BASE ── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#e5e8de] dark:border-stone-800 pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#176b39] bg-[#f2f9f4] dark:bg-[#0d3d21] px-2.5 py-0.5 rounded-md">
                دانشنامه و مقالات علمی
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-[#17251c] dark:text-white mt-1.5">
                تازه‌ترین پژوهش‌ها و راهنماهای سلامت
              </h2>
            </div>
            <Link
              href="/articles"
              className="text-xs font-bold text-[#176b39] dark:text-[#2ea355] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>مشاهده تمام مقالات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-[#e5e8de] dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-card transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="h-44 bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <img
                      src={art.cover_image_url}
                      alt={art.title_fa}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-bold text-[#176b39] dark:text-[#97d2a7] bg-[#f2f9f4] dark:bg-[#0d3d21] px-2.5 py-0.5 rounded-md">
                      {art.category_name_fa}
                    </span>
                    <h3 className="font-bold text-[#17251c] dark:text-white text-sm leading-snug group-hover:text-[#176b39] transition-colors">
                      <Link href={`/articles/${encodeURIComponent(art.slug)}`}>{art.title_fa}</Link>
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                      {art.summary_fa}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-4 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {art.reading_time_minutes} دقیقه مطالعه
                  </span>
                  <Link
                    href={`/articles/${encodeURIComponent(art.slug)}`}
                    className="text-[#176b39] dark:text-[#2ea355] font-bold hover:underline"
                  >
                    مطالعه کامل ←
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── 7. VERIFIED CUSTOMER REVIEWS ── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#176b39] bg-[#f2f9f4] dark:bg-[#0d3d21] px-3 py-1 rounded-full">
              دیدگاه خریداران
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-[#17251c] dark:text-white">
              تجربه مصرف‌کنندگان ایران مورینگا
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                quote: '«پودر مورینگا را صبح‌ها همراه با اسموتی مصرف می‌کنم. احساس نشاط و انرژی مداومی در طول روز به من می‌دهد و کیفیت خوابم هم بهتر شده است.»',
                author: 'دکتر مریم رادمنش',
                role: 'تهران',
                stars: 5,
              },
              {
                quote: '«روغن ۳۰ میل مورینگا واقعاً سبک و با جذب سریع است. برای نرمی و درخشندگی پوست بعد از شست‌وشو بهترین گزینه طبیعی است.»',
                author: 'سارا کاظمی',
                role: 'اصفهان',
                stars: 5,
              },
              {
                quote: '«کیفیت بسته‌بندی عالی بود و دمنوش طعم بسیار دلنشین و آرامش‌بخشی دارد. بسته‌بندی ضد نور باعث حفظ تازگی کامل محصول شده است.»',
                author: 'مهدی خسروی',
                role: 'شیراز',
                stars: 5,
              },
            ].map((rev, i) => (
              <div
                key={i}
                className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-2xl border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-3 text-right flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="text-[#f47a24] text-xs font-bold">{'★'.repeat(rev.stars)}</div>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                    {rev.quote}
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                  <span className="font-bold text-[#17251c] dark:text-white text-xs block">{rev.author}</span>
                  <span className="text-[10px] text-stone-400">{rev.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. FAQ ACCORDION ── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold text-[#176b39] bg-[#f2f9f4] dark:bg-[#0d3d21] px-3 py-1 rounded-full">
              پرسش‌های متداول
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17251c] dark:text-white">
              پاسخ به سوالات پرتکرار خریداران
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-[#e5e8de] dark:border-stone-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between font-bold text-xs sm:text-sm text-[#17251c] dark:text-white hover:text-[#176b39] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#176b39] shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                      openFaqIndex === idx ? 'rotate-180 text-[#176b39]' : ''
                    }`}
                  />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 9. NEWSLETTER / CLUB SIGNUP ── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-8">
          <div className="bg-[#f2f9f4] dark:bg-[#0a331b] rounded-3xl p-6 sm:p-12 border border-[#c3e5cd] dark:border-[#14552f] text-center space-y-5">
            <div className="w-12 h-12 bg-[#176b39] text-white rounded-2xl mx-auto flex items-center justify-center text-xl shadow-xs">
              💌
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#17251c] dark:text-white">
              عضویت در باشگاه سلامت ایران مورینگا
            </h2>
            <p className="text-xs sm:text-sm text-[#3f4638] dark:text-stone-300 max-w-lg mx-auto leading-relaxed">
              شماره موبایل یا ایمیل خود را وارد کنید تا کد تخفیف اختصاصی سفارش اول به همراه کتابچه راهنمای مصرف برای شما ارسال شود.
            </p>

            {newsletterSuccess ? (
              <div className="p-4 bg-white dark:bg-stone-900 text-[#176b39] dark:text-[#97d2a7] font-bold rounded-2xl text-xs sm:text-sm max-w-md mx-auto border border-[#c3e5cd] shadow-xs">
                🎉 ثبت‌نام با موفقیت انجام شد! کد تخفیف شما: <span className="font-mono font-black text-sm">MORINGA15</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="شماره موبایل یا ایمیل..."
                  required
                  value={newsletterInput}
                  onChange={(e) => setNewsletterInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white dark:bg-stone-900 text-slate-900 dark:text-white placeholder:text-stone-400 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#176b39] border border-[#e5e8de] dark:border-stone-700 min-h-[44px]"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#176b39] hover:bg-[#14552f] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all shrink-0 min-h-[44px]"
                >
                  دریافت تخفیف
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
