import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.siteUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/product/',
          '/articles',
          '/articles/',
          '/search',
          '/tracking',
        ],
        disallow: [
          '/admin/',
          '/account/',
          '/cart',
          '/checkout',
          '/checkout/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
