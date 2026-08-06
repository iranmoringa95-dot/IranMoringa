'use client';

import { useState } from 'react';
import { Package, Truck, Check } from 'lucide-react';

export default function AdminOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('shipped');
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleOrders = [
    { orderNumber: 'ML-1405-000001', recipient: 'علی محمدی', city: 'تهران', status: 'paid', amount: 430000 },
  ];

  const handleFulfill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/orders/${selectedOrder}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          tracking_code: trackingCode,
        }),
      });

      if (res.ok) {
        alert('وضعیت سفارش با موفقیت به‌روزرسانی شد.');
        setSelectedOrder(null);
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch (err) {
      alert('مشکلی پیش آمده است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900">مدیریت سفارشات و ارسال انبار</h1>
        <p className="text-xs text-slate-500">تغییر وضعیت سفارشات و تخصیص کد رهگیری پستی</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
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
            {sampleOrders.map((ord) => (
              <tr key={ord.orderNumber} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                <td className="p-4 text-slate-800">{ord.recipient}</td>
                <td className="p-4 text-slate-600">{ord.city}</td>
                <td className="p-4 font-bold text-slate-900">{ord.amount.toLocaleString('fa-IR')}</td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    پرداخت شده
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => setSelectedOrder(ord.orderNumber)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    ارسال پستی
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fulfillment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">تغییر وضعیت سفارش {selectedOrder}</h3>
            <form onSubmit={handleFulfill} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">وضعیت جدید</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="processing">در حال پردازش انبار</option>
                  <option value="packed">بسته‌بندی شده</option>
                  <option value="shipped">تحویل به پست (نیازمند کد رهگیری)</option>
                  <option value="delivered">تحویل داده شد</option>
                </select>
              </div>

              {newStatus === 'shipped' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">کد رهگیری ۲۴ رقمی پستی</label>
                  <input
                    type="text"
                    required
                    placeholder="TRK-1405-12345678"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono text-left dir-ltr"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  تایید و به‌روزرسانی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
