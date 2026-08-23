import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site-config';
import { HomeClient } from './HomeClient';

export const metadata: Metadata = {
  title: 'ایران مورینگا | مرجع خرید مورینگا اصل، پودر برگ خالص و روغن پرس سرد',
  description:
    'مرجع تخصصی خرید مستقیم مورینگا اصل در ایران؛ پودر خالص برگ، روغن پرس سرد، دمنوش ارگانیک، قرص و بذر با ارسال سریع به سراسر کشور. تضمین ۱۰۰٪ خلوص با برگه آزمایشگاه.',
  keywords: SITE_CONFIG.keywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ایران مورینگا | خرید مورینگا اصل، پودر برگ خالص و روغن پرس سرد',
    description:
      'مرجع تخصصی خرید مستقیم مورینگا اصل در ایران. تضمین ۱۰۰٪ خلوص، خرید مستقیم از کشاورز و ارسال سریع به سراسر کشور.',
    url: SITE_CONFIG.siteUrl,
    type: 'website',
    images: [
      {
        url: '/images/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'ایران مورینگا - فروشگاه تخصصی سوپرفودهای ارگانیک',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ایران مورینگا | خرید مورینگا اصل و ارگانیک',
    description:
      'مرجع تخصصی خرید مستقیم پودر خالص برگ مورینگا، روغن پرس سرد و دمنوش‌های ارگانیک در ایران.',
    images: ['/images/og-cover.jpg'],
  },
};

export default function HomePage() {
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.defaultDescription,
    url: SITE_CONFIG.siteUrl,
    telephone: SITE_CONFIG.supportPhoneIntl,
    priceRange: '$$',
    image: `${SITE_CONFIG.siteUrl}/images/og-cover.jpg`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_CONFIG.city,
      addressCountry: 'IR',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Saturday',
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
      ],
      opens: '08:00',
      closes: '22:00',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'مورینگا چیست و چه خواصی دارد؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'مورینگا اولیفرا (Moringa Oleifera) گیاهی غنی از ۹۲ ماده مغذی، ۴۶ نوع آنتی‌اکسیدان، اسیدهای آمینه ضروری، کلسیم، آهن و ویتامین‌های A و C است که برای افزایش سطح انرژی طبیعی، تقویت سیستم ایمنی، لاغری و شادابی پوست کاربرد دارد.',
        },
      },
      {
        '@type': 'Question',
        name: 'نحوه مصرف پودر مورینگا چگونه است؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'می‌توانید روزانه نصف تا یک قاشق چای‌خوری (حدود ۲ تا ۵ گرم) از پودر مورینگا را به آب گرم، ماست، اسموتی، آب‌میوه یا سالاد اضافه کرده و میل نمایید.',
        },
      },
      {
        '@type': 'Question',
        name: 'آیا محصولات ایران مورینگا دارای ضمانت اصالت هستند؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'بله، تمامی محصولات از مزارع تحت نظارت جنوب ایران بدون هیچ‌گونه افزودنی، نگه‌دارنده یا ماده شیمیایی برداشت شده و پس از فرآوری استاندارد در دمای ملایم، با ضمانت بازگشت وجه ارائه می‌شوند.',
        },
      },
      {
        '@type': 'Question',
        name: 'سفارش‌ها چگونه و در چه مدتی ارسال می‌شوند؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'سفارش‌ها از طریق پست پیشتاز و سامانه‌های ارسال سریع بسته‌بندی شده و ظرف ۲ الی ۴ روز کاری در سراسر کشور تحویل داده می‌شوند.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomeClient />
    </>
  );
}
