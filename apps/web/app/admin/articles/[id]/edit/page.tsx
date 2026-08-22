'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ArticleRevision {
  id: string;
  version: number;
  title_fa: string;
  created_at: string;
}

export default function AdminEditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [version, setVersion] = useState<number>(1);
  const [status, setStatus] = useState<string>('draft');
  const [titleFA, setTitleFA] = useState('');
  const [slug, setSlug] = useState('');
  const [summaryFA, setSummaryFA] = useState('');
  const [contentFA, setContentFA] = useState('');
  const [categoryNameFA, setCategoryNameFA] = useState('آشنایی با مورینگا');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [revisions, setRevisions] = useState<ArticleRevision[]>([]);

  useEffect(() => {
    if (!id) return;
    const loadArticle = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/v1/admin/articles/${id}`);
        if (!res.ok) throw new Error('مقاله مورد نظر یافت نشد');
        const data = await res.json();
        setVersion(data.version || 1);
        setStatus(data.status || 'draft');
        setTitleFA(data.title_fa || '');
        setSlug(data.slug || '');
        setSummaryFA(data.summary_fa || '');
        setContentFA(data.content_fa || '');
        setCategoryNameFA(data.category_name_fa || 'آشنایی با مورینگا');
        setCoverImageUrl(data.cover_image_url || '');
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');

        // Fetch Revisions
        const revRes = await fetch(`http://localhost:8080/api/v1/admin/articles/${id}/revisions`);
        if (revRes.ok) {
          const revData = await revRes.json();
          setRevisions(revData.revisions || []);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'خطا در بارگذاری مقاله');
      } finally {
        setLoading(false);
      }
    };
    loadArticle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        title_fa: titleFA,
        summary_fa: summaryFA,
        content_fa: contentFA,
        category_name_fa: categoryNameFA,
        cover_image_url: coverImageUrl,
        seo_title: seoTitle,
        seo_description: seoDescription,
        disclaimers_fa: 'این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.',
      };

      const res = await fetch(`http://localhost:8080/api/v1/admin/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'خطا در بروزرسانی مقاله');
      }

      const updated = await res.json();
      setVersion(updated.version);
      setSuccessMessage('تغییرات مقاله با موفقیت ذخیره شد.');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت تغییرات مقاله');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishToggle = async () => {
    const endpoint = status === 'published' ? 'unpublish' : 'publish';
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/articles/${id}/${endpoint}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'انتشار مقاله به دلیل عدم تایید یا وجود ادعای درمانی رد شد.');
      }
      const updated = await res.json();
      setStatus(updated.status);
      setSuccessMessage(endpoint === 'publish' ? 'مقاله با موفقیت منتشر شد.' : 'مقاله از حالت انتشار خارج شد.');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!confirm('آیا از بازگردانی این نسخه اطمینان دارید؟')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/articles/${id}/revisions/${revId}/restore`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('خطا در بازگردانی نسخه مقاله');
      }
      const restored = await res.json();
      setTitleFA(restored.title_fa);
      setSummaryFA(restored.summary_fa);
      setContentFA(restored.content_fa);
      setVersion(restored.version);
      setSuccessMessage('نسخه قبلی با موفقیت بازگردانی شد.');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">در حال دریافت محتوای مقاله...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-800 dir-rtl">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ویرایش مقاله: {titleFA}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
            <span>اسلاگ: {slug}</span>
            <span>|</span>
            <span>نسخه فعال: {version}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePublishToggle}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${
              status === 'published'
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {status === 'published' ? '⏸️ خروج از انتشار' : '🚀 انتشار مقاله'}
          </button>
          <Link
            href="/admin/articles"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
          >
            بازگشت
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold">
          ✅ {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">محتوای مقاله</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">عنوان مقاله (فارسی) *</label>
            <input
              type="text"
              required
              value={titleFA}
              onChange={(e) => setTitleFA(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">چکیده مقاله (Excerpt) *</label>
            <textarea
              rows={2}
              required
              value={summaryFA}
              onChange={(e) => setSummaryFA(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">متن اصلی (Markdown/Sanitized) *</label>
            <textarea
              rows={12}
              required
              value={contentFA}
              onChange={(e) => setContentFA(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Revisions History */}
        {revisions.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">تاریخچه نسخه‌ها (Revisions)</h2>
            <div className="divide-y divide-slate-100">
              {revisions.map((rev) => (
                <div key={rev.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-slate-800">نسخه {rev.version}</span>
                    <span className="text-xs text-slate-400 mr-3">{new Date(rev.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestoreRevision(rev.id)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    🔄 بازگردانی این نسخه
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
          >
            {submitting ? 'در حال ذخیره...' : 'ذخیره تغییرات مقاله'}
          </button>
        </div>
      </form>
    </div>
  );
}
