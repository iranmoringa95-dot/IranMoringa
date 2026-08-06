'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowLeft, Tag } from 'lucide-react';
import { Header } from '@/components/storefront/Header';

interface CartData {
  id: string;
  items: Array<{
    id: string;
    product_title: string;
    variant_title: string;
    sku: string;
    unit_price_irr: number;
    compare_at_price_irr?: number;
    quantity: number;
    line_subtotal_irr: number;
  }>;
  breakdown: {
    subtotal_irr: number;
    item_discount_irr: number;
    cart_discount_irr: number;
    shipping_fee_irr: number;
    grand_total_irr: number;
  };
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch('http://localhost:8080/api/v1/carts/current');
        if (res.ok) {
          const data = await res.json();
          setCart(data);
        }
      } catch (err) {
        setCart(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, []);

  const items = cart?.items || [];
  const breakdown = cart?.breakdown || {
    subtotal_irr: 0,
    item_discount_irr: 0,
    cart_discount_irr: 0,
    shipping_fee_irr: 300000,
    grand_total_irr: 300000,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">سبد خرید شما</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">بررسی اقلام انتخابی و محاسبه قیمت نهایی سفارش</p>
        </div>

        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 animate-pulse text-slate-400">
            در حال دریافت اطلاعات سبد خرید...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4 max-w-md mx-auto">
            <div className="text-5xl">🛒</div>
            <h2 className="text-lg font-bold text-slate-900">سبد خرید شما خالی است</h2>
            <p className="text-xs text-slate-500">می‌توانید جهت انتخاب کالا به صفحه محصولات مراجعه کنید.</p>
            <Link
              href="/shop"
              className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              مشاهده محصولات فروشگاه
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const unitPriceToman = Math.round(item.unit_price_irr / 10);
                const lineTotalToman = Math.round(item.line_subtotal_irr / 10);
                return (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                        🌱
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">{item.product_title}</h3>
                        <p className="text-xs text-slate-500">{item.variant_title} ({item.sku})</p>
                        <p className="text-xs text-emerald-700 font-semibold mt-1">
                          {unitPriceToman.toLocaleString('fa-IR')} تومان
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1 text-sm font-semibold">
                        <span>تعداد: {item.quantity}</span>
                      </div>

                      <div className="text-left">
                        <span className="text-base font-black text-slate-900">{lineTotalToman.toLocaleString('fa-IR')}</span>
                        <span className="text-xs text-slate-500 mr-1">تومان</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown Sidebar */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-6">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 text-sm">خلاصه صورت‌حساب</h3>

              {/* Coupon Box */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>کد تخفیف</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="کد تخفیف (مثلاً WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors">
                    اعمال
                  </button>
                </div>
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-3 text-xs sm:text-sm border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>جمع کل کالاها:</span>
                  <span>{Math.round(breakdown.subtotal_irr / 10).toLocaleString('fa-IR')} تومان</span>
                </div>

                {breakdown.item_discount_irr > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>تخفیف کالاها:</span>
                    <span>{Math.round(breakdown.item_discount_irr / 10).toLocaleString('fa-IR')} تومان-</span>
                  </div>
                )}

                {breakdown.cart_discount_irr > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>تخفیف کد promo:</span>
                    <span>{Math.round(breakdown.cart_discount_irr / 10).toLocaleString('fa-IR')} تومان-</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>هزینه ارسال:</span>
                  <span>{Math.round(breakdown.shipping_fee_irr / 10).toLocaleString('fa-IR')} تومان</span>
                </div>

                <div className="flex justify-between text-slate-900 font-black text-base pt-3 border-t border-slate-200">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-emerald-700">{Math.round(breakdown.grand_total_irr / 10).toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>ادامه ثبت سفارش</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
