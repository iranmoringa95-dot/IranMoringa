'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  ShieldCheck,
  Sparkles,
  Leaf,
  PhoneCall,
  Mail,
  Clock,
  MapPin,
  ArrowUp,
  Send,
  CheckCircle2,
  Truck,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
    }, 4000);
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-[#072714] text-stone-300 text-xs sm:text-sm pt-16 pb-12 overflow-hidden border-t border-white/[0.08] selection:bg-[#f47a24] selection:text-white dir-rtl font-sans">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#176b39]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#f47a24]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* ── 1. Top Newsletter & Community Banner (Minimalist & Sleek) ── */}
        <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] backdrop-blur-md shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f47a24]/15 border border-[#f47a24]/30 text-[#f47a24] text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>باشگاه همراهان سلامتی ایران مورینگا</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              دریافت مقالات علمی اختصاصی و ۱۰٪ تخفیف اولین سفارش
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              با عضویت در خبرنامه تخصصی، از آخرین پژوهش‌های بین‌المللی درباره خواص مورینگا و تخفیف‌های فصلی مطلع شوید.
            </p>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[380px]">
            {subscribed ? (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#176b39]/30 border border-[#2ea355]/40 text-[#97d2a7] text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#2ea355] shrink-0" />
                <span>عضویت شما با موفقیت ثبت گردید. خوش آمدید! 🌿</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <input
                  type="email"
                  required
                  placeholder="ایمیل خود را وارد کنید..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-28 pr-4 py-3 bg-black/40 hover:bg-black/60 focus:bg-black/70 border border-white/15 focus:border-[#f47a24] rounded-2xl text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  className="absolute left-1.5 top-1.5 bottom-1.5 px-4 bg-[#176b39] hover:bg-[#14552f] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>عضویت</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── 2. Four Pillars of Trust (Minimalist Micro-Cards) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="group p-4 sm:p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all duration-300 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#176b39]/20 text-[#2ea355] group-hover:scale-110 transition-transform flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">۱۰۰٪ خالص و ارگانیک</div>
              <div className="text-[11px] text-stone-400 mt-0.5">کشت طبیعی بدون سموم شیمیایی</div>
            </div>
          </div>

          <div className="group p-4 sm:p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all duration-300 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#176b39]/20 text-[#2ea355] group-hover:scale-110 transition-transform flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">آنالیز کیفی آزمایشگاهی</div>
              <div className="text-[11px] text-stone-400 mt-0.5">تضمین اصالت گونه مورینگا اولیفرا</div>
            </div>
          </div>

          <div className="group p-4 sm:p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all duration-300 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#176b39]/20 text-[#2ea355] group-hover:scale-110 transition-transform flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">ارسال سریع سراسری</div>
              <div className="text-[11px] text-stone-400 mt-0.5">پیک فوری اصفهان و پست پیشتاز</div>
            </div>
          </div>

          <div className="group p-4 sm:p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all duration-300 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#176b39]/20 text-[#2ea355] group-hover:scale-110 transition-transform flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">ضمانت بازگشت وجه</div>
              <div className="text-[11px] text-stone-400 mt-0.5">۷ روز ضمانت کیفیت و رضایت کالا</div>
            </div>
          </div>
        </div>

        {/* ── 3. Main Footer Grid (Brand + Categorized Sitemap) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pt-6 border-t border-white/[0.08]">
          {/* Brand Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <BrandLogo
              theme="light"
              size="md"
              showSubtext={true}
              subtextLang="both"
              href="/"
            />
            <p className="text-xs text-stone-400 leading-relaxed text-justify">
              ایران مورینگا مرجع پیشگام فرآوری و عرضه مستقیم سوپرفودهای گیاهی درخت معجزه‌گر مورینگا اولیفرا در ایران است. ما با مزارع اختصاصی و کنترل کیفی آزمایشگاهی، محصولی ۱۰۰٪ خالص و استاندارد را با بالاترین ارزش غذایی تقدیم سلامت جامعه می‌نماییم.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>پشتیبانی فعال آنلاین</span>
              </div>
              <a
                href="https://wa.me/989175929345"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتس‌اپ</span>
              </a>
            </div>
          </div>

          {/* Col 1: Products (2 Cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#f47a24] rounded-full" />
              <span>محصولات</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link href="/shop?category=powder" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>پودر خالص مورینگا</span>
                </Link>
              </li>
              <li>
                <Link href="/shop?category=oil" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>روغن آرایشی و درمانی</span>
                </Link>
              </li>
              <li>
                <Link href="/shop?category=tea" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>دمنوش و برگ خشک</span>
                </Link>
              </li>
              <li>
                <Link href="/shop?category=tablets" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>قرص و کپسول سوپرفود</span>
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors flex items-center gap-1 group font-bold text-[#97d2a7]">
                  <ChevronLeft className="w-3 h-3 text-[#97d2a7]" />
                  <span>مشاهده همه محصولات</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Knowledge & Guide (3 Cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#176b39] rounded-full" />
              <span>پایگاه دانش و راهنما</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link href="/articles" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>دانشنامه علمی مورینگا</span>
                </Link>
              </li>
              <li>
                <Link href="/articles/moringa-super-food" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>جدول ارزش غذایی و ترکیبات</span>
                </Link>
              </li>
              <li>
                <Link href="/articles/moringa-tree-miracle" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>خواص دارویی و آنتی‌اکسیدانی</span>
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>پیگیری مرسوله با کد رهگیری</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#f47a24] transition-colors" />
                  <span>ورود به حساب کاربری خریداران</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Channels (3 Cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#2ea355] rounded-full" />
              <span>ارتباط با دفتر مرکزی</span>
            </h4>
            <div className="space-y-3 text-xs text-stone-400">
              <a
                href="tel:09175929345"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-stone-300 hover:text-white transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-[#f47a24] shrink-0" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-stone-400">پشتیبانی و مشاوره تلفنی</span>
                  <span className="font-mono font-bold text-xs text-white">۰۹۱۷۵۹۲۹۳۴۵</span>
                </div>
              </a>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Clock className="w-4 h-4 text-[#2ea355] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-stone-300">
                  <span>ساعات پاسخگویی:</span>
                  <span className="block text-white font-medium">شنبه تا پنج‌شنبه: ۸:۰۰ الی ۲۰:۰۰</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <MapPin className="w-4 h-4 text-[#2ea355] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-stone-300">
                  <span>مزارع و مرکز فرآوری:</span>
                  <span className="block text-white font-medium">هرمزگان، فارس و اصفهان</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Bottom Sleek Bar ── */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right text-xs text-stone-400">
          <p className="leading-relaxed">
            © {new Date().getFullYear()} ایران مورینگا (Iran Moringa) — کلیه حقوق مادی و معنوی برای این برند محفوظ است.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Theme Toggle (Light / Dark / Auto System) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-400">تم:</span>
              <ThemeToggle variant="segmented" />
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 hover:text-white border border-white/[0.08] transition-all text-xs font-medium cursor-pointer"
            >
              <span>بازگشت به بالا</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

