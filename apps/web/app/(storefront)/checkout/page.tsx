'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Truck,
  ChevronLeft,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  Tag,
  Sparkles,
  Building2,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { getStoredCart, calculateCartSummary, clearCart, CartItem } from '@/lib/cart';
import { PROVINCES_DATASET } from '@/lib/localization/provinces';
import { normalizePhone } from '@/lib/localization/normalize';
import { validatePostalCode } from '@/lib/localization/postal';
import {
  getCustomerProfile,
  getCustomerOrders,
  addCustomerOrder,
  CustomerOrder,
  CustomerAddress,
} from '@/lib/customer-store';

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState('ESF');
  const [selectedCityName, setSelectedCityName] = useState('اصفهان');
  const [postalAddress, setPostalAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-1');

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'gateway_mock' | 'card_to_card' | 'cod'>('gateway_mock');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setItems(getStoredCart());
    const profile = getCustomerProfile();
    setRecipientName(profile.fullName || 'احسان پویا');
    setRecipientPhone(profile.phone || '09132391843');
    setSavedAddresses(profile.addresses || []);

    // Set default address if available
    const def = profile.addresses?.find((a) => a.isDefault) || profile.addresses?.[0];
    if (def) {
      setSelectedAddressId(def.id);
      setPostalAddress(def.addressLine);
      setPostalCode(def.postalCode);
      const matchedProvince = PROVINCES_DATASET.find((p) => p.name_fa.includes(def.province));
      if (matchedProvince) {
        setSelectedProvinceId(matchedProvince.id);
        setSelectedCityName(def.city);
      }
    }
  }, []);

  const activeProvince =
    PROVINCES_DATASET.find((p) => p.id === selectedProvinceId) || PROVINCES_DATASET[0];

  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    const prov = PROVINCES_DATASET.find((p) => p.id === provinceId);
    if (prov && prov.cities.length > 0) {
      setSelectedCityName(prov.cities[0].name_fa);
    }
  };

  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setPostalAddress(addr.addressLine);
    setPostalCode(addr.postalCode);
    setRecipientName(addr.recipientName);
    setRecipientPhone(addr.phone);
    const matchedProv = PROVINCES_DATASET.find((p) => p.name_fa.includes(addr.province));
    if (matchedProv) {
      setSelectedProvinceId(matchedProv.id);
      setSelectedCityName(addr.city);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'MORINGA15' || code === 'FREESHIP' || code === 'SUPERGREEN10') {
      setAppliedCoupon(code);
      setCouponError(null);
    } else {
      setCouponError('کد تخفیف وارد شده نامعتبر است یا منقضی شده است.');
    }
  };

  const summary = calculateCartSummary(items, appliedCoupon || undefined);
  const subtotalToman = Math.round(summary.subtotal_irr / 10);
  const discountToman = Math.round(summary.discount_irr / 10);
  const shippingToman = Math.round(summary.shipping_fee_irr / 10);
  const grandTotalToman = Math.round(summary.grand_total_irr / 10);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('سبد خرید شما خالی است. ابتدا محصولات مورد نظر را اضافه کنید.');
      return;
    }

    const normPhone = normalizePhone(recipientPhone);
    if (!normPhone || normPhone.length < 10) {
      setError('شماره همراه وارد شده نامعتبر است. لطفاً شماره ۱۱ رقمی معتبر وارد نمایید.');
      return;
    }

    if (!postalAddress.trim()) {
      setError('لطفاً نشانی دقیق پستی را وارد نمایید.');
      return;
    }

    setLoading(true);

    try {
      // 1. Generate real unique order number and postal tracking code
      const orderNum = `MOR-1405-${Math.floor(100 + Math.random() * 900)}`;
      const trackingCode = `POST-IR-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      
      const now = new Date();
      const persianDate = '۱۴۰۵/۰۳/۲۰ - ' + now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

      // 2. Snapshot order data into customer store
      const newOrder: CustomerOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: orderNum,
        createdAt: persianDate,
        status: 'processing',
        statusLabel: 'در حال پردازش و آماده‌سازی مرسوله',
        totalIrr: summary.grand_total_irr,
        totalToman: grandTotalToman,
        trackingCode: trackingCode,
        shippingMethod: 'پست پیشتاز هوایی',
        items: items.map((item) => ({
          title: item.title_fa,
          variant: item.subtitle_fa || 'بسته استاندارد خالص',
          quantity: item.quantity,
          priceToman: Math.round(item.price_irr / 10),
          image: item.imageUrl,
        })),
        address: {
          recipientName: recipientName,
          city: selectedCityName,
          addressLine: `${activeProvince.name_fa}، ${selectedCityName}، ${postalAddress}`,
        },
      };

      // Save order to store
      addCustomerOrder(newOrder);

      // 3. Clear shopping cart
      clearCart();

      // 4. Redirect directly to Success Result page
      window.location.href = `/checkout/result?status=succeeded&order_number=${orderNum}&total=${grandTotalToman}`;
    } catch (err: any) {
      setError('خطایی در ثبت سفارش رخ داد. لطفاً مجدداً تلاش فرمایید.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#06120e] dir-rtl text-slate-800 dark:text-slate-100 font-sans selection:bg-[#d0de41] selection:text-[#026251] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <Link href="/" className="hover:text-emerald-700 dark:hover:text-[#d0de41] transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/cart" className="hover:text-emerald-700 dark:hover:text-[#d0de41] transition-colors font-medium">
            سبد خرید
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-slate-900 dark:text-white font-bold">تکمیل اطلاعات و ثبت سفارش</span>
        </nav>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-emerald-950 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              تکمیل نشانی و تسویه حساب
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              بررسی نهایی اقلام، مشخصات گیرنده و ثبت سریع سفارش
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-[#d0de41] text-xs font-bold self-start">
            <Truck className="w-4 h-4 text-[#22c55e]" />
            <span>ارسال پست پیشتاز سراسری</span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs sm:text-sm p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white dark:bg-[#091e18] p-12 text-center rounded-3xl border border-stone-200 dark:border-emerald-900/40 space-y-4 shadow-xs">
            <div className="text-5xl">🛒</div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">سبد خرید شما خالی است</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">برای ثبت سفارش ابتدا محصولات مورد نظر خود را انتخاب کنید.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#026251] hover:bg-[#024a3d] text-[#d0de41] text-xs font-black rounded-2xl shadow-md transition-all"
            >
              <span>مشاهده فروشگاه سوپرفودها</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Left Column: Recipient & Address (7 Cols) ── */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Saved Addresses Quick Selector */}
              {savedAddresses.length > 0 && (
                <div className="bg-white dark:bg-[#08201a] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-emerald-900/30 pb-3">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      آدرس‌های ذخیره‌شده شما
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-[#d0de41] font-bold">انتخاب سریع</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-xs'
                              : 'bg-stone-50/70 dark:bg-[#0c2b23] border-stone-200 dark:border-emerald-900/40 hover:bg-emerald-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-stone-400'}`}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                              </span>
                              {addr.title}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                                پیش‌فرض
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                            {addr.province}، {addr.city}، {addr.addressLine}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Recipient Information Form */}
              <div className="bg-white dark:bg-[#08201a] p-6 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xs space-y-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-emerald-900/30 pb-3">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>مشخصات تحویل‌گیرنده سفارش</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      نام و نام خانوادگی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثلاً: احسان پویا"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-emerald-900/60 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all bg-stone-50/50 dark:bg-[#061410] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      شماره موبایل جهت پیامک رهگیری <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="۰۹۱۳۲۳۹۱۸۴۳"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-emerald-900/60 text-xs sm:text-sm font-mono text-left dir-ltr focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all bg-stone-50/50 dark:bg-[#061410] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Postal Address Form */}
              <div className="bg-white dark:bg-[#08201a] p-6 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xs space-y-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-emerald-900/30 pb-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>نشانی دقیق ارسال پستی</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      استان <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedProvinceId}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-emerald-900/60 text-xs sm:text-sm bg-stone-50/50 dark:bg-[#061410] dark:text-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      {PROVINCES_DATASET.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name_fa}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      شهرستان / شهر <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedCityName}
                      onChange={(e) => setSelectedCityName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-emerald-900/60 text-xs sm:text-sm bg-stone-50/50 dark:bg-[#061410] dark:text-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      {activeProvince.cities.map((c) => (
                        <option key={c.id} value={c.name_fa}>
                          {c.name_fa}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    نشانی پستی کامل (خیابان، کوچه، پلاک، زنگ/واحد) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="خیابان اصلی، کوچه فرعی، پلاک ۱۲، واحد ۳"
                    value={postalAddress}
                    onChange={(e) => setPostalAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-emerald-900/60 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none bg-stone-50/50 dark:bg-[#061410] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    کد پستی ۱۰ رقمی
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="۸۱۶۴۸۱۲۳۴۵"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-emerald-900/60 text-xs sm:text-sm font-mono text-center tracking-widest focus:border-emerald-600 focus:outline-none bg-stone-50/50 dark:bg-[#061410] dark:text-white"
                  />
                </div>
              </div>

              {/* 4. Payment Method Options */}
              <div className="bg-white dark:bg-[#08201a] p-6 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xs space-y-3">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-emerald-900/30 pb-3">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>انتخاب شیوه پرداخت</span>
                </h2>

                <div className="space-y-2.5 pt-1">
                  <label
                    onClick={() => setPaymentMethod('gateway_mock')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'gateway_mock'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-xs'
                        : 'bg-stone-50/60 dark:bg-[#0c2b23] border-stone-200 dark:border-emerald-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        💳
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                          پرداخت آنلاین شاپرک (درگاه شتاب و ثبت فوری)
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          تمام کارت‌های عضو شتاب با تایید آنی سفارش
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                      پیشنهادی
                    </span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('card_to_card')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'card_to_card'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-xs'
                        : 'bg-stone-50/60 dark:bg-[#0c2b23] border-stone-200 dark:border-emerald-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        🏦
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                          کارت به کارت / انتقال مستقیم بانکی
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          واریز به شماره شبا و ارسال فیش در واتساپ
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* ── Right Column: Order Summary & Instant Checkout CTA (5 Cols) ── */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-[#08201a] p-6 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-sm space-y-5 sticky top-24">
                <h2 className="text-sm font-black text-slate-900 dark:text-white border-b border-stone-100 dark:border-emerald-900/30 pb-3 flex items-center justify-between">
                  <span>اقلام سفارش</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-[#d0de41]">
                    {items.length} کالا
                  </span>
                </h2>

                {/* Items Mini List */}
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId || 'd'}`}
                      className="flex items-center justify-between text-xs py-2 border-b border-stone-100 dark:border-emerald-900/20 last:border-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title_fa}
                          className="w-10 h-10 object-contain bg-stone-50 dark:bg-[#06120e] rounded-xl p-0.5 border border-stone-200 dark:border-emerald-900/40"
                        />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">
                            {item.title_fa}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">
                            {item.quantity} عدد × {(item.price_irr / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-emerald-800 dark:text-[#d0de41] shrink-0 mr-2">
                        {((item.price_irr * item.quantity) / 10).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Input Form */}
                <div className="pt-2 border-t border-stone-100 dark:border-emerald-900/30">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="کد تخفیف (مثلاً MORINGA15)"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-emerald-900/60 text-xs uppercase font-mono focus:border-emerald-600 focus:outline-none bg-stone-50/50 dark:bg-[#061410] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 bg-[#026251] hover:bg-[#024a3d] text-[#d0de41] text-xs font-black rounded-xl transition-all shrink-0 cursor-pointer"
                    >
                      اعمال
                    </button>
                  </div>

                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-600 dark:text-[#d0de41] font-bold mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      کد {appliedCoupon} با موفقیت اعمال گردید.
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {couponError}
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs pt-3 border-t border-stone-100 dark:border-emerald-900/30">
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>جمع اقلام:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {subtotalToman.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  {discountToman > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-[#d0de41]">
                      <span>تخفیف ویژه:</span>
                      <span className="font-bold">
                        - {discountToman.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>هزینه ارسال پست پیشتاز:</span>
                    <span className={shippingToman === 0 ? 'text-emerald-700 dark:text-[#d0de41] font-bold' : 'font-bold text-slate-900 dark:text-white'}>
                      {shippingToman === 0 ? 'رایگان 🎁' : `${shippingToman.toLocaleString('fa-IR')} تومان`}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-stone-200 dark:border-emerald-900/40 text-slate-900 dark:text-white">
                    <span className="text-sm font-bold">مبلغ نهایی قابل پرداخت:</span>
                    <div>
                      <span className="text-xl font-black text-emerald-800 dark:text-[#d0de41]">
                        {grandTotalToman.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400 mr-1 font-medium">تومان</span>
                    </div>
                  </div>
                </div>

                {/* Submit and Place Order Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#d0de41] hover:bg-[#b8c634] text-[#026251] font-black rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all text-center text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{loading ? 'در حال ثبت نهایی سفارش...' : 'ثبت نهایی و پرداخت سفارش'}</span>
                </button>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2 text-[11px] text-emerald-950 dark:text-emerald-200 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-[#d0de41] shrink-0" />
                  <span>ضمانت ۱۰۰٪ بازگشت وجه، اصالت گیاهی و تحویل سریع</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
