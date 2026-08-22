'use client';

import React, { useState } from 'react';
import {
  Settings,
  Truck,
  CreditCard,
  Bell,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  Percent,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'shipping' | 'payment' | 'sms' | 'storefront'>('shipping');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [freeShippingThresholdToman, setFreeShippingThresholdToman] = useState('500000');
  const [shippingFeeToman, setShippingFeeToman] = useState('45000');
  const [processingTimeHours, setProcessingTimeHours] = useState('24');

  // Payment states
  const [zarinpalMerchantId, setZarinpalMerchantId] = useState('6d3e8912-789a-4e2a-a1b2-c3d4e5f6a7b8');
  const [zarinpalSandbox, setZarinpalSandbox] = useState(true);
  const [cardToCardActive, setCardToCardActive] = useState(true);
  const [cardNumber, setCardNumber] = useState('6037-9975-1234-5678');
  const [shabaNumber, setShabaNumber] = useState('IR12-0170-0000-0012-3456-7890');
  const [cardHolderName, setCardHolderName] = useState('احسان پویا (ایران مورینگا)');
  const [bankName, setBankName] = useState('بانک ملی ایران');
  const [codActive, setCodActive] = useState(false);

  // SMS states
  const [smsApiKey, setSmsApiKey] = useState('wbone_live_sec_8923746192837461928');
  const [smsLineNumber, setSmsLineNumber] = useState('30008899');
  const [smsOrderConfirmation, setSmsOrderConfirmation] = useState(true);
  const [smsShippingTracking, setSmsShippingTracking] = useState(true);

  // Storefront announcement states
  const [announcementText, setAnnouncementText] = useState('تضمین ۱۰۰٪ خلوص و اصالت ارگانیک برگ‌های سایه‌خشک مورینگا اولیفرا • ارسال سریع پستی به سراسر ایران');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [supportPhone, setSupportPhone] = useState('09132391843');
  const [officeAddress, setOfficeAddress] = useState('اصفهان، چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#08201a] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-[#026251] dark:text-[#d0de41] flex items-center justify-center font-black">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              تنظیمات جامع فروشگاه و زیرساخت
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              پیکربندی درگاه‌های پرداخت، قوانین ارسال، سامانه پیامکی WebOne و اعلان‌های عمومی
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
            <span>تنظیمات با موفقیت ذخیره شد.</span>
          </div>
        )}
      </div>

      {/* Tabs Nav */}
      <div className="flex bg-white dark:bg-[#08201a] p-2 rounded-3xl border border-slate-200 dark:border-emerald-900/40 shadow-sm text-xs font-bold gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('shipping')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'shipping'
              ? 'bg-[#026251] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>قوانین ارسال و پست</span>
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'payment'
              ? 'bg-[#026251] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>درگاه‌های پرداخت الکترونیک</span>
        </button>

        <button
          onClick={() => setActiveTab('sms')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'sms'
              ? 'bg-[#026251] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>سامانه پیامک WebOne</span>
        </button>

        <button
          onClick={() => setActiveTab('storefront')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'storefront'
              ? 'bg-[#026251] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>اعلان‌ها و اطلاعات فروشگاه</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: SHIPPING */}
        {activeTab === 'shipping' && (
          <div className="bg-white dark:bg-[#08201a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-emerald-900/40 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-emerald-950 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
              <span>پیکربندی آستانه ارسال رایگان و تعرفه پستی</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  سقف خرید برای ارسال رایگان (تومان) *
                </label>
                <input
                  type="number"
                  value={freeShippingThresholdToman}
                  onChange={(e) => setFreeShippingThresholdToman(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs font-mono font-bold dark:text-white focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[11px] text-slate-400">
                  خریدهای بالاتر از این مبلغ به طور خودکار با هزینه ارسال صفر محاسبه می‌شوند.
                </span>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  هزینه ثابت پست پیشتاز سراسری (تومان) *
                </label>
                <input
                  type="number"
                  value={shippingFeeToman}
                  onChange={(e) => setShippingFeeToman(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs font-mono font-bold dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  زمان تخمینی آماده‌سازی و بسته‌بندی (ساعت)
                </label>
                <input
                  type="number"
                  value={processingTimeHours}
                  onChange={(e) => setProcessingTimeHours(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs font-mono font-bold dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            {/* ZarinPal Gateway */}
            <div className="bg-white dark:bg-[#08201a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-emerald-900/40 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black">
                    💳
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      درگاه پرداخت آنلاین شاپرک (زرین‌پال)
                    </h3>
                    <p className="text-[11px] text-slate-400">اتصال شاپرک با پروتکل رسمی ZarinPal REST API</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-black">
                  فعال
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    کد پذیرنده درگاه (Merchant ID)
                  </label>
                  <input
                    type="text"
                    value={zarinpalMerchantId}
                    onChange={(e) => setZarinpalMerchantId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl font-mono text-xs text-left dir-ltr dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#041410] rounded-2xl border border-slate-200 dark:border-emerald-900/40 md:col-span-2">
                  <input
                    type="checkbox"
                    id="sandbox"
                    checked={zarinpalSandbox}
                    onChange={(e) => setZarinpalSandbox(e.target.checked)}
                    className="w-4 h-4 text-[#026251] rounded cursor-pointer"
                  />
                  <label htmlFor="sandbox" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    حالت تستی آزمایشی Sandbox (برای شبیه‌سازی پرداخت بدون تراکنش واقعی)
                  </label>
                </div>
              </div>
            </div>

            {/* Card to Card */}
            <div className="bg-white dark:bg-[#08201a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-emerald-900/40 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-emerald-950 pb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
                <span>مشخصات حساب بانکی و کارت به کارت</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    شماره کارت بانکی (۱۶ رقمی)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl font-mono text-xs text-left dir-ltr dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    نام صاحب حساب و بانک
                  </label>
                  <input
                    type="text"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    شماره شبا (IBAN)
                  </label>
                  <input
                    type="text"
                    value={shabaNumber}
                    onChange={(e) => setShabaNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl font-mono text-xs text-left dir-ltr dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SMS */}
        {activeTab === 'sms' && (
          <div className="bg-white dark:bg-[#08201a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-emerald-900/40 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-emerald-950 pb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
              <span>پیکربندی پنل وب‌وان اس‌ام‌اس (WebOneSMS)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  کلید دسترسی وب‌سرویس (API Key)
                </label>
                <input
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl font-mono text-xs text-left dir-ltr dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  سرخط اختصاصی ارسال پیامک
                </label>
                <input
                  type="text"
                  value={smsLineNumber}
                  onChange={(e) => setSmsLineNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl font-mono text-xs text-left dir-ltr dark:text-white"
                />
              </div>

              <div className="md:col-span-2 space-y-3 pt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#041410] rounded-2xl border border-slate-200 dark:border-emerald-900/40">
                  <input
                    type="checkbox"
                    id="sms_order"
                    checked={smsOrderConfirmation}
                    onChange={(e) => setSmsOrderConfirmation(e.target.checked)}
                    className="w-4 h-4 text-[#026251] rounded cursor-pointer"
                  />
                  <label htmlFor="sms_order" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    ارسال خودکار پیامک تایید و فاکتور بلافاصله پس از ثبت سفارش موفق
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#041410] rounded-2xl border border-slate-200 dark:border-emerald-900/40">
                  <input
                    type="checkbox"
                    id="sms_track"
                    checked={smsShippingTracking}
                    onChange={(e) => setSmsShippingTracking(e.target.checked)}
                    className="w-4 h-4 text-[#026251] rounded cursor-pointer"
                  />
                  <label htmlFor="sms_track" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    ارسال خودکار کد رهگیری پستچی ۲۴ رقمی به محض تحویل بسته به پست
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STOREFRONT */}
        {activeTab === 'storefront' && (
          <div className="bg-white dark:bg-[#08201a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-emerald-900/40 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-emerald-950 pb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
              <span>نوار اعلان، اطلاعات تماس و دفتر مرکزی</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  متن نوار اعلان بالای صفحات فروشگاه (Top Notification Banner)
                </label>
                <textarea
                  rows={2}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    شماره تماس پشتیبانی مشتریان
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl font-mono text-xs dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    نشانی پستی دفتر مرکزی و مزرعه
                  </label>
                  <input
                    type="text"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 bg-[#026251] hover:bg-[#014d3f] text-white rounded-2xl font-black text-xs transition-all shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره کلیه تغییرات و به‌روزرسانی تنظیمات</span>
          </button>
        </div>
      </form>
    </div>
  );
}
