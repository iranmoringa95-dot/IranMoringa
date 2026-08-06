import Link from 'next/link';

interface ArticleItem {
  id: string;
  slug: string;
  title_fa: string;
  summary_fa: string;
  category_name_fa: string;
  author_name_fa: string;
  disclaimers_fa: string;
}

async function getArticles(): Promise<ArticleItem[]> {
  try {
    const res = await fetch('http://localhost:8080/api/v1/content/articles', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

export default async function ArticlesListPage() {
  const articles = await getArticles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">مقالات تخصصی و مستندات سلامت</h1>
        <p className="mt-2 text-sm text-slate-600">بررسی‌های علمی در مورد خواص، عوارض و دوز مصرف گیاهان دارویی</p>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          مقاله‌ای یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article) => (
            <article key={article.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                {article.category_name_fa}
              </span>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">{article.title_fa}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{article.summary_fa}</p>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>نویسنده: {article.author_name_fa}</span>
                <span className="text-emerald-600 font-semibold">مطالعه مقاله ←</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
