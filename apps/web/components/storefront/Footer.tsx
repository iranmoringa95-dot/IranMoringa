'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ShieldCheck, Sparkles, HeartHandshake, Leaf, PhoneCall, Mail, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#01382e] dark:bg-[#021813] text-white/85 text-xs sm:text-sm pt-14 pb-8 border-t border-emerald-950/80 dark:border-emerald-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Badges / Guarantees */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10 border-b border-emerald-900/60">
          <div className="flex items-center gap-3 bg-emerald-900/30 p-3.5 rounded-2xl border border-emerald-800/40">
            <div className="w-10 h-10 rounded-xl bg-[#d0de41]/15 text-[#d0de41] flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-white text-xs sm:text-sm">۱۰۰٪ خالص و ارگانیک</div>
              <div className="text-[11px] text-white/60">کشت پایدار در مزارع جنوب ایران</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-emerald-900/30 p-3.5 rounded-2xl border border-emerald-800/40">
            <div className="w-10 h-10 rounded-xl bg-[#d0de41]/15 text-[#d0de41] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-white text-xs sm:text-sm">ضمانت اصالت و خلوص</div>
              <div className="text-[11px] text-white/60">آنالیز آزمایشگاهی و برگ بازگشت</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-emerald-900/30 p-3.5 rounded-2xl border border-emerald-800/40">
            <div className="w-10 h-10 rounded-xl bg-[#d0de41]/15 text-[#d0de41] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-white text-xs sm:text-sm">سوپرفود استاندارد جهانی</div>
              <div className="text-[11px] text-white/60">الهام‌گرفته از Kuli Kuli Foods</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-emerald-900/30 p-3.5 rounded-2xl border border-emerald-800/40">
            <div className="w-10 h-10 rounded-xl bg-[#d0de41]/15 text-[#d0de41] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-white text-xs sm:text-sm">حمایت از کشاورزان بومی</div>
              <div className="text-[11px] text-white/60">تجارت عادلانه و احیای خاک</div>
            </div>
          </div>
        </div>

        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <BrandLogo
              theme="light"
              size="md"
              showSubtext={true}
              subtextLang="both"
              href="/"
            />
            <p className="text-xs text-white/70 leading-relaxed text-justify">
              ایران مورینگا، پیشگام تولید و فرآوری سوپرفودهای گیاهی درخت زندگی (Moringa Oleifera) در ایران است. با تمرکز بر بالاترین درجه خلوص، انرژی پاک پایدار و نشاط طبیعی را به سفره شما می‌آوریم.
            </p>
          </div>

          {/* Nav links */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm border-r-2 border-[#d0de41] pr-2.5">
              دسترسی سریع به فروشگاه
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/shop" className="hover:text-[#d0de41] transition-colors flex items-center gap-1.5">
                  <span>•</span> <span>فروشگاه سوپرفودهای مورینگا</span>
                </Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-[#d0de41] transition-colors flex items-center gap-1.5">
                  <span>•</span> <span>دانشنامه و مقالات علمی</span>
                </Link>
              </li>
              <li>
                <Link href="/#why-moringa" className="hover:text-[#d0de41] transition-colors flex items-center gap-1.5">
                  <span>•</span> <span>ارزش‌های تغذیه‌ای مورینگا</span>
                </Link>
              </li>
              <li>
                <Link href="/#smoothies" className="hover:text-[#d0de41] transition-colors flex items-center gap-1.5">
                  <span>•</span> <span>دستورهای کاربردی اسموتی و ماسک</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm border-r-2 border-[#d0de41] pr-2.5">
              خدمات مشتریان و راهنما
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/tracking" className="hover:text-[#d0de41] transition-colors flex items-center gap-1.5">
                  <span>•</span> <span>رهگیری سفارشات پستی</span>
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[#d0de41] transition-colors flex items-center gap-1.5">
                  <span>•</span> <span>مشاهده سبد خرید</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#d0de41] transition-colors flex items-center gap-1.5">
                  <span>•</span> <span>ورود / عضویت در باشگاه مشتریان</span>
                </Link>
              </li>
              <li>
                <Link href="/articles/moringa-safety-dosage" className="hover:text-[#d0de41] transition-colors flex items-center gap-1.5">
                  <span>•</span> <span>راهنمای دوز مصرف و منع مصرف</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm border-r-2 border-[#d0de41] pr-2.5">
              تماس و مشاوره تخصصی
            </h4>
            <div className="space-y-2.5 text-xs text-white/75">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#d0de41] shrink-0" />
                <span>مشاوره و پشتیبانی: ۰۹۱۷۵۹۲۹۳۴۵</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d0de41] shrink-0" />
                <span>شنبه تا پنج‌شنبه: ۸:۰۰ الی ۱۸:۰۰</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#d0de41] shrink-0" />
                <span className="font-mono">support@moringalab.ir</span>
              </div>
              <div className="mt-2 text-[11px] text-white/60 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-900">
                🌱 مزارع و فرآوری: هرمزگان، فارس و بوشهر
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright and Designer Credit */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right text-xs text-white/60">
          <p>© {new Date().getFullYear()} ایران مورینگا (IRAN MORINGA). کلیه حقوق محفوظ است.</p>
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <span>طراحی و اجرا:</span>
            <a
              href="mailto:pqehsan@gmail.com"
              className="text-[#d0de41] hover:text-[#b8c634] hover:underline font-bold transition-colors"
              title="ارسال ایمیل به احسان پویا"
            >
              احسان پویا
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
