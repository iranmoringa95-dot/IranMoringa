'use client';

import { useState } from 'react';
import { Search, Truck, CheckCircle2, Clock } from 'lucide-react';
import { Header } from '@/components/storefront/Header';

interface TrackingData {
  order_number: string;
  status: string;
  status_title: string;
  recipient: string;
  city: string;
  total_toman: number;
  timeline: Array<{
    title: string;
    completed: boolean;
    current: boolean;
  }>;
}

export default function TrackingPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingData | null>(null);
  const [error, setError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/v1/order-tracking/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'سفارشی با این مشخصات یافت نشد.');
      }
      setResult(data);
    } catch (err: any) {
      setResult(null);
      setError(err.message || 'خطایی رخ داده است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center space-y-3 mb-8">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-xl">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">رهگیری مرسوله و سفارش</h1>
          <p className="text-xs sm:text-sm text-slate-600">برای اطلاع از آخرین وضعیت، شماره سفارش (مثلاً ML-1405-000123) را وارد کنید.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLookup} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex gap-2 mb-8">
          <input
            type="text"
            required
            placeholder="شماره سفارش یا کد رهگیری..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 shrink-0"
          >
            {loading ? 'در حال جست‌وجو...' : 'رهگیری'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl text-center mb-8">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <span className="text-xs text-slate-500">شماره سفارش:</span>
                <h3 className="font-mono font-bold text-slate-900 text-lg">{result.order_number}</h3>
              </div>
              <div>
                <span className="text-xs text-slate-500">وضعیت فعلی:</span>
                <div className="font-bold text-emerald-700 text-sm">{result.status_title}</div>
              </div>
            </div>

            {/* Timeline Stepper */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">مراحل ارسال</h4>
              <div className="space-y-3">
                {result.timeline.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                    <span className={`text-sm ${step.current ? 'font-bold text-emerald-700' : step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
