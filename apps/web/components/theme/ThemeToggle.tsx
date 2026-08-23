'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, Theme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'pill' | 'segmented';
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({
  className = '',
  variant = 'button',
  size = 'md',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-10 h-10 rounded-xl bg-stone-200/60 dark:bg-stone-800/60 animate-pulse ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200/80 dark:border-stone-700/60 text-xs ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
            theme === 'light'
              ? 'bg-white text-[#176b39] shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white'
          }`}
          title="حالت روز (روشن)"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>روشن</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
            theme === 'dark'
              ? 'bg-[#18221b] text-[#97d2a7] shadow-xs border border-[#1e8240]/40'
              : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white'
          }`}
          title="حالت شب (تاریک)"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>تاریک</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
            theme === 'system'
              ? 'bg-white dark:bg-stone-700 text-[#17251c] dark:text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white'
          }`}
          title="هماهنگ خودکار با تنظیمات سیستم/موبایل"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>خودکار</span>
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs cursor-pointer select-none active:scale-95 ${
          isDark
            ? 'bg-[#18221b] text-amber-300 border-stone-700/80 hover:bg-[#202d24]'
            : 'bg-white text-[#176b39] border-stone-200/80 hover:bg-stone-50'
        } ${className}`}
        aria-label={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
        title={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-300" />
            <span>حالت روز</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-[#176b39]" />
            <span>حالت شب</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center border cursor-pointer group relative overflow-hidden select-none active:scale-95 shrink-0 ${
        isDark
          ? 'bg-stone-800/80 text-amber-300 border-stone-700/80 hover:bg-stone-700/80'
          : 'bg-stone-100 text-stone-700 hover:text-[#176b39] border-stone-200/80 hover:bg-stone-200/70'
      } ${className}`}
      aria-label={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      title={isDark ? 'تغییر به حالت روز (روشن)' : 'تغییر به حالت شب (دارک‌مود)'}
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5">
        <Sun
          className={`w-full h-full absolute inset-0 text-amber-400 transition-all duration-300 transform ${
            isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon
          className={`w-full h-full absolute inset-0 text-[#176b39] dark:text-stone-200 transition-all duration-300 transform ${
            isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
      </div>
    </button>
  );
}

