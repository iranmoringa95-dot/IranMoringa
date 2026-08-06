'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { Package, RotateCcw, ArrowRight, ShieldAlert } from 'lucide-react';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const [returnReason, setReturnReason] = useState('defective');
  const [returnDesc, setReturnDesc] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8080/api/v1/account/orders/${orderNumber}/returns`, {
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
    } catch (err) {
      alert('مشکلی پیش آمده است.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">جزئیات سفارش {orderNumber}</h1>
          <p className="text-xs text-slate-500">اطلاعات کالاها، آدرس تحویل و ثبت مرجوعی</p>
        </div>
      </div>

      {returnSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-xl">
          درخواست مرجوعی سفارش با موفقیت ثبت شد و در مرحله بررسی کارشناسان قرار گرفت.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowReturnModal(true)}
          className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ثبت درخواست مرجوعی (۷ روز مهلت)</span>
        </button>
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
