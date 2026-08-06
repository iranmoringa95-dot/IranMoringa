import Link from 'next/link';

interface ProductItem {
  id: string;
  slug: string;
  title_fa: string;
  short_description_fa?: string;
  variants: Array<{
    price_irr: number;
    compare_at_price_irr?: number;
  }>;
}

async function getProducts(): Promise<ProductItem[]> {
  try {
    const res = await fetch('http://localhost:8080/api/v1/catalog/products', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    return [];
  }
}

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">فروشگاه محصولات گیاهی و سلامت</h1>
        <p className="mt-2 text-sm text-slate-600">جست‌وجو و انتخاب بین محصولات ارگانیک با شناسنامه کیفیت</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">دسته‌بندی‌ها</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" defaultChecked />
                <span>همه محصولات</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span>پودر گیاهی</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span>دمنوش ارگانیک</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span>روغن‌های سلامت</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
              در حال حاضر محصولی یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const priceToman = p.variants[0]?.price_irr ? Math.round(p.variants[0].price_irr / 10) : 0;
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between p-6">
                    <div className="space-y-3">
                      <div className="w-full h-48 bg-emerald-50 rounded-xl flex items-center justify-center text-4xl">
                        🌱
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg leading-snug">{p.title_fa}</h3>
                      {p.short_description_fa && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.short_description_fa}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                      <div>
                        <span className="text-lg font-black text-slate-900">{priceToman.toLocaleString('fa-IR')}</span>
                        <span className="text-xs text-slate-500 mr-1">تومان</span>
                      </div>
                      <Link
                        href={`/product/${p.slug}`}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        مشاهده و خرید
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
