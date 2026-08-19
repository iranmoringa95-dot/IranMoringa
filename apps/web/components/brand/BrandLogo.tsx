'use client';

import React from 'react';
import Link from 'next/link';

export interface BrandLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon-only' | 'text-only';
  theme?: 'light' | 'dark' | 'colored' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showSubtext?: boolean;
  subtextLang?: 'fa' | 'en' | 'both';
  href?: string;
  className?: string;
  animated?: boolean;
}

/**
 * Animated Authentic Moringa Leaf Sprout (برگ متحرک و اصیل مورینگا)
 */
export function MoringaAnimatedLeaf({
  className = 'w-6 h-6',
  theme = 'colored',
  animated = true,
}: {
  className?: string;
  theme?: 'light' | 'dark' | 'colored' | 'auto';
  animated?: boolean;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${
        animated
          ? 'animate-[moringaBreeze_4s_ease-in-out_infinite] group-hover:scale-115 group-hover:-rotate-6 transition-all duration-300'
          : ''
      } ${className}`}
      style={{ transformOrigin: 'bottom center' }}
    >
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          <linearGradient id="leafGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
          <linearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="stemGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>

        {/* Curved Stem */}
        <path
          d="M 22 40 C 22 30 20 18 16 8"
          stroke="url(#stemGrad)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Primary Left Moringa Leaflet */}
        <path
          d="M 20 22 C 7 14 3 22 4 30 C 6 36 16 36 20 30 Z"
          fill="url(#leafGrad1)"
        />

        {/* Secondary Right Moringa Leaflet */}
        <path
          d="M 21 16 C 32 10 39 14 40 20 C 39 26 32 26 25 20 Z"
          fill="url(#leafGrad2)"
        />

        {/* Morning Dew Sunlight Pearl */}
        <circle cx="17" cy="7" r="2.2" fill="#fef08a" opacity="0.95" />
      </svg>
    </div>
  );
}

export const MoringaIcon = MoringaAnimatedLeaf;

/**
 * Premium Persian Logotype (ایران مورینگا)
 * - "ایران" in Warm Citrus Orange
 * - "مورینگا" in Fresh Botanical Green
 * - Animated Leaf floating naturally above
 * - Sleek gradient underline
 */
export function IranMoringaLogotype({
  size = 'md',
  showSubtext = true,
  animated = true,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  theme?: 'light' | 'dark' | 'colored' | 'auto';
  showSubtext?: boolean;
  subtextLang?: 'fa' | 'en' | 'both';
  animated?: boolean;
}) {
  const fontSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl md:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
    hero: 'text-4xl sm:text-5xl lg:text-6xl',
  };

  const leafSizes = {
    sm: 'w-4 h-4 -top-3.5 right-6 sm:right-7',
    md: 'w-5 h-5 -top-4 sm:-top-5 right-7 sm:right-9',
    lg: 'w-7 h-7 -top-6 sm:-top-7 right-10 sm:right-12',
    xl: 'w-9 h-9 -top-8 sm:-top-9 right-12 sm:right-16',
    hero: 'w-12 h-12 -top-11 right-16',
  };

  return (
    <div className={`inline-flex flex-col select-none text-right dir-rtl leading-none ${animated ? 'group' : ''}`}>
      {/* ── Main Logotype Line ── */}
      <div className="relative inline-flex items-center gap-1.5 leading-none pb-0.5">
        {/* Word 1: "ایران" in Warm Citrus Orange */}
        <span
          className={`font-black tracking-tight bg-gradient-to-r from-[#ff9a3d] via-[#f97316] to-[#ea580c] bg-clip-text text-transparent drop-shadow-xs ${fontSizes[size]}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          ایران
        </span>

        {/* Word 2: "مورینگا" with Animated Moringa Leaf */}
        <div className="relative inline-flex items-center">
          {/* Animated Leaf */}
          <div className={`absolute ${leafSizes[size]} pointer-events-none z-10`}>
            <MoringaAnimatedLeaf className="w-full h-full" animated={animated} />
          </div>

          <span
            className={`font-black tracking-tight bg-gradient-to-r from-[#86efac] via-[#22c55e] to-[#15803d] bg-clip-text text-transparent drop-shadow-xs ${fontSizes[size]}`}
            style={{ letterSpacing: '-0.01em' }}
          >
            مورینگا
          </span>
        </div>
      </div>

      {/* ── Sleek Gradient Underline Bar (Orange to Green) ── */}
      <div className="w-full h-0.75 rounded-full bg-gradient-to-l from-[#f97316] via-[#22c55e] to-[#d0de41] opacity-90 shadow-[0_0_8px_rgba(34,197,94,0.35)] mt-0.5" />

      {/* ── Subtitle / Tagline ── */}
      {showSubtext && (
        <div className="hidden sm:flex items-center justify-between gap-1 mt-1 text-[8.5px] sm:text-[9.5px] font-bold tracking-wider uppercase font-mono">
          <span className="bg-gradient-to-r from-[#22c55e] to-[#86efac] bg-clip-text text-transparent font-black">
            ORGANIC SUPERFOODS
          </span>
          <span className="text-[#f97316] text-[8px]">•</span>
          <span className="text-emerald-200/90 dark:text-emerald-300/80 font-sans text-[8.5px]">
            ۱۰۰٪ خالص
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Main Brand Logo Component
 */
export function BrandLogo({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  showSubtext = true,
  subtextLang = 'en',
  href = '/',
  className = '',
  animated = true,
}: BrandLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      {variant === 'icon-only' ? (
        <MoringaIcon theme={theme} animated={animated} />
      ) : (
        <IranMoringaLogotype
          size={size}
          theme={theme}
          showSubtext={showSubtext}
          subtextLang={subtextLang}
          animated={animated}
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center shrink-0 transition-transform active:scale-95 focus:outline-hidden"
        aria-label="ایران مورینگا - سوپرفود خالص و ارگانیک"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default BrandLogo;
