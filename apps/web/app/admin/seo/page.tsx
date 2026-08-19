'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, ArrowLeftRight, AlertOctagon, Plus, Trash2, CheckCircle, RefreshCw, FileCode, ShieldCheck, Link2 } from 'lucide-react';

interface RedirectRule {
  id: string;
  source_path: string;
  target_url: string;
  status_code: number;
  is_active: boolean;
  hit_count: number;
  last_hit_at?: string;
  created_by: string;
  created_at: string;
}

interface NotFoundEvent {
  id: string;
  path_normalized: string;
  hit_count: number;
  first_seen_at: string;
  last_seen_at: string;
  suggested_target_url?: string;
}

const API_BASE = 'http://localhost:8080/api/v1';

export default function AdminSEOPage() {
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [notFoundEvents, setNotFoundEvents] = useState<NotFoundEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'redirects' | '404s'>('redirects');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sourcePath, setSourcePath] = useState('');
  const [targetURL, setTargetURL] = useState('');
  const [statusCode, setStatusCode] = useState<number>(301);
  const [submitting, setSubmitting] = useState(false);

  const fetchRedirects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/seo/redirects`);
      if (res.ok) {
        const data = await res.json();
        setRedirects(data.redirects || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetch404Events = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/seo/404-events`);
      if (res.ok) {
        const data = await res.json();
        setNotFoundEvents(data.not_found_events || []);
      }
    } catch {
      // Silently handle error
    }
  }, []);

  useEffect(() => {
    fetchRedirects();
    fetch404Events();
  }, [fetchRedirects, fetch404Events]);

  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/admin/seo/redirects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_path: sourcePath,
          target_url: targetURL,
          status_code: Number(statusCode),
        }),
      });

      if (res.ok) {
        alert('قانون ریدایرکت با موفقیت ثبت شد.');
        setShowCreateModal(false);
        setSourcePath('');
        setTargetURL('');
        fetchRedirects();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در ثبت ریدایرکت.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm('آیا از حذف این قانون ریدایرکت اطمینان دارید؟')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/seo/redirects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRedirects();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در حذف ریدایرکت.');
    }
  };

  const handleQuickConvert404 = (path: string) => {
    setSourcePath(path);
    setTargetURL('');
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">سئو فنی، ریدایرکت‌ها و Sitemap</h1>
          <p className="text-xs text-slate-500">مدیریت قوانین 301/302، گزارش خطاهای ۴۰۴ و تنظیمات دامنه Canonical</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchRedirects(); fetch404Events(); }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>به‌روزرسانی</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد ریدایرکت جدید</span>
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">دامنه اصلی Canonical</div>
            <div className="text-xs font-bold text-slate-900 font-mono dir-ltr">https://moringalab.ir</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">نقشه سایت XML</div>
            <a
              href="http://localhost:8080/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline font-mono dir-ltr"
            >
              /sitemap.xml ↗
            </a>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">قوانین ریدایرکت فعال</div>
            <div className="text-sm font-bold text-slate-900">{redirects.length.toLocaleString('fa-IR')} قانون</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">آدرس‌های ۴۰۴ ثبت‌شده</div>
            <div className="text-sm font-bold text-slate-900">{notFoundEvents.length.toLocaleString('fa-IR')} مورد</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('redirects')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'redirects'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          قوانین ریدایرکت ({redirects.length.toLocaleString('fa-IR')})
        </button>
        <button
          onClick={() => setActiveTab('404s')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === '404s'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          گزارش خطاهای ۴۰۴ ({notFoundEvents.length.toLocaleString('fa-IR')})
        </button>
      </div>

      {/* ── Redirects Tab ── */}
      {activeTab === 'redirects' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">در حال بارگذاری...</div>
          ) : redirects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <ArrowLeftRight className="w-8 h-8 mx-auto mb-2" />
              هیچ قانون ریدایرکتی تعریف نشده است
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">آدرس مبدا (Old Path)</th>
                  <th className="p-3.5">آدرس مقصد (Target URL)</th>
                  <th className="p-3.5">کد ریدایرکت</th>
                  <th className="p-3.5">تعداد فراخوانی (Hits)</th>
                  <th className="p-3.5">سازنده</th>
                  <th className="p-3.5">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {redirects.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-slate-900 dir-ltr text-right font-semibold">{r.source_path}</td>
                    <td className="p-3.5 font-mono text-emerald-700 dir-ltr text-right font-semibold">{r.target_url}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                        {r.status_code}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">{r.hit_count.toLocaleString('fa-IR')}</td>
                    <td className="p-3.5 text-slate-500">{r.created_by}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleDeleteRedirect(r.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف قانون ریدایرکت"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── 404s Tab ── */}
      {activeTab === '404s' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {notFoundEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              هیچ خطا یا آدرس ۴۰۴ تاکنون ثبت نشده است
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">آدرس مفقود (404 Path)</th>
                  <th className="p-3.5">تعداد درخواست</th>
                  <th className="p-3.5">اولین مشاهده</th>
                  <th className="p-3.5">آخرین مشاهده</th>
                  <th className="p-3.5">عملیات سریع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notFoundEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-slate-900 dir-ltr text-right font-semibold">{ev.path_normalized}</td>
                    <td className="p-3.5 font-mono font-bold text-amber-700">{ev.hit_count.toLocaleString('fa-IR')}</td>
                    <td className="p-3.5 text-slate-500">{new Date(ev.first_seen_at).toLocaleDateString('fa-IR')}</td>
                    <td className="p-3.5 text-slate-500">{new Date(ev.last_seen_at).toLocaleDateString('fa-IR')}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleQuickConvert404(ev.path_normalized)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        تبدیل به ریدایرکت ۳۰۱
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Create Redirect Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">ثبت قانون جدید ریدایرکت (301 / 302)</h3>
            <form onSubmit={handleCreateRedirect} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">آدرس مبدا (Old Source Path)</label>
                <input
                  type="text"
                  required
                  placeholder="/shop/old-url"
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">آدرس مقصد (Target URL)</label>
                <input
                  type="text"
                  required
                  placeholder="/product/moringa-oil-30ml"
                  value={targetURL}
                  onChange={(e) => setTargetURL(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">نوع کد وضعیت (HTTP Status Code)</label>
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={301}>301 Moved Permanently (دائمی - توصیه سئو)</option>
                  <option value={302}>302 Found / Temporary (موقت)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  ثبت قانون ریدایرکت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
