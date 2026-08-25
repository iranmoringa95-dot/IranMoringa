'use client';

import React, { useState } from 'react';
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
  FileText,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { CommentsSection, CommentItem } from '@/components/storefront/CommentsSection';
import { ArticleItem } from '@/lib/articles-data';
import { ALL_MORINGA_PRODUCTS, ProductItem } from '@/lib/products-data';
import { SITE_CONFIG } from '@/lib/site-config';

function renderFormattedText(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[#114627] dark:text-[#97d2a7]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

interface ArticleDetailClientProps {
  article: ArticleItem;
  initialComments?: CommentItem[];
}

export function ArticleDetailClient({ article, initialComments = [] }: ArticleDetailClientProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Look up related products
  const relatedProducts: ProductItem[] = (article.related_product_ids || [])
    .map((id) => ALL_MORINGA_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is ProductItem => Boolean(p));

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((current) => (current === idx ? null : idx));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbf8] dark:bg-[#072714] dir-rtl text-[#17251c] dark:text-[#f2f9f4] font-sans selection:bg-[#c3e5cd] selection:text-[#176b39] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-[#176b39] transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/articles" className="hover:text-[#176b39] transition-colors font-medium">
            مجله و دانشنامه تخصصی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-slate-900 dark:text-white font-bold truncate max-w-xs">{article.title_fa}</span>
        </nav>

        {/* Article Header Card */}
        <header className="bg-white dark:bg-stone-900 rounded-3xl border border-[#e5e8de] dark:border-stone-800 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#f2f9f4] dark:bg-[#0a331b] text-[#176b39] dark:text-[#97d2a7] font-bold rounded-full border border-[#c3e5cd] dark:border-[#14552f]">
                {article.category_name_fa || 'عمومی'}
              </span>
              <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400 font-medium mr-2">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {article.reading_time_minutes || 5} دقیقه مطالعه
              </span>
            </div>

            {article.published_at && (
              <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {new Date(article.published_at).toLocaleDateString('fa-IR')}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#17251c] dark:text-white leading-normal sm:leading-relaxed">
            {article.title_fa}
          </h1>

          <p className="text-sm sm:text-base text-[#17251c] dark:text-stone-200 leading-relaxed bg-[#fafbf8] dark:bg-stone-800 p-5 rounded-2xl border border-[#e5e8de] dark:border-stone-700 font-medium">
            {article.summary_fa}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-stone-400 font-normal">نویسنده:</span>
              <span className="font-bold text-[#17251c] dark:text-white">{article.author_name_fa || 'تیم پژوهشی ایران مورینگا'}</span>
            </div>

            {article.reviewer_name_fa && (
              <div className="flex items-center gap-1.5 bg-[#f2f9f4] dark:bg-[#0a331b] text-[#176b39] dark:text-[#97d2a7] px-3 py-1 rounded-full border border-[#c3e5cd] dark:border-[#14552f]">
                <UserCheck className="w-3.5 h-3.5 text-[#2ea355]" />
                <span className="font-bold">تأییدیه علمی: {article.reviewer_name_fa}</span>
              </div>
            )}
          </div>
        </header>

        {/* Featured Cover Image */}
        {article.cover_image_url && (
          <div className="rounded-3xl overflow-hidden border border-[#e5e8de] dark:border-stone-800 shadow-xs max-h-[440px] bg-[#fafbf8] dark:bg-stone-800 flex items-center justify-center">
            <img
              src={article.cover_image_url}
              alt={article.title_fa}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body Content */}
        <section className="bg-white dark:bg-stone-900 rounded-3xl border border-[#e5e8de] dark:border-stone-800 p-6 sm:p-10 shadow-xs space-y-6 leading-loose text-sm sm:text-base text-[#17251c] dark:text-stone-200">
          <div className="space-y-6 max-w-none">
            {article.content_fa.split('\n\n').map((paragraph, index) => {
              const trimmed = paragraph.trim();

              // Table parsing
              if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
                const lines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
                if (lines.length >= 2) {
                  const parseRow = (line: string) =>
                    line
                      .split('|')
                      .map((c) => c.trim())
                      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                  const headerRow = parseRow(lines[0]);
                  const isDivider = (line: string) => line.replace(/[|\-\s:]/g, '').length === 0;
                  const bodyRows = lines.slice(1).filter((l) => !isDivider(l)).map(parseRow);

                  return (
                    <div key={index} className="my-6 overflow-x-auto rounded-2xl border border-[#e5e8de] dark:border-stone-800 shadow-xs">
                      <table className="w-full text-right text-xs sm:text-sm">
                        <thead className="bg-[#f2f9f4] dark:bg-[#0a331b] text-[#176b39] dark:text-[#97d2a7] font-bold border-b border-[#e5e8de] dark:border-stone-800">
                          <tr>
                            {headerRow.map((cell, cIdx) => (
                              <th key={cIdx} className="px-4 py-3.5 whitespace-nowrap">
                                {renderFormattedText(cell)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900">
                          {bodyRows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-[#fafbf8] dark:bg-stone-800/50'}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 text-stone-700 dark:text-stone-300 font-medium">
                                  {renderFormattedText(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
              }

              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-lg sm:text-xl font-bold text-[#17251c] dark:text-white pt-6 border-b border-stone-100 dark:border-stone-800 pb-2 flex items-center gap-2 leading-relaxed">
                    <span className="w-1.5 h-5 bg-[#176b39] dark:bg-[#2ea355] rounded-full inline-block" />
                    <span>{renderFormattedText(trimmed.replace('## ', ''))}</span>
                  </h2>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-base sm:text-lg font-bold text-[#176b39] dark:text-[#97d2a7] pt-3 leading-relaxed">
                    {renderFormattedText(trimmed.replace('### ', ''))}
                  </h3>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={index} className="text-xl sm:text-2xl font-bold text-[#17251c] dark:text-white pt-4 leading-relaxed">
                    {renderFormattedText(trimmed.replace('# ', ''))}
                  </h2>
                );
              }
              if (trimmed.startsWith('- ')) {
                const items = trimmed.split('\n- ');
                return (
                  <ul key={index} className="space-y-2 text-[#17251c] dark:text-stone-300 mr-4 list-disc marker:text-[#176b39]">
                    {items.map((it, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {renderFormattedText(it.replace(/^- /, ''))}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (trimmed.match(/^\d+\./)) {
                const items = trimmed.split('\n');
                return (
                  <ol key={index} className="space-y-2 text-[#17251c] dark:text-stone-300 mr-2 list-none">
                    {items.map((it, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="bg-[#f2f9f4] dark:bg-[#0a331b] text-[#176b39] dark:text-[#97d2a7] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-[#c3e5cd] dark:border-[#14552f]">
                          {idx + 1}
                        </span>
                        <span>{renderFormattedText(it.replace(/^\d+\.\s*/, ''))}</span>
                      </li>
                    ))}
                  </ol>
                );
              }
              return (
                <p key={index} className="text-[#17251c] dark:text-stone-200 leading-relaxed text-justify">
                  {renderFormattedText(paragraph)}
                </p>
              );
            })}
          </div>

          {/* Direct Commercial Conversion CTA Box */}
          <div className="my-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#114627] to-[#072714] text-white shadow-xl relative overflow-hidden border border-[#2ea355]/30">
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#2ea355]/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#97d2a7] text-xs font-bold border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>خرید مستقیم از تولیدکننده مزارع ایران مورینگا</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  قصد خرید پودر یا روغن مورینگا ۱۰۰٪ خالص و اصل را دارید؟
                </h3>
                <p className="text-xs sm:text-sm text-[#c3e5cd] leading-relaxed">
                  تمامی محصولات ایران مورینگا دارای ضمانت اصالت، برگه آزمایشگاهی خلوص، بسته‌بندی بهداشتی و ارسال سریع به سراسر ایران هستند.
                </p>
              </div>
              <div className="shrink-0 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/shop"
                  className="px-6 py-3 bg-[#2ea355] hover:bg-[#258746] text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>خرید آنلاین مورینگا اصل</span>
                </Link>
                <a
                  href={`https://wa.me/98${SITE_CONFIG.supportPhoneIntl.replace('+', '').slice(2)}?text=${encodeURIComponent('سلام، جهت مشاوره و خرید مورینگا پیام می‌دهم.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs transition-all border border-white/15 text-center flex items-center justify-center gap-1"
                >
                  <span>مشاوره رایگان مصرف</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive In-Article FAQ Accordion */}
          {article.faqs && article.faqs.length > 0 && (
            <div className="my-8 space-y-4 pt-6 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#176b39] dark:text-[#2ea355]" />
                <h3 className="text-base sm:text-lg font-bold text-[#17251c] dark:text-white">
                  پرسش‌های متداول و کلیدی درباره {article.title_fa}
                </h3>
              </div>
              <div className="space-y-3">
                {article.faqs.map((faq, fIdx) => (
                  <div
                    key={fIdx}
                    className="border border-[#e5e8de] dark:border-stone-800 rounded-2xl overflow-hidden bg-[#fafbf8] dark:bg-stone-800/60 transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(fIdx)}
                      className="w-full p-4 text-right font-bold text-xs sm:text-sm text-[#17251c] dark:text-white flex items-center justify-between gap-4"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#176b39] dark:text-[#2ea355] shrink-0" />
                        <span>{faq.question}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                          openFaqIndex === fIdx ? 'rotate-180 text-[#176b39]' : ''
                        }`}
                      />
                    </button>
                    {openFaqIndex === fIdx && (
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-700/60 bg-white dark:bg-stone-900/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scientific Sources & DOI References */}
          {article.sources && article.sources.length > 0 && (
            <div className="bg-[#f8faf7] dark:bg-stone-800/60 border border-[#e5e8de] dark:border-stone-700/60 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#176b39] dark:text-[#97d2a7] font-bold text-sm border-b border-[#e5e8de] dark:border-stone-700 pb-3">
                <FileText className="w-4 h-4 text-[#2ea355]" />
                <span>منابع، مقالات داوری‌شده و مراجع علمی معتبر (Scientific References):</span>
              </div>
              <ul className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
                {article.sources.map((src, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#176b39] dark:bg-[#2ea355] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{src.title}</span>
                      {(src.publisher || src.year) && (
                        <span className="text-stone-400 mr-2 text-[11px]">
                          ({[src.publisher, src.year].filter(Boolean).join(' • ')})
                        </span>
                      )}
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#176b39] dark:text-[#2ea355] hover:underline mr-2 text-[11px]"
                        >
                          <span>مشاهده پیوند DOI</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                برچسب‌ها:
              </span>
              {article.tags.map((tag, i) => (
                <Link
                  key={i}
                  href={`/articles?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-[#f2f9f4] text-[#17251c] dark:text-stone-200 text-xs rounded-full font-medium transition-colors"
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
              <p>{article.disclaimers_fa || 'این مطلب صرفاً برای آشنایی عمومی و افزایش آگاهی است و جایگزین توصیه مستقیم پزشک یا متخصص تغذیه نمی‌باشد.'}</p>
            </div>
          </div>
        </section>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl border border-[#e5e8de] dark:border-stone-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
              <ShoppingBag className="w-5 h-5 text-[#176b39]" />
              <h3 className="font-bold text-[#17251c] dark:text-white text-base">محصولات ارگانیک مرتبط معرفی‌شده در این مقاله</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedProducts.map((p) => {
                const primaryMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];
                const priceToman = Math.round(p.price_irr / 10);

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-4 p-4 bg-[#fafbf8] dark:bg-stone-800 hover:bg-[#f2f9f4] dark:hover:bg-[#0a331b] rounded-2xl border border-[#e5e8de] dark:border-stone-700 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-16 bg-white dark:bg-stone-900 rounded-xl overflow-hidden shrink-0 border border-[#e5e8de] dark:border-stone-700 flex items-center justify-center p-1">
                        {primaryMedia ? (
                          <img src={primaryMedia.url} alt={p.title_fa} className="w-full h-full object-contain" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-stone-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#17251c] dark:text-white group-hover:text-[#176b39] truncate">
                          {p.title_fa}
                        </h4>
                        <p className="text-xs font-bold text-[#176b39] dark:text-[#2ea355] mt-1">
                          {priceToman.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-stone-500 dark:text-stone-400">تومان</span>
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/product/${p.slug}`}
                      className="px-3.5 py-2 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl text-xs font-bold transition-colors shrink-0 shadow-xs"
                    >
                      مشاهده و خرید
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Comments and Discussions Section */}
        <CommentsSection
          targetType="article"
          targetId={article.id}
          targetSlug={article.slug}
          targetTitle={article.title_fa}
          showRating={false}
          initialComments={initialComments}
        />

        {/* Back Link */}
        <div className="pt-4 flex justify-between items-center">
          <Link
            href="/articles"
            className="px-5 py-2.5 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[#17251c] dark:text-stone-200 border border-[#e5e8de] dark:border-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به فهرست مقالات</span>
          </Link>
          <Link
            href="/shop"
            className="px-5 py-2.5 bg-[#176b39] hover:bg-[#14552f] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
          >
            <span>مشاهده فروشگاه محصولات</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
