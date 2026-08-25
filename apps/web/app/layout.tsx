import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SITE_CONFIG } from '@/lib/site-config';

import { FloatingSupport } from '@/components/storefront/FloatingSupport';

export const viewport: Viewport = {
  themeColor: '#064e3b',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.siteUrl),
  title: {
    default: SITE_CONFIG.defaultTitle,
    template: SITE_CONFIG.titleTemplate,
  },
  description: SITE_CONFIG.defaultDescription,
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: 'تیم پژوهشی ایران مورینگا', url: SITE_CONFIG.siteUrl }],
  creator: 'ایران مورینگا (HIGIYA)',
  publisher: 'ایران مورینگا',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: SITE_CONFIG.siteUrl,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.defaultDescription,
    images: [
      {
        url: '/images/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'ایران مورینگا - فروشگاه تخصصی سوپرفودهای خالص و ارگانیک',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.defaultDescription,
    images: ['/images/og-cover.jpg'],
  },
  other: {
    enamad: '50295246',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_CONFIG.name,
  alternateName: [SITE_CONFIG.englishName, SITE_CONFIG.brandName],
  url: SITE_CONFIG.siteUrl,
  logo: `${SITE_CONFIG.siteUrl}/favicon.svg`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: SITE_CONFIG.supportPhoneIntl,
    contactType: 'customer service',
    areaServed: 'IR',
    availableLanguage: ['Persian', 'fa'],
  },
  sameAs: [
    SITE_CONFIG.socials.instagram,
    SITE_CONFIG.socials.telegram,
    SITE_CONFIG.socials.bale,
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_CONFIG.siteUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa-IR" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="enamad" content="50295246" />
        <meta name="enamad" content="۵۰۲۹۵۲۴۶" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#064e3b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('iran_moringa_theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (savedTheme === 'dark' || (savedTheme !== 'light' && systemDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}

              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans bg-[#faf8f5] dark:bg-[#06120e] text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200 selection:bg-[#d0de41] selection:text-[#026251]">
        <ThemeProvider>
          {children}
          <FloatingSupport />
        </ThemeProvider>
      </body>
    </html>
  );
}
