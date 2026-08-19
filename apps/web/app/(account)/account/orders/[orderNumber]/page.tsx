'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw, CheckCircle2, Clock, XCircle, Package, MapPin, CreditCard, FileText } from 'lucide-react';

interface OrderItem {
  product_title: string;
  variant_title: string;
  sku: string;
  quantity: number;
  unit_price_irr: number;
  subtotal_irr: number;
  weight_grams: number;
}

interface TimelineEvent {
  event_type: string;
  old_status: string;
  new_status: string;
  actor_type: string;
  note: string;
  created_at: string;
}

interface OrderAddress {
  recipient_name: string;
  recipient_phone: string;
  province: string;
  city: string;
  postal_address: string;
  postal_code: string;
}

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  subtotal_irr: number;
  shipping_fee_irr: number;
  discount_irr: number;
  total_irr: number;
  tracking_code?: string;
  notes?: string;
  shipping_method?: string;
  address: OrderAddress;
  items: OrderItem[];
  created_at: string;
}

const API_BASE = 'http://localhost:8080/api/v1';

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending_payment: { label: 'در انتظار پرداخت', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: '⏳' },
  paid: { label: 'پرداخت شده', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: '✅' },
  processing: { label: 'در حال پردازش', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '⚙️' },
  packed: { label: 'بسته‌بندی شده', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: '📦' },
  shipped: { label: 'ارسال شده', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: '🚚' },
  delivered: { label: 'تحویل داده شده', color: 'text-teal-600 bg-teal-50 border-teal-200', icon: '🎉' },
  cancelled: { label: 'لغو شده', color: 'text-red-600 bg-red-50 border-red-200', icon: '❌' },
  refunded: { label: 'بازگشت وجه', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: '💸' },
};

function getStatus(status: string) {
  return STATUS_MAP[status] || { label: status, color: 'text-slate-600 bg-slate-50 border-slate-200', icon: '📋' };
}

// Order progress steps for timeline stepper
const ORDER_STEPS = [
  { key: 'pending_payment', label: 'ثبت سفارش', idx: 0 },
  { key: 'paid', label: 'پرداخت شده', idx: 1 },
  { key: 'processing', label: 'پردازش انبار', idx: 2 },
  { key: 'packed', label: 'بسته‌بندی', idx: 3 },
  { key: 'shipped', label: 'ارسال شده', idx: 4 },
  { key: 'delivered', label: 'تحویل', idx: 5 },
];

