'use client';

import { useState, useEffect, useCallback } from 'react';
import { Headset, Ticket, CheckCircle2, Clock, ShieldCheck, UserCheck, RefreshCw, MessageSquare, Phone, AlertTriangle } from 'lucide-react';

interface SupportInquiry {
  id: string;
  ticket_number: string;
  customer_name: string;
  contact_info: string;
  subject: string;
  body: string;
  order_number?: string;
  order_owner_verified: boolean;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  admin_notes?: string;
  created_at: string;
}

const API_BASE = 'http://localhost:8080/api/v1';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'باز (در انتظار بررسی)', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  in_progress: { label: 'در حال پیگیری', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolved: { label: 'پاسخ داده‌شده و حل‌شده', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  closed: { label: 'بسته شده', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function AdminSupportPage() {
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Selected Inquiry Modal
  const [selectedInquiry, setSelectedInquiry] = useState<SupportInquiry | null>(null);
  const [newStatus, setNewStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
  const [assignedTo, setAssignedTo] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `${API_BASE}/admin/support/inquiries?status=${statusFilter}`
        : `${API_BASE}/admin/support/inquiries`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleOpenUpdateModal = (inq: SupportInquiry) => {
    setSelectedInquiry(inq);
    setNewStatus(inq.status);
    setAssignedTo(inq.assigned_to || '');
    setAdminNotes(inq.admin_notes || '');
  };

  const handleUpdateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support/inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          assigned_to: assignedTo,
          admin_notes: adminNotes,
        }),
      });

      if (res.ok) {
        alert('تیکت پشتیبانی با موفقیت به‌روزرسانی شد.');
        setSelectedInquiry(null);
        fetchInquiries();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در به‌روزرسانی تیکت.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">صندوق ورودی تیکت‌ها و مرکز پشتیبانی</h1>
          <p className="text-xs text-slate-500">مدیریت پیام‌های کاربران، پیگیری سفارشات و ارجاع تیکت‌ها به کارشناسان</p>
        </div>
        <button
          onClick={() => fetchInquiries()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>به‌روزرسانی تیکت‌ها</span>
        </button>
      </div>

      {/* Status Filter Badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: '', label: 'همه تیکت‌ها' },
          { value: 'open', label: 'باز (در انتظار بررسی)' },
          { value: 'in_progress', label: 'در حال پیگیری' },
          { value: 'resolved', label: 'پاسخ داده‌شده' },
          { value: 'closed', label: 'بسته شده' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              statusFilter === f.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Inquiries List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-400 text-sm">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
            در حال بارگذاری تیکت‌های پشتیبانی...
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-400 text-sm">
            <Headset className="w-8 h-8 mx-auto mb-2" />
            هیچ تیکت پشتیبانی در این بخش یافت نشد
          </div>
        ) : (
          inquiries.map((inq) => {
            const statusInfo = STATUS_MAP[inq.status] || { label: inq.status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
            return (
              <div key={inq.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                      {inq.ticket_number}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{inq.customer_name}</span>
                    <span className="text-xs text-slate-500 dir-ltr font-mono">({inq.contact_info})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {inq.priority === 'urgent' && (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">فوری</span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(inq.created_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-xs">{inq.subject}</h4>
                    {inq.order_number && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                        سفارش: {inq.order_number}
                        {inq.order_owner_verified ? (
                          <span className="text-emerald-600 font-bold" title="مالکیت سفارش تایید شده است">✓ مالک معتبر</span>
                        ) : (
                          <span className="text-amber-600 font-bold" title="مالکیت سفارش ناشناخته">⚠️ غیرمرتبط</span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    {inq.body}
                  </p>
                </div>

                {inq.admin_notes && (
                  <div className="bg-amber-50 text-amber-900 text-xs p-2.5 rounded-xl border border-amber-100">
                    یادداشت کارشناس ({inq.assigned_to || 'سیستم'}): {inq.admin_notes}
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    {inq.assigned_to ? `ارجاع‌شده به: ${inq.assigned_to}` : 'بدون ارجاع کارشناس'}
                  </div>
                  <button
                    onClick={() => handleOpenUpdateModal(inq)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    پاسخ و به‌روزرسانی تیکت
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Update Ticket Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              به‌روزرسانی تیکت «{selectedInquiry.ticket_number}»
            </h3>
            <form onSubmit={handleUpdateInquiry} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">وضعیت تیکت</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                >
                  <option value="open">باز (در انتظار بررسی)</option>
                  <option value="in_progress">در حال پیگیری</option>
                  <option value="resolved">پاسخ داده‌شده و حل‌شده</option>
                  <option value="closed">بسته شده</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ارجاع به کارشناس پشتیبانی</label>
                <input
                  type="text"
                  placeholder="نام کارشناس مسئول..."
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">یادداشت کارشناس / متن پاسخ</label>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="توضیحات یا نحوه پاسخگویی به مشتری..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  ذخیره تغییرات تیکت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
