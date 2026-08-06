import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/storefront/Header';
import { JsonLd } from '@/components/storefront/JsonLd';

interface ProductDetail {
  id: string;
  slug: string;
  title_fa: string;
  short_description_fa?: string;
  full_description_fa?: string;
  usage_instructions_fa?: string;
  country_of_origin?: string;
  variants: Array<{
    id: string;
    title_fa: string;
    sku: string;
    price_irr: number;
    compare_at_price_irr?: number;
    net_weight_grams: number;
  }>;
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`http://localhost:8080/api/v1/catalog/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const activeVariant = product.variants[0];
  const priceToman = activeVariant ? Math.round(activeVariant.price_irr / 10) : 0;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title_fa,
    description: product.short_description_fa || product.title_fa,
    sku: activeVariant?.sku,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IRR',
      price: activeVariant?.price_irr,
      availability: 'https://schema.org/InStock',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'صفحه اصلی', item: 'http://localhost:3000' },
      { '@type': 'ListItem', position: 2, name: 'فروشگاه', item: 'http://localhost:3000/shop' },
      { '@type': 'ListItem', position: 3, name: product.title_fa, item: `http://localhost:3000/product/${product.slug}` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:underline">صفحه اصلی</Link>
          <span>/</span>
          <Link href="/shop" className="hover:underline">فروشگاه</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">{product.title_fa}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12">
          {/* Gallery */}
          <div className="bg-emerald-50 rounded-3xl h-80 sm:h-96 flex items-center justify-center text-7xl sm:text-8xl shadow-inner">
            🌱
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-snug">{product.title_fa}</h1>
            {product.short_description_fa && (
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">{product.short_description_fa}</p>
            )}

            {/* Pricing Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{priceToman.toLocaleString('fa-IR')}</span>
                <span className="text-slate-500 text-xs sm:text-sm">تومان</span>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-center text-sm">
                  افزودن به سبد خرید
                </button>
              </div>
            </div>

            {/* Medical Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-xs leading-relaxed">
              <strong>هشدار مصرف:</strong> اطلاعات ارائه شده جنبه آگاهی‌بخشی عمومی داشته و جایگزین توصیه مستقیم پزشک متخصص نیست.
            </div>

            {/* Specifications */}
            <div className="border-t border-slate-200 pt-6 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">شناسه کالا (SKU):</span>
                <span className="font-mono text-slate-900">{activeVariant?.sku}</span>
              </div>
              {product.country_of_origin && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">کشور تولیدکننده:</span>
                  <span className="text-slate-900">{product.country_of_origin}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">وزن خالص:</span>
                <span className="text-slate-900">{activeVariant?.net_weight_grams} گرم</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
