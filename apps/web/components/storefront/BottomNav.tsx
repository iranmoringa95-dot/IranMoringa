'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  Search,
  ShoppingCart,
  User,
  Sparkles,
} from 'lucide-react';
import { getStoredCart, getCartItemsCount } from '@/lib/cart';
import { isCustomerLoggedIn, getCustomerProfile } from '@/lib/customer-store';

interface BottomNavProps {
  onOpenSearch: () => void;
}

export function BottomNav({ onOpenSearch }: BottomNavProps) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('احسان پویا');

  useEffect(() => {
    const update = () => {
      const items = getStoredCart();
      setCartCount(getCartItemsCount(items));

      const logged = isCustomerLoggedIn();
      setIsLoggedIn(logged);
      if (logged) {
        const prof = getCustomerProfile();
        setUserName(prof.fullName || 'احسان پویا');
      }
    };

    update();
    window.addEventListener('moringalab_cart_updated', update);
    window.addEventListener('storage', update);
    window.addEventListener('moringa_auth_changed', update);

    return () => {
      window.removeEventListener('moringalab_cart_updated', update);
      window.removeEventListener('storage', update);
      window.removeEventListener('moringa_auth_changed', update);
    };
  }, []);

  const navItems = [
    {
      id: 'home',
      label: 'خانه',
      icon: Home,
      href: '/',
      isActive: pathname === '/',
    },
    {
      id: 'shop',
      label: 'محصولات',
      icon: ShoppingBag,
      href: '/shop',
      badge: 'ویژه',
      isActive: pathname.startsWith('/shop') || pathname.startsWith('/product'),
    },
    {
      id: 'search',
      label: 'جستجو',
      icon: Search,
      onClick: onOpenSearch,
      isActive: false,
    },
    {
      id: 'cart',
      label: 'سبد خرید',
      icon: ShoppingCart,
      href: '/cart',
      count: cartCount,
      isActive: pathname === '/cart' || pathname === '/checkout',
    },
    {
      id: 'account',
      label: isLoggedIn ? 'حساب من' : 'ورود',
      icon: User,
      href: isLoggedIn ? '/account' : '/login',
      isAvatar: isLoggedIn,
      isActive: pathname.startsWith('/account') || pathname === '/login' || pathname === '/register',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/85 dark:bg-[#071d17]/85 backdrop-blur-xl border-t border-slate-200/80 dark:border-emerald-900/60 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-colors duration-200"
      aria-label="منوی دسترسی سریع موبایل"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="relative flex flex-col items-center justify-center gap-1 py-1 w-14 transition-transform active:scale-95">
              {/* Active Indicator Glow */}
              {item.isActive && (
                <span className="absolute -top-2 w-7 h-1 bg-[#026251] dark:bg-[#d0de41] rounded-full shadow-[0_0_8px_rgba(208,222,65,0.6)] animate-in fade-in zoom-in duration-200" />
              )}

              {/* Icon / Avatar Wrapper */}
              <div className="relative">
                {item.isAvatar ? (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                      item.isActive
                        ? 'bg-[#026251] text-[#d0de41] ring-2 ring-[#d0de41]'
                        : 'bg-slate-100 dark:bg-emerald-900/40 text-slate-700 dark:text-emerald-300'
                    }`}
                  >
                    {userName ? userName.slice(0, 1) : 'اح'}
                  </div>
                ) : (
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      item.isActive
                        ? 'text-[#026251] dark:text-[#d0de41] stroke-[2.5]'
                        : 'text-slate-500 dark:text-slate-400 stroke-[1.75]'
                    }`}
                  />
                )}

                {/* Live Cart Counter Badge */}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-[#d0de41] text-[#026251] text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                    {item.count.toLocaleString('fa-IR')}
                  </span>
                )}

                {/* Special Shop Badge */}
                {item.badge && !item.isActive && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-[#d0de41] rounded-full animate-pulse" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-bold tracking-tight transition-colors ${
                  item.isActive
                    ? 'text-[#026251] dark:text-[#d0de41] font-black'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="focus:outline-none"
                aria-label={item.label}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.id} href={item.href || '/'} className="focus:outline-none" aria-label={item.label}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
