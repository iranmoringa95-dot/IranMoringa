import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';

export default function WishlistPage() {
  const sampleWishlist = [
    { id: '1', title: 'پودر ارگانیک برگ مورینگا (۲۵۰ گرمی)', priceToman: 450000, slug: 'moringa-leaf-powder-250g' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900">علاقه‌مندی‌های من</h1>
        <p className="text-xs text-slate-500">لیست کالاهای ذخیره‌شده جهت خرید در آینده</p>
      </div>

      {sampleWishlist.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Heart className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-700">هیچ کالایی در لیست علاقه‌مندی‌ها قرار ندارد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sampleWishlist.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                  🌱
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-emerald-700 font-bold mt-0.5">{item.priceToman.toLocaleString('fa-IR')} تومان</p>
                </div>
              </div>

              <Link
                href={`/product/${item.slug}`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
              >
                خرید
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
