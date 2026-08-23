'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafbf8] dark:bg-[#072714] p-6 text-center text-[#17251c] dark:text-[#f2f9f4] dir-rtl font-sans selection:bg-[#c3e5cd] selection:text-[#176b39]">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 p-8 sm:p-10 rounded-3xl border border-[#e5e8de] dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex justify-center">
          <BrandLogo variant="horizontal" size="md" href="/" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg sm:text-xl font-bold text-[#17251c] dark:text-white">مشکلی در بارگذاری پیش آمد</h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
            خطایی در برقراری ارتباط با سرور رخ داده است. لطفاً مجدداً تلاش فرمایید.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#176b39] hover:bg-[#14552f] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تلاش مجدد</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#f2f9f4] dark:bg-[#0a331b] hover:bg-[#c3e5cd] text-[#176b39] dark:text-[#97d2a7] text-xs font-bold rounded-xl transition-colors border border-[#c3e5cd] dark:border-[#14552f]"
          >
            صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}

