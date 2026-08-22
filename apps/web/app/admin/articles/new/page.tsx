'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminNewArticlePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [titleFA, setTitleFA] = useState('');
  const [slug, setSlug] = useState('');
  const [summaryFA, setSummaryFA] = useState('');
  const [contentFA, setContentFA] = useState('');
  const [categoryNameFA, setCategoryNameFA] = useState('آشنایی با مورینگا');
  const [coverImageUrl, setCoverImageUrl] = useState('/images/demo/articles/what-is-moringa.jpg');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

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

    try {
      const payload = {
        title_fa: titleFA,
        slug: slug,
        summary_fa: summaryFA,
        content_fa: contentFA,
        category_name_fa: categoryNameFA,
        cover_image_url: coverImageUrl,
        seo_title: seoTitle || titleFA,
        seo_description: seoDescription || summaryFA,
        disclaimers_fa: 'این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.',
      };

      const res = await fetch('http://localhost:8080/api/v1/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'خطا در ثبت مقاله جدید');
      }

      router.push('/admin/articles');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ارسال اطلاعات مقاله به سرور');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-800 dir-rtl">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">افزودن مقاله آموزشی جدید</h1>
          <p className="text-sm text-slate-500 mt-1">تکمیل عنوان، اسلاگ، چکیده، متن اصلی مارک‌داون و تصویر شاخص</p>
        </div>
        <Link
          href="/admin/articles"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
        >
          بازگشت
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">مشخصات عمومی مقاله</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">عنوان مقاله (فارسی) *</label>
              <input
                type="text"
                required
                value={titleFA}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="مثال: مورینگا چیست؟ آشنایی ساده با این گیاه"
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
                placeholder="what-is-moringa"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm dir-ltr focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">دسته‌بندی مقاله *</label>
              <select
                value={categoryNameFA}
                onChange={(e) => setCategoryNameFA(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="آشنایی با مورینگا">آشنایی با مورینگا</option>
                <option value="راهنمای محصولات">راهنمای محصولات</option>
                <option value="نگهداری">نگهداری</option>
                <option value="آموزش استفاده">آموزش استفاده</option>
                <option value="راهنمای خرید">راهنمای خرید</option>
                <option value="راهنمای سفارش">راهنمای سفارش</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">آدرس تصویر شاخص (Cover Image) *</label>
              <input
                type="text"
                required
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm dir-ltr focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">چکیده مقاله (Excerpt) *</label>
            <textarea
              rows={2}
              required
              value={summaryFA}
              onChange={(e) => setSummaryFA(e.target.value)}
              placeholder="خلاصه کوتاهی جهت نمایش در کارت‌های مقاله و گوگل..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">محتوای اصلی مقاله (Markdown/Sanitized) *</label>
            <textarea
              rows={12}
              required
              value={contentFA}
              onChange={(e) => setContentFA(e.target.value)}
              placeholder="# مقدمه\n\nمتن مقاله آموزشی...\n\n## بخش اول\n\nتوضیحات..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* SEO Metadata */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">تنظیمات سئو (SEO Metadata)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">عنوان سئو (SEO Title)</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="حداکثر حدود ۶۰ کاراکتر"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">توضیحات سئو (Meta Description)</label>
              <input
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="حدود ۱۲۰ تا ۱۶۰ کاراکتر"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/articles"
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
