import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE_CONFIG } from '@/lib/site-config';
import { ALL_MORINGA_PRODUCTS } from '@/lib/products-data';
import { ShopClient } from './ShopClient';

export const metadata: Metadata = {
  title: 'خرید مورینگا اصل | قیمت پودر، روغن پرس سرد و دمنوش ارگانیک | فروشگاه ایران مورینگا',
  description:
    'فروشگاه تخصصی خرید مورینگا اصل؛ استعلام قیمت و خرید آنلاین پودر برگ ۱۰۰٪ خالص، روغن ضد لک و جوانساز، دمنوش، قرص و بذر با تضمین آزمایشگاهی کیفیت و ارسال سریع.',
  keywords: [
    'خرید مورینگا',
    'قیمت پودر مورینگا',
    'خرید روغن مورینگا',
    'پودر مورینگا اصل',
    'خرید دمنوش مورینگا',
    'خرید قرص مورینگا',
    'خرید بذر مورینگا',
    'فروش عمده مورینگا',
    'فروشگاه ایران مورینگا',
  ],
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'فروشگاه تخصصی محصولات مورینگا اصل | ایران مورینگا',
    description:
      'خرید مستقیم پودر خالص برگ مورینگا، روغن پرس سرد، دمنوش‌های ارگانیک و مکمل‌ها با تضمین ۱۰۰٪ خلوص.',
    url: `${SITE_CONFIG.siteUrl}/shop`,
    type: 'website',
    images: [
      {
        url: '/images/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'فروشگاه تخصصی محصولات ایران مورینگا',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'خرید مورینگا اصل | فروشگاه ایران مورینگا',
    description:
      'خرید آنلاین پودر برگ، روغن پرس سرد و دمنوش مورینگا با برگه آنالیز آزمایشگاهی.',
    images: ['/images/og-cover.jpg'],
  },
};

export default function ShopPage() {
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'فروشگاه محصولات تخصصی ایران مورینگا',
    description:
      'خرید مستقیم پودر خالص برگ، روغن پرس سرد، دمنوش، کپسول و بذر درخت مورینگا اولیفرا.',
    url: `${SITE_CONFIG.siteUrl}/shop`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: ALL_MORINGA_PRODUCTS.map((prod, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_CONFIG.siteUrl}/product/${prod.slug}`,
        name: prod.title_fa,
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
        name: 'فروشگاه محصولات',
        item: `${SITE_CONFIG.siteUrl}/shop`,
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
              <div className="text-3xl animate-bounce">🌱</div>
              <p className="text-xs font-bold text-[#176b39]">در حال بارگذاری محصولات...</p>
            </div>
          </div>
        }
      >
        <ShopClient />
      </Suspense>
    </>
  );
}
