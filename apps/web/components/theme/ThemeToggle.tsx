'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'pill' | 'switch';
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({
  className = '',
  variant = 'button',
  size = 'md',
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full bg-slate-200 dark:bg-emerald-950/60 border border-slate-300 dark:border-emerald-800/40 animate-pulse ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border shadow-xs cursor-pointer select-none active:scale-95 ${
          isDark
            ? 'bg-[#0b241d] text-[#d0de41] border-emerald-700/60 hover:bg-[#113329] hover:border-[#d0de41]/60'
            : 'bg-white text-[#026251] border-emerald-900/25 hover:bg-emerald-50 hover:border-emerald-600'
        } ${className}`}
        aria-label={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
        title={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-[#d0de41]" />
            <span>حالت روز</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-[#026251]" />
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
      className={`p-2 rounded-full transition-all flex items-center justify-center border cursor-pointer group relative overflow-hidden select-none active:scale-95 ${
        isDark
          ? 'bg-[#0b241d] text-[#d0de41] border-emerald-700/60 hover:bg-[#113329] hover:border-[#d0de41]/60 hover:scale-105 shadow-sm'
          : 'bg-white text-[#026251] hover:text-[#014639] border-emerald-900/25 hover:bg-emerald-50 hover:border-emerald-600 hover:scale-105 shadow-sm'
      } ${size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9 sm:w-10 sm:h-10'} ${className}`}
      aria-label={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      title={isDark ? 'تغییر به حالت روز (روشن)' : 'تغییر به حالت شب (دارک‌مود)'}
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5">
        <Sun
          className={`w-full h-full absolute inset-0 text-[#d0de41] transition-all duration-300 transform ${
            isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon
          className={`w-full h-full absolute inset-0 text-[#026251] transition-all duration-300 transform ${
            isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
      </div>
    </button>
  );
}

