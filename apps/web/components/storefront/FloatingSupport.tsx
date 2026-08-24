'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  X,
  Sparkles,
  CheckCircle2,
  Copy,
  Clock,
  PhoneCall,
  ChevronLeft,
  Leaf,
  Scale,
  Package,
  Handshake,
} from 'lucide-react';

// Official SVG Logos for Persian and Global Messengers
function BaleLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="24" fill="#00A896" />
      <path
        d="M24 10C16.268 10 10 16.268 10 24C10 27.24 11.116 30.22 13 32.58V38L18.42 35C20.12 35.64 22.012 36 24 36C31.732 36 38 29.732 38 24C38 16.268 31.732 10 24 10Z"
        fill="white"
        opacity="0.95"
      />
      <circle cx="18" cy="23" r="2.5" fill="#00A896" />
      <circle cx="24" cy="23" r="2.5" fill="#00A896" />
      <circle cx="30" cy="23" r="2.5" fill="#00A896" />
      <path
        d="M17 28.5C18.8 30.5 21.2 31.5 24 31.5C26.8 31.5 29.2 30.5 31 28.5"
        stroke="#00A896"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WhatsAppLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="24" fill="#25D366" />
      <path
        d="M34.2 13.8C31.5 11.1 27.9 9.6 24 9.6C16.1 9.6 9.6 16.1 9.6 24C9.6 26.5 10.3 29 11.5 31.1L9.6 38.4L17.1 36.5C19.2 37.6 21.5 38.3 24 38.3C31.9 38.3 38.4 31.9 38.4 24C38.4 20.1 36.9 16.5 34.2 13.8ZM24 35.8C21.8 35.8 19.8 35.2 18 34.1L17.6 33.9L13.1 35.1L14.3 30.8L14 30.4C12.8 28.5 12.1 26.3 12.1 24C12.1 17.4 17.4 12.1 24 12.1C27.2 12.1 30.1 13.3 32.4 15.6C34.7 17.9 35.9 20.8 35.9 24C35.9 30.6 30.5 35.8 24 35.8ZM30.5 27.2C30.1 27 28.4 26.1 28.1 26C27.8 25.9 27.5 25.8 27.3 26.2C27.1 26.6 26.4 27.4 26.2 27.6C26 27.8 25.8 27.8 25.4 27.6C25 27.4 23.8 27 22.4 25.7C21.3 24.7 20.5 23.5 20.3 23.1C20.1 22.7 20.3 22.5 20.5 22.3C20.7 22.1 20.9 21.8 21.1 21.6C21.3 21.4 21.4 21.2 21.5 21C21.6 20.8 21.6 20.6 21.5 20.4C21.4 20.2 20.7 18.5 20.4 17.8C20.1 17.1 19.8 17.2 19.6 17.2C19.4 17.2 19.1 17.2 18.9 17.2C18.6 17.2 18.2 17.3 17.9 17.6C17.6 17.9 16.7 18.7 16.7 20.4C16.7 22.1 17.9 23.7 18.1 23.9C18.3 24.1 20.5 27.6 24 29C24.8 29.4 25.5 29.6 26 29.8C26.8 30.1 27.6 30 28.1 29.9C28.8 29.8 30.1 29.1 30.4 28.3C30.7 27.5 30.7 26.8 30.6 26.7C30.5 27.4 30.8 27.3 30.5 27.2Z"
        fill="white"
      />
    </svg>
  );
}

function TelegramLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="24" fill="#24A1DE" />
      <path
        d="M34 14L11 23L19 26L30 18L21 28L29 34L34 14Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PRESET_TOPICS = [
  {
    id: 'usage',
    title: 'طریقه و دوز مصرف',
    icon: Leaf,
    text: 'سلام آقای کامیاب، می‌خواستم درباره نحوه و میزان مصرف پودر و کپسول مورینگا راهنمایی بگیرم.',
  },
  {
    id: 'diabetes',
    title: 'مشاوره قند و لاغری',
    icon: Scale,
    text: 'سلام وقت بخیر، جهت کنترل قند خون / لاغری نیاز به مشاوره تخصصی مصرف محصولات مورینگا دارم.',
  },
  {
    id: 'order',
    title: 'پیگیری سفارش',
    icon: Package,
    text: 'سلام آقای کامیاب، در مورد وضعیت ارسال و کد رهگیری سفارش سوال داشتم.',
  },
  {
    id: 'bulk',
    title: 'خرید عمده و همکاری',
    icon: Handshake,
    text: 'سلام، جهت استعلام قیمت عمده و شرایط همکاری با ایران مورینگا پیام می‌دهم.',
  },
];

