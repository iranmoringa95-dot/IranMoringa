import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ALL_MORINGA_ARTICLES } from '@/lib/articles-data';
import { SITE_CONFIG } from '@/lib/site-config';
import { ArticleDetailClient } from './ArticleDetailClient';

export function generateStaticParams() {
  return ALL_MORINGA_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

function findArticleBySlug(slug: string) {
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const raw = slug.trim().toLowerCase();
  return ALL_MORINGA_ARTICLES.find(
    (a) =>
      a.slug.toLowerCase() === raw ||
      a.slug.toLowerCase() === decodedSlug ||
      encodeURIComponent(a.slug).toLowerCase() === raw
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticleBySlug(slug);

  if (!article) {
    return {
      title: 'مقاله یافت نشد | دانشنامه تخصصی ایران مورینگا',
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${SITE_CONFIG.siteUrl}/articles/${encodeURIComponent(article.slug)}`;
  const imageUrl = article.cover_image_url
    ? article.cover_image_url.startsWith('http')
      ? article.cover_image_url
      : `${SITE_CONFIG.siteUrl}${article.cover_image_url}`
    : `${SITE_CONFIG.siteUrl}/images/og-cover.jpg`;

  return {
    title: `${article.title_fa} | ایران مورینگا`,
    description: article.summary_fa,
    keywords: [
      ...(article.tags || []),
      'خرید مورینگا',
      'مورینگا چیست',
      'مورینگا چیه',
      'مورینگا از کجا تهیه کنم',
      'بهترین مورینگا',
      'ایران مورینگا',
    ],
    authors: [{ name: article.author_name_fa || 'تیم پژوهشی ایران مورینگا' }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title_fa,
      description: article.summary_fa,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.published_at || article.created_at,
      modifiedTime: article.published_at || article.created_at,
      section: article.category_name_fa,
      tags: article.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title_fa,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title_fa,
      description: article.summary_fa,
      images: [imageUrl],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = findArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const articleUrl = `${SITE_CONFIG.siteUrl}/articles/${encodeURIComponent(article.slug)}`;
  const imageUrl = article.cover_image_url
    ? article.cover_image_url.startsWith('http')
      ? article.cover_image_url
      : `${SITE_CONFIG.siteUrl}${article.cover_image_url}`
    : `${SITE_CONFIG.siteUrl}/images/og-cover.jpg`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: article.title_fa,
    description: article.summary_fa,
    image: [imageUrl],
    datePublished: article.published_at || article.created_at,
    dateModified: article.published_at || article.created_at,
    articleSection: article.category_name_fa,
    keywords: (article.tags || []).join(', '),
    author: {
      '@type': 'Person',
      name: article.author_name_fa || 'تیم پژوهشی ایران مورینگا',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.siteUrl}/favicon.svg`,
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'صفحه اصلی',
        item: SITE_CONFIG.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'دانشنامه مقالات',
        item: `${SITE_CONFIG.siteUrl}/articles`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title_fa,
        item: articleUrl,
      },
    ],
  };

  const faqSchema =
    article.faqs && article.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: article.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <ArticleDetailClient article={article} />
    </>
  );
}
