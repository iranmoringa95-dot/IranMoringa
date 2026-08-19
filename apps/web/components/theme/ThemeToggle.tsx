'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
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
        className={`w-9 h-9 rounded-full bg-white/10 border border-white/10 animate-pulse ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border shadow-xs cursor-pointer ${
          isDark
            ? 'bg-[#0e2a22] text-[#d0de41] border-[#026251] hover:bg-[#13372c]'
            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
        } ${className}`}
        aria-label={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
        title={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-[#d0de41] animate-spin-slow" />
            <span>حالت روز</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-[#d0de41]" />
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
      className={`p-2 rounded-full transition-all flex items-center justify-center border cursor-pointer group relative overflow-hidden ${
        isDark
          ? 'bg-[#0b241d] text-[#d0de41] border-[#026251] hover:bg-[#113329] hover:scale-105 shadow-inner'
          : 'bg-white/10 text-white hover:text-[#d0de41] border-white/15 hover:bg-white/20 hover:scale-105 shadow-xs'
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
          className={`w-full h-full absolute inset-0 text-white group-hover:text-[#d0de41] transition-all duration-300 transform ${
            isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
      </div>
    </button>
  );
}
