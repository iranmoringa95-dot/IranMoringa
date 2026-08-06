'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, Search, ArrowUpDown } from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { FilterDrawer } from '@/components/storefront/FilterDrawer';

interface ProductItem {
  id: string;
  slug: string;
  title_fa: string;
  short_description_fa?: string;
  variants: Array<{
    price_irr: number;
    compare_at_price_irr?: number;
  }>;
}

export default function ShopPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOption, setSortOption] = useState('relevance');

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.set('category_slug', selectedCategory);
        if (sortOption) queryParams.set('sort', sortOption);

        const res = await fetch(`http://localhost:8080/api/v1/catalog/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.items || []);
        }
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategory, sortOption]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">فروشگاه محصولات ارگانیک و سلامت</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">انتخاب بهترین محصولات خالص با ضمانت اصالت و آزمایشگاهی</p>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-medium flex items-center gap-2 shadow-xs"
            >
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>فیلترها</span>
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="relevance">مرتبط‌ترین</option>
                <option value="newest">جدیدترین</option>
                <option value="bestseller">پرفروش‌ترین</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs shrink-0 space-y-6 self-start">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">دسته‌بندی‌ها</h3>
            <div className="space-y-1 text-sm text-slate-700">
              {[
                { slug: '', label: 'همه محصولات' },
                { slug: 'powders', label: 'پودر گیاهی' },
                { slug: 'teas', label: 'دمنوش ارگانیک' },
                { slug: 'oils', label: 'روغن‌های سلامت' },
                { slug: 'seeds', label: 'بذر و نشاء' },
              ].map((item) => (
                <button
                  key={item.slug}
                  onClick={() => setSelectedCategory(item.slug)}
                  className={`w-full text-right px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedCategory === item.slug
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                    <div className="w-full h-44 bg-slate-100 rounded-xl" />
                    <div className="h-5 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <div className="text-3xl">🍃</div>
                <p className="font-medium text-slate-700">محصولی یافت نشد.</p>
                <p className="text-xs text-slate-400">لطفاً فیلترها را تغییر داده یا عبارت دیگری جست‌وجو کنید.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => {
                  const priceToman = p.variants[0]?.price_irr ? Math.round(p.variants[0].price_irr / 10) : 0;
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between p-5 sm:p-6">
                      <div className="space-y-3">
                        <div className="w-full h-44 bg-emerald-50 rounded-xl flex items-center justify-center text-4xl">
                          🌱
                        </div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{p.title_fa}</h3>
                        {p.short_description_fa && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.short_description_fa}</p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                        <div>
                          <span className="text-lg font-black text-slate-900">{priceToman.toLocaleString('fa-IR')}</span>
                          <span className="text-xs text-slate-500 mr-1">تومان</span>
                        </div>
                        <Link
                          href={`/product/${p.slug}`}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          مشاهده و خرید
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
    </div>
  );
}
