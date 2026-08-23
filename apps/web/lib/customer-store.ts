'use client';

export interface CustomerAddress {
  id: string;
  title: string; // e.g. 'منزل', 'محل کار'
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine: string;
  isDefault: boolean;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  statusLabel: string;
  totalIrr: number;
  totalToman: number;
  trackingCode?: string;
  shippingMethod: string;
  items: {
    title: string;
    variant: string;
    quantity: number;
    priceToman: number;
    image?: string;
  }[];
  address: {
    recipientName: string;
    city: string;
    addressLine: string;
  };
}

export interface CustomerCoupon {
  code: string;
  title: string;
  discountPercent: number;
  maxDiscountToman?: number;
  expiresAt: string;
  minOrderToman: number;
  isUsed: boolean;
}

export interface CustomerProfile {
  phone: string;
  fullName: string;
  email: string;
  nationalCode?: string;
  joinDate: string;
  walletBalanceIrr: number;
  tier: 'gold' | 'silver' | 'bronze';
  addresses: CustomerAddress[];
  wishlist: string[];
}

const DEFAULT_PROFILE: CustomerProfile = {
  phone: '09132391843',
  fullName: 'احسان پویا',
  email: 'ehsan.pouya@moringalab.ir',
  nationalCode: '1289456721',
  joinDate: '۱۴۰۴/۰۵/۱۲',
  walletBalanceIrr: 40612440, // 4,061,244 Toman (40,612,440 IRR)
  tier: 'gold',
  addresses: [
    {
      id: 'addr-1',
      title: 'منزل (پیش‌فرض)',
      recipientName: 'احسان پویا',
      phone: '09132391843',
      province: 'اصفهان',
      city: 'اصفهان',
      postalCode: '8164812345',
      addressLine: 'خیابان چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲',
      isDefault: true,
    },
    {
      id: 'addr-2',
      title: 'دفتر کار',
      recipientName: 'احسان پویا',
      phone: '09132391843',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1987654321',
      addressLine: 'ونک، خیابان ملاصدرا، پلاک ۴۸، طبقه ۲',
      isDefault: false,
    },
  ],
  wishlist: ['moringa-powder-pure', 'moringa-capsules-organic', 'moringa-oil-facial-elixir'],
};

export const INITIAL_ORDERS: CustomerOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'MOR-1405-892',
    createdAt: '۱۴۰۵/۰۲/۱۴ - ۱۱:۴۵',
    status: 'delivered',
    statusLabel: 'تحویل داده شده',
    totalIrr: 7450000,
    totalToman: 745000,
    trackingCode: 'POST-IR-8923014798',
    shippingMethod: 'پست پیشتاز هوایی',
    items: [
      {
        title: 'پودر خالص برگ مورینگا اولیفرا',
        variant: 'بسته ۲۵۰ گرمی (ارگانیک سایه‌خشک)',
        quantity: 2,
        priceToman: 295000,
      },
      {
        title: 'دمنوش تخصصی انرژی‌بخش مورینگا و زنجبیل',
        variant: 'جعبه ۲۰ عددی هرمی',
        quantity: 1,
        priceToman: 155000,
      },
    ],
    address: {
      recipientName: 'احسان پویا',
      city: 'اصفهان',
      addressLine: 'خیابان چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲',
    },
  },
  {
    id: 'ord-102',
    orderNumber: 'MOR-1405-944',
    createdAt: '۱۴۰۵/۰۳/۰۱ - ۱۶:۲۰',
    status: 'shipped',
    statusLabel: 'ارسال شده با پستچی',
    totalIrr: 12800000,
    totalToman: 1280000,
    trackingCode: 'POST-IR-9448102376',
    shippingMethod: 'ارسال اکسپرس پستچی',
    items: [
      {
        title: 'روغن اکسیر احیاکننده و ضدچروک صورت مورینگا',
        variant: 'شیشه قطره‌چکانی ۵۰ میل (پرس سرد ۱۰۰٪ خالص)',
        quantity: 1,
        priceToman: 680000,
      },
      {
        title: 'کپسول عصاره استانداردشده مورینگا (تقویت ایمنی)',
        variant: 'قوطی ۶۰ عددی گیاهی',
        quantity: 1,
        priceToman: 600000,
      },
    ],
    address: {
      recipientName: 'احسان پویا',
      city: 'اصفهان',
      addressLine: 'خیابان چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲',
    },
  },
  {
    id: 'ord-103',
    orderNumber: 'MOR-1405-998',
    createdAt: '۱۴۰۵/۰۳/۱۸ - ۰۹:۱۵',
    status: 'processing',
    statusLabel: 'در حال پردازش و بسته‌بندی',
    totalIrr: 5900000,
    totalToman: 590000,
    shippingMethod: 'پست پیشتاز اکسپرس',
    items: [
      {
        title: 'پودر خالص برگ مورینگا اولیفرا',
        variant: 'بسته ۵۰۰ گرمی خانوادگی',
        quantity: 1,
        priceToman: 590000,
      },
    ],
    address: {
      recipientName: 'احسان پویا',
      city: 'اصفهان',
      addressLine: 'خیابان چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲',
    },
  },
];

