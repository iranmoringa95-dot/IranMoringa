import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ALL_MORINGA_PRODUCTS, ProductItem } from '@/lib/products-data';
import { SITE_CONFIG } from '@/lib/site-config';
import { ProductDetailClient } from './ProductDetailClient';

export function generateStaticParams() {
  return ALL_MORINGA_PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

function findProductBySlug(slug: string): ProductItem | undefined {
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const raw = slug.trim().toLowerCase();
  return ALL_MORINGA_PRODUCTS.find(
    (p) =>
      p.slug.toLowerCase() === raw ||
      p.slug.toLowerCase() === decodedSlug ||
      encodeURIComponent(p.slug).toLowerCase() === raw
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductBySlug(slug);

  if (!product) {
    return {
      title: 'محصول یافت نشد | فروشگاه ایران مورینگا',
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${SITE_CONFIG.siteUrl}/product/${product.slug}`;
  const primaryMedia = product.media?.find((m) => m.is_primary) || product.media?.[0];
  const imageUrl = primaryMedia
    ? primaryMedia.url.startsWith('http')
      ? primaryMedia.url
      : `${SITE_CONFIG.siteUrl}${primaryMedia.url}`
    : `${SITE_CONFIG.siteUrl}/images/og-cover.jpg`;

  const metaDesc =
    product.subtitle_fa ||
    product.short_description_fa ||
    product.description_fa.slice(0, 160);

  return {
    title: `خرید ${product.title_fa} اصل | ایران مورینگا`,
    description: metaDesc,
    keywords: [
      ...(product.seo_keywords || []),
      product.title_fa,
      'خرید مورینگا',
      'قیمت مورینگا',
      'پودر مورینگا اصل',
      'روغن مورینگا',
      'فروشگاه ایران مورینگا',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `خرید ${product.title_fa} اصل | ایران مورینگا`,
      description: metaDesc,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: primaryMedia?.alt_fa || product.title_fa,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `خرید ${product.title_fa} اصل | ایران مورینگا`,
      description: metaDesc,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = findProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const productUrl = `${SITE_CONFIG.siteUrl}/product/${product.slug}`;
  const primaryMedia = product.media?.find((m) => m.is_primary) || product.media?.[0];
  const imageUrl = primaryMedia
    ? primaryMedia.url.startsWith('http')
      ? primaryMedia.url
      : `${SITE_CONFIG.siteUrl}${primaryMedia.url}`
    : `${SITE_CONFIG.siteUrl}/images/og-cover.jpg`;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title_fa,
    description: product.short_description_fa || product.description_fa,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    image: [imageUrl],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IRR',
      price: product.price_irr,
      availability:
        product.inventory_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '38',
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
        name: 'فروشگاه',
        item: `${SITE_CONFIG.siteUrl}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title_fa,
        item: productUrl,
      },
    ],
  };

  const faqSchema =
    product.faqs && product.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: product.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.a,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
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
      <ProductDetailClient product={product} />
    </>
  );
}
