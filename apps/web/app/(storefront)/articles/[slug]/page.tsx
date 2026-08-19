import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Calendar,
  ShieldAlert,
  ChevronLeft,
  ArrowRight,
  Tag,
  ShoppingBag,
  UserCheck,
  ExternalLink,
  Bookmark,
  Share2,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { JsonLd } from '@/components/storefront/JsonLd';
import { ALL_MORINGA_ARTICLES, ArticleItem } from '@/lib/articles-data';
import { ALL_MORINGA_PRODUCTS, ProductItem } from '@/lib/products-data';

function getArticle(slug: string): ArticleItem | null {
  return ALL_MORINGA_ARTICLES.find((a) => a.slug === slug) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'مقاله یافت نشد | فروشگاه تخصصی مورینگا ایران' };

  return {
    title: `${article.title_fa} | دانشنامه تخصصی مورینگا ایران`,
    description: article.summary_fa,
    openGraph: {
      title: article.title_fa,
      description: article.summary_fa,
      type: 'article',
      images: article.cover_image_url ? [{ url: `http://localhost:3000${article.cover_image_url}` }] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  // Look up related products from the real ALL_MORINGA_PRODUCTS catalog
  const relatedProducts: ProductItem[] = (article.related_product_ids || [])
    .map((id) => ALL_MORINGA_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is ProductItem => Boolean(p));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title_fa,
    description: article.summary_fa,
    image: article.cover_image_url ? `http://localhost:3000${article.cover_image_url}` : undefined,
    author: {
      '@type': 'Person',
      name: article.author_name_fa,
    },
    publisher: {
      '@type': 'Organization',
      name: 'فروشگاه تخصصی مورینگا ایران (فاتحان فراز سبز)',
      url: 'http://localhost:3000',
    },
    datePublished: article.published_at || article.created_at,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dir-rtl text-slate-800 font-sans selection:bg-[#d0de41] selection:text-[#026251]">
      <JsonLd data={jsonLd} />
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/articles" className="hover:text-emerald-700 transition-colors font-medium">
            مجله و دانشنامه تخصصی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{article.title_fa}</span>
        </nav>

        {/* Article Header Card */}
        <header className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-900 font-bold rounded-full border border-emerald-200">
                {article.category_name_fa}
              </span>
              <span className="flex items-center gap-1 text-stone-500 font-medium mr-2">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {article.reading_time_minutes} دقیقه مطالعه
              </span>
            </div>

            {article.published_at && (
              <span className="flex items-center gap-1 text-stone-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {new Date(article.published_at).toLocaleDateString('fa-IR')}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            {article.title_fa}
          </h1>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed bg-[#faf8f5] p-5 rounded-2xl border border-stone-200/70 font-medium">
            {article.summary_fa}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-stone-100 text-xs text-stone-600">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-stone-400 font-normal">نویسنده:</span>
              <span className="font-bold text-slate-900">{article.author_name_fa}</span>
            </div>

            {article.reviewer_name_fa && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-bold">تاییدیه علمی: {article.reviewer_name_fa}</span>
              </div>
            )}
          </div>
        </header>

        {/* Featured Cover Image */}
        {article.cover_image_url && (
          <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-sm max-h-[440px] bg-stone-100">
            <img
              src={article.cover_image_url}
              alt={article.title_fa}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body Content */}
        <section className="bg-white dark:bg-[#091e18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 p-6 sm:p-10 shadow-xs space-y-6 leading-loose text-sm sm:text-base text-slate-700 dark:text-slate-200">
          <div className="space-y-6 prose-stone max-w-none">
            {article.content_fa.split('\n\n').map((paragraph, index) => {
              // Markdown Images: ![alt](url)
              const imgMatch = paragraph.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
              if (imgMatch) {
                const alt = imgMatch[1];
                const src = imgMatch[2];
                return (
                  <figure key={index} className="my-8 rounded-3xl overflow-hidden border border-stone-200 dark:border-emerald-900/60 shadow-md bg-stone-50 dark:bg-[#051410]">
                    <img src={src} alt={alt} className="w-full h-auto max-h-[500px] object-cover" />
                    {alt && (
                      <figcaption className="p-3.5 text-center text-xs text-slate-600 dark:text-slate-400 bg-stone-100/90 dark:bg-[#04100c] border-t border-stone-200 dark:border-emerald-900/50 font-medium">
                        🔬 {alt}
                      </figcaption>
                    )}
                  </figure>
                );
              }

              // Blockquotes: > text
              if (paragraph.startsWith('> ')) {
                return (
                  <blockquote key={index} className="border-r-4 border-[#026251] dark:border-[#d0de41] bg-[#faf8f5] dark:bg-[#051410] p-4 sm:p-5 rounded-2xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm my-4 font-medium leading-relaxed shadow-xs">
                    {paragraph.replace(/^>\s*/, '')}
                  </blockquote>
                );
              }

              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white pt-6 border-b border-stone-100 dark:border-emerald-950 pb-2 flex items-center gap-2">
                    <span className="w-2 h-5 bg-[#026251] dark:bg-[#d0de41] rounded-full inline-block" />
                    <span>{paragraph.replace('## ', '')}</span>
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-base sm:text-lg font-bold text-emerald-900 dark:text-[#d0de41] pt-3">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n- ');
                return (
                  <ul key={index} className="space-y-2 text-slate-700 dark:text-slate-300 mr-4 list-disc marker:text-emerald-700 dark:marker:text-[#d0de41]">
                    {items.map((it, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {it.replace(/^- /, '')}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.match(/^\d+\./)) {
                const items = paragraph.split('\n');
                return (
                  <ol key={index} className="space-y-2 text-slate-700 dark:text-slate-300 mr-2 list-none">
                    {items.map((it, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-[#d0de41] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300 dark:border-emerald-800">
                          {idx + 1}
                        </span>
                        <span>{it.replace(/^\d+\.\s*/, '')}</span>
                      </li>
                    ))}
                  </ol>
                );
              }
              return (
                <p key={index} className="text-slate-700 dark:text-slate-200 leading-relaxed text-justify">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-6 border-t border-stone-100 dark:border-emerald-950 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                برچسب‌ها:
              </span>
              {article.tags.map((tag, i) => (
                <Link
                  key={i}
                  href={`/articles?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-stone-100 dark:bg-white/10 hover:bg-emerald-100 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs rounded-full font-medium transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Medical Disclaimer Alert Box */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 rounded-2xl p-5 flex items-start gap-3.5 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-900 dark:text-amber-300 mb-1">هشدار و سلب مسئولیت پزشکی (Medical Disclaimer):</span>
              <p>{article.disclaimers_fa}</p>
            </div>
          </div>
        </section>

        {/* Scientific Sources Section */}
        {article.sources && article.sources.length > 0 && (
          <section className="bg-white dark:bg-[#091e18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 dark:border-emerald-950 pb-3">
              <Bookmark className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">منابع و مراجع علمی معتبر (Scientific References)</h3>
            </div>
            <div className="space-y-2 text-xs">
              {article.sources.map((src, idx) => (
                <div key={idx} className="bg-stone-50 dark:bg-[#051410] p-3 rounded-xl border border-stone-100 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    <span className="font-bold text-emerald-800 dark:text-[#d0de41] ml-1">[{idx + 1}]</span>
                    {src.title} ({src.publisher || 'ژورنال تخصصی'}، {src.year || 2022})
                  </div>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-[#d0de41] hover:underline inline-flex items-center gap-1 font-mono text-[11px] shrink-0"
                    >
                      <span>مشاهده در پایگاه علمی</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <section className="bg-white dark:bg-[#091e18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-stone-100 dark:border-emerald-950 pb-4">
              <ShoppingBag className="w-5 h-5 text-[#026251] dark:text-[#d0de41]" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">فرآورده‌های ارگانیک مرتبط معرفی‌شده در این مقاله</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedProducts.map((p) => {
                const primaryMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];
                const priceToman = Math.round(p.price_irr / 10);

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-4 p-4 bg-stone-50 dark:bg-[#051410] hover:bg-emerald-50/60 dark:hover:bg-[#071a15] rounded-2xl border border-stone-200 dark:border-emerald-900/50 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-16 bg-white dark:bg-stone-900 rounded-xl overflow-hidden shrink-0 border border-stone-200 dark:border-emerald-900/50 flex items-center justify-center p-1">
                        {primaryMedia ? (
                          <img src={primaryMedia.url} alt={p.title_fa} className="w-full h-full object-contain" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-stone-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-[#d0de41] truncate">
                          {p.title_fa}
                        </h4>
                        <p className="text-xs font-black text-emerald-900 dark:text-[#d0de41] mt-1">
                          {priceToman.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-stone-500 dark:text-stone-400">تومان</span>
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/product/${p.slug}`}
                      className="px-3.5 py-2 bg-[#026251] hover:bg-[#024a3d] text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
                    >
                      مشاهده و خرید
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Back Link */}
        <div className="pt-4 flex justify-between items-center">
          <Link
            href="/articles"
            className="px-5 py-2.5 bg-white dark:bg-[#091e18] hover:bg-stone-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به فهرست همه مقالات</span>
          </Link>
          <Link
            href="/shop"
            className="px-5 py-2.5 bg-[#026251] hover:bg-[#024a3d] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
          >
            <span>مشاهده فروشگاه سوپرفودها</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
