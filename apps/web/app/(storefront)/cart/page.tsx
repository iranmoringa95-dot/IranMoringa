'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Tag,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  Truck,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import {
  getStoredCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  calculateCartSummary,
  CartItem,
} from '@/lib/cart';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Sync cart from storage
  useEffect(() => {
    const sync = () => {
      setItems(getStoredCart());
      setLoading(false);
    };

    sync();
    window.addEventListener('moringalab_cart_updated', sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener('moringalab_cart_updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const summary = calculateCartSummary(items, appliedCoupon);

  const subtotalToman = Math.round(summary.subtotal_irr / 10);
  const discountToman = Math.round(summary.discount_irr / 10);
  const shippingToman = Math.round(summary.shipping_fee_irr / 10);
  const grandTotalToman = Math.round(summary.grand_total_irr / 10);

  // Free shipping threshold: 500,000 Tomans
  const freeShippingThresholdToman = 500000;
  const remainingForFreeShipping = Math.max(0, freeShippingThresholdToman - subtotalToman);
  const freeShippingProgress = Math.min(100, (subtotalToman / freeShippingThresholdToman) * 100);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'MORINGA15') {
      setAppliedCoupon('MORINGA15');
      setCouponMessage({ text: 'کد تخفیف ۱۵٪ اولین سفارش با موفقیت اعمال شد!', isError: false });
    } else if (code === 'SUPERGREEN10') {
      setAppliedCoupon('SUPERGREEN10');
      setCouponMessage({ text: 'کد تخفیف ۱۰٪ سوپرفود با موفقیت اعمال شد!', isError: false });
    } else {
      setCouponMessage({ text: 'کد تخفیف وارد شده معتبر یا فعال نیست.', isError: true });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponInput('');
    setCouponMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dir-rtl text-slate-800 font-sans selection:bg-[#d0de41] selection:text-[#026251]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/shop" className="hover:text-emerald-700 transition-colors font-medium">
            فروشگاه
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-slate-900 font-bold">سبد خرید شما</span>
        </nav>

        {/* Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">سبد خرید شما</h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">
              بررسی اقلام انتخابی و محاسبه قیمت نهایی سفارش
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold self-start sm:self-auto hover:underline"
            >
              خالی کردن کل سبد خرید
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-stone-400">
            در حال بارگذاری سبد خرید...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 space-y-4 max-w-md mx-auto shadow-xs">
            <div className="text-5xl">🛒</div>
            <h2 className="text-lg font-black text-slate-900">سبد خرید شما در حال حاضر خالی است</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              محصولات ارگانیک و درمانی مورینگا را مشاهده و به سبد خود اضافه کنید.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#026251] hover:bg-[#024a3d] text-white text-xs font-bold rounded-full transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4 text-[#d0de41]" />
                <span>مشاهده کاتالوگ سوپرفودها</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Shipping Meter */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    {remainingForFreeShipping > 0
                      ? `با خرید ${remainingForFreeShipping.toLocaleString('fa-IR')} تومان دیگر، ارسال شما رایگان می‌شود!`
                      : 'تبریک! سفارش شما شامل ارسال کاملاً رایگان پستی شد! 🎉'}
                  </span>
                  <span>{Math.round(freeShippingProgress)}٪</span>
                </div>
                <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                {items.map((item) => {
                  const itemUnitPriceToman = Math.round(item.price_irr / 10);
                  const itemLineTotalToman = itemUnitPriceToman * item.quantity;
                  const compareToman = item.compare_at_price_irr
                    ? Math.round(item.compare_at_price_irr / 10)
                    : null;

                  return (
                    <div
                      key={`${item.productId}-${item.variantId || 'default'}`}
                      className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Image & Title */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-20 h-20 bg-[#faf8f5] rounded-2xl border border-stone-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.title_fa}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                            <Link href={`/product/${item.slug}`}>{item.title_fa}</Link>
                          </h3>
                          {item.subtitle_fa && (
                            <p className="text-[11px] text-stone-500 line-clamp-1">{item.subtitle_fa}</p>
                          )}
                          <div className="text-[11px] text-stone-400 font-mono">SKU: {item.sku}</div>
                        </div>
                      </div>

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        {/* Quantity Buttons */}
                        <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1 border border-stone-200">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.quantity - 1, item.variantId)
                            }
                            className="w-7 h-7 bg-white hover:bg-stone-200 text-slate-700 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                            aria-label="کاهش تعداد"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-900">
                            {item.quantity.toLocaleString('fa-IR')}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.quantity + 1, item.variantId)
                            }
                            className="w-7 h-7 bg-white hover:bg-stone-200 text-slate-700 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                            aria-label="افزایش تعداد"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="text-left shrink-0">
                          {compareToman && (
                            <div className="text-[11px] text-stone-400 line-through">
                              {(compareToman * item.quantity).toLocaleString('fa-IR')}
                            </div>
                          )}
                          <div className="text-sm font-black text-slate-900">
                            {itemLineTotalToman.toLocaleString('fa-IR')}
                            <span className="text-[10px] text-stone-500 font-normal mr-1">تومان</span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="حذف از سبد خرید"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>افزودن محصولات بیشتر به سبد خرید</span>
                </Link>
              </div>
            </div>

            {/* Right: Checkout Summary (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5 sticky top-28">
                <h2 className="text-base font-black text-slate-900 border-b border-stone-100 pb-3">
                  خلاصه فاکتور سفارش
                </h2>

                {/* Coupon Box */}
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">کد تخفیف دارید؟</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="مثلاً: MORINGA15"
                      className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 focus:border-emerald-600 rounded-xl text-xs font-mono uppercase focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#026251] hover:bg-[#024a3d] text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      اعمال
                    </button>
                  </div>

                  {couponMessage && (
                    <div
                      className={`text-[11px] p-2 rounded-xl flex items-center justify-between ${
                        couponMessage.isError
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <span>{couponMessage.text}</span>
                      {!couponMessage.isError && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[10px] text-rose-600 hover:underline font-bold"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  )}
                </form>

                {/* Price Lines */}
                <div className="space-y-3 text-xs pt-2 border-t border-stone-100">
                  <div className="flex justify-between text-stone-600">
                    <span>جمع اقلام:</span>
                    <span className="font-bold text-slate-900">
                      {subtotalToman.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  {discountToman > 0 && (
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>تخفیف کوپن ({summary.couponDiscountPercent}٪):</span>
                      <span>- {discountToman.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600">
                    <span>هزینه ارسال پستی:</span>
                    <span className={shippingToman === 0 ? 'text-emerald-700 font-bold' : 'font-bold text-slate-900'}>
                      {shippingToman === 0 ? 'رایگان 🎁' : `${shippingToman.toLocaleString('fa-IR')} تومان`}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-stone-200 text-slate-900">
                    <span className="text-sm font-bold">مبلغ نهایی قابل پرداخت:</span>
                    <div className="text-left">
                      <span className="text-xl font-black text-emerald-800">
                        {grandTotalToman.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-xs text-stone-500 mr-1 font-medium">تومان</span>
                    </div>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="w-full py-4 bg-[#d0de41] hover:bg-[#b8c634] text-[#026251] text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-center"
                >
                  <span>ادامه فرآیند ثبت و پرداخت</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>

                {/* Trust Badges */}
                <div className="space-y-2 pt-2 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>تضمین سلامت فیزیکی و اصالت کالا</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>ارسال سریع پیشتاز با بسته‌بندی ایمن</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
