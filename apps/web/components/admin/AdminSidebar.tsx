'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  MoreVertical,
  LogOut,
  ExternalLink,
  KeyRound,
  User,
  PanelLeftClose,
  PanelRightClose,
  Sparkles,
} from 'lucide-react';
import { AdminUser } from '@/lib/admin-auth-store';
import {
  AdminNavItem,
  AdminNavGroup,
  ADMIN_NAV_GROUPS,
  FIXED_TOP_NAV_ITEMS,
  getFilteredNavigation,
  findActiveRoute,
  searchNavigation,
  formatBadgeNumber,
  getPersianRoleTitle,
  SearchResultItem,
} from '@/config/admin-nav';
import { MoringaAnimatedLeaf } from '@/components/brand/BrandLogo';

export interface AdminSidebarProps {
  session: AdminUser | null;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export function AdminSidebar({
  session,
  onLogout,
  onOpenChangePassword,
  isCollapsed = false,
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchIdx, setSelectedSearchIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Accordion state: Stores open group ID. Single-accordion behavior.
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [hasInitializedAccordion, setHasInitializedAccordion] = useState(false);

  // User footer popover menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Hovered item for tooltip in collapsed mode
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Real action badges count state (orders, reviews, inventory, support)
  const [badgeCounts, setBadgeCounts] = useState<{
    orders?: number;
    reviews?: number;
    inventory?: number;
    support?: number;
  }>({});

  // Filter navigation by permissions
  const { visibleFixed, visibleGroups } = useMemo(() => {
    return getFilteredNavigation(session, ADMIN_NAV_GROUPS, FIXED_TOP_NAV_ITEMS);
  }, [session]);

  // Find active route and matching group
  const { activeItemId, activeGroupId } = useMemo(() => {
    return findActiveRoute(pathname, visibleGroups, visibleFixed);
  }, [pathname, visibleGroups, visibleFixed]);

  // Sync open group on initial mount or route change
  useEffect(() => {
    if (activeGroupId) {
      setOpenGroupId(activeGroupId);
    } else if (!hasInitializedAccordion && visibleGroups.length > 0) {
      // Check localStorage for saved accordion state if available
      try {
        const saved = localStorage.getItem('moringa_admin_active_accordion');
        if (saved && visibleGroups.some((g) => g.id === saved)) {
          setOpenGroupId(saved);
        } else {
          setOpenGroupId(visibleGroups[0].id);
        }
      } catch {
        setOpenGroupId(visibleGroups[0].id);
      }
    }
    setHasInitializedAccordion(true);
  }, [activeGroupId, visibleGroups, hasInitializedAccordion]);

  // Persist open group in localStorage safely
  const handleToggleGroup = (groupId: string) => {
    const nextGroup = openGroupId === groupId ? null : groupId;
    setOpenGroupId(nextGroup);
    if (typeof window !== 'undefined' && nextGroup) {
      try {
        localStorage.setItem('moringa_admin_active_accordion', nextGroup);
      } catch {}
    }
  };

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Fetch real badge metrics from existing APIs safely
  useEffect(() => {
    let isMounted = true;
    async function loadBadges() {
      try {
        // Fetch pending reviews count
        const reviewsRes = await fetch('/api/v1/admin/reviews?status=pending&limit=1');
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          if (isMounted && typeof data.total === 'number') {
            setBadgeCounts((prev) => ({ ...prev, reviews: data.total }));
          }
        }
      } catch {}

      try {
        // Fetch pending orders count
        const ordersRes = await fetch('/api/v1/admin/orders?status=pending_payment&limit=1');
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          if (isMounted && typeof data.total === 'number') {
            setBadgeCounts((prev) => ({ ...prev, orders: data.total }));
          }
        }
      } catch {}
    }

    if (session) {
      loadBadges();
    }

    return () => {
      isMounted = false;
    };
  }, [session]);

  // Filtered search results
  const searchResults: SearchResultItem[] = useMemo(() => {
    return searchNavigation(searchQuery, visibleGroups, visibleFixed);
  }, [searchQuery, visibleGroups, visibleFixed]);

  // Reset selected search index when search query changes
  useEffect(() => {
    setSelectedSearchIdx(0);
  }, [searchQuery]);

