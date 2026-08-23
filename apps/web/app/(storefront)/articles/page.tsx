import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE_CONFIG } from '@/lib/site-config';
import { ALL_MORINGA_ARTICLES } from '@/lib/articles-data';
import { ArticlesContent } from './ArticlesContent';

export const metadata: Metadata = {
  title: 'دانشنامه و مقالات تخصصی مورینگا | خواص، ارزش غذایی، فواید و طریقه مصرف',
  description:
    'مرجع کامل مقالات علمی و مستند درباره خواص مورینگا، لاغری، دیابت، راهنمای مصرف پودر و روغن، زراعت و ارزش غذایی درخت معجزه در ایران مورینگا.',
  keywords: [
    'مقالات مورینگا',
    'دانشنامه مورینگا',
    'خواص مورینگا',
    'مورینگا چیست',
    'مورینگا چیه',
    'مورینگا از کجا تهیه کنم',
    'بهترین مورینگا',
    'خرید پودر مورینگا',
    'خرید روغن مورینگا',
    'طریقه مصرف مورینگا',
    'عوارض مورینگا',
  ],
  alternates: {
    canonical: '/articles',
  },
  openGraph: {
    title: 'دانشنامه و مقالات تخصصی مورینگا | ایران مورینگا',
    description:
      'مجموعه مقالات مستند درباره خواص درمانی، ارزش‌های تغذیه‌ای، راهنمای مصرف پودر و روغن و زراعت مورینگا با استناد به مراجع علمی.',
    url: `${SITE_CONFIG.siteUrl}/articles`,
    type: 'website',
    images: [
      {
        url: '/images/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'دانشنامه تخصصی مقالات مورینگا',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دانشنامه و مقالات تخصصی مورینگا | ایران مورینگا',
    description:
      'مرجع کامل مقالات علمی و مستند درباره خواص درمانی و راهنمای مصرف مورینگا.',
    images: ['/images/og-cover.jpg'],
  },
};

export default function ArticlesPage() {
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'دانشنامه و مقالات تخصصی مورینگا',
    description:
      'مرجع کامل مقالات علمی و مستند درباره خواص مورینگا، راهنمای مصرف پودر و روغن، ارزش غذایی و کاشت در ایران.',
    url: `${SITE_CONFIG.siteUrl}/articles`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: ALL_MORINGA_ARTICLES.slice(0, 10).map((art, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_CONFIG.siteUrl}/articles/${encodeURIComponent(art.slug)}`,
        name: art.title_fa,
      })),
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
        name: 'دانشنامه مقالات مورینگا',
        item: `${SITE_CONFIG.siteUrl}/articles`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#fafbf8]">
            <div className="text-center space-y-2">
              <div className="text-3xl animate-bounce">📚</div>
              <p className="text-xs font-bold text-[#176b39]">در حال بارگذاری دانشنامه مقالات مورینگا...</p>
            </div>
          </div>
        }
      >
        <ArticlesContent />
      </Suspense>
    </>
  );
}
