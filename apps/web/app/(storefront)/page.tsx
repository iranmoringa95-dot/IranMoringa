import Link from 'next/link';
import { Header } from '@/components/storefront/Header';
import { JsonLd } from '@/components/storefront/JsonLd';

export default function StorefrontHomePage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'فروشگاه سبزینه (MoringaLab Commerce)',
    url: 'http://localhost:3000',
    logo: 'http://localhost:3000/logo.png',
    description: 'مرجع تخصصی فروش محصولات ارگانیک مورینگا و گیاهان سلامت‌محور با شناسنامه کیفیت علمی.',
  };

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd data={organizationSchema} />
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-l from-emerald-800 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-4 sm:space-y-6">
            <span className="inline-block bg-emerald-700/60 backdrop-blur border border-emerald-500/30 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
              مرجع تخصصی گیاهان دارویی و ارگانیک
            </span>
            <h1 className="text-2xl sm:text-5xl font-black leading-tight sm:leading-tight">
              سلامتی طبیعی با محصولات اصیل مورینگا و گیاهان درمانی
            </h1>
            <p className="text-emerald-100 text-sm sm:text-lg leading-relaxed">
              تأمین مستقیم از مزارع تخصصی، همراه با شناسنامه آزمایشگاهی و بازبینی علمی مقالات درمانی.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
              <Link href="/shop" className="px-5 py-3 bg-white text-emerald-900 font-bold rounded-xl text-xs sm:text-sm shadow-lg hover:bg-emerald-50 transition-colors">
                مشاهده محصولات ارگانیک
              </Link>
              <Link href="/articles" className="px-5 py-3 bg-emerald-700/50 hover:bg-emerald-700/80 text-white font-medium rounded-xl text-xs sm:text-sm transition-colors border border-emerald-500/30">
                راهنمای انتخاب و مصرف
              </Link>
            </div>
          </div>
        </section>

        {/* Categories Cards Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">دسته‌بندی‌های اصلی</h2>
            <Link href="/shop" className="text-xs sm:text-sm font-semibold text-emerald-600 hover:underline">
              مشاهده همه ←
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { title: 'پودر گیاهی', slug: 'powders', icon: '🌿', count: '۴ محصول' },
              { title: 'دمنوش ارگانیک', slug: 'teas', icon: '🍵', count: '۳ محصول' },
              { title: 'روغن‌های سلامت', slug: 'oils', icon: '💧', count: '۳ محصول' },
              { title: 'بذر و نشاء', slug: 'seeds', icon: '🌱', count: '۲ محصول' },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category_slug=${cat.slug}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{cat.icon}</div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">{cat.title}</h3>
                <p className="text-xs text-slate-500">{cat.count}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 3 Trust Badges */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl text-xl">🌱</div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">۱۰۰٪ طبیعی و خالص</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">بدون افزودنی‌های شیمیایی و نگهدارنده صنعتی.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl text-xl">🔬</div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">بازبینی تخصصی محتوا</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">ارائه مستندات علمی و دوز مصرف استاندارد.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl text-xl">🚚</div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">ارسال سریع سراسری</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">بسته‌بندی استاندارد به همراه کد رهگیری پستی.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs sm:text-sm py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p>© {new Date().getFullYear()} فروشگاه سبزینه (MoringaLab Commerce). تمامی حقوق محفوظ است.</p>
          <p className="text-xs text-slate-500">اطلاعات و مقالات این سایت جایگزین توصیه مستقیم پزشک متخصص نیست.</p>
        </div>
      </footer>
    </div>
  );
}
