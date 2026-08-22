'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ArticleItem {
  id: string;
  slug: string;
  title_fa: string;
  summary_fa: string;
  category_name_fa?: string;
  author_name_fa?: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  cover_image_url?: string;
  reading_time_minutes: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminArticlesListPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/api/v1/admin/articles');
      if (!res.ok) {
        throw new Error('خطا در دریافت فهرست مقالات');
      }
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err: any) {
      setError(err.message || 'خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handlePublishToggle = async (id: string, currentStatus: string) => {
    const endpoint = currentStatus === 'published' ? 'unpublish' : 'publish';
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/articles/${id}/${endpoint}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'خطا در تغییر وضعیت انتشار مقاله');
        return;
      }
      fetchArticles();
    } catch (err) {
      alert('خطا در ارسال درخواست');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('آیا از آرشیو کردن این مقاله اطمینان دارید؟')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/articles/${id}/archive`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'خطا در آرشیو مقاله');
        return;
      }
      fetchArticles();
    } catch (err) {
      alert('خطا در اجرای بایگانی مقاله');
    }
  };

  const filteredArticles = articles.filter((art) => {
    if (statusFilter !== 'all' && art.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const titleMatch = art.title_fa.toLowerCase().includes(q);
      const summaryMatch = art.summary_fa.toLowerCase().includes(q);
      return titleMatch || summaryMatch;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">منتشرشده</span>;
      case 'draft':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">پیش‌نویس</span>;
      case 'in_review':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">در حال بررسی</span>;
      case 'archived':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-semibold rounded-full">آرشیوشده</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dir-rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مدیریت مقالات و محتوا (CMS)</h1>
          <p className="text-sm text-slate-500 mt-1">ویرایش، انتشار، بررسی تاریخچه نسخه‌ها و کنترل ادعاهای سلامت مقالات</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-md shadow-emerald-200"
        >
          <span>✍️</span>
          <span>افزودن مقاله جدید</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="جستجو بر اساس عنوان یا چکیده مقاله..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="published">منتشرشده</option>
            <option value="draft">پیش‌نویس</option>
            <option value="in_review">در حال بررسی علمی</option>
            <option value="archived">آرشیوشده</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">در حال دریافت مقالات...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50">{error}</div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center text-slate-500">هیچ مقاله‌ای یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-4 font-semibold">تصویر شاخص</th>
                  <th className="p-4 font-semibold">عنوان مقاله و شناسه</th>
                  <th className="p-4 font-semibold">دسته‌بندی</th>
                  <th className="p-4 font-semibold">نویسنده</th>
                  <th className="p-4 font-semibold">زمان مطالعه</th>
                  <th className="p-4 font-semibold">وضعیت</th>
                  <th className="p-4 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="w-16 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                        {article.cover_image_url ? (
                          <img
                            src={article.cover_image_url}
                            alt={article.title_fa}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">📝</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">{article.title_fa}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">{article.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium">
                        {article.category_name_fa || 'عمومی'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      {article.author_name_fa || 'تیم تحریریه'}
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      {article.reading_time_minutes} دقیقه
                    </td>
                    <td className="p-4">{getStatusBadge(article.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                          title="مشاهده عمومی"
                        >
                          👁️
                        </Link>
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="p-2 hover:bg-slate-100 rounded-lg text-emerald-600 transition-colors"
                          title="ویرایش مقاله"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={() => handlePublishToggle(article.id, article.status)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-amber-600 transition-colors"
                          title={article.status === 'published' ? 'خروج از انتشار' : 'انتشار رسمی'}
                        >
                          {article.status === 'published' ? '⏸️' : '🚀'}
                        </button>
                        {article.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(article.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-rose-600 transition-colors"
                            title="آرشیو مقاله"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
