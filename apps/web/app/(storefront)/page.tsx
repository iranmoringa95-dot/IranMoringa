import Link from 'next/link';

export default function StorefrontHomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-emerald-700 flex items-center gap-2">
              <span className="bg-emerald-600 text-white p-1.5 rounded-lg text-sm">🌱</span>
              فروشگاه سبزینه
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-700">
              <Link href="/shop" className="hover:text-emerald-600 transition-colors">محصولات</Link>
              <Link href="/articles" className="hover:text-emerald-600 transition-colors">مقالات سلامت</Link>
              <Link href="/about" className="hover:text-emerald-600 transition-colors">درباره ما</Link>
              <Link href="/contact" className="hover:text-emerald-600 transition-colors">تماس با ما</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700 transition-colors">
              سبد خرید
            </Link>
            <Link href="/login" className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
              ورود / ثبت‌نام
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-l from-emerald-800 to-teal-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block bg-emerald-700/60 backdrop-blur border border-emerald-500/30 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
              مرجع تخصصی گیاهان دارویی و ارگانیک
            </span>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              سلامتی طبیعی با محصولات اصیل مورینگا و گیاهان درمانی
            </h1>
            <p className="text-emerald-100 text-base sm:text-lg leading-relaxed">
              تأمین مستقیم از مزارع تخصصی، همراه با شناسنامه آزمایشگاهی و بازبینی علمی مقالات درمانی.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/shop" className="px-6 py-3 bg-white text-emerald-900 font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-colors">
                مشاهده محصولات
              </Link>
              <Link href="/articles" className="px-6 py-3 bg-emerald-700/50 hover:bg-emerald-700/80 text-white font-medium rounded-xl transition-colors border border-emerald-500/30">
                راهنمای انتخاب و مصرف
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Cards Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl text-xl">🌱</div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">۱۰۰٪ طبیعی و خالص</h3>
              <p className="text-sm text-slate-600 leading-relaxed">بدون افزودنی‌های شیمیایی و نگهدارنده صنعتی.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl text-xl">🔬</div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">بازبینی تخصصی محتوا</h3>
              <p className="text-sm text-slate-600 leading-relaxed">ارائه مستندات علمی و دوز مصرف استاندارد.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl text-xl">🚚</div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">ارسال سریع سراسری</h3>
              <p className="text-sm text-slate-600 leading-relaxed">بسته‌بندی استاندارد به همراه کد رهگیری پستی.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-sm py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p>© {new Date().getFullYear()} فروشگاه سبزینه (MoringaLab Commerce). تمامی حقوق محفوظ است.</p>
          <p className="text-xs text-slate-500">اطلاعات و مقالات این سایت جایگزین توصیه مستقیم پزشک متخصص نیست.</p>
        </div>
      </footer>
    </div>
  );
}
