'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PhoneCall,
  MessageCircle,
  Send,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Truck,
  MapPin,
  User,
  Clock,
  ShieldCheck,
  Package,
  ShoppingBag,
  Printer,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  Phone,
  ExternalLink,
  MessageSquare,
  Building2,
  Hourglass,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { getCustomerOrders, CustomerOrder } from '@/lib/customer-store';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('id');

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedShaba, setCopiedShaba] = useState(false);

  // Store bank & contact info matching exact specifications
  const supportPhone = '09175929345';
  const supportPhoneDisplay = '۰۹۱۷۵۹۲۹۳۴۵';
  const baleId = 'iranmoringa';
  const baleUrl = 'https://ble.ir/iranmoringa';

  // Bank Info (Mehr Iran Bank)
  const bankName = 'مهر ایران';
  const cardNumberFormatted = '۶۰۶۳-۷۳۷۰-۰۵۰۴-۰۳۲۲';
  const cardNumberRaw = '6063737005040322';
  const accountNumber = '240511120246861';
  const accountNumberFa = '۲۴۰۵۱۱۱۲۰۲۴۶۸۶۱';
  const shabaNumber = '640600240501112024686001';
  const shabaNumberFa = '۶۴۰۶۰۰۲۴۰۵۰۱۱۱۲۰۲۴۶۸۶۰۰۱';

  useEffect(() => {
    const orders = getCustomerOrders();
    if (orderId) {
      const found = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (found) {
        setOrder(found);
        return;
      }
    }
    // Fallback to most recent order if available
    if (orders.length > 0) {
      setOrder(orders[0]);
    }
  }, [orderId]);

  const handleCopy = (text: string, type: 'code' | 'card' | 'account' | 'shaba') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } else if (type === 'card') {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    } else if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    } else if (type === 'shaba') {
      setCopiedShaba(true);
      setTimeout(() => setCopiedShaba(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const orderNum = order?.orderNumber || 'IM-1405-892';
  const totalToman = order?.totalToman || 0;
  const recipientName = order?.address?.recipientName || 'خریدار محترم';
  const recipientCity = order?.address?.city || 'اصفهان';
  const shippingTitle = order?.shippingMethod || 'پست پیشتاز سراسری';

  const itemsSummaryText = order?.items && order.items.length > 0
    ? order.items.map((i) => `• ${i.title} (${i.variant}) - ${i.quantity} عدد`).join('\n')
    : '• محصولات ثبت‌شده در سبد خرید';

  // Compact SMS message (< 130 chars / strictly 2 parts)
  const smsMessage = `سفارش در سایت ثبت شد:
کد: ${orderNum}
نام: ${recipientName}
مبلغ: ${totalToman.toLocaleString('fa-IR')} تومان
لطفاً جهت واریز و ارسال راهنمایی فرمایید.`;

  // Full rich message for WhatsApp and Bale
  const fullMessengerMessage = `سلام وقت بخیر 🌿
سفارش من در سایت ثبت شد:
📋 کد رهگیری سفارش: ${orderNum}
👤 تحویل‌گیرنده: ${recipientName}
💰 مبلغ کل: ${totalToman.toLocaleString('fa-IR')} تومان
📍 مقصد: ${recipientCity}
📦 شیوه ارسال: ${shippingTitle}
🛒 اقلام:
${itemsSummaryText}

فیش واریزی به شماره کارت ${cardNumberFormatted} (بانک مهر ایران) آماده ارسال است. لطفاً راهنمایی بفرمایید. تشکر 🙏`;

  const whatsappUrl = `https://wa.me/98${supportPhone.slice(1)}?text=${encodeURIComponent(fullMessengerMessage)}`;
  const smsUrl = `sms:${supportPhone}?body=${encodeURIComponent(smsMessage)}`;
  const telUrl = `tel:${supportPhone}`;

  return (
    <div className="space-y-8 print:space-y-4">
      {/* ── 1. Hero Celebration Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#114627] via-[#176b39] to-[#0a331b] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#2ea355]/30 text-center">
        {/* Glow decorative spheres */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#c3e5cd]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#f47a24]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          {/* Animated Icon Badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl shadow-inner animate-bounce duration-1000">
              📞
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#2ea355] text-white rounded-full flex items-center justify-center border-2 border-[#114627] shadow-md">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c3e5cd]/20 border border-[#c3e5cd]/30 text-[#c3e5cd] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>اطلاعات شما با موفقیت ثبت شد</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-snug sm:leading-normal">
            سفارش شما با موفقیت ثبت شد! 🎉
          </h1>

          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-lg mx-auto">
            کالاهای انتخابی شما در انبار رزرو شده است. لطفاً طبق مشخصات زیر، پرداخت کارت‌به‌کارت را انجام داده و فیش را ارسال فرمایید.
          </p>
        </div>
      </div>

      {/* ── 2. Order Code & Total Amount Spotlight Card ── */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border-2 border-[#176b39] dark:border-[#2ea355] shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#f2f9f4] dark:bg-[#0a331b] p-5 sm:p-6 rounded-2xl border border-[#c3e5cd] dark:border-[#14552f]">
          {/* Order Code Callout */}
          <div className="text-center md:text-right space-y-1">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block">
              کد اختصاصی پیگیری سفارش شما:
            </span>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#176b39] dark:text-[#97d2a7] tracking-wider dir-ltr select-all">
                {orderNum}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(orderNum, 'code')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#176b39] hover:bg-[#14552f] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                title="کپی کد سفارش"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی کد</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block w-px h-16 bg-[#c3e5cd] dark:bg-stone-700" />

          {/* Amount Box */}
          <div className="text-center md:text-left space-y-1">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block">
              مبلغ نهایی قابل پرداخت:
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#176b39] dark:text-[#97d2a7]">
              {totalToman > 0 ? totalToman.toLocaleString('fa-IR') : '—'}{' '}
              <span className="text-sm font-bold">تومان</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. EXACT BANK PAYMENT INSTRUCTIONS (بخش پرداخت و مشخصات بانکی دقیق) ── */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border-2 border-[#f47a24] shadow-xl space-y-6">
        {/* Top Orange Header Banner */}
        <div className="p-4 sm:p-5 bg-[#ff6036] text-white rounded-2xl text-center space-y-1.5 shadow-md">
          <h2 className="text-base sm:text-xl font-black">
            اکنون پرداخت خود را با اپلیکیشن بانک یا عابر بانک کارت به کارت کنید
          </h2>
        </div>

        {/* Big Card Highlight Banner */}
        <div className="p-5 sm:p-6 bg-[#ff6036] text-white rounded-2xl text-center space-y-3 shadow-md">
          <span className="text-xs sm:text-sm font-bold block opacity-95">
            شماره کارت جهت واریز مبلغ نهایی و ثبت سفارش:
          </span>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-widest dir-ltr select-all">
              {cardNumberFormatted}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(cardNumberRaw, 'card')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#ff6036] hover:bg-stone-100 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              {copiedCard ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی شماره کارت</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Explanatory Notice Notes */}
        <div className="space-y-2 text-center text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-200">
          <p className="flex items-center justify-center gap-2 text-[#176b39] dark:text-[#97d2a7]">
            <MessageCircle className="w-4 h-4 shrink-0 text-[#25D366]" />
            <span>سپس فیش خود را به شماره <strong>{supportPhoneDisplay}</strong> واتساپ نمایید.</span>
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 inline-flex items-center justify-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-medium">
            <Hourglass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>سفارش شما تا ۱ ساعت باز، بعد از آن در صورت عدم پرداخت از سیستم حذف خواهد شد.</span>
          </div>
        </div>

        {/* Detailed Bank Account Specifications List */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#176b39] dark:text-[#97d2a7]" />
            <h3 className="text-base sm:text-lg font-black text-[#17251c] dark:text-white">
              مشخصات بانکی:
            </h3>
          </div>

          <div className="p-5 rounded-2xl bg-[#fafbf8] dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-3.5 text-xs sm:text-sm">
            <div className="font-bold text-stone-800 dark:text-stone-100 text-sm">
              بانک مهر ایران:
            </div>

            <ul className="space-y-3 pr-2">
              <li className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff6036]" />
                <span>نام بانک:</span>
                <strong className="text-[#17251c] dark:text-white font-black">{bankName}</strong>
              </li>

              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6036]" />
                  <span>شماره کارت:</span>
                  <strong className="font-mono text-sm sm:text-base font-black text-[#17251c] dark:text-white dir-ltr">
                    {cardNumberFormatted}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(cardNumberRaw, 'card')}
                  className="px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold transition-all cursor-pointer self-end sm:self-auto"
                >
                  {copiedCard ? 'کپی شد ✓' : 'کپی'}
                </button>
              </li>

              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6036]" />
                  <span>شماره حساب:</span>
                  <strong className="font-mono text-sm sm:text-base font-black text-[#17251c] dark:text-white dir-ltr">
                    {accountNumberFa}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(accountNumber, 'account')}
                  className="px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold transition-all cursor-pointer self-end sm:self-auto"
                >
                  {copiedAccount ? 'کپی شد ✓' : 'کپی'}
                </button>
              </li>

              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6036]" />
                  <span>شماره حساب بانک بین المللی (شبا):</span>
                  <strong className="font-mono text-xs sm:text-sm font-black text-[#17251c] dark:text-white dir-ltr truncate">
                    {shabaNumberFa}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(shabaNumber, 'shaba')}
                  className="px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold transition-all cursor-pointer self-end sm:self-auto shrink-0"
                >
                  {copiedShaba ? 'کپی شد ✓' : 'کپی'}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── 4. ACTION CHANNELS (راه‌های ارتباطی و ارسال فیش) ── */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-[#e5e8de] dark:border-stone-800 shadow-sm space-y-5">
        <div className="text-center sm:text-right space-y-1 border-b border-stone-100 dark:border-stone-800 pb-3">
          <h2 className="text-base sm:text-lg font-black text-[#17251c] dark:text-white">
            ارسال فیش واریزی و ارتباط با پشتیبانی:
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            برای تسریع در ارسال بسته، فیش را در واتساپ یا بله ارسال فرمایید یا پیامک بزنید.
          </p>
        </div>

        {/* 4 Clickable Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. WhatsApp Action Card */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-between gap-4 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform text-2xl">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-xs font-medium text-white/90 block">ارسال فیش در واتساپ:</span>
                <span className="text-base sm:text-lg font-black text-white font-mono dir-ltr block">
                  {supportPhoneDisplay}
                </span>
                <span className="text-[11px] text-white/80 block">
                  کلیک برای ارسال فیش و تأیید آنی در واتساپ 🚀
                </span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform shrink-0" />
          </a>

          {/* 2. Bale Messenger Action Card */}
          <a
            href={baleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-[#00a884] hover:bg-[#008f70] text-white flex items-center justify-between gap-4 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform text-2xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-xs font-medium text-white/90 block">پیام‌رسان بله (آیدی اختصاصی):</span>
                <span className="text-base sm:text-lg font-black text-white font-mono dir-ltr block">
                  @{baleId}
                </span>
                <span className="text-[11px] text-white/80 block">
                  کلیک برای چت و ارسال فیش در بله 💬
                </span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform shrink-0" />
          </a>

          {/* 3. Direct Phone Call Card */}
          <a
            href={telUrl}
            className="p-5 rounded-2xl bg-[#176b39] hover:bg-[#14552f] text-white flex items-center justify-between gap-4 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform text-2xl">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-xs font-medium text-white/90 block">تماس تلفنی مستقیم با واحد فروش:</span>
                <span className="text-base sm:text-lg font-black text-white font-mono dir-ltr block">
                  {supportPhoneDisplay}
                </span>
                <span className="text-[11px] text-white/80 block">
                  شماره‌گیری جهت هماهنگی و اعلام واریز 📞
                </span>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-white/80 group-hover:-translate-x-1 transition-transform shrink-0" />
          </a>

          {/* 4. SMS Action Card */}
          <a
            href={smsUrl}
            className="p-5 rounded-2xl bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-900 hover:to-black text-white flex items-center justify-between gap-4 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform text-2xl">
                <Send className="w-6 h-6" />
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-xs font-medium text-white/90 block">ارسال پیامک SMS:</span>
                <span className="text-base sm:text-lg font-black text-white font-mono dir-ltr block">
                  {supportPhoneDisplay}
                </span>
                <span className="text-[11px] text-stone-300 block">
                  ارسال پیامک کوتاه فاکتور ✉️
                </span>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-stone-300 group-hover:-translate-x-1 transition-transform shrink-0" />
          </a>
        </div>
      </div>

      {/* ── 5. Registered Order Details & Invoice (فاکتور و اقلام ثبت شده) ── */}
      {order && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#176b39] dark:text-[#97d2a7]" />
              <h2 className="text-sm sm:text-base font-black text-[#17251c] dark:text-white">
                مشخصات سفارش و فاکتور اقلام
              </h2>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all print:hidden cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ فاکتور</span>
            </button>
          </div>

          {/* Delivery & Recipient Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#fafbf8] dark:bg-stone-800 border border-[#e5e8de] dark:border-stone-700 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#176b39] dark:text-[#97d2a7]">
                <User className="w-4 h-4" />
                <span>تحویل‌گیرنده:</span>
              </div>
              <p className="text-[#17251c] dark:text-white font-bold">
                {order.address.recipientName}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#fafbf8] dark:bg-stone-800 border border-[#e5e8de] dark:border-stone-700 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#176b39] dark:text-[#97d2a7]">
                <Truck className="w-4 h-4" />
                <span>شیوه ارسال:</span>
              </div>
              <p className="text-[#17251c] dark:text-white font-bold">
                {order.shippingMethod || 'پست پیشتاز سراسری'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#fafbf8] dark:bg-stone-800 border border-[#e5e8de] dark:border-stone-700 space-y-2 sm:col-span-2">
              <div className="flex items-center gap-1.5 font-bold text-[#176b39] dark:text-[#97d2a7]">
                <MapPin className="w-4 h-4" />
                <span>نشانی کامل ارسال:</span>
              </div>
              <p className="text-stone-700 dark:text-stone-200 leading-relaxed">
                {order.address.city}، {order.address.addressLine}
              </p>
            </div>
          </div>

          {/* Items Table / List */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block">
              اقلام ثبت شده در این سفارش ({order.items.length} کالا):
            </span>

            <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-[#e5e8de] dark:border-stone-700 rounded-2xl overflow-hidden">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-[#fafbf8] dark:bg-stone-800/50 hover:bg-white dark:hover:bg-stone-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-contain bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#176b39]/10 text-[#176b39] flex items-center justify-center text-lg shrink-0">
                        🌿
                      </div>
                    )}
                    <div className="truncate">
                      <span className="text-xs sm:text-sm font-bold text-[#17251c] dark:text-white block truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate">
                        {item.variant} • تعداد: {item.quantity} عدد
                      </span>
                    </div>
                  </div>

                  <div className="text-left dir-ltr shrink-0">
                    <span className="text-xs sm:text-sm font-black text-[#176b39] dark:text-[#97d2a7]">
                      {(item.priceToman * item.quantity).toLocaleString('fa-IR')}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 ml-1">تومان</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Trust Badges ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-[#e5e8de] dark:border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#176b39]/15 text-[#176b39] dark:text-[#97d2a7] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-[#17251c] dark:text-white block">ضمانت اصالت و سلامت</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">۱۰۰٪ خالص و ارگانیک</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-[#e5e8de] dark:border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#176b39]/15 text-[#176b39] dark:text-[#97d2a7] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-[#17251c] dark:text-white block">ارسال سریع پستی</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">به تمام نقاط کشور</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-[#e5e8de] dark:border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#176b39]/15 text-[#176b39] dark:text-[#97d2a7] flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-[#17251c] dark:text-white block">پشتیبانی مستقیم</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">{supportPhoneDisplay}</span>
          </div>
        </div>
      </div>

      {/* ── 7. Bottom Navigation CTAs ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 print:hidden">
        <Link
          href="/tracking"
          className="w-full sm:w-auto px-6 py-3.5 bg-[#176b39] hover:bg-[#14552f] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          <span>رهگیری وضعیت سفارشات پستی</span>
        </Link>

        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[#17251c] dark:text-white font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>بازگشت به فروشگاه محصولات</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafbf8] dark:bg-[#072714] dir-rtl text-[#17251c] dark:text-[#f2f9f4] font-sans selection:bg-[#c3e5cd] selection:text-[#176b39] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 mb-6 print:hidden">
          <Link href="/" className="hover:text-[#176b39] transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/cart" className="hover:text-[#176b39] transition-colors font-medium">
            سبد خرید
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[#17251c] dark:text-white font-bold">ثبت نهایی و راه‌های ارتباطی سفارش</span>
        </nav>

        <Suspense
          fallback={
            <div className="p-16 text-center text-stone-400 text-sm">
              در حال بارگذاری اطلاعات سفارش...
            </div>
          }
        >
          <OrderConfirmationContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
