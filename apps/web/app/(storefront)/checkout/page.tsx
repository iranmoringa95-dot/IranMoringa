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
  Clock,
  Box,
  Scale,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { getStoredCart, calculateCartSummary, clearCart, CartItem } from '@/lib/cart';
import { PROVINCES_DATASET } from '@/lib/localization/provinces';
import { normalizePhone } from '@/lib/localization/normalize';
import { validatePostalCode } from '@/lib/localization/postal';
import {
  calculateShippingQuotes,
  isCityIsfahan,
  ShippingQuote,
} from '@/lib/shipping';
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

  // Shipping Method state
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<'courier_isfahan' | 'post_pishtaz'>('courier_isfahan');

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'phone_order' | 'card_to_card' | 'gateway_mock'>('phone_order');

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
        if (!isCityIsfahan(def.city)) {
          setSelectedShippingMethod('post_pishtaz');
        }
      }
    }
  }, []);

  const activeProvince =
    PROVINCES_DATASET.find((p) => p.id === selectedProvinceId) || PROVINCES_DATASET[0];

  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    const prov = PROVINCES_DATASET.find((p) => p.id === provinceId);
    if (prov && prov.cities.length > 0) {
      const newCity = prov.cities[0].name_fa;
      setSelectedCityName(newCity);
      if (!isCityIsfahan(newCity)) {
        setSelectedShippingMethod('post_pishtaz');
      }
    }
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCityName(cityName);
    if (!isCityIsfahan(cityName)) {
      setSelectedShippingMethod('post_pishtaz');
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
      if (!isCityIsfahan(addr.city)) {
        setSelectedShippingMethod('post_pishtaz');
      }
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

  // Calculate cart summary with selected shipping method and destination
  const summary = calculateCartSummary(
    items,
    appliedCoupon || undefined,
    selectedShippingMethod,
    activeProvince.name_fa,
    selectedCityName
  );

  const subtotalToman = Math.round(summary.subtotal_irr / 10);
  const discountToman = Math.round(summary.discount_irr / 10);
  const shippingToman = Math.round(summary.shipping_fee_irr / 10);
  const grandTotalToman = Math.round(summary.grand_total_irr / 10);

  // Available shipping options for current destination
  const shippingQuotes = calculateShippingQuotes(
    activeProvince.name_fa,
    selectedCityName,
    summary.subtotal_irr,
    items
  );

  const isIsfahan = isCityIsfahan(selectedCityName);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recipientName.trim()) {
      setError('لطفاً نام تحویل‌گیرنده را وارد کنید.');
      return;
    }

    const normP = normalizePhone(recipientPhone);
    if (!normP) {
      setError('شماره موبایل تحویل‌گیرنده نامعتبر است.');
      return;
    }

    if (!postalAddress.trim()) {
      setError('لطفاً نشانی دقیق پستی را وارد کنید.');
      return;
    }

    if (postalCode.trim() && !validatePostalCode(postalCode)) {
      setError('کد پستی ۱۰ رقمی وارد شده نامعتبر است.');
      return;
    }

    setLoading(true);

    try {
      const orderId = `ORD-${Date.now()}`;
      const newOrder: CustomerOrder = {
        id: orderId,
        orderNumber: `IM-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString(),
        totalIrr: summary.grand_total_irr,
        totalToman: grandTotalToman,
        status: 'processing',
        statusLabel: 'در حال آماده‌سازی و بسته‌بندی',
        trackingCode: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        shippingMethod: selectedShippingMethod === 'courier_isfahan' ? 'پیک موتوری اصفهان' : 'پست پیشتاز سراسری',
        address: {
          recipientName,
          city: `${activeProvince.name_fa} - ${selectedCityName}`,
          addressLine: postalAddress,
        },
        items: items.map((i) => ({
          title: i.title_fa,
          variant: i.subtitle_fa || 'بسته‌بندی استاندارد',
          quantity: i.quantity,
          priceToman: Math.round(i.price_irr / 10),
          image: i.imageUrl,
        })),
      };

      addCustomerOrder(newOrder);
      clearCart();

      // Trigger automatic SMS notification to buyer & admin via Next.js API & WebOneSMS
      try {
        await fetch('/api/v1/orders/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            customerName: recipientName,
            customerPhone: recipientPhone,
            totalToman: grandTotalToman,
            orderStatus: 'order_placed',
            trackingCode: newOrder.trackingCode,
          }),
        });
      } catch (smsErr) {
        console.warn('SMS dispatch error:', smsErr);
      }

      // Redirect to confirmation / tracking
      window.location.href = `/checkout/confirmation?orderId=${orderId}`;
    } catch {
      setError('خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbf8] dark:bg-[#072714] dir-rtl text-[#17251c] dark:text-[#f2f9f4] font-sans selection:bg-[#c3e5cd] selection:text-[#176b39] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-[#176b39] transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/cart" className="hover:text-[#176b39] transition-colors font-medium">
            سبد خرید
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-slate-900 dark:text-white font-bold">تسویه حساب و پرداخت</span>
        </nav>

        {/* Title */}
        <div className="border-b border-[#e5e8de] dark:border-stone-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-[#17251c] dark:text-white">تسویه حساب و تکمیل سفارش</h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            تأیید اطلاعات پستی، شیوه ارسال و پرداخت ایمن
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-3xl border border-[#e5e8de] dark:border-stone-800 space-y-4 max-w-md mx-auto shadow-xs">
            <div className="text-5xl">🛍️</div>
            <h2 className="text-lg font-black text-[#17251c] dark:text-white">سبد خرید شما برای تسویه خالی است</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              برای ادامه سفارش، ابتدا محصولات مورد نظر خود را به سبد خرید اضافه نمایید.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#176b39] hover:bg-[#14552f] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <span>مشاهده فروشگاه محصولات</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Left Column: Recipient, Address & Shipping Method (7 Cols) ── */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Saved Addresses Quick Selector */}
              {savedAddresses.length > 0 && (
                <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-2xl border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <span className="text-xs font-bold text-[#17251c] dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#176b39]" />
                      آدرس‌های ذخیره‌شده شما
                    </span>
                    <span className="text-[11px] text-[#176b39] dark:text-[#97d2a7] font-bold">انتخاب سریع</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#f2f9f4] dark:bg-[#0a331b] border-[#176b39] shadow-xs'
                              : 'bg-[#fafbf8] dark:bg-stone-800 border-[#e5e8de] dark:border-stone-700 hover:bg-[#f2f9f4]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-[#17251c] dark:text-white flex items-center gap-1.5">
                              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#176b39] bg-[#176b39]' : 'border-stone-400'}`}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                              </span>
                              {addr.title}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#c3e5cd] text-[#176b39]">
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
              <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-[#17251c] dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <User className="w-4 h-4 text-[#176b39]" />
                  <span>مشخصات تحویل‌گیرنده سفارش</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17251c] dark:text-stone-200 mb-1.5">
                      نام و نام خانوادگی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثلاً: احسان پویا"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e8de] dark:border-stone-700 text-xs sm:text-sm focus:border-[#176b39] focus:outline-none transition-all bg-[#fafbf8] dark:bg-stone-800 dark:text-white min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17251c] dark:text-stone-200 mb-1.5">
                      شماره موبایل جهت پیامک رهگیری <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="۰۹۱۳۲۳۹۱۸۴۳"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e8de] dark:border-stone-700 text-xs sm:text-sm font-mono text-left dir-ltr focus:border-[#176b39] focus:outline-none transition-all bg-[#fafbf8] dark:bg-stone-800 dark:text-white min-h-[42px]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Postal Address Form */}
              <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-[#17251c] dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <MapPin className="w-4 h-4 text-[#176b39]" />
                  <span>نشانی دقیق ارسال و مقصد</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17251c] dark:text-stone-200 mb-1.5">
                      استان <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedProvinceId}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e8de] dark:border-stone-700 text-xs sm:text-sm bg-[#fafbf8] dark:bg-stone-800 dark:text-white focus:border-[#176b39] focus:outline-none cursor-pointer min-h-[42px]"
                    >
                      {PROVINCES_DATASET.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name_fa}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17251c] dark:text-stone-200 mb-1.5">
                      شهرستان / شهر <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedCityName}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e8de] dark:border-stone-700 text-xs sm:text-sm bg-[#fafbf8] dark:bg-stone-800 dark:text-white focus:border-[#176b39] focus:outline-none cursor-pointer min-h-[42px]"
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
                  <label className="block text-xs font-bold text-[#17251c] dark:text-stone-200 mb-1.5">
                    نشانی پستی کامل (خیابان، کوچه، پلاک، واحد) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="خیابان اصلی، کوچه فرعی، پلاک ۱۲، واحد ۳"
                    value={postalAddress}
                    onChange={(e) => setPostalAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e8de] dark:border-stone-700 text-xs sm:text-sm focus:border-[#176b39] focus:outline-none bg-[#fafbf8] dark:bg-stone-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17251c] dark:text-stone-200 mb-1.5">
                    کد پستی ۱۰ رقمی
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="۸۱۶۴۸۱۲۳۴۵"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e8de] dark:border-stone-700 text-xs sm:text-sm font-mono text-center tracking-widest focus:border-[#176b39] focus:outline-none bg-[#fafbf8] dark:bg-stone-800 dark:text-white min-h-[42px]"
                  />
                </div>
              </div>

              {/* 4. Shipping Method Selection */}
              <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <h2 className="text-sm font-bold text-[#17251c] dark:text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#176b39]" />
                    <span>انتخاب شیوه ارسال سفارش</span>
                  </h2>
                  <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    مقصد: {selectedCityName} ({activeProvince.name_fa})
                  </span>
                </div>

                {/* Shipping Method Options */}
                <div className="space-y-3 pt-1">
                  {shippingQuotes.map((quote) => {
                    const isSelected = selectedShippingMethod === quote.code;
                    const isCourier = quote.code === 'courier_isfahan';

                    return (
                      <label
                        key={quote.code}
                        onClick={() => setSelectedShippingMethod(quote.code)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#f2f9f4] dark:bg-[#0a331b] border-[#176b39] shadow-xs ring-1 ring-[#176b39]'
                            : 'bg-[#fafbf8] dark:bg-stone-800 border-[#e5e8de] dark:border-stone-700 hover:bg-[#f2f9f4]'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                            isCourier ? 'bg-[#f47a24]/15 text-[#f47a24]' : 'bg-[#176b39]/15 text-[#176b39]'
                          }`}>
                            {isCourier ? '🛵' : '📦'}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#17251c] dark:text-white">
                                {quote.name_fa}
                              </span>
                              {isCourier && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  تحویل فوری امروز
                                </span>
                              )}
                              {!isCourier && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e1f2e6] text-[#176b39]">
                                  ارسال پیشتاز سراسری
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                              {quote.description}
                            </p>

                            <div className="flex items-center gap-3 pt-1 text-[10px] text-stone-500 dark:text-stone-400">
                              <span className="flex items-center gap-1">
                                <Scale className="w-3 h-3 text-[#176b39]" />
                                وزن مرسوله: {quote.charged_weight_grams.toLocaleString('fa-IR')} گرم
                              </span>
                              <span className="flex items-center gap-1">
                                <Box className="w-3 h-3 text-[#176b39]" />
                                {quote.packaging_tier_fa}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Radio */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200 dark:border-stone-700 shrink-0">
                          <div>
                            {quote.is_free ? (
                              <span className="text-xs sm:text-sm font-black text-[#176b39] dark:text-[#2ea355] bg-[#e1f2e6] px-2.5 py-1 rounded-xl">
                                رایگان 🎁
                              </span>
                            ) : (
                              <div className="text-left dir-ltr">
                                <span className="text-xs sm:text-sm font-black text-[#176b39] dark:text-[#2ea355]">
                                  {quote.fee_toman.toLocaleString('fa-IR')}
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400 ml-1">تومان</span>
                              </div>
                            )}
                          </div>

                          <div className={`w-4 h-4 rounded-full border-2 mt-1 hidden sm:flex items-center justify-center ${
                            isSelected ? 'border-[#176b39] bg-[#176b39]' : 'border-stone-400'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 5. Payment Method Options */}
              <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <h2 className="text-sm font-bold text-[#17251c] dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#176b39]" />
                    <span>انتخاب شیوه پرداخت و نهایی‌سازی</span>
                  </h2>
                  <span className="text-[11px] font-bold text-[#176b39] dark:text-[#97d2a7] bg-[#c3e5cd]/40 px-2.5 py-0.5 rounded-full">
                    هماهنگی فوری تلفنی
                  </span>
                </div>

                {/* Telephone Order Notice Card */}
                <div className="p-3.5 bg-emerald-50/80 dark:bg-[#0a331b] border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#176b39] dark:text-[#97d2a7]">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>ثبت آسان و بدون دغدغه سفارش</span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                    اطلاعات شما با زدن دکمه ثبت نهایی، بلافاصله در سیستم رزرو می‌شود. سپس با تماس، پیامک یا پیام در واتساپ به شماره (<strong>۰۹۱۷۵۹۲۹۳۴۵</strong>) یا پیام در بله به آیدی (<strong>iranmoringa@</strong>) و اعلام کد سفارش، پرداخت را هماهنگ کرده و سفارش با اولویت فوری بسته‌بندی و ارسال می‌شود.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* Phone Order & Card to Card (Featured & Active) */}
                  <label
                    onClick={() => setPaymentMethod('phone_order')}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'phone_order'
                        ? 'bg-[#f2f9f4] dark:bg-[#0a331b] border-[#176b39] shadow-xs ring-1 ring-[#176b39]'
                        : 'bg-[#fafbf8] dark:bg-stone-800 border-[#e5e8de] dark:border-stone-700 hover:bg-[#f2f9f4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#176b39] text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
                        📞
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-[#17251c] dark:text-white block">
                          ثبت سفارش و هماهنگی پرداخت تلفنی / کارت‌به‌کارت
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          رزرو آنی کالا در انبار + دریافت کد پیگیری اختصاصی
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#c3e5cd] text-[#176b39] shrink-0">
                      روش فعال فعلی
                    </span>
                  </label>

                  {/* Online IPG (Under domain migration) */}
                  <div
                    className="flex items-center justify-between p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 opacity-70 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-300 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center text-lg shrink-0">
                        💳
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-stone-700 dark:text-stone-300 block">
                          پرداخت آنلاین شاپرک (درگاه مستقیم بانک ملت)
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          در حال انتقال دامنه به moringo9.ir (به‌زودی مجدداً فعال می‌شود)
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 shrink-0">
                      به‌زودی
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column: Order Summary & Instant Checkout CTA (5 Cols) ── */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-5 sticky top-24">
                <h2 className="text-sm font-bold text-[#17251c] dark:text-white border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
                  <span>اقلام سفارش</span>
                  <span className="text-xs font-bold text-[#176b39] dark:text-[#97d2a7]">
                    {items.length} کالا
                  </span>
                </h2>

                {/* Items Mini List */}
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId || 'd'}`}
                      className="flex items-center justify-between text-xs py-2 border-b border-stone-100 dark:border-stone-800 last:border-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title_fa}
                          className="w-10 h-10 object-contain bg-[#fafbf8] dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200 dark:border-stone-700"
                        />
                        <div className="truncate">
                          <span className="font-bold text-[#17251c] dark:text-white block truncate">
                            {item.title_fa}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">
                            {item.quantity} عدد × {(item.price_irr / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-[#176b39] dark:text-[#2ea355] shrink-0 mr-2">
                        {((item.price_irr * item.quantity) / 10).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Input Form */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="کد تخفیف (مثلاً MORINGA15)"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#e5e8de] dark:border-stone-700 text-xs uppercase font-mono focus:border-[#176b39] focus:outline-none bg-[#fafbf8] dark:bg-stone-800 dark:text-white min-h-[42px]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-[#176b39] hover:bg-[#14552f] text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer min-h-[42px]"
                    >
                      اعمال
                    </button>
                  </div>

                  {appliedCoupon && (
                    <p className="text-[11px] text-[#176b39] dark:text-[#97d2a7] font-bold mt-1.5 flex items-center gap-1">
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
                <div className="space-y-2.5 text-xs pt-3 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>جمع اقلام:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {subtotalToman.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  {discountToman > 0 && (
                    <div className="flex justify-between text-[#176b39] dark:text-[#2ea355]">
                      <span>تخفیف ویژه:</span>
                      <span className="font-bold">
                        - {discountToman.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-stone-600 dark:text-stone-300">
                    <div className="space-y-0.5">
                      <span className="block">هزینه ارسال:</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">
                        {summary.shippingMethodTitle || (selectedShippingMethod === 'courier_isfahan' ? 'پیک موتوری اصفهان' : 'پست پیشتاز')}
                      </span>
                    </div>
                    <span className={shippingToman === 0 ? 'text-[#176b39] dark:text-[#2ea355] font-bold' : 'font-bold text-slate-900 dark:text-white'}>
                      {shippingToman === 0 ? 'رایگان 🎁' : `${shippingToman.toLocaleString('fa-IR')} تومان`}
                    </span>
                  </div>

                  {summary.chargedWeightGrams && (
                    <div className="flex justify-between text-[11px] text-stone-500 dark:text-stone-400 bg-[#fafbf8] dark:bg-stone-800 p-2 rounded-xl border border-[#e5e8de] dark:border-stone-700">
                      <span>محاسبه وزن بسته:</span>
                      <span>{summary.chargedWeightGrams.toLocaleString('fa-IR')} گرم ({summary.packagingTierFA})</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-3 border-t border-[#e5e8de] dark:border-stone-800 text-[#17251c] dark:text-white">
                    <span className="text-sm font-bold">مبلغ نهایی قابل پرداخت:</span>
                    <div>
                      <span className="text-xl font-black text-[#176b39] dark:text-[#2ea355]">
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
                  className="w-full py-3.5 bg-[#176b39] hover:bg-[#14552f] text-white font-bold rounded-xl shadow-xs hover:shadow-card transition-all text-center text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] active:scale-[0.99]"
                >
                  <Phone className="w-4 h-4" />
                  <span>{loading ? 'در حال ثبت اطلاعات سفارش...' : 'ثبت سفارش و دریافت کد هماهنگی تلفنی'}</span>
                </button>

                <div className="p-3 bg-[#f2f9f4] dark:bg-[#0a331b] rounded-xl border border-[#c3e5cd] dark:border-[#14552f] flex items-center gap-2 text-[11px] text-[#176b39] dark:text-[#97d2a7] font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#2ea355] shrink-0" />
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
