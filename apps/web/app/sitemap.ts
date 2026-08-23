import type { MetadataRoute } from 'next';
import { ALL_MORINGA_PRODUCTS } from '@/lib/products-data';
import { ALL_MORINGA_ARTICLES } from '@/lib/articles-data';
import { SITE_CONFIG } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.siteUrl;
  const now = new Date();

  // Core static storefront routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/tracking`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic product routes
  const productRoutes: MetadataRoute.Sitemap = ALL_MORINGA_PRODUCTS.map((prod) => ({
    url: `${baseUrl}/product/${prod.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // Dynamic article routes
  const articleRoutes: MetadataRoute.Sitemap = ALL_MORINGA_ARTICLES.map((art) => {
    let articleDate = now;
    if (art.published_at || art.created_at) {
      const parsed = new Date(art.published_at || art.created_at);
      if (!isNaN(parsed.getTime())) {
        articleDate = parsed;
      }
    }
    return {
      url: `${baseUrl}/articles/${encodeURIComponent(art.slug)}`,
      lastModified: articleDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...productRoutes, ...articleRoutes];
}