export const INITIAL_COUPONS: CustomerCoupon[] = [
  {
    code: 'MORINGA15',
    title: '۱۵٪ تخفیف ویژه عضویت در باشگاه سلامت سبزینه',
    discountPercent: 15,
    maxDiscountToman: 150000,
    expiresAt: '۱۴۰۵/۰۶/۳۱',
    minOrderToman: 300000,
    isUsed: false,
  },
  {
    code: 'FREESHIP',
    title: 'ارسال رایگان پستی برای سفارش‌های بالای ۵۰۰ هزار تومان',
    discountPercent: 100,
    expiresAt: '۱۴۰۵/۰۵/۲۹',
    minOrderToman: 500000,
    isUsed: false,
  },
];

/**
 * Get all customer orders from LocalStorage or defaults
 */
export function getCustomerOrders(): CustomerOrder[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const saved = localStorage.getItem('moringa_customer_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_ORDERS;
}

/**
 * Add a newly placed order to customer's order history
 */
export function addCustomerOrder(newOrder: CustomerOrder): CustomerOrder[] {
  const current = getCustomerOrders();
  const updated = [newOrder, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('moringa_customer_orders', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('moringa_orders_updated', { detail: updated }));
    } catch (e) {
      console.error('Failed to save order:', e);
    }
  }
  return updated;
}

/**
 * Get Customer Profile from LocalStorage or defaults
 */
export function getCustomerProfile(): CustomerProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const saved = localStorage.getItem('moringa_customer_profile');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_PROFILE;
}

/**
 * Save Customer Profile
 */
export function saveCustomerProfile(profile: Partial<CustomerProfile>): CustomerProfile {
  const current = getCustomerProfile();
  const merged: CustomerProfile = { ...current, ...profile };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('moringa_customer_profile', JSON.stringify(merged));
      window.dispatchEvent(new Event('moringa_customer_updated'));
    } catch (e) {}
  }
  return merged;
}

/**
 * Check if customer is authenticated
 */
export function isCustomerLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hasCookie = document.cookie.includes('moringa_auth_session=authenticated');
    const hasLocal = localStorage.getItem('moringa_user_session') === 'active';
    return hasCookie || hasLocal;
  } catch {
    return false;
  }
}

/**
 * Set customer authenticated session and sync admin role if applicable
 */
export function setCustomerSession(phone: string, name?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('moringa_user_session', 'active');
    localStorage.setItem('moringa_user_phone', phone);
    if (name) localStorage.setItem('moringa_user_name', name);
    document.cookie = `moringa_auth_session=authenticated; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    document.cookie = `moringa_user_phone=${encodeURIComponent(phone)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    if (name) {
      document.cookie = `moringa_user_name=${encodeURIComponent(name)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    }

    // Save to profile
    saveCustomerProfile({ phone, fullName: name });

    window.dispatchEvent(new Event('moringa_auth_changed'));
    window.dispatchEvent(new Event('moringa_admin_session_updated'));
  } catch (e) {}
}

/**
 * Customer Logout - Synchronously destroys both customer and admin sessions
 */
export function customerLogout() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('moringa_user_session');
    localStorage.removeItem('moringa_user_phone');
    localStorage.removeItem('moringa_user_name');
    localStorage.removeItem('moringa_admin_current_session');

    // Clear all auth cookies
    document.cookie = 'moringa_auth_session=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'moringa_user_phone=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'moringa_user_name=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'moringa_admin_session=; path=/; max-age=0; SameSite=Lax';

    window.dispatchEvent(new Event('moringa_auth_changed'));
    window.dispatchEvent(new Event('moringa_admin_session_updated'));
  } catch (e) {}
}


