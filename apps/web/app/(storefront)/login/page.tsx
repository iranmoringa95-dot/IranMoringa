'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'خطا در ارسال کد تایید');
      }

      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'مشکلی پیش آمده است.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'کد تایید معتبر نیست');
      }

      window.location.href = '/account';
    } catch (err: any) {
      setError(err.message || 'کد واردشده معتبر نیست.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="text-2xl font-bold text-emerald-700 inline-flex items-center gap-2">
          <span className="bg-emerald-600 text-white p-2 rounded-xl text-lg">🌱</span>
          فروشگاه سبزینه
        </Link>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-900">
          {step === 'phone' ? 'ورود یا ثبت‌نام مشتری' : 'تایید شماره موبایل'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {step === 'phone'
            ? 'جهت ورود یا ایجاد حساب، شماره همراه خود را وارد کنید.'
            : `کد ۶ رقمی ارسال‌شده به ${phone} را وارد کنید.`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {devOtp && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl">
              کد آزمایشی توسعه: <span className="font-mono font-bold text-sm">{devOtp}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  شماره موبایل
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    type="text"
                    required
                    placeholder="09123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-left dir-ltr font-mono text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition-colors disabled:opacity-50"
              >
                {loading ? 'در حال ارسال...' : 'دریافت کد تایید'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                  کد تایید ۶ رقمی
                </label>
                <div className="mt-1">
                  <input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-mono text-lg tracking-widest"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-1/3 py-3 px-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  ویرایش شماره
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition-colors disabled:opacity-50"
                >
                  {loading ? 'در حال تایید...' : 'ورود به حساب'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
