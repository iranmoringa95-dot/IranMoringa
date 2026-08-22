import { notFound } from 'next/navigation';
import { ALL_MORINGA_ARTICLES, ArticleItem } from '@/lib/articles-data';
import { ArticleDetailClient } from './ArticleDetailClient';

export function generateStaticParams() {
  return ALL_MORINGA_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const raw = slug.trim().toLowerCase();
  const article = ALL_MORINGA_ARTICLES.find(
    (a) =>
      a.slug.toLowerCase() === raw ||
      a.slug.toLowerCase() === decodedSlug ||
      encodeURIComponent(a.slug).toLowerCase() === raw
  );
  if (!article) return { title: 'مقاله یافت نشد | فروشگاه تخصصی مورینگا ایران' };

  return {
    title: `${article.title_fa} | دانشنامه تخصصی مورینگا ایران`,
    description: article.summary_fa,
    openGraph: {
      title: article.title_fa,
      description: article.summary_fa,
      type: 'article',
      images: article.cover_image_url ? [{ url: `https://moringano.ir${article.cover_image_url}` }] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const raw = slug.trim().toLowerCase();
  const article = ALL_MORINGA_ARTICLES.find(
    (a) =>
      a.slug.toLowerCase() === raw ||
      a.slug.toLowerCase() === decodedSlug ||
      encodeURIComponent(a.slug).toLowerCase() === raw
  );

  if (!article) {
    notFound();
  }

  return <ArticleDetailClient article={article} />;
}
