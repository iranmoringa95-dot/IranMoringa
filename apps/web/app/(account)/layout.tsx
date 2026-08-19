import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#061410] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
