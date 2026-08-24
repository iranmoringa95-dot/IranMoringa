'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, ChevronLeft, X, Search, Sparkles } from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ALL_MORINGA_ARTICLES } from '@/lib/articles-data';

export function ArticlesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCategory = searchParams.get('category') || 'all';
  const urlQuery = searchParams.get('q') || '';

  const [currentCat, setCurrentCat] = useState<string>(urlCategory);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);
  const [searchInput, setSearchInput] = useState<string>(urlQuery);

  // Sync state with URL changes
  useEffect(() => {
    setCurrentCat(urlCategory);
    setSearchQuery(urlQuery);
    setSearchInput(urlQuery);
  }, [urlCategory, urlQuery]);

  const categories = useMemo(() => {
    const allCount = ALL_MORINGA_ARTICLES.length;
    const aboutCount = ALL_MORINGA_ARTICLES.filter((a) => a.category_slug === 'about-moringa').length;
    const healthCount = ALL_MORINGA_ARTICLES.filter((a) => a.category_slug === 'health-benefits').length;
    const superfoodCount = ALL_MORINGA_ARTICLES.filter((a) => a.category_slug === 'spirulina-and-superfoods').length;
    const dietCount = ALL_MORINGA_ARTICLES.filter((a) => a.category_slug === 'diet-and-weight-loss').length;
    const recipesCount = ALL_MORINGA_ARTICLES.filter((a) => a.category_slug === 'recipes-and-lifestyle').length;
    const growingCount = ALL_MORINGA_ARTICLES.filter((a) => a.category_slug === 'growing-moringa').length;

    return [
      { slug: 'all', name: `همه مقالات (${allCount})`, count: allCount },
      { slug: 'about-moringa', name: 'آشنایی با مورینگا', count: aboutCount },
      { slug: 'health-benefits', name: 'خواص درمانی و سلامت', count: healthCount },
      { slug: 'spirulina-and-superfoods', name: 'اسپیرولینا و سوپرفودها', count: superfoodCount },
      { slug: 'diet-and-weight-loss', name: 'رژیم و لاغری', count: dietCount },
      { slug: 'recipes-and-lifestyle', name: 'آشپزی و اسموتی', count: recipesCount },
      { slug: 'growing-moringa', name: 'کاشت و زراعت', count: growingCount },
    ];
  }, []);

  const filteredArticles = useMemo(() => {
    let list = ALL_MORINGA_ARTICLES;

    if (currentCat !== 'all') {
      list = list.filter((a) => a.category_slug === currentCat);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        const titleMatch = (a.title_fa || '').toLowerCase().includes(q);
        const summaryMatch = (a.summary_fa || '').toLowerCase().includes(q);
        const tagMatch = a.tags && a.tags.some((t) => t.toLowerCase().includes(q));
        return titleMatch || summaryMatch || tagMatch;
      });
    }

    return list;
  }, [currentCat, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) {
      router.push(currentCat !== 'all' ? `/articles?category=${currentCat}&q=${encodeURIComponent(q)}` : `/articles?q=${encodeURIComponent(q)}`);
    } else {
      router.push(currentCat !== 'all' ? `/articles?category=${currentCat}` : '/articles');
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    router.push(currentCat !== 'all' ? `/articles?category=${currentCat}` : '/articles');
  };

  const handleCategorySelect = (slug: string) => {
    setCurrentCat(slug);
    if (searchQuery.trim()) {
      router.push(slug !== 'all' ? `/articles?category=${slug}&q=${encodeURIComponent(searchQuery.trim())}` : `/articles?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(slug !== 'all' ? `/articles?category=${slug}` : '/articles');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbf8] dark:bg-[#072714] dir-rtl text-[#17251c] dark:text-[#f2f9f4] font-sans selection:bg-[#c3e5cd] selection:text-[#176b39] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-[#176b39] transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/articles" className="hover:text-[#176b39] transition-colors font-medium">
            مجله و دانشنامه تخصصی
          </Link>
          {currentCat !== 'all' && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[#176b39] dark:text-[#97d2a7] font-bold">
                {categories.find((c) => c.slug === currentCat)?.name.split(' (')[0] || currentCat}
              </span>
            </>
          )}
          {searchQuery && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[#176b39] dark:text-[#97d2a7] font-bold">«{searchQuery}»</span>
            </>
          )}
        </nav>

        {/* Header Hero Section */}
        <div className="bg-[#114627] text-white rounded-3xl p-8 sm:p-12 shadow-card relative overflow-hidden border border-[#14552f]">
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-[#2ea355]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-xs border border-white/15 text-[#97d2a7] text-xs font-bold rounded-full inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              مرجع جامع پژوهشی و دانشنامه مورینگا
            </span>
            <h1 className="text-2xl sm:text-4xl font-black leading-normal sm:leading-relaxed text-white">
              دانشنامه و مقالات تخصصی مورینگا
            </h1>
            <p className="text-xs sm:text-sm text-[#c3e5cd] leading-relaxed">
              مجموعه کامل مقالات مستند درباره خواص درمانی، ارزش‌های تغذیه‌ای، راهنمای مصرف پودر و روغن، و زراعت مورینگا با استناد به مراجع علمی.
            </p>

            {/* Quick In-Hero Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-lg pt-2">
              <Search className="w-4 h-4 text-stone-400 absolute right-4 top-5 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در مقالات (مانند: لاغری، دیابت، نحوه مصرف، روغن)..."
                className="w-full pr-11 pl-24 py-3 bg-white text-[#17251c] placeholder:text-stone-400 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2ea355] shadow-xs transition-all min-h-[44px]"
              />
              <button
                type="submit"
                className="absolute left-1.5 top-3.5 px-4 py-1.5 bg-[#176b39] hover:bg-[#14552f] text-white text-xs font-bold rounded-lg transition-all shadow-xs min-h-[36px]"
              >
                جستجو
              </button>
            </form>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e8de] dark:border-stone-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                  currentCat === cat.slug
                    ? 'bg-[#176b39] text-white shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-[#17251c] dark:hover:text-white border border-[#e5e8de] dark:border-stone-800'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    currentCat === cat.slug ? 'bg-[#114627] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            نمایش {filteredArticles.length} مقاله از {ALL_MORINGA_ARTICLES.length} مقاله مرجع
          </span>
        </div>

        {/* Active Query Chip */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400">فیلتر جستجو:</span>
            <span className="px-3 py-1 bg-[#f2f9f4] dark:bg-[#0a331b] text-[#176b39] dark:text-[#97d2a7] rounded-full font-bold flex items-center gap-1.5 border border-[#c3e5cd] dark:border-[#14552f]">
              <span>«{searchQuery}»</span>
              <button
                onClick={handleClearSearch}
                className="hover:text-rose-700 transition-colors"
                title="حذف جستجو"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        )}

        {/* Article Cards Grid */}
        {filteredArticles.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-3xl border border-[#e5e8de] dark:border-stone-800 text-stone-500 dark:text-stone-400 space-y-3 shadow-xs">
            <BookOpen className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600" />
            <p className="text-sm font-bold text-[#17251c] dark:text-white">مقاله‌ای مطابق با جستجوی شما یافت نشد.</p>
            <button
              onClick={() => {
                handleClearSearch();
                setCurrentCat('all');
              }}
              className="inline-block text-xs font-bold text-[#176b39] hover:underline"
            >
              نمایش همه مقالات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-[#e5e8de] dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Article Image */}
                  <div className="h-48 bg-[#fafbf8] dark:bg-stone-800 relative overflow-hidden border-b border-[#e5e8de] dark:border-stone-800 flex items-center justify-center">
                    {article.cover_image_url ? (
                      <img
                        src={article.cover_image_url}
                        alt={article.title_fa}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl">📝</span>
                    )}
                    <span className="absolute top-3 right-3 px-3 py-1 bg-white/95 dark:bg-[#176b39] backdrop-blur-xs text-[#176b39] dark:text-white text-[11px] font-bold rounded-full shadow-xs">
                      {article.category_name_fa}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <h2 className="text-base font-bold text-[#17251c] dark:text-white group-hover:text-[#176b39] transition-colors leading-snug line-clamp-2">
                      <Link href={`/articles/${encodeURIComponent(article.slug)}`}>{article.title_fa}</Link>
                    </h2>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                      {article.summary_fa}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="px-5 pb-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {article.reading_time_minutes || 5} دقیقه مطالعه
                    </span>
                  </div>
                  <Link
                    href={`/articles/${encodeURIComponent(article.slug)}`}
                    className="text-[#176b39] dark:text-[#2ea355] font-bold hover:underline transition-colors inline-flex items-center gap-1"
                  >
                    <span>مطالعه مقاله</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
