'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Filter, ArrowUpDown, ShoppingBag, Sparkles, Search, X, ChevronLeft, Check } from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ALL_MORINGA_PRODUCTS, ProductItem } from '@/lib/products-data';
import { normalizeSearchText } from '@/lib/search';
import { addToCart } from '@/lib/cart';

export function ShopClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || '';

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortOption, setSortOption] = useState('newest');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Sync state if URL changes
  useEffect(() => {
    setSearchQuery(urlQuery);
    setSelectedCategory(urlCategory);
  }, [urlQuery, urlCategory]);

  const filteredProducts = useMemo(() => {
    let list = [...ALL_MORINGA_PRODUCTS];

    if (selectedCategory) {
      list = list.filter((p) => p.category_slug === selectedCategory);
    }

    if (searchQuery.trim()) {
      const normQ = normalizeSearchText(searchQuery.trim());
      const tokens = normQ.split(' ').filter(Boolean);

      list = list.filter((p) => {
        const normTitle = normalizeSearchText(p.title_fa);
        const normSubtitle = normalizeSearchText(p.subtitle_fa || '');
        const normDesc = normalizeSearchText(p.description_fa || '');
        const normCat = normalizeSearchText(p.category_name_fa || '');
        const normSku = normalizeSearchText(p.sku || '');
        const normClaims = normalizeSearchText(p.health_claims_fa || '');

        if (
          normTitle.includes(normQ) ||
          normSubtitle.includes(normQ) ||
          normCat.includes(normQ) ||
          normSku.includes(normQ) ||
          normClaims.includes(normQ) ||
          normDesc.includes(normQ)
        ) {
          return true;
        }

        if (tokens.length > 1) {
          return tokens.every(
            (t) =>
              normTitle.includes(t) ||
              normSubtitle.includes(t) ||
              normCat.includes(t) ||
              normClaims.includes(t) ||
              normDesc.includes(t)
          );
        }

        return false;
      });
    }

    if (sortOption === 'price_asc') {
      list.sort((a, b) => a.price_irr - b.price_irr);
    } else if (sortOption === 'price_desc') {
      list.sort((a, b) => b.price_irr - a.price_irr);
    }

    return list;
  }, [selectedCategory, searchQuery, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}${selectedCategory ? `&category=${selectedCategory}` : ''}`);
    } else {
      router.push(selectedCategory ? `/shop?category=${selectedCategory}` : '/shop');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    router.push(selectedCategory ? `/shop?category=${selectedCategory}` : '/shop');
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    if (searchQuery.trim()) {
      router.push(slug ? `/shop?category=${slug}&q=${encodeURIComponent(searchQuery.trim())}` : `/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(slug ? `/shop?category=${slug}` : '/shop');
    }
  };

  const handleQuickAdd = (product: ProductItem) => {
    addToCart(product, 1);
    setAddedToast(product.title_fa);
    setTimeout(() => {
      setAddedToast(null);
    }, 3000);
  };

  const categories = [
    { slug: '', label: 'همه محصولات', count: ALL_MORINGA_PRODUCTS.length },
    { slug: 'powders', label: 'پودر برگ مورینگا', count: ALL_MORINGA_PRODUCTS.filter((p) => p.category_slug === 'powders').length },
    { slug: 'oils', label: 'روغن‌های درمانی خالص', count: ALL_MORINGA_PRODUCTS.filter((p) => p.category_slug === 'oils').length },
    { slug: 'teas', label: 'دمنوش و چای مورینگا', count: ALL_MORINGA_PRODUCTS.filter((p) => p.category_slug === 'teas').length },
    { slug: 'supplements', label: 'مکمل و قرص خوراکی', count: ALL_MORINGA_PRODUCTS.filter((p) => p.category_slug === 'supplements').length },
    { slug: 'bulk', label: 'فله و عمده (قیمت مزرعه)', count: ALL_MORINGA_PRODUCTS.filter((p) => p.category_slug === 'bulk').length },
    { slug: 'seeds', label: 'بذر و نهال اصلاح‌شده', count: ALL_MORINGA_PRODUCTS.filter((p) => p.category_slug === 'seeds').length },
    { slug: 'books', label: 'کتاب و آموزش', count: ALL_MORINGA_PRODUCTS.filter((p) => p.category_slug === 'books').length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbf8] dark:bg-[#072714] dir-rtl text-[#17251c] dark:text-[#f2f9f4] font-sans selection:bg-[#c3e5cd] selection:text-[#176b39] transition-colors duration-200">
      <Header />

      {/* Floating Add to Cart Toast Feedback */}
      {addedToast && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-[#176b39] text-white p-4 rounded-2xl shadow-float border border-[#2ea355] flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-[#176b39] rounded-xl flex items-center justify-center font-bold shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold truncate max-w-[200px]">{addedToast}</p>
              <p className="text-[11px] text-emerald-100">به سبد خرید شما افزوده شد.</p>
            </div>
          </div>
          <Link
            href="/cart"
            className="px-3 py-1.5 bg-white hover:bg-stone-100 text-[#176b39] text-xs font-black rounded-lg transition-colors shrink-0"
          >
            مشاهده سبد
          </Link>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner */}
        <div className="p-4 bg-[#f2f9f4] dark:bg-[#0a331b] border border-[#c3e5cd] dark:border-[#14552f] rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#17251c] dark:text-white font-medium">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#176b39] dark:text-[#2ea355] shrink-0" />
            <span>تمامی محصولات با تضمین ۱۰۰٪ اصالت و خلوص ارگانیک از مزارع جنوب ایران عرضه می‌شوند.</span>
          </span>
          <span className="text-xs text-[#176b39] dark:text-[#97d2a7] font-bold bg-white dark:bg-stone-900 px-2.5 py-1 rounded-full border border-[#c3e5cd] dark:border-stone-700">
            ارسال سریع پستی 📦
          </span>
        </div>

        {/* Title & In-Page Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#17251c] dark:text-white">فروشگاه تخصصی محصولات مورینگا</h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">خرید مستقیم پودر برگ، روغن خالص پرس سرد، دمنوش، کپسول، بذر و بسته‌های فله</p>
          </div>

          {/* Search Form inside Shop */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#176b39] dark:text-[#2ea355] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در محصولات..."
              className="w-full pr-10 pl-8 py-2.5 bg-white dark:bg-stone-900 border border-[#e5e8de] dark:border-stone-700 text-slate-900 dark:text-white placeholder:text-stone-400 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#176b39]/30 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full"
                title="پاک کردن"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Active Filter Chips */}
        {searchQuery.trim() && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400">فیلتر جستجو:</span>
            <span className="px-3 py-1 bg-[#f2f9f4] dark:bg-[#0d3d21] text-[#176b39] dark:text-[#97d2a7] rounded-full font-bold flex items-center gap-1.5 border border-[#c3e5cd] dark:border-[#1e8240]">
              <span>«{searchQuery}»</span>
              <button onClick={handleClearSearch} className="hover:text-rose-700 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-stone-400">({filteredProducts.length} محصول یافت شد)</span>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex items-center justify-between border-b border-[#e5e8de] dark:border-stone-800 pb-4">
          <span className="text-xs font-bold text-stone-600 dark:text-stone-400">
            نمایش {filteredProducts.length} محصول از {ALL_MORINGA_PRODUCTS.length} محصول موجود
          </span>

          {/* Sort Select */}
          <div className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-[#e5e8de] dark:border-stone-700 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-xs dark:bg-stone-900"
            >
              <option value="newest">جدیدترین محصولات</option>
              <option value="price_asc">ارزان‌ترین به گران‌ترین</option>
              <option value="price_desc">گران‌ترین به ارزان‌ترین</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="w-full lg:w-64 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-[#e5e8de] dark:border-stone-800 shadow-xs shrink-0 space-y-4 self-start">
            <h3 className="font-bold text-[#17251c] dark:text-white text-sm border-b border-stone-100 dark:border-stone-800 pb-3">دسته‌بندی‌ها</h3>
            <div className="space-y-1 text-xs sm:text-sm">
              {categories.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => handleCategorySelect(item.slug)}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    selectedCategory === item.slug
                      ? 'bg-[#176b39] text-white font-bold shadow-xs'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedCategory === item.slug ? 'bg-[#114627] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-2xl border border-[#e5e8de] dark:border-stone-800 text-stone-500 dark:text-stone-400 space-y-3">
                <div className="text-3xl">🍃</div>
                <p className="font-bold text-slate-800 dark:text-slate-200">محصولی مطابق با فیلتر جستجوی شما یافت نشد.</p>
                <div className="flex justify-center gap-3 pt-2">
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
                    >
                      پاک کردن جستجو
                    </button>
                  )}
                  {selectedCategory && (
                    <button
                      onClick={() => handleCategorySelect('')}
                      className="px-4 py-2 bg-[#176b39] hover:bg-[#14552f] text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      نمایش همه دسته‌ها
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((p) => {
                  const priceToman = Math.round(p.price_irr / 10);
                  const compareToman = p.compare_at_price_irr ? Math.round(p.compare_at_price_irr / 10) : null;
                  const discountPercent = compareToman ? Math.round(((compareToman - priceToman) / compareToman) * 100) : null;
                  const primaryMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];

                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-stone-900 rounded-2xl border border-[#e5e8de] dark:border-stone-800 p-4 flex flex-col justify-between hover:border-[#c3e5cd] dark:hover:border-[#1e8240] hover:shadow-card transition-all group min-w-[160px]"
                    >
                      <div className="space-y-3">
                        {/* Image */}
                        <Link
                          href={`/product/${p.slug}`}
                          className="w-full aspect-square bg-[#fafbf8] dark:bg-stone-800/50 rounded-xl overflow-hidden border border-stone-100 dark:border-stone-800 relative flex items-center justify-center p-3 block"
                        >
                          {primaryMedia ? (
                            <img
                              src={primaryMedia.url}
                              alt={primaryMedia.alt_fa || p.title_fa}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <ShoppingBag className="w-12 h-12 text-stone-300" />
                          )}
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 text-[10px] font-bold rounded-md shadow-xs border border-stone-200/60 dark:border-stone-700">
                            {p.category_name_fa}
                          </span>
                          {discountPercent && discountPercent > 0 && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#f47a24] text-white text-[10px] font-bold rounded-md shadow-xs">
                              {discountPercent}٪ تخفیف
                            </span>
                          )}
                        </Link>

                        {/* Details */}
                        <h3 className="font-bold text-sm text-[#17251c] dark:text-white leading-snug line-clamp-2 min-h-[2.5rem]">
                          <Link href={`/product/${p.slug}`} className="hover:text-[#176b39] transition-colors">
                            {p.title_fa}
                          </Link>
                        </h3>
                        {p.subtitle_fa && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 leading-relaxed">{p.subtitle_fa}</p>
                        )}
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          بسته‌بندی: {p.weight_grams} گرمی
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-3">
                        <div>
                          {compareToman && (
                            <div className="text-[11px] text-stone-400 line-through">
                              {compareToman.toLocaleString('fa-IR')}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-black text-[#176b39] dark:text-[#2ea355]">{priceToman.toLocaleString('fa-IR')}</span>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 mr-1">تومان</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(p)}
                            className="p-2 bg-[#f2f9f4] dark:bg-[#0d3d21] text-[#176b39] dark:text-[#97d2a7] hover:bg-[#e1f2e6] rounded-xl text-xs font-bold transition-colors border border-[#c3e5cd] dark:border-[#1e8240]"
                            title="افزودن به سبد خرید"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/product/${p.slug}`}
                            className="px-3 py-2 bg-[#176b39] hover:bg-[#14552f] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                          >
                            مشاهده
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
