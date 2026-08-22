'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ChevronLeft,
  ShoppingBag,
  Truck,
  Award,
  CheckCircle2,
  Plus,
  Minus,
  Check,
  Sparkles,
  HelpCircle,
  Activity,
  Layers,
  Leaf,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { JsonLd } from '@/components/storefront/JsonLd';
import { CommentsSection } from '@/components/storefront/CommentsSection';
import { ALL_MORINGA_PRODUCTS, ProductItem } from '@/lib/products-data';
import { addToCart } from '@/lib/cart';

interface ProductDetailClientProps {
  product: ProductItem;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'claims' | 'specs' | 'usage'>('desc');
  const [showToast, setShowToast] = useState<boolean>(false);

  const activeVariant =
    product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0];

  const currentPriceIrr = activeVariant ? activeVariant.price_irr : product.price_irr;
  const priceToman = Math.round(currentPriceIrr / 10);
  const compareToman = activeVariant?.compare_at_price_irr
    ? Math.round(activeVariant.compare_at_price_irr / 10)
    : product.compare_at_price_irr
    ? Math.round(product.compare_at_price_irr / 10)
    : null;
  const discountPercent = compareToman
    ? Math.round(((compareToman - priceToman) / compareToman) * 100)
    : null;

  const mediaList = product.media && product.media.length > 0 ? product.media : [];
  const currentImage = mediaList[selectedImageIndex] || mediaList[0];

  // Related products in same category
  const relatedProducts = ALL_MORINGA_PRODUCTS.filter(
    (p) => p.id !== product.id && p.category_slug === product.category_slug
  ).slice(0, 3);

  const handleAddToCart = () => {
    if (product.inventory_quantity <= 0) return;
    addToCart(product, quantity, selectedVariantId);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title_fa,
    description: product.short_description_fa || product.description_fa,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'مورینگا ایران',
    },
    image: currentImage ? `https://moringano.ir${currentImage.url}` : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IRR',
      price: currentPriceIrr,
      availability:
        product.inventory_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'صفحه اصلی', item: 'https://moringano.ir' },
      { '@type': 'ListItem', position: 2, name: 'فروشگاه', item: 'https://moringano.ir/shop' },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title_fa,
        item: `https://moringano.ir/product/${product.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#06120e] dir-rtl text-slate-800 dark:text-slate-100 font-sans selection:bg-[#d0de41] selection:text-[#026251] transition-colors duration-200">
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Header />

      {/* Floating Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-md z-50 bg-[#026251] text-white p-4 rounded-3xl shadow-2xl border-2 border-[#d0de41] flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#d0de41] text-[#026251] rounded-2xl flex items-center justify-center font-black shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-black text-white">{product.title_fa}</p>
              <p className="text-[11px] text-emerald-200">با موفقیت به سبد خرید اضافه شد.</p>
            </div>
          </div>
          <Link
            href="/cart"
            className="px-4 py-2 bg-[#d0de41] hover:bg-[#b8c634] text-[#026251] text-xs font-black rounded-xl shrink-0 transition-colors shadow-sm"
          >
            مشاهده سبد
          </Link>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/shop" className="hover:text-emerald-700 transition-colors font-medium">
            فروشگاه مورینگا
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <Link
            href={`/shop?category=${product.category_slug}`}
            className="hover:text-emerald-700 transition-colors font-medium"
          >
            {product.category_name_fa}
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-slate-900 dark:text-white font-bold truncate max-w-xs">{product.title_fa}</span>
        </nav>

        {/* ── Main Product Display Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          {/* Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-stone-900 rounded-3xl h-80 sm:h-[480px] flex items-center justify-center border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden p-6 group">
              {currentImage ? (
                <img
                  src={currentImage.url}
                  alt={currentImage.alt_fa || product.title_fa}
                  className="w-full h-full object-contain max-h-[400px] group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <ShoppingBag className="w-16 h-16 text-stone-300" />
              )}

              <span className="absolute top-4 right-4 px-3 py-1 bg-[#026251] text-[#d0de41] text-xs font-black rounded-full shadow-md">
                {product.category_name_fa}
              </span>

              {discountPercent && discountPercent > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-full shadow-md">
                  {discountPercent}٪ تخفیف
                </span>
              )}
            </div>

            {/* Thumbnails Gallery */}
            {mediaList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {mediaList.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 bg-white dark:bg-stone-900 rounded-2xl border p-1 overflow-hidden transition-all shrink-0 relative ${
                      selectedImageIndex === idx
                        ? 'border-[#026251] ring-2 ring-[#026251]/20 shadow-xs scale-105'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <img src={m.url} alt={m.alt_fa} className="w-full h-full object-contain" />
                    {m.is_primary && (
                      <span className="absolute bottom-1 right-1 px-1 bg-[#026251] text-[#d0de41] text-[9px] font-black rounded">
                        شاخص
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges Bar */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2">
              <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center gap-1.5 text-slate-700 dark:text-stone-300 shadow-xs">
                <Award className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <span className="font-bold">۱۰۰٪ ارگانیک مزرعه</span>
              </div>
              <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center gap-1.5 text-slate-700 dark:text-stone-300 shadow-xs">
                <Truck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <span className="font-bold">ارسال سریع به کل ایران</span>
              </div>
              <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center gap-1.5 text-slate-700 dark:text-stone-300 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <span className="font-bold">تضمین خلوص آزمایشگاهی</span>
              </div>
            </div>
          </div>

          {/* Product Purchase Box (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                  {product.title_fa}
                </h1>
                {product.subtitle_fa && (
                  <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 font-bold mt-1.5 leading-relaxed">
                    {product.subtitle_fa}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                  <span className="text-stone-500 font-mono">کد کالا: {product.sku}</span>
                  <span className="text-stone-300">|</span>
                  <span
                    className={`font-bold ${
                      product.inventory_quantity > 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-600'
                    }`}
                  >
                    {product.inventory_quantity > 0
                      ? `موجود در انبار مرکزی (${product.inventory_quantity.toLocaleString('fa-IR')} عدد)`
                      : 'ناموجود'}
                  </span>
                </div>
              </div>

              {/* Persuasive Key Selling Points */}
              {product.key_benefits_fa && product.key_benefits_fa.length > 0 && (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 p-4 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-[#026251] dark:text-[#d0de41] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ویژگی‌های برجسته و ارزش خرید:</span>
                  </span>
                  <ul className="space-y-1.5">
                    {product.key_benefits_fa.map((benefit, bIdx) => (
                      <li key={bIdx} className="text-xs text-emerald-950 dark:text-emerald-100 flex items-start gap-2 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-[#d0de41] shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Variants Selector */}
              {product.variants && product.variants.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">انتخاب بسته بندی / وزن:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`p-3 rounded-2xl text-xs font-bold transition-all border text-right flex items-center justify-between ${
                          selectedVariantId === v.id
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-[#026251] text-[#026251] dark:text-[#d0de41] ring-2 ring-[#026251]/20'
                            : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-slate-700 dark:text-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <span>{v.package_type}</span>
                        <span>{Math.round(v.price_irr / 10).toLocaleString('fa-IR')} تومان</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Box */}
              <div className="bg-[#faf8f5] dark:bg-stone-800/60 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-4">
                <div className="flex items-baseline gap-3">
                  {compareToman && (
                    <span className="text-sm text-stone-400 line-through font-medium">
                      {compareToman.toLocaleString('fa-IR')}
                    </span>
                  )}
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {priceToman.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm font-medium">تومان</span>
                </div>

                {/* Quantity + Add to Cart Row */}
                <div className="flex items-center gap-3">
                  {/* Quantity control */}
                  <div className="flex items-center gap-2 bg-white dark:bg-stone-900 rounded-2xl p-1.5 border border-stone-200 dark:border-stone-700 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={product.inventory_quantity <= 0}
                      className="w-8 h-8 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl flex items-center justify-center transition-colors text-slate-700 dark:text-stone-300"
                      aria-label="کاهش تعداد"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-slate-900 dark:text-white">
                      {quantity.toLocaleString('fa-IR')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((prev) => Math.min(product.inventory_quantity, prev + 1))
                      }
                      disabled={product.inventory_quantity <= 0}
                      className="w-8 h-8 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl flex items-center justify-center transition-colors text-slate-700 dark:text-stone-300"
                      aria-label="افزایش تعداد"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.inventory_quantity <= 0}
                    className="flex-1 py-4 bg-[#026251] hover:bg-[#024a3d] disabled:bg-stone-300 text-white font-black rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-center text-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#d0de41]" />
                    <span>{product.inventory_quantity > 0 ? 'افزودن به سبد خرید' : 'اتمام موجودی'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Specs Summary */}
              <div className="space-y-2 text-xs pt-2">
                <div className="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-500">وزن خالص محتوا:</span>
                  <span className="text-slate-900 dark:text-stone-200 font-bold">{product.weight_grams} گرم</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-500">وزن با بسته‌بندی مرسوله:</span>
                  <span className="text-slate-900 dark:text-stone-200 font-bold">
                    {product.shipping_weight_grams} گرم
                  </span>
                </div>
                {product.storage_conditions_fa && (
                  <div className="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500">شرایط نگهداری:</span>
                    <span className="text-slate-900 dark:text-stone-200 font-medium">
                      {product.storage_conditions_fa}
                    </span>
                  </div>
                )}
              </div>

              {/* Medical Disclaimer Banner */}
              {product.warnings_fa && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl text-amber-950 dark:text-amber-200 text-xs leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>اطلاعیه و سلب مسئولیت بهداشتی:</span>
                  </div>
                  <p>{product.warnings_fa}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs: Detailed Specifications & Health Claims ── */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 p-2 gap-2">
            <button
              onClick={() => setActiveTab('desc')}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'desc'
                  ? 'bg-white dark:bg-stone-800 text-[#026251] dark:text-[#d0de41] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              توضیحات تخصصی و معرفی
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'claims'
                  ? 'bg-white dark:bg-stone-800 text-[#026251] dark:text-[#d0de41] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              خواص علمی و آنالیز تغذیه‌ای
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'usage'
                  ? 'bg-white dark:bg-stone-800 text-[#026251] dark:text-[#d0de41] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              دستور و شیوه مصرف
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'specs'
                  ? 'bg-white dark:bg-stone-800 text-[#026251] dark:text-[#d0de41] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              جدول مشخصات فنی
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {activeTab === 'desc' && (
              <div className="space-y-6 leading-relaxed text-sm text-slate-700 dark:text-stone-300">
                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-emerald-700 dark:text-[#d0de41]" />
                    <span>شناخت جامع فرآورده و اصالت تولید</span>
                  </h3>
                  <p className="whitespace-pre-line leading-loose text-justify">{product.description_fa}</p>
                </div>

                {/* FAQs Section inside Description */}
                {product.faqs && product.faqs.length > 0 && (
                  <div className="pt-6 border-t border-stone-200 dark:border-stone-800 space-y-4">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
                      <span>پرسش‌های متداول خریداران:</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {product.faqs.map((faq, fIdx) => (
                        <div key={fIdx} className="bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1.5">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{faq.q}</p>
                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="space-y-6">
                <div className="p-5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl space-y-2">
                  <h3 className="font-black text-emerald-950 dark:text-[#d0de41] text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-700 dark:text-[#d0de41]" />
                    <span>خواص تاییدشده و شواهد آزمایشگاهی:</span>
                  </h3>
                  <p className="text-emerald-900 dark:text-emerald-100 text-sm leading-relaxed">
                    {product.health_claims_fa}
                  </p>
                </div>

                {/* Biochemical Profile Grid */}
                {product.biochemical_profile && product.biochemical_profile.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
                      <span>آنالیز کمی ترکیبات فیتوشیمیایی و ارزش تغذیه‌ای:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {product.biochemical_profile.map((bio, idx) => (
                        <div key={idx} className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1">
                          <span className="text-xs text-stone-500 dark:text-stone-400 block">{bio.label}</span>
                          <span className="font-black text-slate-900 dark:text-white text-base">{bio.value}</span>
                          <span className="text-[11px] text-emerald-800 dark:text-emerald-400 block font-medium">{bio.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-4 text-sm text-slate-700 dark:text-stone-300 leading-relaxed">
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-700 dark:text-[#d0de41]" />
                  <span>پروتکل بهینه و دوز پیشنهادی مصرف روزانه</span>
                </h3>
                <p className="leading-loose bg-stone-50 dark:bg-stone-800/40 p-5 rounded-2xl border border-stone-200 dark:border-stone-700">
                  {product.usage_instructions_fa}
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-700 dark:text-[#d0de41]" />
                  <span>مشخصات فنی، استانداردهای بهداشتی و بسته‌بندی</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1">
                    <span className="text-stone-500 block text-xs">کد انبارداری (SKU):</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{product.sku}</span>
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1">
                    <span className="text-stone-500 block text-xs">دسته‌بندی تخصصی:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{product.category_name_fa}</span>
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1">
                    <span className="text-stone-500 block text-xs">وزن خالص محتوا:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{product.weight_grams} گرم</span>
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1">
                    <span className="text-stone-500 block text-xs">وزن نهایی ارسال پستی:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {product.shipping_weight_grams} گرم
                    </span>
                  </div>

                  {product.specifications_table &&
                    product.specifications_table.map((spec, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1"
                      >
                        <span className="text-stone-500 block text-xs">{spec.title}:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{spec.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Product Reviews & User Experiences ── */}
        <CommentsSection
          targetType="product"
          targetId={product.id}
          targetSlug={product.slug}
          targetTitle={product.title_fa}
          showRating={true}
        />

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-700 dark:text-[#d0de41]" />
                <span>محصولات مکمل و مرتبط</span>
              </h2>
              <Link
                href={`/shop?category=${product.category_slug}`}
                className="text-xs font-bold text-emerald-700 dark:text-[#d0de41] hover:underline flex items-center gap-1"
              >
                <span>مشاهده همه</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.map((p) => {
                const pPriceToman = Math.round(p.price_irr / 10);
                const pMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];

                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-full h-44 bg-[#faf8f5] dark:bg-stone-800 rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-stone-100 dark:border-stone-700">
                        {pMedia ? (
                          <img
                            src={pMedia.url}
                            alt={p.title_fa}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-3xl">🌱</span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 hover:text-emerald-700">
                        <Link href={`/product/${p.slug}`}>{p.title_fa}</Link>
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        {pPriceToman.toLocaleString('fa-IR')} تومان
                      </div>
                      <Link
                        href={`/product/${p.slug}`}
                        className="px-3 py-1.5 bg-[#026251] hover:bg-[#024a3d] text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        مشاهده
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
