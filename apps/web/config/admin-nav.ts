import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Truck,
  Package,
  PlusCircle,
  Tag,
  Boxes,
  Users,
  Percent,
  MessageSquare,
  Smartphone,
  Bell,
  Headphones,
  Bot,
  FileText,
  Globe2,
  Settings,
  DownloadCloud,
  UserCog,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';
import { AdminUser, AdminRole } from '@/lib/admin-auth-store';

export type MatchMode = 'exact' | 'prefix';

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  matchMode?: MatchMode;
  keywords: string[];
  permission?: string; // Section id in allowedSections (e.g. 'products', 'inventory', 'orders', etc.)
  isSuperAdminOnly?: boolean;
  badgeKey?: 'orders' | 'reviews' | 'support' | 'inventory';
  children?: AdminNavItem[];
}

export interface AdminNavGroup {
  id: string;
  title: string;
  items: AdminNavItem[];
}

/**
 * Persian number formatter
 */
export function toPersianDigits(n: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * Badge count formatter:
 * - Hidden if 0 or null
 * - Shows '+۹۹' if > 99
 * - Uses Persian numbers
 */
export function formatBadgeNumber(count?: number | null): string | null {
  if (count === undefined || count === null || count <= 0) return null;
  if (count > 99) return '+۹۹';
  return toPersianDigits(count);
}

/**
 * Text normalizer for Persian search (handles arabic yeh/kaf, half-spaces, spaces, case)
 */
export function normalizePersianText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\u200c/g, ' ') // ZWNJ to space
    .replace(/[\u200B\u200D\uFEFF]/g, '') // zero-width spaces
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/[آأإ]/g, 'ا')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ی')
    .replace(/[\s\-_]+/g, ' ')
    .trim();
}

/**
 * Persian role title translator
 */
export function getPersianRoleTitle(role?: AdminRole | string, isSuperAdmin?: boolean): string {
  if (isSuperAdmin || role === 'super_admin') return 'مدیر ارشد';
  switch (role) {
    case 'shop_manager':
      return 'مدیر فروشگاه';
    case 'content_editor':
      return 'کارشناس محتوا';
    case 'logistics_operator':
      return 'مسئول لجستیک و ارسال';
    case 'support_agent':
      return 'کارشناس پشتیبانی';
    default:
      return 'مدیر سیستم';
  }
}

/**
 * Fixed top items (Always shown directly below search, not inside accordion)
 */
export const FIXED_TOP_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'داشبورد',
    href: '/admin',
    icon: LayoutDashboard,
    exact: true,
    matchMode: 'exact',
    keywords: ['داشبورد', 'پیشخوان', 'امار', 'آمار', 'فروش', 'خلاصه', 'dashboard', 'home', 'main'],
  },
  {
    id: 'reports',
    label: 'گزارش‌های مالی و سود',
    href: '/admin/reports',
    icon: TrendingUp,
    exact: false,
    matchMode: 'prefix',
    permission: 'reports',
    keywords: ['گزارش', 'مالی', 'سود', 'فروش', 'حسابداری', 'درامد', 'درآمد', 'تحلیل', 'reports', 'finance', 'analytics'],
  },
];

