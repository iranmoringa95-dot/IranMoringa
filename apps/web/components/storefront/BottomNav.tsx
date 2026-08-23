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
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-[#072714]/95 backdrop-blur-xl border-t border-[#e5e8de] dark:border-[#14552f] shadow-float transition-colors duration-200"
      aria-label="منوی دسترسی سریع موبایل"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="relative flex flex-col items-center justify-center gap-1 py-1 w-14 transition-transform active:scale-95">
              {/* Active Indicator Glow */}
              {item.isActive && (
                <span className="absolute -top-2 w-7 h-1 bg-[#176b39] dark:bg-[#2ea355] rounded-full animate-in fade-in zoom-in duration-200" />
              )}

              {/* Icon / Avatar Wrapper */}
              <div className="relative">
                {item.isAvatar ? (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                      item.isActive
                        ? 'bg-[#176b39] text-white ring-2 ring-[#176b39]/30'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {userName ? userName.slice(0, 1) : 'اح'}
                  </div>
                ) : (
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      item.isActive
                        ? 'text-[#176b39] dark:text-[#2ea355] stroke-[2.5]'
                        : 'text-stone-500 dark:text-stone-400 stroke-[1.75]'
                    }`}
                  />
                )}

                {/* Live Cart Counter Badge */}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-[#f47a24] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                    {item.count.toLocaleString('fa-IR')}
                  </span>
                )}

                {/* Special Shop Badge */}
                {item.badge && !item.isActive && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-[#f47a24] rounded-full animate-pulse" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-bold tracking-tight transition-colors ${
                  item.isActive
                    ? 'text-[#176b39] dark:text-[#2ea355] font-black'
                    : 'text-stone-500 dark:text-stone-400'
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

export default BottomNav;

