'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  ShoppingBag,
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Tag,
  Clock,
  ChevronLeft,
  CornerDownLeft,
} from 'lucide-react';
import { performUnifiedSearch, POPULAR_SEARCH_TERMS, UnifiedSearchResults } from '@/lib/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function SearchModal({ isOpen, onClose, initialQuery = '' }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<UnifiedSearchResults>({
    query: '',
    products: [],
    articles: [],
    categories: [],
    suggestions: [],
    totalMatches: 0,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      if (initialQuery.trim()) {
        setResults(performUnifiedSearch(initialQuery));
      } else {
        setResults(performUnifiedSearch(''));
      }
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Perform search on query change
  useEffect(() => {
    if (!isOpen) return;
    const res = performUnifiedSearch(query);
    setResults(res);
    setSelectedIndex(0);
  }, [query, isOpen]);

  // Flatten items for keyboard navigation
  const allNavItems = [
    ...results.products.map((p) => ({
      type: 'product' as const,
      id: p.item.id,
      url: `/product/${p.item.slug}`,
      title: p.item.title_fa,
    })),
    ...results.articles.map((a) => ({
      type: 'article' as const,
      id: a.item.id,
      url: `/articles/${a.item.slug}`,
      title: a.item.title_fa,
    })),
    ...results.categories.map((c) => ({
      type: 'category' as const,
      id: c.id,
      url: c.url,
      title: c.name_fa,
    })),
  ];

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < allNavItems.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allNavItems.length - 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (allNavItems.length > 0 && selectedIndex >= 0 && selectedIndex < allNavItems.length) {
          const selected = allNavItems[selectedIndex];
          onClose();
          router.push(selected.url);
        } else if (query.trim()) {
          onClose();
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
      }
    },
    [allNavItems, selectedIndex, query, onClose, router]
  );

  const handleSelectTerm = (term: string, url?: string) => {
    if (url && !term) {
      onClose();
      router.push(url);
      return;
    }
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150 dir-rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={handleFullSearch}
          className="relative flex items-center px-4 sm:px-6 py-4 border-b border-stone-200 bg-stone-50/70"
        >
          <Search className="w-5 h-5 text-emerald-700 shrink-0 ml-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی هوشمند میان محصولات، مقالات دانشنامه و ترکیبات..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-stone-400 font-medium focus:outline-none"
            aria-label="جستجوی هوشمند مورینگا"
          />

          <div className="flex items-center gap-2 mr-2 shrink-0">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition-colors"
                title="پاک کردن متن"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-bold text-stone-500 bg-stone-200 hover:bg-stone-300 rounded-lg transition-colors"
            >
              ESC
            </button>
          </div>
        </form>

        {/* Results / Suggestions Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* If query is empty -> Show trending & popular searches */}
          {!query.trim() && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>جستجوهای پرطرفدار و پیشنهادی</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCH_TERMS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectTerm(item.text, item.url)}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-stone-200 rounded-2xl text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Category Chips */}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-600 mb-3">
                  <Tag className="w-4 h-4 text-stone-500" />
                  <span>دسته‌بندی‌های کاتالوگ و دانشنامه</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <Link
                    href="/shop?category=powders"
                    onClick={onClose}
                    className="p-3 bg-emerald-50/50 hover:bg-emerald-100/60 rounded-2xl border border-emerald-100 text-emerald-950 font-bold flex items-center justify-between"
                  >
                    <span>🍃 پودر خالص برگ</span>
                    <ChevronLeft className="w-3.5 h-3.5 text-emerald-600" />
                  </Link>
                  <Link
                    href="/shop?category=oils"
                    onClick={onClose}
                    className="p-3 bg-amber-50/50 hover:bg-amber-100/60 rounded-2xl border border-amber-100 text-amber-950 font-bold flex items-center justify-between"
                  >
                    <span>✨ روغن پرس سرد</span>
                    <ChevronLeft className="w-3.5 h-3.5 text-amber-600" />
                  </Link>
                  <Link
                    href="/articles"
                    onClick={onClose}
                    className="p-3 bg-teal-50/50 hover:bg-teal-100/60 rounded-2xl border border-teal-100 text-teal-950 font-bold flex items-center justify-between"
                  >
                    <span>📖 مقالات و خواص</span>
                    <ChevronLeft className="w-3.5 h-3.5 text-teal-600" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* If query has no matches */}
          {query.trim() && results.totalMatches === 0 && (
            <div className="text-center py-10 space-y-3">
              <div className="text-4xl">🔍</div>
              <p className="text-sm font-bold text-slate-800">
                نتیجه‌ای برای «<span className="text-emerald-700">{query}</span>» پیدا نشد.
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                پیشنهاد می‌کنیم از کلمات کلیدی عام‌تر مانند «پودر»، «روغن»، «دیابت» یا «لاغری» استفاده نمایید.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {POPULAR_SEARCH_TERMS.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectTerm(item.text, item.url)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 text-xs font-medium text-slate-700 rounded-xl"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Live Results */}
          {query.trim() && results.totalMatches > 0 && (
            <div className="space-y-6">
              {/* 1. Products Section */}
              {results.products.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 pb-1 border-b border-stone-100">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      محصولات سوپرفود ({results.products.length})
                    </span>
                    <Link
                      href={`/shop?q=${encodeURIComponent(query)}`}
                      onClick={onClose}
                      className="text-emerald-600 hover:underline flex items-center gap-0.5"
                    >
                      مشاهده در فروشگاه
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    {results.products.slice(0, 4).map((p, idx) => {
                      const priceToman = Math.round(p.item.price_irr / 10);
                      const compareToman = p.item.compare_at_price_irr
                        ? Math.round(p.item.compare_at_price_irr / 10)
                        : null;
                      const primaryMedia = p.item.media?.find((m) => m.is_primary) || p.item.media?.[0];
                      const isSelected = selectedIndex === idx;

                      return (
                        <Link
                          key={p.item.id}
                          href={`/product/${p.item.slug}`}
                          onClick={onClose}
                          className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                            isSelected
                              ? 'bg-emerald-50 border border-emerald-200 shadow-xs'
                              : 'hover:bg-stone-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                              {primaryMedia ? (
                                <img
                                  src={primaryMedia.url}
                                  alt={p.item.title_fa}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-xl">🌱</span>
                              )}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>{p.item.title_fa}</span>
                                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md font-medium">
                                  {p.item.category_name_fa}
                                </span>
                              </div>
                              {p.item.subtitle_fa && (
                                <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                                  {p.item.subtitle_fa}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-left shrink-0 mr-3">
                            {compareToman && (
                              <span className="text-[10px] text-stone-400 line-through block">
                                {compareToman.toLocaleString('fa-IR')}
                              </span>
                            )}
                            <div className="text-xs sm:text-sm font-black text-emerald-800">
                              {priceToman.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-stone-500">تومان</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Articles Section */}
              {results.articles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-800 pb-1 border-b border-stone-100">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      مقالات و دانشنامه مورینگا ({results.articles.length})
                    </span>
                    <Link
                      href={`/articles?q=${encodeURIComponent(query)}`}
                      onClick={onClose}
                      className="text-teal-600 hover:underline flex items-center gap-0.5"
                    >
                      مشاهده در مقالات
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    {results.articles.slice(0, 4).map((a, idx) => {
                      const actualIdx = results.products.slice(0, 4).length + idx;
                      const isSelected = selectedIndex === actualIdx;

                      return (
                        <Link
                          key={a.item.id}
                          href={`/articles/${a.item.slug}`}
                          onClick={onClose}
                          className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                            isSelected
                              ? 'bg-teal-50 border border-teal-200 shadow-xs'
                              : 'hover:bg-stone-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-stone-100 rounded-xl overflow-hidden shrink-0 border border-stone-200">
                              <img
                                src={a.item.cover_image_url}
                                alt={a.item.title_fa}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                                {a.item.title_fa}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                                <span className="text-teal-700 font-medium">{a.item.category_name_fa}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  {a.item.reading_time_minutes} دقیقه مطالعه
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Categories / Quick Links */}
              {results.categories.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-stone-600 pb-1 border-b border-stone-100">
                    دسته‌بندی‌ها و بخش‌های مرتبط
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((c) => (
                      <Link
                        key={c.id}
                        href={c.url}
                        onClick={onClose}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 rounded-xl text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Tag className="w-3 h-3 text-emerald-700" />
                        <span>{c.name_fa}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-stone-100/90 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded font-mono text-[10px] shadow-xs">
                ↑↓
              </kbd>
              ناوبری
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded font-mono text-[10px] shadow-xs">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              انتخاب
            </span>
          </div>

          {query.trim() && (
            <button
              onClick={handleFullSearch}
              className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
            >
              <span>مشاهده تمام نتایج برای «{query}»</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