/**
 * Accordion Navigation Groups
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'sales',
    title: 'گروه ۱: فروش و سفارش‌ها',
    items: [
      {
        id: 'orders',
        label: 'سفارش‌ها و فاکتورها',
        href: '/admin/orders',
        icon: ShoppingBag,
        permission: 'orders',
        badgeKey: 'orders',
        keywords: ['سفارش', 'فاکتور', 'فروش', 'سبد', 'خرید', 'پرداخت', 'order', 'invoice', 'checkout'],
      },
      {
        id: 'postchi',
        label: 'ارسال و مرسولات',
        href: '/admin/postchi',
        icon: Truck,
        permission: 'postchi',
        keywords: ['پست', 'مرسولات', 'پستچی', 'ارسال', 'کد رهگیری', 'تیپاکس', 'حمل و نقل', 'shipping', 'post', 'delivery'],
      },
    ],
  },
  {
    id: 'catalog',
    title: 'گروه ۲: محصولات و انبار',
    items: [
      {
        id: 'products',
        label: 'محصولات',
        href: '/admin/products',
        icon: Package,
        permission: 'products',
        keywords: ['محصولات', 'کالا', 'کاتالوگ', 'لیست محصولات', 'ویرایش محصول', 'products', 'catalog', 'items'],
      },
      {
        id: 'products-new',
        label: 'افزودن محصول',
        href: '/admin/products/new',
        icon: PlusCircle,
        exact: true,
        permission: 'products',
        keywords: ['افزودن محصول', 'محصول جدید', 'ایجاد کالا', 'ثبت محصول', 'new product', 'create product'],
      },
      {
        id: 'categories',
        label: 'دسته‌بندی و برچسب‌ها',
        href: '/admin/categories',
        icon: Tag,
        permission: 'products',
        keywords: ['دسته بندی', 'دسته‌بندی', 'برچسب', 'تگ', 'گروه کالا', 'categories', 'tags'],
      },
      {
        id: 'inventory',
        label: 'موجودی و گردش انبار',
        href: '/admin/inventory',
        icon: Boxes,
        permission: 'inventory',
        badgeKey: 'inventory',
        keywords: ['انبار', 'موجودی', 'گردش انبار', 'کسری', 'کاردکس', 'موجودی کالا', 'inventory', 'stock', 'warehouse'],
      },
    ],
  },
  {
    id: 'marketing',
    title: 'گروه ۳: مشتریان و بازاریابی',
    items: [
      {
        id: 'customers',
        label: 'مشتریان و باشگاه',
        href: '/admin/customers',
        icon: Users,
        permission: 'access',
        keywords: ['مشتری', 'مشتریان', 'کاربران', 'باشگاه', 'crm', 'اعضا', 'خریداران', 'customers', 'users', 'club'],
      },
      {
        id: 'promotions',
        label: 'تخفیف‌ها و کمپین‌ها',
        href: '/admin/promotions',
        icon: Percent,
        permission: 'promotions',
        keywords: ['تخفیف', 'کوپن', 'کمپین', 'پروموشن', 'کد تخفیف', 'جشنواره', 'تخفیفها', 'promotions', 'discounts', 'coupons'],
      },
      {
        id: 'reviews',
        label: 'دیدگاه‌ها',
        href: '/admin/reviews',
        icon: MessageSquare,
        permission: 'reviews',
        badgeKey: 'reviews',
        keywords: ['دیدگاه', 'دیدگاه‌ها', 'نظرات', 'کامنت', 'امتیاز', 'بررسی', 'دیدگاهها', 'reviews', 'comments', 'feedback'],
      },
    ],
  },
  {
    id: 'communication',
    title: 'گروه ۴: ارتباطات و پشتیبانی',
    items: [
      {
        id: 'sms',
        label: 'پیامک‌ها',
        href: '/admin/sms',
        icon: Smartphone,
        permission: 'notifications',
        keywords: ['پیامک', 'پیامک‌ها', 'اس ام اس', 'sms', 'پنل پیامک', 'ارسال پیامک', 'لاگ پیامک', 'کاوه نگار', 'پیامکها'],
      },
      {
        id: 'notifications',
        label: 'اعلان‌ها و قالب‌ها',
        href: '/admin/notifications',
        icon: Bell,
        permission: 'notifications',
        keywords: ['اعلان', 'اعلان‌ها', 'نوتیفیکیشن', 'قالب', 'پترن', 'پیامک الگو', 'قالبها', 'notifications', 'templates', 'alerts'],
      },
      {
        id: 'support',
        label: 'پشتیبانی آنلاین',
        href: '/admin/support',
        icon: Headphones,
        permission: 'support',
        badgeKey: 'support',
        keywords: ['پشتیبانی', 'مشاور', 'تیکت', 'گفتگو', 'چت آنلاین', 'راهنمایی', 'support', 'helpdesk', 'chat'],
      },
      {
        id: 'chatbot',
        label: 'چت‌بات هوشمند',
        href: '/admin/chatbot',
        icon: Bot,
        permission: 'chatbot',
        keywords: ['چت بات', 'چت‌بات', 'هوش مصنوعی', 'ربات', 'پاسخگوی خودکار', 'ai', 'chatbot', 'bot'],
      },
    ],
  },
  {
    id: 'content',
    title: 'گروه ۵: محتوا و سئو',
    items: [
      {
        id: 'articles',
        label: 'دانشنامه و مقالات',
        href: '/admin/articles',
        icon: FileText,
        permission: 'articles',
        keywords: ['مقاله', 'مقالات', 'دانشنامه', 'وبلاگ', 'آموزش', 'محتوا', 'articles', 'blog', 'posts', 'content'],
      },
      {
        id: 'seo',
        label: 'سئو و متاتگ‌ها',
        href: '/admin/seo',
        icon: Globe2,
        permission: 'seo',
        keywords: ['سئو', 'متاتگ', 'گوگل', 'ریدایرکت', 'اسکیما', 'سرچ کنسول', 'سئو و متاتگها', 'seo', 'sitemap', 'meta'],
      },
    ],
  },
  {
    id: 'system',
    title: 'گروه ۶: سیستم و امنیت',
    items: [
      {
        id: 'settings',
        label: 'تنظیمات فروشگاه',
        href: '/admin/settings',
        icon: Settings,
        keywords: ['تنظیمات', 'پیکربندی', 'اطلاعات فروشگاه', 'لوگو', 'تماس', 'درگاه', 'تنظیمات فروشگاه', 'settings', 'config'],
      },
      {
        id: 'app',
        label: 'اپلیکیشن و PWA',
        href: '/download/app',
        icon: DownloadCloud,
        keywords: ['اپلیکیشن', 'اپلیکیشن و pwa', 'اندروید', 'دانلود برنامه', 'pwa', 'apk', 'موبایل', 'app', 'download'],
      },
      {
        id: 'access',
        label: 'مدیران و دسترسی‌ها',
        href: '/admin/access',
        icon: UserCog,
        permission: 'access',
        keywords: ['دسترسی', 'مدیران', 'ادمین', 'نقش ها', 'مجوزها', 'کاربران ادمین', 'مدیران و دسترسیها', 'access', 'roles', 'admins'],
      },
      {
        id: 'audit-logs',
        label: 'گزارش فعالیت و امنیت',
        href: '/admin/audit-logs',
        icon: ShieldCheck,
        permission: 'audit-logs',
        keywords: ['امنیت', 'لاگ', 'سوابق', 'فعالیت', 'تغییرات', 'حسابرسی', 'audit', 'logs', 'security'],
      },
    ],
  },
];

/**
 * Filter items by session permissions
 */
