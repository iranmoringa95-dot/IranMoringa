'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ArrowLeft, XCircle, Clock } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_irr: number;
  created_at: string;
  address: {
    recipient_name: string;
    city: string;
  };
}

const API_BASE = 'http://localhost:8080/api/v1';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'در انتظار پرداخت', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'پرداخت شده', color: 'bg-emerald-100 text-emerald-700' },
  processing: { label: 'در حال پردازش', color: 'bg-blue-100 text-blue-700' },
  packed: { label: 'بسته‌بندی شده', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'ارسال شده', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'تحویل داده شده', color: 'bg-teal-100 text-teal-700' },
  cancelled: { label: 'لغو شده', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'بازگشت وجه', color: 'bg-rose-100 text-rose-700' },
};

function getStatus(status: string) {
  return STATUS_MAP[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`${API_BASE}/orders/my`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {
        // Silently handle in demo mode
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleCancel = async (orderNumber: string) => {
    if (!confirm('آیا از لغو این سفارش مطمئن هستید؟')) return;

    setCancellingId(orderNumber);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderNumber}/cancel`, {
        method: 'POST',
      });

      if (res.ok) {
        // Refresh the specific order status
        setOrders((prev) =>
          prev.map((o) =>
            o.order_number === orderNumber ? { ...o, status: 'cancelled' } : o
          )
        );
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('مشکلی پیش آمده است.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="w-6 h-6 text-slate-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">سفارش‌های من</h1>
          <p className="text-xs text-slate-500">تاریخچه خریدهای انجام‌شده و وضعیت پیگیری</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-700">هنوز هیچ سفارشی ثبت نکرده‌اید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const status = getStatus(ord.status);
            return (
              <div key={ord.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{ord.order_number}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      تاریخ ثبت: {new Date(ord.created_at).toLocaleDateString('fa-IR')}
                    </p>
                    <p className="text-xs text-slate-700 font-semibold pt-1">
                      مبلغ کل: {(ord.total_irr / 10).toLocaleString('fa-IR')} تومان
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ord.status === 'pending_payment' && (
                      <button
                        onClick={() => handleCancel(ord.order_number)}
                        disabled={cancellingId === ord.order_number}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="لغو سفارش"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">لغو</span>
                      </button>
                    )}

                    <Link
                      href={`/account/orders/${ord.order_number}`}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>مشاهده جزئیات</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
