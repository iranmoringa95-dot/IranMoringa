'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Package,
  Layers,
  ShoppingBag,
  Truck,
  Percent,
  MessageSquare,
  Bell,
  FileText,
  Globe2,
  Headphones,
  Bot,
  BarChart3,
  Users,
  LogOut,
  ArrowLeft,
  KeyRound,
  AlertTriangle,
  Lock,
  Tag,
  Plus,
  Search,
  Settings,
  Smartphone,
} from 'lucide-react';
import {
  getActiveAdminSession,
  clearAdminSession,
  changeAdminPassword,
  AdminUser,
} from '@/lib/admin-auth-store';
import { ThemeToggle } from '@/components/theme/ThemeToggle';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Forced Password Change State
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    const checkAdmin = () => {
      const admin = getActiveAdminSession();
      if (!admin) {
        setSession(null);
        setIsLoaded(true);
        router.replace(`/login?redirect=${encodeURIComponent(pathname || '/admin')}`);
        return;
      }
      setSession(admin);
      setIsLoaded(true);
    };

    checkAdmin();

    const handleSessionUpdate = () => {
      const currentAdmin = getActiveAdminSession();
      if (!currentAdmin) {
        setSession(null);
        router.replace('/login');
      } else {
        setSession(currentAdmin);
      }
    };

    window.addEventListener('moringa_admin_session_updated', handleSessionUpdate);
    window.addEventListener('moringa_auth_changed', handleSessionUpdate);
    return () => {
      window.removeEventListener('moringa_admin_session_updated', handleSessionUpdate);
      window.removeEventListener('moringa_auth_changed', handleSessionUpdate);
    };
  }, [pathname, router]);

  const handleLogout = () => {
    clearAdminSession();
    router.replace('/login');
  };

  const handleForceChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (!session) return;
    if (newPass.length < 6) {
      setPassError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (newPass === '@KamalGeraei990') {
      setPassError('رمز عبور جدید نمی‌تواند همان رمز اولیه باشد.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('تکرار کلمه عبور با رمز جدید همخوانی ندارد.');
      return;
    }

    changeAdminPassword(session.id, newPass);
    setSession(getActiveAdminSession());
    setNewPass('');
    setConfirmPass('');
  };

  const [menuSearch, setMenuSearch] = useState('');

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
    badge?: string;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: 'پیشخوان و آمار',
      items: [
        { href: '/admin', label: 'داشبورد جامع', icon: BarChart3, exact: true },
        { href: '/admin/reports', label: 'گزارش‌های مالی و سود', icon: BarChart3 },
      ],
    },
    {
      title: 'فروش و سفارش‌ها',
      items: [
        { href: '/admin/orders', label: 'سفارش‌ها و فاکتورها', icon: ShoppingBag, badge: 'سفارش' },
        { href: '/admin/postchi', label: 'پستچی و مرسولات', icon: Truck, badge: 'جدید' },
        { href: '/admin/inventory', label: 'موجودی و گردش انبار', icon: Layers },
      ],
    },
    {
      title: 'محصولات و کاتالوگ',
      items: [
        { href: '/admin/products', label: 'کاتالوگ محصولات', icon: Package, exact: true },
        { href: '/admin/products/new', label: 'افزودن محصول جدید', icon: Plus },
        { href: '/admin/categories', label: 'دسته‌بندی‌ها و تگ‌ها', icon: Tag },
        { href: '/admin/reviews', label: 'دیدگاه‌ها و نظرات', icon: MessageSquare },
      ],
    },
    {
      title: 'بازاریابی و مشتریان',
      items: [
        { href: '/admin/customers', label: 'مشتریان و باشگاه (CRM)', icon: Users, badge: 'CRM' },
        { href: '/admin/promotions', label: 'تخفیف و پروموشن‌ها', icon: Percent },
        { href: '/admin/sms', label: 'سامانه پیامک پیشرفته (Pro)', icon: Smartphone, badge: 'PRO' },
        { href: '/admin/notifications', label: 'صف و قالب‌های اعلان', icon: Bell, badge: 'SMS' },
      ],
    },

    {
      title: 'محتوا و آموزش',
      items: [
        { href: '/admin/articles', label: 'دانشنامه و مقالات', icon: FileText },
        { href: '/admin/seo', label: 'سئو و متاتگ‌های پیشرفته', icon: Globe2 },
        { href: '/admin/chatbot', label: 'چت‌بات هوش مصنوعی', icon: Bot },
        { href: '/admin/support', label: 'مشاور و پشتیبانی آنلاین', icon: Headphones },
      ],
    },
    {
      title: 'تنظیمات و امنیت',
      items: [
        { href: '/admin/settings', label: 'تنظیمات فروشگاه', icon: Settings, badge: 'پیکربندی' },
        { href: '/download/app', label: 'دانلود اپلیکیشن اندروید', icon: Smartphone, badge: 'APK/PWA' },
        { href: '/admin/access', label: 'سطوح دسترسی و مدیران', icon: Users, badge: 'امنیت' },
        { href: '/admin/audit-logs', label: 'سوابق امنیتی (Audit)', icon: ShieldCheck },
      ],
    },
  ];
  if (!isLoaded || !session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 dir-rtl">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
            🌿
          </div>
          <p className="text-xs font-bold text-slate-300">در حال بررسی سطح دسترسی مدیریت و انتقال به صفحه ورود...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#040f0c] flex flex-col md:flex-row dir-rtl transition-colors duration-200">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-white p-4 sm:p-5 flex flex-col justify-between shrink-0 shadow-xl border-l border-slate-800 h-auto md:h-screen md:sticky md:top-0">
        <div className="space-y-4 overflow-y-auto pr-0.5 custom-scrollbar flex-1">
          {/* Brand & Panel Title */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                🌿
              </span>
              <div>
                <h2 className="text-sm font-black text-white">پنل مدیریت ایران مورینگا</h2>
                <p className="text-[10px] text-emerald-400 font-bold">سامانه یکپارچه فروشگاهی</p>
              </div>
            </div>
            <Link
              href="/"
              title="مشاهده وب‌سایت"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1"
            >
              <span>فروشگاه</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Menu Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو در منوها..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-[11px] text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Categorized Navigation Sections */}
          <nav className="flex flex-col gap-4 text-xs">
            {navSections.map((section, sIdx) => {
              const filteredItems = section.items.filter((item) =>
                item.label.toLowerCase().includes(menuSearch.toLowerCase())
              );

              if (menuSearch && filteredItems.length === 0) return null;

              return (
                <div key={sIdx} className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-400/90 uppercase tracking-wider px-3 block">
                    {section.title}
                  </span>
                  <div className="space-y-0.5">
                    {filteredItems.map((item) => {
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`px-3 py-2 rounded-xl font-bold flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[9px] bg-[#d0de41] text-[#026251] px-1.5 py-0.5 rounded-full font-black">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xs">
              {session?.fullName ? session.fullName.slice(0, 1) : 'م'}
            </div>
            <div className="overflow-hidden flex-1">
              <span className="text-xs font-bold text-white block truncate">
                {session?.fullName || 'احسان پویا (مدیر ارشد)'}
              </span>
              <span className="text-[10px] text-amber-400 block truncate">
                {session?.isSuperAdmin ? 'دسترسی کامل Super Admin' : 'مدیر سیستم'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Link
              href="/admin/settings"
              className="flex-1 text-center py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              تنظیمات فروشگاه
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950/80 rounded-xl transition-all"
              title="خروج از پنل مدیریت"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <header className="bg-white dark:bg-[#08201a] border-b border-slate-200 dark:border-emerald-900/40 h-16 px-6 flex items-center justify-between shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
              پیشخوان مدیریت فروشگاه ایران مورینگا
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-full text-xs font-black flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>دسترسی مدیر ارشد</span>
            </span>

            <Link
              href="/"
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              نمایش سایت
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>

      {/* Mandatory Password Change Modal for First Login */}
      {session && session.mustChangePassword && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-amber-300 dark:border-amber-800">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                الزام تغییر رمز عبور اولیه
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                مدیر گرامی ({session.fullName})؛ شما با رمز عبور موقت وارد شده‌اید. جهت حفظ امنیت سامانه، لطفاً رمز عبور اختصاصی خود را تعیین فرمایید.
              </p>
            </div>

            {passError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleForceChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  رمز عبور اختصاصی جدید *
                </label>
                <input
                  type="password"
                  required
                  placeholder="حداقل ۶ کاراکتر"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  تکرار رمز عبور جدید *
                </label>
                <input
                  type="password"
                  required
                  placeholder="تکرار رمز عبور"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#026251] hover:bg-[#014d3f] text-white rounded-xl font-black text-xs shadow-md transition-all"
              >
                تایید و ورود به پنل
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