function getStepIndex(status: string): number {
  const found = ORDER_STEPS.find((s) => s.key === status);
  return found ? found.idx : -1;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('defective');
  const [returnDesc, setReturnDesc] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
          setTimeline(data.timeline || []);
        }
      } catch {
        // Silently handle in demo mode
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  const handleCancel = async () => {
    if (!confirm('آیا از لغو این سفارش مطمئن هستید؟')) return;

    setCancelLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderNumber}/cancel`, {
        method: 'POST',
      });

      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('مشکلی پیش آمده است.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCustomerPrintInvoice = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderNumber}/invoice`);
      if (res.ok) {
        const inv = await res.json();
        window.open(`${API_BASE}/admin/invoices/${inv.invoice_number}/print?format=a4`, '_blank');
      } else {
        alert('فاکتور برای این سفارش یافت نشد.');
      }
    } catch {
      alert('خطا در بارگذاری فاکتور.');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/account/orders/${orderNumber}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: returnReason,
          description: returnDesc,
        }),
      });

      if (res.ok) {
        setReturnSuccess(true);
        setShowReturnModal(false);
      } else {
        alert('خطا در ثبت درخواست مرجوعی.');
      }
    } catch {
      alert('مشکلی پیش آمده است.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="w-6 h-6 text-slate-400 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 space-y-3">
        <Package className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm text-slate-600">سفارش یافت نشد.</p>
        <Link href="/account/orders" className="text-xs text-emerald-600 hover:underline">بازگشت به لیست سفارشات</Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const statusInfo = getStatus(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">سفارش {order.order_number}</h1>
          <p className="text-xs text-slate-500">
            ثبت‌شده در {new Date(order.created_at).toLocaleDateString('fa-IR')}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
          {statusInfo.icon} {statusInfo.label}
        </div>
      </div>

      {returnSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-xl">
          درخواست مرجوعی سفارش با موفقیت ثبت شد و در مرحله بررسی کارشناسان قرار گرفت.
        </div>
      )}

      {/* ── Order Progress Stepper ── */}
      {!isCancelled && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">وضعیت پیشرفت سفارش</h2>
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-3 right-0 left-0 h-0.5 bg-slate-200 z-0" />
            <div
              className="absolute top-3 right-0 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStep / (ORDER_STEPS.length - 1)) * 100)}%` }}
            />

            {ORDER_STEPS.map((step) => {
              const isCompleted = step.idx <= currentStep;
              const isCurrent = step.idx === currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-[10px] mt-2 font-medium ${
                    isCurrent ? 'text-emerald-700 font-bold' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tracking Code ── */}
      {order.tracking_code && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xs text-purple-700">🚚 کد رهگیری پستی:</span>
          <span className="font-mono font-bold text-purple-900 text-sm">{order.tracking_code}</span>
        </div>
      )}

      {/* ── Order Items ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            اقلام سفارش
          </h2>
        </div>
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="p-3">محصول</th>
              <th className="p-3">تعداد</th>
              <th className="p-3">قیمت واحد (تومان)</th>
              <th className="p-3">جمع (تومان)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {order.items?.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3">
                  <div className="font-semibold text-slate-900">{item.product_title}</div>
                  {item.variant_title && (
                    <div className="text-[10px] text-slate-500">{item.variant_title}</div>
                  )}
                </td>
                <td className="p-3 text-slate-700">{item.quantity.toLocaleString('fa-IR')}</td>
                <td className="p-3 text-slate-700">{(item.unit_price_irr / 10).toLocaleString('fa-IR')}</td>
                <td className="p-3 font-bold text-slate-900">{(item.subtotal_irr / 10).toLocaleString('fa-IR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Financial Summary ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-slate-400" />
          خلاصه مالی
        </h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>جمع اقلام</span>
            <span>{(order.subtotal_irr / 10).toLocaleString('fa-IR')} تومان</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>هزینه ارسال</span>
            <span>{order.shipping_fee_irr === 0 ? 'رایگان' : `${(order.shipping_fee_irr / 10).toLocaleString('fa-IR')} تومان`}</span>
          </div>
          {order.discount_irr > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>تخفیف</span>
              <span>−{(order.discount_irr / 10).toLocaleString('fa-IR')} تومان</span>
            </div>
          )}
          <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-100">
            <span>مبلغ نهایی</span>
            <span className="text-base">{(order.total_irr / 10).toLocaleString('fa-IR')} تومان</span>
          </div>
        </div>
      </div>

      {/* ── Shipping Address ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-slate-400" />
          آدرس تحویل (اسنپ‌شات)
        </h2>
        <div className="space-y-1 text-xs text-slate-700">
          <p><span className="font-semibold">تحویل‌گیرنده:</span> {order.address?.recipient_name}</p>
          <p><span className="font-semibold">تلفن:</span> {order.address?.recipient_phone}</p>
          <p><span className="font-semibold">استان:</span> {order.address?.province} — شهر: {order.address?.city}</p>
          <p><span className="font-semibold">آدرس:</span> {order.address?.postal_address}</p>
          <p><span className="font-semibold">کد پستی:</span> <span className="font-mono">{order.address?.postal_code}</span></p>
        </div>
      </div>

      {/* ── Event Timeline ── */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            تایم‌لاین رویدادها
          </h2>
          <div className="space-y-3">
            {timeline.map((evt, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {evt.event_type === 'status_change' && evt.new_status
                        ? (STATUS_MAP[evt.new_status]?.label || evt.new_status)
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
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCustomerPrintInvoice}
          className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>مشاهده و چاپ فاکتور رسمی</span>
        </button>

        {order.status === 'pending_payment' && (
          <button
            onClick={handleCancel}
            disabled={cancelLoading}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>لغو سفارش</span>
          </button>
        )}

        {(order.status === 'delivered') && (
          <button
            onClick={() => setShowReturnModal(true)}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ثبت درخواست مرجوعی (۷ روز مهلت)</span>
          </button>
        )}
      </div>

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">ثبت درخواست مرجوعی کالا</h3>
            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">علت مرجوعی</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="defective">معیوب بودن یا آسیب‌دیدگی کالا</option>
                  <option value="wrong_item">مغایرت کالا با سفارش</option>
                  <option value="change_of_mind">انصراف از خرید</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">توضیحات تکمیلی</label>
                <textarea
                  required
                  rows={3}
                  value={returnDesc}
                  onChange={(e) => setReturnDesc(e.target.value)}
                  placeholder="لطفاً علت دقیق و وضعیت بسته‌بندی را توضیح دهید..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  تایید و ارسال درخواست
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
