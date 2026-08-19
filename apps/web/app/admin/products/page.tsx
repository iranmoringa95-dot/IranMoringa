'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProductMedia {
  id: string;
  url: string;
  alt_fa: string;
  is_primary: boolean;
}

interface ProductVariant {
  id: string;
  sku: string;
  title_fa: string;
  price_irr: number;
  compare_at_price_irr?: number;
  net_weight_grams: number;
  shipping_weight_grams: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name_fa: string;
  slug: string;
}

interface Product {
  id: string;
  slug: string;
  title_fa: string;
  short_description_fa?: string;
  status: 'draft' | 'in_review' | 'published' | 'unpublished' | 'archived';
  is_featured: boolean;
  version: number;
  available_stock: number;
  created_at: string;
  updated_at: string;
  categories?: Category[];
  variants?: ProductVariant[];
  media?: ProductMedia[];
}

export default function AdminProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: query,
        status: statusFilter,
        category_slug: categoryFilter,
        stock_status: stockFilter,
        page: page.toString(),
        limit: '10',
      });
      const res = await fetch(`/api/v1/admin/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error('خطا در دریافت فهرست محصولات');
      }
      const data = await res.json();
      setProducts(data.items || data.products || []);
      setTotal(data.total || (data.items || data.products || []).length);
    } catch (err: any) {
      setError(err.message || 'خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, statusFilter, categoryFilter, stockFilter, page]);

  const handlePublishToggle = async (id: string, currentStatus: string) => {
    const endpoint = currentStatus === 'published' ? 'unpublish' : 'publish';
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/products/${id}/${endpoint}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'خطا در تغییر وضعیت انتشار محصول');
        return;
      }
      fetchProducts();
    } catch (err) {
      alert('خطا در ارسال درخواست');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('آیا از آرشیو کردن این محصول اطمینان دارید؟')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/products/${id}/archive`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'خطا در آرشیو محصول');
        return;
      }
      fetchProducts();
    } catch (err) {
      alert('خطا در اجرای بایگانی محصول');
    }
  };

  const formatToman = (irr: number) => {
    const toman = Math.floor(irr / 10);
    return toman.toLocaleString('fa-IR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">منتشرشده</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">پیش‌نویس</span>;
      case 'unpublished':
        return <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-full">غیرفعال</span>;
      case 'archived':
        return <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs font-semibold rounded-full">آرشیوشده</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مدیریت کاتالوگ محصولات</h1>
          <p className="text-sm text-slate-500 mt-1">مدیریت ساخت، ویرایش، انتشار و آرشیو محصولات فروشگاه</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-md shadow-emerald-200"
        >
          <span>➕</span>
          <span>افزودن محصول جدید</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، SKU یا مشخصات..."
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
            <option value="unpublished">غیرفعال</option>
            <option value="archived">آرشیوشده</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">موجودی: همه</option>
            <option value="in_stock">موجود در انبار</option>
            <option value="out_of_stock">ناموجود</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">در حال دریافت محصولات...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50">{error}</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">هیچ محصولی یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-4 font-semibold">تصویر</th>
                  <th className="p-4 font-semibold">نام محصول و SKU</th>
                  <th className="p-4 font-semibold">دسته‌بندی</th>
                  <th className="p-4 font-semibold">قیمت (تومان)</th>
                  <th className="p-4 font-semibold">موجودی</th>
                  <th className="p-4 font-semibold">وضعیت</th>
                  <th className="p-4 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const primaryMedia = product.media?.find((m) => m.is_primary) || product.media?.[0];
                  const defaultVariant = product.variants?.[0];
                  const priceIRR = defaultVariant?.price_irr || 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative group">
                          {primaryMedia ? (
                            <img
                              src={primaryMedia.url}
                              alt={primaryMedia.alt_fa || product.title_fa}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl text-slate-400">🌿</span>
                          )}
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5 opacity-90">نمونه</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{product.title_fa}</div>
                        <div className="text-xs text-slate-400 mt-1 font-mono">{defaultVariant?.sku || 'بدون SKU'}</div>
                      </td>
                      <td className="p-4">
                        {product.categories && product.categories.length > 0 ? (
                          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium">
                            {product.categories[0].name_fa}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-900" title={`${priceIRR.toLocaleString('fa-IR')} ریال`}>
                        {formatToman(priceIRR)} <span className="text-xs font-normal text-slate-500">تومان</span>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${product.available_stock > 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                          {product.available_stock.toLocaleString('fa-IR')} عدد
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(product.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/product/${product.slug}`}
                            target="_blank"
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            title="مشاهده در فروشگاه"
                          >
                            👁️
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-2 hover:bg-slate-100 rounded-lg text-emerald-600 transition-colors"
                            title="ویرایش"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => handlePublishToggle(product.id, product.status)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-amber-600 transition-colors"
                            title={product.status === 'published' ? 'خروج از انتشار' : 'انتشار سریع'}
                          >
                            {product.status === 'published' ? '⏸️' : '🚀'}
                          </button>
                          {product.status !== 'archived' && (
                            <button
                              onClick={() => handleArchive(product.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-rose-600 transition-colors"
                              title="آرشیو محصول"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
