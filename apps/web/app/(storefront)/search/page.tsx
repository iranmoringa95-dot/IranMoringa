'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  BookOpen,
  Tag,
  ArrowUpDown,
  X,
  Sparkles,
  ChevronLeft,
  Clock,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { MoringaIcon } from '@/components/brand/BrandLogo';
import { performUnifiedSearch, POPULAR_SEARCH_TERMS, UnifiedSearchResults } from '@/lib/search';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'articles' | 'categories'>('all');
  const [sortOption, setSortOption] = useState<'relevance' | 'price_asc' | 'price_desc' | 'newest'>('relevance');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Update query input when URL query changes
  useEffect(() => {
    setQueryInput(initialQuery);
  }, [initialQuery]);

  const searchResults: UnifiedSearchResults = useMemo(() => {
    return performUnifiedSearch(queryInput);
  }, [queryInput]);

  // Handle form submission / URL sync
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(queryInput.trim())}`);
    } else {
      router.push('/search');
    }
  };

  // Filter and sort products
  const sortedProducts = useMemo(() => {
    let list = [...searchResults.products];

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.item.category_slug === selectedCategory);
    }

    if (sortOption === 'price_asc') {
      list.sort((a, b) => a.item.price_irr - b.item.price_irr);
    } else if (sortOption === 'price_desc') {
      list.sort((a, b) => b.item.price_irr - a.item.price_irr);
    } else if (sortOption === 'relevance') {
      list.sort((a, b) => b.score - a.score);
    }

    return list;
  }, [searchResults.products, selectedCategory, sortOption]);

  const productCount = searchResults.products.length;
  const articleCount = searchResults.articles.length;
  const categoryCount = searchResults.categories.length;
  const totalCount = productCount + articleCount + categoryCount;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbf8] dark:bg-[#072714] text-[#17251c] dark:text-[#f2f9f4] dir-rtl font-sans selection:bg-[#c3e5cd] selection:text-[#176b39]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-[#176b39] transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-slate-900 dark:text-white font-bold">جستجوی محصولات و مقالات</span>
          {queryInput && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[#176b39] dark:text-[#97d2a7] font-bold">«{queryInput}»</span>
            </>
          )}
        </nav>

        {/* Search Input Box Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-5 h-5 text-stone-400 absolute right-4 pointer-events-none" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="جستجو میان پودر، روغن پرس سرد، کپسول، مقالات خواص و دیابت..."
              className="w-full pr-12 pl-24 sm:pl-32 py-3.5 bg-[#fafbf8] dark:bg-stone-800 hover:bg-stone-100/80 focus:bg-white dark:focus:bg-stone-800 text-[#17251c] dark:text-white placeholder:text-stone-400 border border-[#e5e8de] dark:border-stone-700 focus:border-[#176b39] rounded-2xl text-sm sm:text-base font-medium focus:outline-none transition-all shadow-inner min-h-[48px]"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => setQueryInput('')}
                className="absolute left-20 sm:left-24 p-1.5 text-stone-400 hover:text-stone-700 rounded-full transition-colors"
                title="پاک کردن"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute left-2 px-4 sm:px-6 py-2 bg-[#176b39] hover:bg-[#14552f] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-card transition-all min-h-[38px]"
            >
              جست‌وجو
            </button>
          </form>

          {/* Quick Trending Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-stone-500 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#176b39]" />
              پیشنهادات سریع:
            </span>
            {POPULAR_SEARCH_TERMS.slice(0, 5).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQueryInput(item.text)}
                className="px-3 py-1 bg-[#fafbf8] dark:bg-stone-800 hover:bg-[#f2f9f4] hover:text-[#176b39] text-stone-600 dark:text-stone-300 rounded-full font-medium transition-colors border border-[#e5e8de] dark:border-stone-700"
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e8de] dark:border-stone-800 pb-4">
          {/* Result Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#176b39] text-white shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 border border-[#e5e8de] dark:border-stone-800'
              }`}
            >
              <span>همه نتایج</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-[#114627] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}>
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'bg-[#176b39] text-white shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 border border-[#e5e8de] dark:border-stone-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>محصولات</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'products' ? 'bg-[#114627] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}>
                {productCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('articles')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'articles'
                  ? 'bg-[#176b39] text-white shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 border border-[#e5e8de] dark:border-stone-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>دانشنامه و مقالات</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'articles' ? 'bg-[#114627] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}>
                {articleCount}
              </span>
            </button>

            {categoryCount > 0 && (
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'categories'
                    ? 'bg-[#176b39] text-white shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 border border-[#e5e8de] dark:border-stone-800'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>دسته‌بندی‌ها</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'categories' ? 'bg-[#114627] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}>
                  {categoryCount}
                </span>
              </button>
            )}
          </div>

          {/* Sort selector for products */}
          {(activeTab === 'all' || activeTab === 'products') && productCount > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-[#e5e8de] dark:border-stone-800 px-3 py-2 rounded-xl text-xs font-medium text-[#17251c] dark:text-white shadow-xs self-end sm:self-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs dark:bg-stone-900"
              >
                <option value="relevance">بیشترین ارتباط</option>
                <option value="price_asc">ارزان‌ترین به گران‌ترین</option>
                <option value="price_desc">گران‌ترین به ارزان‌ترین</option>
              </select>
            </div>
          )}
        </div>

        {/* Empty State */}
        {queryInput.trim() && totalCount === 0 && (
          <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-3xl border border-[#e5e8de] dark:border-stone-800 space-y-4 shadow-xs">
            <div className="text-5xl">🔍</div>
            <h3 className="text-lg font-black text-[#17251c] dark:text-white">
              هیچ نتیجه‌ای برای «{queryInput}» پیدا نشد!
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              املای واژه‌ها را بررسی کنید یا از کلمات کلیدی کلی‌تر مثل «پودر»، «روغن»، «کپسول» یا «چای» استفاده کنید.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#176b39] hover:bg-[#14552f] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>مشاهده کل کاتالوگ محصولات</span>
              </Link>
            </div>
          </div>
        )}

        {/* Results Container */}
        <div className="space-y-10">
          {/* 1. PRODUCTS SECTION */}
          {(activeTab === 'all' || activeTab === 'products') && sortedProducts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e8de] dark:border-stone-800 pb-2">
                <h2 className="text-base sm:text-lg font-black text-[#17251c] dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#176b39]" />
                  <span>محصولات سوپرفود مورینگا ({sortedProducts.length})</span>
                </h2>
                {activeTab === 'all' && sortedProducts.length > 3 && (
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs font-bold text-[#176b39] dark:text-[#97d2a7] hover:underline flex items-center gap-1"
                  >
                    <span>مشاهده همه محصولات ({sortedProducts.length})</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'all' ? sortedProducts.slice(0, 6) : sortedProducts).map((p) => {
                  const priceToman = Math.round(p.item.price_irr / 10);
                  const compareToman = p.item.compare_at_price_irr
                    ? Math.round(p.item.compare_at_price_irr / 10)
                    : null;
                  const discountPercent = compareToman
                    ? Math.round(((compareToman - priceToman) / compareToman) * 100)
                    : null;
                  const primaryMedia = p.item.media?.find((m) => m.is_primary) || p.item.media?.[0];

                  return (
                    <div
                      key={p.item.id}
                      className="bg-white dark:bg-stone-900 rounded-2xl border border-[#e5e8de] dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between p-5 group"
                    >
                      <div className="space-y-3">
                        {/* Image Box */}
                        <div className="w-full h-52 bg-[#fafbf8] dark:bg-stone-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-stone-100 dark:border-stone-700 p-2">
                          {primaryMedia ? (
                            <img
                              src={primaryMedia.url}
                              alt={p.item.title_fa}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-4xl">🌱</span>
                          )}

                          <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/95 dark:bg-stone-900 text-[#176b39] dark:text-[#97d2a7] text-[10px] font-bold rounded-full shadow-xs">
                            {p.item.category_name_fa}
                          </span>

                          {discountPercent && discountPercent > 0 && (
                            <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#f47a24] text-white text-[10px] font-bold rounded-full">
                              {discountPercent}٪ تخفیف
                            </span>
                          )}
                        </div>

                        {/* Title & Info */}
                        <h3 className="font-bold text-[#17251c] dark:text-white text-sm leading-snug group-hover:text-[#176b39] transition-colors">
                          <Link href={`/product/${p.item.slug}`}>{p.item.title_fa}</Link>
                        </h3>

                        {p.item.subtitle_fa && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 leading-relaxed">
                            {p.item.subtitle_fa}
                          </p>
                        )}
                      </div>

                      {/* Footer Price & Action */}
                      <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-4">
                        <div>
                          {compareToman && (
                            <div className="text-[11px] text-stone-400 line-through">
                              {compareToman.toLocaleString('fa-IR')}
                            </div>
                          )}
                          <div>
                            <span className="text-base font-black text-[#176b39] dark:text-[#2ea355]">
                              {priceToman.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[11px] text-stone-500 mr-1">تومان</span>
                          </div>
                        </div>

                        <Link
                          href={`/product/${p.item.slug}`}
                          className="px-3.5 py-2 bg-[#176b39] hover:bg-[#14552f] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          مشاهده و خرید
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 2. ARTICLES SECTION */}
          {(activeTab === 'all' || activeTab === 'articles') && searchResults.articles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e8de] dark:border-stone-800 pb-2">
                <h2 className="text-base sm:text-lg font-black text-[#17251c] dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#176b39]" />
                  <span>مقالات دانشنامه و مستندات علمی ({searchResults.articles.length})</span>
                </h2>
                {activeTab === 'all' && searchResults.articles.length > 3 && (
                  <button
                    onClick={() => setActiveTab('articles')}
                    className="text-xs font-bold text-[#176b39] dark:text-[#97d2a7] hover:underline flex items-center gap-1"
                  >
                    <span>مشاهده همه مقالات ({searchResults.articles.length})</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'all' ? searchResults.articles.slice(0, 6) : searchResults.articles).map((a) => (
                  <article
                    key={a.item.id}
                    className="bg-white dark:bg-stone-900 rounded-2xl border border-[#e5e8de] dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image */}
                      <div className="h-44 bg-[#fafbf8] dark:bg-stone-800 relative overflow-hidden border-b border-[#e5e8de] dark:border-stone-800">
                        <img
                          src={a.item.cover_image_url}
                          alt={a.item.title_fa}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-3 right-3 px-3 py-1 bg-white/95 dark:bg-stone-900 text-[#176b39] dark:text-[#97d2a7] text-[10px] font-bold rounded-full shadow-xs">
                          {a.item.category_name_fa}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <h3 className="text-sm sm:text-base font-bold text-[#17251c] dark:text-white group-hover:text-[#176b39] transition-colors leading-snug line-clamp-2">
                          <Link href={`/articles/${a.item.slug}`}>{a.item.title_fa}</Link>
                        </h3>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
                          {a.item.summary_fa}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {a.item.reading_time_minutes} دقیقه مطالعه
                      </span>

                      <Link
                        href={`/articles/${a.item.slug}`}
                        className="text-[#176b39] dark:text-[#2ea355] font-bold hover:underline transition-colors inline-flex items-center gap-1"
                      >
                        <span>مطالعه کامل</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* 3. CATEGORIES SECTION */}
          {(activeTab === 'all' || activeTab === 'categories') && searchResults.categories.length > 0 && (
            <section className="space-y-4">
              <div className="border-b border-[#e5e8de] dark:border-stone-800 pb-2">
                <h2 className="text-base sm:text-lg font-black text-[#17251c] dark:text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#176b39]" />
                  <span>دسته‌بندی‌ها و بخش‌های مرتبط ({searchResults.categories.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {searchResults.categories.map((c) => (
                  <Link
                    key={c.id}
                    href={c.url}
                    className="p-4 bg-white dark:bg-stone-900 hover:bg-[#f2f9f4] dark:hover:bg-[#0a331b] rounded-xl border border-[#e5e8de] dark:border-stone-800 hover:border-[#c3e5cd] transition-all flex items-center justify-between group shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Tag className="w-4 h-4 text-[#176b39]" />
                      <span className="text-xs sm:text-sm font-bold text-[#17251c] dark:text-white group-hover:text-[#176b39]">
                        {c.name_fa}
                      </span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:text-[#176b39] transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fafbf8]">
          <div className="text-center space-y-3">
            <MoringaIcon className="w-12 h-12 mx-auto animate-pulse" />
            <p className="text-xs font-bold text-[#176b39]">در حال بارگذاری جستجوی هوشمند...</p>
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}