  // Keyboard navigation inside search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      searchInputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIdx((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIdx((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedSearchIdx]) {
        const target = searchResults[selectedSearchIdx].item;
        router.push(target.href);
        setSearchQuery('');
        if (onCloseMobileDrawer) onCloseMobileDrawer();
      }
    }
  };

  const handleItemClick = () => {
    if (searchQuery) setSearchQuery('');
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  const isSearching = searchQuery.trim().length > 0;
  const showCollapsedView = isCollapsed && !isMobileDrawer;

  return (
    <aside
      dir="rtl"
      aria-label="منوی ناوبری پنل مدیریت"
      className={`
        bg-[#071a15] text-slate-200 border-l border-emerald-950/60
        flex flex-col h-[100dvh] select-none transition-all duration-200 ease-in-out
        ${showCollapsedView ? 'w-[76px]' : 'w-[280px] sm:w-[288px]'}
        ${isMobileDrawer ? 'w-[300px] max-w-[88vw] shadow-2xl z-50' : 'sticky top-0 shrink-0 z-30'}
      `}
    >
      {/* ── 1. HEADER (Fixed) ── */}
      <div className="shrink-0 p-3.5 sm:p-4 border-b border-emerald-950/80 flex flex-col gap-3 bg-[#051410]">
        <div className="flex items-center justify-between gap-2 min-h-[40px]">
          {/* Brand Info */}
          <Link
            href="/admin"
            onClick={handleItemClick}
            className="flex items-center gap-2.5 group overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1"
            title="پیشخوان مدیریت ایران مورینگا"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <MoringaAnimatedLeaf className="w-5 h-5" />
            </div>

            {!showCollapsedView && (
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[13px] font-black text-white truncate tracking-tight">
                  پنل مدیریت ایران مورینگا
                </span>
                <span className="text-[10px] text-emerald-400 font-bold truncate">
                  سامانه مدیریت فروشگاه
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle / Mobile Close Button */}
          {!isMobileDrawer && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}
              title={isCollapsed ? 'باز کردن منو (بزرگ‌نمایی)' : 'جمع کردن منو (حالت فشرده)'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
            >
              {isCollapsed ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              aria-label="بستن منو"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Box (Only shown in expanded mode) */}
        {!showCollapsedView && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              role="searchbox"
              aria-label="جستجو در منوهای مدیریت"
              placeholder="جستجو در منوها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pr-8.5 pl-8 py-2 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-[12px] text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="پاک کردن جستجو"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 2. NAVIGATION BODY (Scrollable with min-h-0) ── */}
      <nav
        className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-3 custom-scrollbar"
        aria-label="فهرست بخش‌های پنل"
      >
        {/* ── 2.A: SEARCH RESULTS VIEW ── */}
        {isSearching && !showCollapsedView && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-bold text-emerald-400/90 border-b border-emerald-950/60">
              <span>نتایج جستجو</span>
              <span className="text-[10px] text-slate-400">
                {searchResults.length} مورد
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <p className="text-xs font-bold text-slate-300">گزینه‌ای پیدا نشد</p>
                <p className="text-[11px] text-slate-500">
                  عنوان یا کلیدواژه دیگری را جستجو کنید
                </p>
              </div>
            ) : (
              <div className="space-y-1 pt-1" role="listbox">
                {searchResults.map((res, idx) => {
                  const Icon = res.item.icon;
                  const isActive = activeItemId === res.item.id;
                  const isSelected = selectedSearchIdx === idx;
                  const badge = badgeCounts[res.item.badgeKey as keyof typeof badgeCounts];
                  const formattedBadge = formatBadgeNumber(badge);

                  return (
                    <Link
                      key={res.item.id}
                      href={res.item.href}
                      onClick={handleItemClick}
                      role="option"
                      aria-selected={isSelected}
                      className={`
                        w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all group
                        ${
                          isSelected
                            ? 'bg-emerald-600/30 text-white border border-emerald-500/50'
                            : isActive
                            ? 'bg-emerald-950/60 text-emerald-300 border-r-3 border-emerald-500'
                            : 'text-slate-300 hover:bg-emerald-950/40 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                        <div className="flex flex-col min-w-0 text-right leading-tight">
                          <span className="truncate text-[13px] font-bold">
                            {res.item.label}
                          </span>
                          {res.groupTitle && (
                            <span className="text-[10px] text-slate-400 truncate">
                              {res.groupTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {formattedBadge && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                          {formattedBadge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 2.B: NORMAL NAVIGATION VIEW ── */}
        {!isSearching && (
          <>
            {/* Fixed Top Items (داشبورد و گزارش‌های مالی) */}
            <div className="space-y-1">
              {visibleFixed.map((item) => {
                const Icon = item.icon;
                const isActive = activeItemId === item.id;
                const badge = badgeCounts[item.badgeKey as keyof typeof badgeCounts];
                const formattedBadge = formatBadgeNumber(badge);

                if (showCollapsedView) {
                  return (
                    <div
                      key={item.id}
                      className="relative group flex justify-center"
                      onMouseEnter={() => setActiveTooltipId(item.id)}
                      onMouseLeave={() => setActiveTooltipId(null)}
                    >
                      <Link
                        href={item.href}
                        onClick={handleItemClick}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        onFocus={() => setActiveTooltipId(item.id)}
                        onBlur={() => setActiveTooltipId(null)}
                        className={`
                          w-11 h-11 rounded-xl flex items-center justify-center transition-all relative
                          ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                              : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
                          }
                        `}
                      >
                        {isActive && (
                          <span className="absolute right-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-l-full" />
                        )}
                        <Icon className="w-5 h-5 shrink-0" />
                        {formattedBadge && (
                          <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#071a15]" />
                        )}
                      </Link>

                      {/* Accessible Tooltip for Collapsed View */}
                      {activeTooltipId === item.id && (
                        <div
                          role="tooltip"
                          className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 bg-[#09241d] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl border border-emerald-800/60 whitespace-nowrap pointer-events-none flex items-center gap-1.5"
                        >
                          <span>{item.label}</span>
                          {formattedBadge && (
                            <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full">
                              {formattedBadge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleItemClick}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      px-3 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-between transition-all relative group
                      ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 shadow-xs border-r-[3.5px] border-emerald-500 font-black'
                          : 'text-slate-300 hover:bg-emerald-950/40 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {formattedBadge && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black">
                        {formattedBadge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Subtle Divider */}
            <div className="border-t border-emerald-950/60 my-1" />

            {/* Accordion Groups */}
            <div className="space-y-1.5">
              {visibleGroups.map((group) => {
                const isGroupOpen = openGroupId === group.id;
                const hasActiveChild = group.items.some((it) => it.id === activeItemId);

                // In collapsed mode: render items directly or compact group
                if (showCollapsedView) {
                  return (
                    <div key={group.id} className="space-y-1 pt-1 border-t border-emerald-950/40">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItemId === item.id;
                        const badge = badgeCounts[item.badgeKey as keyof typeof badgeCounts];
                        const formattedBadge = formatBadgeNumber(badge);

                        return (
                          <div
                            key={item.id}
                            className="relative group flex justify-center"
                            onMouseEnter={() => setActiveTooltipId(item.id)}
                            onMouseLeave={() => setActiveTooltipId(null)}
                          >
                            <Link
                              href={item.href}
                              onClick={handleItemClick}
                              aria-label={`${item.label} (${group.title})`}
                              aria-current={isActive ? 'page' : undefined}
                              onFocus={() => setActiveTooltipId(item.id)}
                              onBlur={() => setActiveTooltipId(null)}
                              className={`
                                w-11 h-11 rounded-xl flex items-center justify-center transition-all relative
                                ${
                                  isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
                                }
                              `}
                            >
                              {isActive && (
                                <span className="absolute right-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-l-full" />
                              )}
                              <Icon className="w-5 h-5 shrink-0" />
                              {formattedBadge && (
                                <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#071a15]" />
                              )}
                            </Link>

                            {/* Accessible Tooltip */}
                            {activeTooltipId === item.id && (
                              <div
                                role="tooltip"
                                className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 bg-[#09241d] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl border border-emerald-800/60 whitespace-nowrap pointer-events-none flex flex-col gap-0.5"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>{item.label}</span>
                                  {formattedBadge && (
                                    <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full">
                                      {formattedBadge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9.5px] text-emerald-400/80 font-medium">
                                  {group.title.replace(/^گروه\s+\d+:\s*/, '')}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Normal Expanded Accordion Group
                return (
                  <div
                    key={group.id}
                    className={`rounded-2xl transition-colors ${
                      isGroupOpen ? 'bg-emerald-950/20 pb-1' : ''
                    }`}
                  >
                    {/* Accordion Header Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(group.id)}
                      aria-expanded={isGroupOpen}
                      aria-controls={`group-content-${group.id}`}
                      className={`
                        w-full px-3 py-2 rounded-xl text-xs font-black flex items-center justify-between transition-colors
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                        ${
                          hasActiveChild && !isGroupOpen
                            ? 'text-emerald-300 bg-emerald-950/30'
                            : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/30'
                        }
                      `}
                    >
                      <span className="tracking-tight truncate">{group.title}</span>
                      <ChevronLeft
                        className={`w-3.5 h-3.5 text-emerald-400/70 transition-transform duration-200 shrink-0 ${
                          isGroupOpen ? '-rotate-90 text-emerald-300' : 'rotate-0'
                        }`}
                      />
                    </button>

                    {/* Accordion Submenu Items */}
                    {isGroupOpen && (
                      <div
                        id={`group-content-${group.id}`}
                        role="region"
                        aria-label={group.title}
                        className="space-y-0.5 pt-1 pr-1.5 pl-0.5 animate-in fade-in-50 duration-150"
                      >
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeItemId === item.id;
                          const badge = badgeCounts[item.badgeKey as keyof typeof badgeCounts];
                          const formattedBadge = formatBadgeNumber(badge);

                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={handleItemClick}
                              aria-current={isActive ? 'page' : undefined}
                              className={`
                                px-3 py-2 rounded-xl font-medium text-[13px] flex items-center justify-between transition-all group
                                ${
                                  isActive
                                    ? 'bg-emerald-500/15 text-emerald-300 shadow-xs border-r-[3.5px] border-emerald-500 font-bold'
                                    : 'text-slate-300 hover:bg-emerald-950/40 hover:text-white'
                                }
                              `}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon
                                  className={`w-4 h-4 shrink-0 transition-colors ${
                                    isActive
                                      ? 'text-emerald-400'
                                      : 'text-slate-400 group-hover:text-emerald-300'
                                  }`}
                                />
                                <span className="truncate">{item.label}</span>
                              </div>

                              {formattedBadge && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                                  {formattedBadge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* ── 3. USER ACCOUNT FOOTER (Fixed, Never Obstructed) ── */}
      <div className="shrink-0 p-3 sm:p-3.5 border-t border-emerald-950/80 bg-[#051410] relative">
        {showCollapsedView ? (
          <div className="flex justify-center" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="پروفایل کاربر و خروج"
              className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-black text-sm hover:scale-105 transition-transform"
            >
              {session?.fullName ? session.fullName.trim().charAt(0) : 'م'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2" ref={userMenuRef}>
            {/* User Details */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-black text-xs shrink-0">
                {session?.fullName ? session.fullName.trim().charAt(0) : 'م'}
              </div>
              <div className="overflow-hidden min-w-0 flex-1 leading-tight">
                <span className="text-xs font-bold text-white block truncate">
                  {session?.fullName || 'احسان پویا'}
                </span>
                <span className="text-[10.5px] text-emerald-400/90 font-medium block truncate">
                  {getPersianRoleTitle(session?.role, session?.isSuperAdmin)}
                </span>
              </div>
            </div>

            {/* Three Dots More Actions Menu */}
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="عملیات حساب کاربری"
              aria-expanded={isUserMenuOpen}
              className={`p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0 ${
                isUserMenuOpen
                  ? 'bg-emerald-900/40 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-emerald-950/50'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Actions Popover Menu */}
        {isUserMenuOpen && (
          <div
            role="menu"
            className={`
              absolute bottom-[calc(100%+8px)] z-50 bg-[#09241d] text-white rounded-2xl shadow-2xl border border-emerald-800/60 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150
              ${showCollapsedView ? 'right-2 w-48' : 'left-3 right-3'}
            `}
          >
            {onOpenChangePassword && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onOpenChangePassword();
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-emerald-900/40 hover:text-white flex items-center gap-2 transition-colors text-right"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>تغییر رمز عبور</span>
              </button>
            )}

            <Link
              href="/"
              target="_blank"
              role="menuitem"
              onClick={() => setIsUserMenuOpen(false)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-emerald-900/40 hover:text-white flex items-center justify-between transition-colors text-right"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>مشاهده وب‌سایت</span>
              </div>
            </Link>

            <div className="border-t border-emerald-950/80 my-1" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsUserMenuOpen(false);
                onLogout();
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/60 hover:text-rose-200 flex items-center gap-2 transition-colors text-right"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>خروج از پنل مدیریت</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