export function FloatingSupport() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customMsg, setCustomMsg] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Consultant & Channel Config from Admin
  const [config, setConfig] = useState({
    consultantName: 'آقای کامیاب',
    consultantTitle: 'مشاور تخصصی و پاسخگوی سفارشات',
    consultantRoleDesc: 'کارشناس گیاهان دارویی و سوپرفود مورینگا',
    avatarEmoji: '👨‍💼',
    avatarUrl: '',
    phone: '09175929345',
    phoneDisplay: '۰۹۱۷۵۹۲۹۳۴۵',
    telegramHandle: '@Iranmoringa95',
    telegramUrl: 'https://t.me/Iranmoringa95',
    baleUrl: 'https://ble.ir/iranmoringa',
    whatsappUrl: 'https://wa.me/989175929345',
    workingHours: 'همه‌روزه ۸:۰۰ الی ۲۲:۰۰',
    responseTime: 'کمتر از ۵ دقیقه',
    enableWidget: true,
    enableGreetingBubble: true,
    greetingMessage: 'مشاوره تخصصی و ثبت سفارش آنلاین',
  });

  useEffect(() => {
    fetch('/api/v1/support/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setConfig((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  // Hide on admin routes
  const isAdminRoute = pathname?.startsWith('/admin');

  // Hover Handlers with Bridge Tolerance
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 350);
  };

  // Messenger URLs
  const activeText = customMsg
    ? customMsg
    : selectedTopic
    ? PRESET_TOPICS.find((t) => t.id === selectedTopic)?.text || `سلام ${config.consultantName}، جهت مشاوره و خرید محصولات مورینگا پیام می‌دهم.`
    : `سلام ${config.consultantName}، جهت مشاوره و خرید محصولات مورینگا پیام می‌دهم.`;

  const baleUrl = config.baleUrl || 'https://ble.ir/iranmoringa';
  const whatsappUrl = config.whatsappUrl
    ? `${config.whatsappUrl}${config.whatsappUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(activeText)}`
    : `https://wa.me/989175929345?text=${encodeURIComponent(activeText)}`;
  const telegramUrl = config.telegramUrl || 'https://t.me/Iranmoringa95';
  const supportPhone = config.phone || '09175929345';
  const supportPhoneDisplay = config.phoneDisplay || config.phone || '۰۹۱۷۵۹۲۹۳۴۵';

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Gentle greeting badge on first visit only (once per session/user), after 5 seconds
  useEffect(() => {
    try {
      const isDismissed =
        sessionStorage.getItem('moringa_support_bubble_dismissed') === 'true' ||
        localStorage.getItem('moringa_support_bubble_dismissed') === 'true';
      const hasAlreadyShown = sessionStorage.getItem('moringa_support_bubble_shown') === 'true';

      if (isDismissed || hasAlreadyShown) {
        setHasPrompted(false);
        return;
      }

      const timer = setTimeout(() => {
        if (!isOpen && config.enableGreetingBubble) {
          setHasPrompted(true);
          try {
            sessionStorage.setItem('moringa_support_bubble_shown', 'true');
          } catch (e) {}
        }
      }, 5000);

      return () => clearTimeout(timer);
    } catch (e) {
      // Safe fallback if storage is restricted
    }
  }, [isOpen, config.enableGreetingBubble]);

  if (isAdminRoute || !config.enableWidget) {
    return null;
  }

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHasPrompted(false);
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    try {
      sessionStorage.setItem('moringa_support_bubble_dismissed', 'true');
      sessionStorage.setItem('moringa_support_bubble_shown', 'true');
      localStorage.setItem('moringa_support_bubble_dismissed', 'true');
    } catch (e) {}
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(supportPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSelectTopic = (topicId: string) => {
    if (selectedTopic === topicId) {
      setSelectedTopic(null);
      setCustomMsg('');
    } else {
      setSelectedTopic(topicId);
      const topic = PRESET_TOPICS.find((t) => t.id === topicId);
      if (topic) setCustomMsg(topic.text);
    }
  };

  // Render Avatar (Image or Emoji)
  const renderAvatar = (size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-8 h-8 sm:w-9 sm:h-9 text-base',
      md: 'w-9 h-9 text-base',
      lg: 'w-11 h-11 text-2xl',
    };

    if (config.avatarUrl) {
      return (
        <img
          src={config.avatarUrl}
          alt={config.consultantName}
          className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} rounded-full object-cover border border-white/30 shadow-inner`}
        />
      );
    }

    return (
      <div className={`${sizeClasses[size]} rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner`}>
        {config.avatarEmoji || '👨‍💼'}
      </div>
    );
  };

  return (
    <div className="dir-rtl font-sans select-none">
      {/* ── 1. Floating Hover / Initial Greeting Bubble (Desktop & Mobile) ── */}
      {!isOpen && (isHovered || hasPrompted) && config.enableGreetingBubble && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
            setHasPrompted(false);
            setIsHovered(false);
          }}
          className="fixed bottom-36 right-4 sm:bottom-24 sm:right-6 z-[60] w-72 p-3.5 bg-white dark:bg-[#18221b] rounded-2xl shadow-float border border-[#c3e5cd] dark:border-[#1e8240]/40 text-[#17251c] dark:text-[#f2f9f4] cursor-pointer animate-in fade-in slide-in-from-bottom-3 duration-200 transition-all hover:scale-[1.02] group"
        >
          {/* Hover Gap Bridge (Keeps hover alive when cursor moves between button and bubble) */}
          <div className="absolute -bottom-6 inset-x-0 h-6 pointer-events-auto" />

          {/* Close / Dismiss Button for the Bubble */}
          <button
            type="button"
            onClick={handleDismissBubble}
            className="absolute top-2.5 left-2.5 w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            aria-label="بستن این پیام"
            title="بستن پیام"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2.5 pl-6">
            <div className="w-9 h-9 rounded-xl bg-[#176b39] text-white flex items-center justify-center text-base shrink-0 shadow-xs overflow-hidden">
              {config.avatarUrl ? (
                <img src={config.avatarUrl} alt={config.consultantName} className="w-full h-full object-cover" />
              ) : (
                config.avatarEmoji || '👨‍💼'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#176b39] dark:text-[#97d2a7] truncate">{config.consultantName}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-300 truncate mt-0.5">
                {config.greetingMessage || 'مشاوره تخصصی و ثبت سفارش آنلاین'}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] font-bold text-[#176b39] dark:text-[#97d2a7]">
            <span>گفتگو و مشاوره رایگان</span>
            <span>شروع گفتگو ←</span>
          </div>
        </div>
      )}

      {/* ── 2. The Main Floating Trigger Button ── */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[60]">
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-[#176b39]/25 dark:bg-[#2ea355]/20 blur-sm animate-pulse pointer-events-none" />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
            setHasPrompted(false);
            setIsHovered(false);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`relative flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full shadow-float transition-all duration-200 transform active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-[#17251c] text-white hover:bg-black'
              : 'bg-[#176b39] hover:bg-[#14552f] text-white'
          }`}
          aria-label="دکمه ارتباط و پشتیبانی"
        >
          {isOpen ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6 animate-in spin-in-90 duration-200" />
          ) : (
            <>
              {/* Avatar with Live Green Status */}
              <div className="relative shrink-0">
                {renderAvatar('sm')}
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#176b39] rounded-full animate-pulse" />
              </div>

              {/* Text Label on Desktop */}
              <div className="hidden sm:flex flex-col text-right leading-tight pr-0.5">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>مشاوره و پشتیبانی</span>
                  <span className="text-[9px] bg-[#d0de41] text-[#114627] px-1.5 py-0.2 rounded-md font-bold">
                    آنلاین
                  </span>
                </span>
                <span className="text-[10px] text-emerald-100 font-medium">ارتباط با {config.consultantName}</span>
              </div>
            </>
          )}
        </button>
      </div>

      {/* ── 3. The Clean Responsive Modal (Desktop Card / Mobile Bottom Sheet) ── */}
      {isOpen && (
        <>
          {/* Universal Backdrop (Closes on Click Outside) */}
          <div
            className="fixed inset-0 bg-black/30 sm:bg-black/10 backdrop-blur-[2px] z-[55] animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[370px] max-h-[82vh] sm:max-h-[calc(100vh-120px)] bg-white dark:bg-[#18221b] rounded-[2rem] shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col z-[60] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 text-[#17251c] dark:text-[#f2f9f4]"
          >
            {/* ── Header ── */}
            <div className="relative bg-[#114627] dark:bg-[#0f301c] text-white p-4 sm:p-5 shrink-0 border-b border-[#14552f]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-xs overflow-hidden">
                      {config.avatarUrl ? (
                        <img src={config.avatarUrl} alt={config.consultantName} className="w-full h-full object-cover" />
                      ) : (
                        config.avatarEmoji || '👨‍💼'
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#114627] rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-white">{config.consultantName}</h3>
                      <span className="px-2 py-0.2 bg-[#d0de41] text-[#114627] rounded-md text-[10px] font-black">
                        مشاور تخصصی
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-200 font-normal">
                      {config.consultantTitle || 'پاسخگوی سوالات شما درباره مصرف و سفارش'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/90 hover:text-white transition-colors cursor-pointer"
                  aria-label="بستن پنجره"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Pill */}
              <div className="mt-3 flex items-center justify-between text-[11px] bg-black/20 px-3 py-1 rounded-xl text-emerald-200 border border-white/10">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>پاسخگویی سریع</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-[#d0de41]">
                  <Clock className="w-3 h-3" />
                  <span>میانگین پاسخ: {config.responseTime || 'فوری'}</span>
                </div>
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Quick Topics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#f47a24]" />
                    <span>موضوع مشاوره:</span>
                  </span>
                  {selectedTopic && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopic(null);
                        setCustomMsg('');
                      }}
                      className="text-[10px] text-rose-500 hover:underline font-bold"
                    >
                      حذف انتخاب
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_TOPICS.map((topic) => {
                    const isSelected = selectedTopic === topic.id;
                    const Icon = topic.icon;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => handleSelectTopic(topic.id)}
                        className={`p-2.5 rounded-xl text-[11px] font-bold text-right transition-all flex items-center gap-2 border cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-[#176b39] text-white border-[#176b39] shadow-xs'
                            : 'bg-stone-50 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#176b39]/50 hover:bg-[#f2f9f4] dark:hover:bg-stone-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-[#176b39] dark:text-[#97d2a7]'}`} />
                        <span className="truncate">{topic.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Message Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="یا متن پیام خود را بنویسید..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full pl-3 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-[#17251c] dark:text-white placeholder:text-stone-400 placeholder:font-light focus:outline-none focus:border-[#176b39] transition-all min-h-[40px]"
                />
              </div>

              {/* Primary Messenger Channels */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block">
                  انتخاب پیام‌رسان جهت گفتگو:
                </span>

                {/* 1. BALE MESSENGER */}
                <a
                  href={baleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between p-3 rounded-2xl bg-[#00A896]/10 hover:bg-[#00A896]/15 border border-[#00A896]/30 hover:border-[#00A896] transition-all shadow-xs active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <BaleLogo className="w-7 h-7 shrink-0 group-hover:scale-105 transition-transform" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-stone-900 dark:text-white group-hover:text-[#00A896] transition-colors">
                          ارتباط در پیام‌رسان بله
                        </span>
                        <span className="px-1.5 py-0.2 bg-[#00A896] text-white text-[9px] font-black rounded-md">
                          پیشنهادی
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#00A896]" />
                </a>

                {/* 2. WHATSAPP */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/15 border border-[#25D366]/30 hover:border-[#25D366] transition-all shadow-xs active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <WhatsAppLogo className="w-7 h-7 shrink-0 group-hover:scale-105 transition-transform" />
                    <div>
                      <span className="text-xs font-black text-stone-900 dark:text-white group-hover:text-[#25D366] transition-colors">
                        ارسال پیام در واتس‌اپ
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#25D366]" />
                </a>

                {/* 3. TELEGRAM (@Iranmoringa95) */}
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between p-3 rounded-2xl bg-[#24A1DE]/10 hover:bg-[#24A1DE]/15 border border-[#24A1DE]/30 hover:border-[#24A1DE] transition-all shadow-xs active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <TelegramLogo className="w-7 h-7 shrink-0 group-hover:scale-105 transition-transform" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-stone-900 dark:text-white group-hover:text-[#24A1DE] transition-colors">
                          ارتباط در تلگرام
                        </span>
                        <span className="text-[10px] text-[#24A1DE] font-mono font-bold">
                          @Iranmoringa95
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#24A1DE]" />
                </a>

                {/* 4. DIRECT CALL & COPY */}
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={`tel:${supportPhone}`}
                    className="flex-1 flex items-center justify-between p-3 rounded-2xl bg-[#f2f9f4] dark:bg-[#0a331b] hover:bg-[#e1f2e6] border border-[#c3e5cd] dark:border-[#14552f] text-stone-900 dark:text-white transition-all shadow-xs active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-[#176b39] text-white flex items-center justify-center">
                        <PhoneCall className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black block text-[#176b39] dark:text-[#97d2a7]">تماس تلفنی</span>
                        <span className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300">
                          {supportPhoneDisplay}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#176b39] dark:text-[#97d2a7]">تماس 📞</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="p-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-2xl transition-colors text-stone-700 dark:text-stone-300 cursor-pointer"
                    title="کپی شماره"
                  >
                    {copiedPhone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#176b39] dark:text-[#97d2a7]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Fixed Footer Note ── */}
            <div className="bg-stone-50 dark:bg-stone-900/90 p-2.5 text-center border-t border-stone-200/80 dark:border-stone-800 text-[10px] text-stone-500 dark:text-stone-400 shrink-0">
              <span>⏰ پاسخگویی همه‌روزه ۸:۰۰ الی ۲۲:۰۰ • مشاوره کاملاً رایگان</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FloatingSupport;

