'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  User,
  Copy,
  ExternalLink,
  Share2,
  Printer,
  ShieldCheck,
  AlertCircle,
  PackageCheck,
  Sparkles,
  QrCode,
  PhoneCall,
  Send,
  MessageCircle,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { PostchiShipment } from '@/lib/postchi-data';

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('code') || '';

  const [searchTab, setSearchTab] = useState<'tracking' | 'order' | 'phone'>('tracking');
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<PostchiShipment | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTracking = async (searchStr: string) => {
    if (!searchStr.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/tracking/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchStr.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'مرسوله‌ای با این مشخصات یافت نشد.');
      }
      setShipment(data);
    } catch (err: any) {
      setShipment(null);
      setError(err.message || 'خطا در ارتباط با سامانه رهگیری پستچی.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchTracking(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(query);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareBale = () => {
    if (!shipment) return;
    const text = `رهگیری مرسوله پستی سفارش ${shipment.order_number}\nکد رهگیری: ${shipment.tracking_code}\nوضعیت: ${shipment.status_title_fa}\nپیگیری: ${window.location.href}`;
    window.open(`https://ble.ir/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareRubika = () => {
    if (!shipment) return;
    const text = `رهگیری مرسوله پستی سفارش ${shipment.order_number} - کد: ${shipment.tracking_code}`;
    window.open(`https://rubika.ir`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header Hero Banner */}
      <div className="bg-[#026251] text-white p-8 sm:p-10 rounded-3xl shadow-lg text-center relative overflow-hidden space-y-3">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#d0de41]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="w-16 h-16 bg-[#d0de41] text-[#026251] rounded-2xl mx-auto flex items-center justify-center text-3xl font-black shadow-md">
          📮
        </div>
        <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-[#d0de41]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>سامانه هوشمند رهگیری پستچی (Postchi)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black">رهگیری زنده و هوشمند مرسولات پستی</h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
          استعلام لحظه‌ای موقعیت بسته از باجه قبول تا دست موزع شرکت ملی پست ایران و تیپاکس
        </p>
      </div>

      {/* Quick Search Box */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
        {/* Tabs */}
        <div className="flex border-b border-stone-100 pb-3 gap-2 sm:gap-4 text-xs font-bold">
          <button
            onClick={() => { setSearchTab('tracking'); setQuery(''); }}
            className={`pb-2 px-3 rounded-lg transition-all ${
              searchTab === 'tracking'
                ? 'bg-[#026251] text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            کد ۲۴ رقمی رهگیری پست
          </button>
          <button
            onClick={() => { setSearchTab('order'); setQuery(''); }}
            className={`pb-2 px-3 rounded-lg transition-all ${
              searchTab === 'order'
                ? 'bg-[#026251] text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            شماره سفارش (ML-...)
          </button>
          <button
            onClick={() => { setSearchTab('phone'); setQuery(''); }}
            className={`pb-2 px-3 rounded-lg transition-all ${
              searchTab === 'phone'
                ? 'bg-[#026251] text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            شماره موبایل خریدار
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchTab === 'tracking'
                  ? 'مثال: 140508170098234567123456'
                  : searchTab === 'order'
                  ? 'مثال: ML-1405-000123'
                  : 'مثال: 09121234567'
              }
              className="w-full pl-10 pr-4 py-3.5 bg-[#faf8f5] border border-stone-200 rounded-2xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#026251] focus:outline-none"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-[#d0de41] hover:bg-[#b8c634] text-[#026251] text-xs sm:text-sm font-black rounded-2xl transition-all shadow-sm hover:shadow disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>{loading ? 'در حال استعلام...' : 'استعلام وضعیت مرسوله'}</span>
          </button>
        </form>

        {/* Quick Samples for Instant Testing */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="font-bold">نمونه‌های آماده تست:</span>
          <button
            onClick={() => { setQuery('140508170098234567123456'); fetchTracking('140508170098234567123456'); }}
            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors font-mono"
          >
            🚚 در دست پستچی (1405...456)
          </button>
          <button
            onClick={() => { setQuery('TPX-9981245012'); fetchTracking('TPX-9981245012'); }}
            className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors font-mono"
          >
            ✅ تحویل شده تیپاکس (TPX-998)
          </button>
          <button
            onClick={() => { setQuery('140508170098234567998877'); fetchTracking('140508170098234567998877'); }}
            className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors font-mono"
          >
            📦 در راه هاب شیراز (1405...877)
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── LIVE SHIPMENT RESULT CARD ── */}
      {shipment && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Status Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400">کد رهگیری پستی مرسوله:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-base sm:text-xl font-black text-[#026251] tracking-wider">
                    {shipment.tracking_code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(shipment.tracking_code)}
                    className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-slate-600 transition-colors"
                    title="کپی کد رهگیری"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copied && (
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">کپی شد!</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-black shadow-xs ${
                    shipment.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : shipment.status === 'out_for_delivery'
                      ? 'bg-[#d0de41] text-[#026251]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {shipment.status_title_fa}
                </span>
              </div>
            </div>

            {/* Package Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-[#faf8f5] rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold block">شماره سفارش:</span>
                <span className="font-mono font-bold text-slate-800">{shipment.order_number}</span>
              </div>
              <div className="p-3.5 bg-[#faf8f5] rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold block">حامل پستی:</span>
                <span className="font-bold text-slate-800">{shipment.carrier_title_fa}</span>
              </div>
              <div className="p-3.5 bg-[#faf8f5] rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold block">نوع سرویس:</span>
                <span className="font-bold text-slate-800">{shipment.service_type_fa}</span>
              </div>
              <div className="p-3.5 bg-[#faf8f5] rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold block">وزن مرسوله:</span>
                <span className="font-bold text-slate-800">{shipment.weight_grams} گرم</span>
              </div>
            </div>

            {/* Address / Postman Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#026251]">
                  <Building2 className="w-4 h-4" />
                  <span>مبدا ارسال:</span>
                </div>
                <p className="text-slate-700">{shipment.sender_province}، {shipment.sender_city} ({shipment.sender_name})</p>
              </div>

              <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sky-800">
                  <MapPin className="w-4 h-4" />
                  <span>مقصد و تحویل‌گیرنده:</span>
                </div>
                <p className="text-slate-700">{shipment.recipient_province}، {shipment.recipient_city} — {shipment.recipient_name}</p>
                <p className="text-[11px] text-slate-500 line-clamp-1">{shipment.recipient_address}</p>
              </div>
            </div>

            {shipment.postman_name && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-900">مأمور توزیع (پستچی): {shipment.postman_name}</span>
                </div>
                {shipment.postman_phone && (
                  <span className="font-mono text-amber-800 text-[11px]">{shipment.postman_phone}</span>
                )}
              </div>
            )}
          </div>

          {/* ── TIMELINE STEPPER (Postchi Visual History) ── */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#026251]" />
                <span>تاریخچه و رویدادهای پستی مرسوله</span>
              </h3>
              <span className="text-[11px] text-slate-400">به‌روزرسانی خودکار برخط</span>
            </div>

            <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:right-3.5 before:w-0.5 before:bg-stone-200 pr-2">
              {shipment.events.map((evt, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pr-1">
                  {/* Step Icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                      evt.is_completed
                        ? 'bg-[#026251] text-[#d0de41] ring-4 ring-emerald-50'
                        : 'bg-stone-200 text-slate-400'
                    }`}
                  >
                    {evt.is_completed ? '✓' : idx + 1}
                  </div>

                  <div className="flex-1 bg-[#faf8f5] p-4 rounded-2xl border border-stone-100 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className={`text-xs font-bold ${evt.is_current ? 'text-[#026251] font-black' : 'text-slate-800'}`}>
                        {evt.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{evt.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">موقعیت: {evt.location}</div>
                    <p className="text-xs text-slate-600">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons Bar */}
            <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={`https://tracking.post.ir/?id=${shipment.tracking_code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>مشاهده در سامانه رسمی شرکت ملی پست (tracking.post.ir)</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareBale}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  title="ارسال به پیام‌رسان بله"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">اشتراک در بله</span>
                </button>
                <button
                  onClick={handleShareRubika}
                  className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  title="اشتراک در روبیکا"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">روبیکا</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-800 dir-rtl font-sans selection:bg-[#d0de41] selection:text-[#026251]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={<div className="p-12 text-center text-slate-400 text-sm">در حال بارگذاری رهگیری...</div>}>
          <TrackingContent />
        </Suspense>
      </main>
    </div>
  );
}
