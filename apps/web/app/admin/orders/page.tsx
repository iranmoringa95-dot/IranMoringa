'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Truck, Check, Search, Clock, Eye, MessageSquarePlus, Filter, ChevronLeft, ChevronRight, FileText, Download, Printer } from 'lucide-react';

interface OrderItem {
  product_title: string;
  variant_title: string;
  quantity: number;
  unit_price_irr: number;
  subtotal_irr: number;
}

interface TimelineEvent {
  event_type: string;
  old_status: string;
  new_status: string;
  actor_type: string;
  note: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal_irr: number;
  shipping_fee_irr: number;
  discount_irr: number;
  total_irr: number;
  tracking_code?: string;
  notes?: string;
  address: {
    recipient_name: string;
    recipient_phone: string;
    province: string;
    city: string;
    postal_code: string;
    postal_address: string;
  };
  items: OrderItem[];
  created_at: string;
}

const API_BASE = 'http://localhost:8080/api/v1';

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: '', label: 'همه', color: 'bg-slate-100 text-slate-700' },
  { value: 'pending_payment', label: 'در انتظار پرداخت', color: 'bg-amber-100 text-amber-700' },
  { value: 'paid', label: 'پرداخت شده', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'processing', label: 'در حال پردازش', color: 'bg-blue-100 text-blue-700' },
  { value: 'packed', label: 'بسته‌بندی شده', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'shipped', label: 'ارسال شده', color: 'bg-purple-100 text-purple-700' },
  { value: 'delivered', label: 'تحویل داده شده', color: 'bg-teal-100 text-teal-700' },
  { value: 'cancelled', label: 'لغو شده', color: 'bg-red-100 text-red-700' },
  { value: 'refunded', label: 'بازگشت وجه', color: 'bg-rose-100 text-rose-700' },
];

function getStatusBadge(status: string) {
  const found = STATUS_OPTIONS.find((s) => s.value === status);
  return found || { value: status, label: status, color: 'bg-slate-100 text-slate-600' };
}