export function isItemAllowed(item: AdminNavItem, session: AdminUser | null): boolean {
  if (!session) return false;
  if (session.isSuperAdmin) return true;
  if (item.isSuperAdminOnly && !session.isSuperAdmin) return false;
  if (!item.permission) return true;

  const allowed = session.allowedSections || [];
  return allowed.includes(item.permission);
}

/**
 * Filter whole navigation based on admin session permissions
 */
export function getFilteredNavigation(
  session: AdminUser | null,
  groups: AdminNavGroup[] = ADMIN_NAV_GROUPS,
  fixedItems: AdminNavItem[] = FIXED_TOP_NAV_ITEMS
): { visibleFixed: AdminNavItem[]; visibleGroups: AdminNavGroup[] } {
  const visibleFixed = fixedItems.filter((it) => isItemAllowed(it, session));

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((it) => isItemAllowed(it, session)),
    }))
    .filter((group) => group.items.length > 0);

  return { visibleFixed, visibleGroups };
}

/**
 * Match the most specific active route
 * Returns { activeItemId, activeGroupId }
 */
export function findActiveRoute(
  pathname: string,
  visibleGroups: AdminNavGroup[],
  visibleFixed: AdminNavItem[]
): { activeItemId: string | null; activeGroupId: string | null } {
  if (!pathname) return { activeItemId: null, activeGroupId: null };

  const allItems: { item: AdminNavItem; groupId: string | null }[] = [
    ...visibleFixed.map((it) => ({ item: it, groupId: null })),
  ];

  for (const group of visibleGroups) {
    for (const item of group.items) {
      allItems.push({ item, groupId: group.id });
    }
  }

  // Find candidate matches with scores
  let bestMatch: { item: AdminNavItem; groupId: string | null; score: number } | null = null;

  for (const entry of allItems) {
    const { item, groupId } = entry;
    let score = -1;

    if (item.href === '/admin') {
      // Root dashboard should only match exactly /admin or /admin/
      if (pathname === '/admin' || pathname === '/admin/') {
        score = 10000;
      }
    } else if (item.exact) {
      if (pathname === item.href || pathname === `${item.href}/`) {
        score = 5000 + item.href.length;
      }
    } else {
      if (pathname === item.href || pathname === `${item.href}/`) {
        score = 5000 + item.href.length;
      } else if (pathname.startsWith(`${item.href}/`)) {
        // Deep subroute match (e.g. /admin/products/123/edit matches /admin/products)
        score = 1000 + item.href.length;
      }
    }

    if (score > (bestMatch?.score ?? -1)) {
      bestMatch = { item, groupId, score };
    }
  }

  if (bestMatch && bestMatch.score > 0) {
    return {
      activeItemId: bestMatch.item.id,
      activeGroupId: bestMatch.groupId,
    };
  }

  return { activeItemId: null, activeGroupId: null };
}

export interface SearchResultItem {
  item: AdminNavItem;
  groupTitle?: string;
  groupId?: string;
}

/**
 * Search items across navigation with Persian normalizer
 */
export function searchNavigation(
  query: string,
  visibleGroups: AdminNavGroup[],
  visibleFixed: AdminNavItem[]
): SearchResultItem[] {
  const normQuery = normalizePersianText(query);
  if (!normQuery) return [];

  const results: SearchResultItem[] = [];

  for (const fixedItem of visibleFixed) {
    const normLabel = normalizePersianText(fixedItem.label);
    const matchesKeyword = fixedItem.keywords.some((k) =>
      normalizePersianText(k).includes(normQuery)
    );
    if (normLabel.includes(normQuery) || matchesKeyword) {
      results.push({ item: fixedItem });
    }
  }

  for (const group of visibleGroups) {
    const normGroupTitle = normalizePersianText(group.title);
    for (const item of group.items) {
      const normLabel = normalizePersianText(item.label);
      const matchesKeyword = item.keywords.some((k) =>
        normalizePersianText(k).includes(normQuery)
      );
      if (
        normLabel.includes(normQuery) ||
        matchesKeyword ||
        normGroupTitle.includes(normQuery)
      ) {
        // Strip group number prefix for cleaner breadcrumb
        const cleanGroupTitle = group.title.replace(/^گروه\s+\d+:\s*/, '');
        results.push({
          item,
          groupTitle: cleanGroupTitle,
          groupId: group.id,
        });
      }
    }
  }

  return results;
}
