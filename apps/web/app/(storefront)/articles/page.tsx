'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, ChevronLeft, X, Search, Sparkles } from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ALL_MORINGA_ARTICLES } from '@/lib/articles-data';

function ArticlesContent() {
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
    const growingCount = ALL_MORINGA_ARTICLES.filter((a) => a.category_slug === 'growing-moringa').length;

    return [
      { slug: 'all', name: `همه مقالات (${allCount})`, count: allCount },
      { slug: 'about-moringa', name: 'آشنایی با مورینگا', count: aboutCount },
      { slug: 'health-benefits', name: 'خواص درمانی و سلامت', count: healthCount },
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
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#061410] dir-rtl text-slate-800 dark:text-slate-100 font-sans selection:bg-[#d0de41] selection:text-[#026251] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <Link href="/" className="hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/articles" className="hover:text-[#026251] dark:hover:text-[#d0de41] transition-colors font-medium">
            مجله و دانشنامه تخصصی
          </Link>
          {currentCat !== 'all' && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-emerald-800 dark:text-[#d0de41] font-bold">
                {categories.find((c) => c.slug === currentCat)?.name.split(' (')[0] || currentCat}
              </span>
            </>
          )}
          {searchQuery && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-emerald-800 dark:text-[#d0de41] font-black">«{searchQuery}»</span>
            </>
          )}
        </nav>

        {/* Header Hero Section */}
        <div className="bg-[#024a3d] dark:bg-[#032a22] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden border border-emerald-900">
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-[#d0de41]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="px-3.5 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-[#d0de41] text-xs font-black rounded-full inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              مرجع جامع علمی، آموزشی و پژوهشی مورینگا در ایران
            </span>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight text-white">
              دانشنامه و مقالات تخصصی مورینگا اولیفرا
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium">
              مجموعه کامل مقالات مستند درباره خواص درمانی، کنترل دیابت، لاغری و تناسب اندام، راهنمای مصرف پودر و روغن، و زراعت مورینگا با بازبینی علمی.
            </p>

            {/* Quick In-Hero Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-lg pt-2">
              <Search className="w-4 h-4 text-emerald-800 absolute right-4 top-5 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در مقالات (مانند: لاغری، دیابت، نحوه مصرف، کاشت)..."
                className="w-full pr-11 pl-24 py-3 bg-white text-slate-900 placeholder:text-stone-400 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#d0de41]/40 shadow-md transition-all"
              />
              <button
                type="submit"
                className="absolute left-1.5 top-3.5 px-4 py-1.5 bg-[#024a3d] hover:bg-[#01382e] text-[#d0de41] text-xs font-black rounded-xl transition-all shadow-xs"
              >
                جستجو
              </button>
            </form>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 dark:text-[#d0de41] shrink-0" />
          <span>🌱 <strong>اطلاعیه عمومی:</strong> کلیه مطالب این مجله آموزشی و پژوهشی بوده و جایگزین توصیه مستقیم پزشک یا متخصص تغذیه نمی‌باشد.</span>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-emerald-950 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                  currentCat === cat.slug
                    ? 'bg-[#026251] dark:bg-[#034d3f] text-white shadow-xs'
                    : 'bg-white dark:bg-[#091e18] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-stone-200 dark:border-emerald-900/60'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    currentCat === cat.slug ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">
            نمایش {filteredArticles.length} مقاله از {ALL_MORINGA_ARTICLES.length} مقاله مرجع
          </span>
        </div>

        {/* Active Query Chip */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400">فیلتر جستجو:</span>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 rounded-full font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
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
          <div className="bg-white dark:bg-[#091e18] p-12 text-center rounded-3xl border border-stone-200 dark:border-emerald-900/60 text-stone-500 dark:text-stone-400 space-y-3 shadow-xs">
            <BookOpen className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">مقاله‌ای مطابق با جستجوی شما یافت نشد.</p>
            <button
              onClick={() => {
                handleClearSearch();
                setCurrentCat('all');
              }}
              className="inline-block text-xs font-bold text-[#026251] dark:text-[#d0de41] hover:underline"
            >
              نمایش همه مقالات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white dark:bg-[#091e18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Article Image */}
                  <div className="h-48 bg-stone-100 dark:bg-stone-900 relative overflow-hidden border-b border-stone-100 dark:border-emerald-950 flex items-center justify-center">
                    {article.cover_image_url ? (
                      <img
                        src={article.cover_image_url}
                        alt={article.title_fa}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl">📝</span>
                    )}
                    <span className="absolute top-3 right-3 px-3 py-1 bg-white/95 dark:bg-[#026251] backdrop-blur-xs text-emerald-800 dark:text-white text-[11px] font-bold rounded-full shadow-xs">
                      {article.category_name_fa}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#026251] dark:group-hover:text-[#d0de41] transition-colors leading-snug line-clamp-2">
                      <Link href={`/articles/${article.slug}`}>{article.title_fa}</Link>
                    </h2>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                      {article.summary_fa}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="px-6 pb-6 pt-3 border-t border-stone-100 dark:border-emerald-950 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {article.reading_time_minutes || 5} دقیقه مطالعه
                    </span>
                  </div>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="text-[#026251] dark:text-[#d0de41] font-bold hover:underline transition-colors inline-flex items-center gap-1"
                  >
                    <span>مطالعه کامل</span>
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

export default function ArticlesListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
          <div className="text-center space-y-2">
            <div className="text-3xl animate-bounce">📚</div>
            <p className="text-xs font-bold text-emerald-800">در حال بارگذاری دانشنامه مقالات مورینگا...</p>
          </div>
        </div>
      }
    >
      <ArticlesContent />
    </Suspense>
  );
}
