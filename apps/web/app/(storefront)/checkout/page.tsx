'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, MapPin, Phone, User, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/storefront/Header';

export default function CheckoutPage() {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [postalAddress, setPostalAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const idempotencyKey = `IDEM-${Date.now()}`;
      const res = await fetch('http://localhost:8080/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          province,
          city,
          postal_address: postalAddress,
          postal_code: postalCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'خطا در ثبت سفارش');
      }

      // Redirect to Fake Payment Gateway Sandbox
      window.location.href = `/checkout/payment/${data.payment.id}`;
    } catch (err: any) {
      setError(err.message || 'مشکلی پیش آمده است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">تکمیل اطلاعات و پرداخت</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">وارد کردن اطلاعات گیرنده و آدرس تحویل سفارش</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-8">
          {/* Section 1: Contact Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-emerald-600" />
              <span>اطلاعات تحویل‌گیرنده</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">نام و نام خانوادگی گیرنده</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً علی محمدی"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">شماره همراه گیرنده</label>
                <input
                  type="text"
                  required
                  placeholder="09123456789"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-left dir-ltr font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>آدرس پستی تحویل</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">استان</label>
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">شهر</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">نشانی دقیق پستی</label>
              <textarea
                required
                rows={2}
                placeholder="خیابان، پلاک، واحد..."
                value={postalAddress}
                onChange={(e) => setPostalAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">کد پستی (۱۰ رقمی)</label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="1234567890"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 3: Submit Order */}
          <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base">پرداخت امن شاپرک (درگاه آزمایشی)</h3>
                <p className="text-xs text-emerald-200">موجودی کالا به‌صورت خودکار رزرو شده و انتقال امن انجام می‌شود.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? 'در حال ثبت...' : 'پرداخت و ثبت نهایی سفارش'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
