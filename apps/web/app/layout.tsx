import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'ایران مورینگا (Iran Moringa) | فروشگاه تخصصی سوپرفودهای خالص و ارگانیک',
  description: 'مرجع تخصصی خرید مستقیم پودر خالص برگ مورینگا، روغن پرس سرد، دمنوش‌های ارگانیک و دانشنامه علمی درخت معجزه مورینگا اولیفرا در ایران.',
  manifest: '/manifest.json',
  themeColor: '#064e3b',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#064e3b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
