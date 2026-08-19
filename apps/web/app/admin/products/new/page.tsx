'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminNewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [titleFA, setTitleFA] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescriptionFA, setShortDescriptionFA] = useState('');
  const [fullDescriptionFA, setFullDescriptionFA] = useState('');
  const [sku, setSku] = useState('');
  const [priceToman, setPriceToman] = useState('');
  const [compareAtPriceToman, setCompareAtPriceToman] = useState('');
  const [netWeight, setNetWeight] = useState('100');
  const [shippingWeight, setShippingWeight] = useState('130');
  const [initialStock, setInitialStock] = useState('20');
  const [category, setCategory] = useState('powders-and-leaves');
  const [imageUrl, setImageUrl] = useState('/images/demo/moringa-leaf-powder-100g.png');
  const [usageInstructionsFA, setUsageInstructionsFA] = useState('');
  const [warningsFA, setWarningsFA] = useState('تذکر مهم: این محصول جایگزین توصیه پزشک یا درمان دارویی نیست.');
  const [storageConditionsFA, setStorageConditionsFA] = useState('در جای خشک و خنک نگهداری شود.');

  const handleTitleChange = (val: string) => {
    setTitleFA(val);
    if (!slug) {
      setSlug(val.trim().toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const priceIRR = (parseInt(priceToman, 10) || 0) * 10;
    const compareAtIRR = compareAtPriceToman ? (parseInt(compareAtPriceToman, 10) || 0) * 10 : undefined;

    // Weight Invariant Check
    const netGrams = parseInt(netWeight, 10) || 0;
    const shipGrams = parseInt(shippingWeight, 10) || 0;
    if (shipGrams < netGrams) {
      setErrorMessage('وزن ارسال نمی‌تواند از وزن خالص محصول کمتر باشد.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title_fa: titleFA,
        slug: slug,
        short_description_fa: shortDescriptionFA,
        full_description_fa: fullDescriptionFA,
        product_type: 'simple',
        sku: sku,
        price_irr: priceIRR,
        compare_at_price_irr: compareAtIRR,
        net_weight_grams: netGrams,
        shipping_weight_grams: shipGrams,
        initial_stock: parseInt(initialStock, 10) || 0,
        usage_instructions_fa: usageInstructionsFA,
        warnings_fa: warningsFA,
        storage_conditions_fa: storageConditionsFA,
        media: [
          {
            url: imageUrl,
            alt_fa: titleFA,
            is_primary: true,
            sort_order: 1,
          },
        ],
      };

      const res = await fetch('http://localhost:8080/api/v1/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'خطا در ثبت محصول جدید');
      }

      router.push('/admin/products');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ارسال اطلاعات به سرور');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-800 dir-rtl">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">افزودن محصول جدید</h1>
          <p className="text-sm text-slate-500 mt-1">تکمیل مشخصات عمومی، قیمت، وزن، تصاویر و موجودی</p>
        </div>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
        >
          بازگشت به فهرست
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">اطلاعات عمومی محصول</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">نام محصول (فارسی) *</label>
              <input
                type="text"
                required
                value={titleFA}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="مثال: پودر برگ مورینگا ۱۰۰ گرمی"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">شناسه آدرس (Slug) *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="moringa-leaf-powder-100g"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm dir-ltr focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">توضیح کوتاه *</label>
            <textarea
              rows={2}
              required
              value={shortDescriptionFA}
              onChange={(e) => setShortDescriptionFA(e.target.value)}
              placeholder="خلاصه کوتاه بین ۳۰ تا ۶۰ کلمه..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">توضیحات کامل</label>
            <textarea
              rows={5}
              value={fullDescriptionFA}
              onChange={(e) => setFullDescriptionFA(e.target.value)}
              placeholder="معرفی کامل محصول، خواص، روش نگهداری..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Pricing and SKU */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">قیمت و شناسه کالا (SKU)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">کد کالا (SKU) *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="MIR-PWD-100"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">قیمت فروش (تومان) *</label>
              <input
                type="number"
                required
                value={priceToman}
                onChange={(e) => setPriceToman(e.target.value)}
                placeholder="245000"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                معادل {((parseInt(priceToman, 10) || 0) * 10).toLocaleString('fa-IR')} ریال در دیتابیس
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">قیمت قبل از تخفیف (تومان)</label>
              <input
                type="number"
                value={compareAtPriceToman}
                onChange={(e) => setCompareAtPriceToman(e.target.value)}
                placeholder="275000"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Weights and Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">وزن و موجودی اولیه</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">وزن خالص (گرم) *</label>
              <input
                type="number"
                required
                value={netWeight}
                onChange={(e) => setNetWeight(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">وزن ارسال با بسته‌بندی (گرم) *</label>
              <input
                type="number"
                required
                value={shippingWeight}
                onChange={(e) => setShippingWeight(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">موجودی اولیه *</label>
              <input
                type="number"
                required
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Media & Medical Disclaimer */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">تصویر و هشدارهای سلامت</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">آدرس تصویر اصلی محصول *</label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm dir-ltr focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">هشدار و تذکر عدم ادعای پزشکی</label>
            <input
              type="text"
              value={warningsFA}
              onChange={(e) => setWarningsFA(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/products"
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
          >
            انصراف
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
          >
            {submitting ? 'در حال ثبت...' : 'ذخیره به‌عنوان پیش‌نویس'}
          </button>
        </div>
      </form>
    </div>
  );
}
