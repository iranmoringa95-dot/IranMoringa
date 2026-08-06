'use client';

import { useState } from 'react';
import { PackagePlus, RefreshCw } from 'lucide-react';

export default function AdminInventoryPage() {
  const [variantId, setVariantId] = useState('');
  const [onHand, setOnHand] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: variantId,
          on_hand: onHand,
        }),
      });

      if (res.ok) {
        alert('موجودی انبار با موفقیت به‌روزرسانی شد.');
        setVariantId('');
      } else {
        alert('خطا در به‌روزرسانی موجودی.');
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
        <h1 className="text-xl font-bold text-slate-900">مدیریت موجودی انبار</h1>
        <p className="text-xs text-slate-500">مشاهده موجودی کل، رزرو شده و افزایش موجودی کالاها</p>
      </div>

      {/* Adjust Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <PackagePlus className="w-4 h-4 text-emerald-600" />
          <span>افزایش / به‌روزرسانی موجودی انبار</span>
        </h3>

        <form onSubmit={handleAdjust} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">شناسه متغیر کالا (UUID)</label>
            <input
              type="text"
              required
              placeholder="مثلاً 123e4567-e89b-12d3-a456-426614174000"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left dir-ltr"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">موجودی جدید انبار (On Hand)</label>
            <input
              type="number"
              required
              min={0}
              value={onHand}
              onChange={(e) => setOnHand(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-left dir-ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'در حال ثبت...' : 'ذخیره در دفترکل انبار'}
          </button>
        </form>
      </div>
    </div>
  );
}
