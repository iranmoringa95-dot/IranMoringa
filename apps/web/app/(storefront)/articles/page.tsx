import Link from 'next/link';
import { BookOpen, Clock, ChevronLeft, X } from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ALL_MORINGA_ARTICLES, ArticleItem } from '@/lib/articles-data';

export const metadata = {
  title: 'پایگاه دانش و مجله تخصصی مورینگا ایران | مقالات، راهنماها و خواص علمی',
  description: 'مجموعه مقالات تخصصی درباره خواص پودر و روغن مورینگا، کاشت و زراعت در ایران، کنترل دیابت، لاغری، تقویت پوست و مو و هشدارهای مصرف.',
};

async function getArticles(): Promise<ArticleItem[]> {
  try {
    const res = await fetch('http://localhost:8080/api/v1/content/articles', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        return data.articles;
      }
    }
  } catch (err) {
    // Fallback to static articles data
  }
  return ALL_MORINGA_ARTICLES;
}

export default async function ArticlesListPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const currentCat = params.category || 'all';
  const query = (params.q || '').trim();

  const allArticles = await getArticles();
  let filtered = allArticles;

  if (currentCat !== 'all') {
    filtered = filtered.filter((a) => a.category_slug === currentCat);
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((a) => {
      const titleMatch = a.title_fa.toLowerCase().includes(q);
      const summaryMatch = (a.summary_fa || '').toLowerCase().includes(q);
      return titleMatch || summaryMatch;
    });
  }

  const categories = [
    { slug: 'all', name: 'همه مقالات (۱۰ مقاله)', count: allArticles.length },
    { slug: 'intro-to-moringa', name: 'آشنایی با مورینگا', count: allArticles.filter((a) => a.category_slug === 'intro-to-moringa').length },
    { slug: 'product-guides', name: 'راهنمای محصولات', count: allArticles.filter((a) => a.category_slug === 'product-guides').length },
    { slug: 'storage-guides', name: 'نگهداری', count: allArticles.filter((a) => a.category_slug === 'storage-guides').length },
    { slug: 'usage-tutorials', name: 'آموزش استفاده', count: allArticles.filter((a) => a.category_slug === 'usage-tutorials').length },
    { slug: 'buying-guides', name: 'راهنمای خرید', count: allArticles.filter((a) => a.category_slug === 'buying-guides').length },
    { slug: 'order-faq', name: 'راهنمای سفارش', count: allArticles.filter((a) => a.category_slug === 'order-faq').length },
  ];

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
          <span className="text-slate-900 dark:text-white font-bold">مجله و مقالات تخصصی مورینگا</span>
          {query && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-emerald-800 dark:text-[#d0de41] font-black">«{query}»</span>
            </>
          )}
        </nav>

        {/* Header Hero Section */}
        <div className="bg-[#024a3d] dark:bg-[#032a22] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden border border-emerald-900">
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-[#d0de41]/10 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="px-3.5 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-[#d0de41] text-xs font-black rounded-full inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              مرجع جامع علمی و آموزشی مورینگا در ایران
            </span>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight text-white">
              دانشنامه تخصصی درخت مورینگا اولیفرا
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium">
              مجموعه مقالات مستند درباره خواص، راهنمای نگهداری پودر و روغن، آماده‌سازی دمنوش و نکات اساسی خرید با بازبینی علمی.
            </p>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-900 font-medium">
          🌱 <strong>اطلاعیه عمومی:</strong> کلیه مطالب این مجله آموزشی بوده و جایگزین توصیه مستقیم پزشک یا متخصص تغذیه نمی‌باشد.
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-emerald-950 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={
                  cat.slug === 'all'
                    ? query ? `/articles?q=${encodeURIComponent(query)}` : '/articles'
                    : query ? `/articles?category=${cat.slug}&q=${encodeURIComponent(query)}` : `/articles?category=${cat.slug}`
                }
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
              </Link>
            ))}
          </div>

          <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">
            نمایش {filtered.length} مقاله از {allArticles.length} مقاله مرجع
          </span>
        </div>

        {/* Active Query Chip */}
        {query && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400">فیلتر جستجو:</span>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 rounded-full font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
              <span>«{query}»</span>
              <Link
                href={currentCat !== 'all' ? `/articles?category=${currentCat}` : '/articles'}
                className="hover:text-rose-700 transition-colors"
                title="حذف جستجو"
              >
                <X className="w-3.5 h-3.5" />
              </Link>
            </span>
          </div>
        )}

        {/* Article Cards Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#091e18] p-12 text-center rounded-3xl border border-stone-200 dark:border-emerald-900/60 text-stone-500 dark:text-stone-400 space-y-3 shadow-xs">
            <BookOpen className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">مقاله‌ای مطابق با جستجوی شما یافت نشد.</p>
            <Link href="/articles" className="inline-block text-xs font-bold text-[#026251] dark:text-[#d0de41] hover:underline">
              نمایش همه مقالات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
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
