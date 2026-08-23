import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafbf8] dark:bg-[#072714] text-[#17251c] dark:text-[#f2f9f4] transition-colors duration-200 dir-rtl font-sans selection:bg-[#c3e5cd] selection:text-[#176b39]">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