const TRANSITION_OPTIONS: { value: string; label: string }[] = [
  { value: 'processing', label: 'در حال پردازش انبار' },
  { value: 'packed', label: 'بسته‌بندی شده' },
  { value: 'shipped', label: 'تحویل به پست (نیازمند کد رهگیری)' },
  { value: 'delivered', label: 'تحویل داده شد' },
  { value: 'cancelled', label: 'لغو سفارش' },
  { value: 'refunded', label: 'بازگشت وجه' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalMode, setModalMode] = useState<'transition' | 'timeline' | 'note' | null>(null);
  const [newStatus, setNewStatus] = useState('processing');
  const [trackingCode, setTrackingCode] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery) params.set('q', searchQuery);
      params.set('page', String(page));
      params.set('page_size', '20');

      const res = await fetch(`${API_BASE}/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalCount(data.total_count || 0);
      }
    } catch {
      // Silently handle fetch errors in demo mode
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          tracking_code: trackingCode,
          note: statusNote,
        }),
      });

      if (res.ok) {
        setModalMode(null);
        setSelectedOrder(null);
        setTrackingCode('');
        setStatusNote('');
        fetchOrders();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('مشکلی پیش آمده است.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !adminNote.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${selectedOrder.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: adminNote }),
      });

      if (res.ok) {
        setModalMode(null);
        setSelectedOrder(null);
        setAdminNote('');
        fetchOrders();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('مشکلی پیش آمده است.');
    } finally {
      setActionLoading(false);
    }
  };

  const openTimeline = async (order: Order) => {
    setSelectedOrder(order);
    setModalMode('timeline');

    try {
      const res = await fetch(`${API_BASE}/admin/orders/${order.id}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setTimelineEvents(data.events || []);
      }
    } catch {
      setTimelineEvents([]);
    }
  };

  const handlePrintInvoice = async (orderNumber: string, format: 'a4' | 'thermal') => {
    try {
      // 1. Issue invoice first if not issued
      const issueRes = await fetch(`${API_BASE}/admin/orders/${orderNumber}/invoice`, {
        method: 'POST',
      });
      if (!issueRes.ok) {
        alert('خطا در صدور فاکتور');
        return;
      }
      const inv = await issueRes.json();

      // 2. Open print window
      window.open(`${API_BASE}/admin/invoices/${inv.invoice_number}/print?format=${format}`, '_blank');
    } catch {
      alert('مشکلی در باز کردن فاکتور پیش آمده است.');
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/exports/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusFilter,
          search_query: searchQuery,
        }),
      });

      if (res.ok) {
        const job = await res.json();
        // Trigger download
        window.location.href = `${API_BASE}/admin/exports/${job.id}/download`;
      } else {
        alert('خطا در خروجی فایل اکسل.');
      }
    } catch {
      alert('مشکلی در خروجی اکسل پیش آمده است.');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">مدیریت سفارشات</h1>
          <p className="text-xs text-slate-500">مشاهده، فیلتر، تغییر وضعیت و خروجی فاکتور — تعداد کل: {totalCount.toLocaleString('fa-IR')}</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 self-start"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'در حال آماده‌سازی...' : 'خروجی اکسل (CSV)'}</span>
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              statusFilter === s.value
                ? `${s.color} ring-2 ring-offset-1 ring-slate-400`
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="جست‌وجوی شماره سفارش..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
            در حال بارگذاری...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Package className="w-8 h-8 mx-auto mb-2" />
            سفارشی یافت نشد
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">شماره سفارش</th>
                <th className="p-4">تحویل‌گیرنده</th>
                <th className="p-4">شهر</th>
                <th className="p-4">مبلغ (تومان)</th>
                <th className="p-4">وضعیت</th>
                <th className="p-4">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => {
                const badge = getStatusBadge(ord.status);
                return (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{ord.order_number}</td>
                    <td className="p-4 text-slate-800">{ord.address?.recipient_name || '—'}</td>
                    <td className="p-4 text-slate-600">{ord.address?.city || '—'}</td>
                    <td className="p-4 font-bold text-slate-900">{(ord.total_irr / 10).toLocaleString('fa-IR')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => { setSelectedOrder(ord); setModalMode('transition'); }}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                          title="تغییر وضعیت"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(ord.order_number, 'a4')}
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                          title="چاپ فاکتور رسمی A4"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>A4</span>
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(ord.order_number, 'thermal')}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                          title="چاپ فیش حرارتی انبار"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>حرارتی</span>
                        </button>
                        <button
                          onClick={() => openTimeline(ord)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                          title="تایم‌لاین"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedOrder(ord); setModalMode('note'); }}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                          title="یادداشت"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-600">
            صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Status Transition Modal ── */}
      {selectedOrder && modalMode === 'transition' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-900 text-base">
              تغییر وضعیت سفارش <span className="font-mono">{selectedOrder.order_number}</span>
            </h3>
            <div className="text-xs text-slate-500">
              وضعیت فعلی: <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusBadge(selectedOrder.status).color}`}>{getStatusBadge(selectedOrder.status).label}</span>
            </div>
            <form onSubmit={handleTransition} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">وضعیت جدید</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {TRANSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {newStatus === 'shipped' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">کد رهگیری پستی</label>
                  <input
                    type="text"
                    required
                    placeholder="TRK-1405-12345678"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">یادداشت (اختیاری)</label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="توضیحات مرتبط با تغییر وضعیت..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalMode(null); setSelectedOrder(null); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  تایید و به‌روزرسانی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Timeline Modal ── */}
      {selectedOrder && modalMode === 'timeline' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full space-y-4 max-h-[80vh] overflow-y-auto animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-900 text-base">
              تایم‌لاین سفارش <span className="font-mono">{selectedOrder.order_number}</span>
            </h3>

            {timelineEvents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">هیچ رویدادی ثبت نشده.</p>
            ) : (
              <div className="space-y-3">
                {timelineEvents.map((evt, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="mt-0.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {evt.event_type === 'status_change' && evt.new_status
                            ? getStatusBadge(evt.new_status).label
                            : evt.event_type === 'note_added'
                            ? 'یادداشت اضافه شد'
                            : evt.event_type === 'order_created'
                            ? 'سفارش ایجاد شد'
                            : evt.event_type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {evt.actor_type === 'admin' ? '(ادمین)' : evt.actor_type === 'customer' ? '(مشتری)' : '(سیستم)'}
                        </span>
                      </div>
                      {evt.note && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{evt.note}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(evt.created_at).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => { setModalMode(null); setSelectedOrder(null); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note Modal ── */}
      {selectedOrder && modalMode === 'note' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-900 text-base">
              یادداشت برای سفارش <span className="font-mono">{selectedOrder.order_number}</span>
            </h3>
            <form onSubmit={handleAddNote} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">متن یادداشت</label>
                <textarea
                  required
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="یادداشت ادمین برای این سفارش..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalMode(null); setSelectedOrder(null); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  ثبت یادداشت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
