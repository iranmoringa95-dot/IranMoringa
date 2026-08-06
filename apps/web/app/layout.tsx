import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'فروشگاه سبزینه | فروشگاه تخصصی محصولات گیاهی و سلامت‌محور',
  description: 'خرید مستقیم و باکیفیت پودر مورینگا، دمنوش‌های گیاهی، روغن‌های سلامت و محصولات طبیعی',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa-IR" dir="rtl">
      <body className="min-h-screen font-sans bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
