import Link from 'next/link';
import { notFound } from 'next/navigation';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:underline">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/shop" className="hover:underline">فروشگاه</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{product.title_fa}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Gallery */}
        <div className="bg-emerald-50 rounded-3xl h-96 flex items-center justify-center text-8xl shadow-inner">
          🌱
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{product.title_fa}</h1>
          {product.short_description_fa && (
            <p className="text-slate-600 leading-relaxed text-sm">{product.short_description_fa}</p>
          )}

          {/* Pricing Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{priceToman.toLocaleString('fa-IR')}</span>
              <span className="text-slate-500 text-sm">تومان</span>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-center">
                افزودن به سبد خرید
              </button>
            </div>
          </div>

          {/* Specifications */}
          <div className="border-t border-slate-200 pt-6 space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">شناسه کالا (SKU):</span>
              <span className="font-mono text-slate-900">{activeVariant?.sku}</span>
            </div>
            {product.country_of_origin && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">کشور تولیدکننده:</span>
                <span className="text-slate-900">{product.country_of_origin}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-500">وزن خالص:</span>
              <span className="text-slate-900">{activeVariant?.net_weight_grams} گرم</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
