'use client';

export type AdminRole = 'super_admin' | 'shop_manager' | 'content_editor' | 'logistics_operator' | 'support_agent';

export interface AdminPermission {
  id: string;
  name: string;
  category: 'products' | 'orders' | 'content' | 'users' | 'settings' | 'reports';
}

export interface AdminUser {
  id: string; // user UUID
  userId?: string;
  roleId?: string;
  identifier: string; // phone or email
  fullName: string;
  firstName?: string;
  lastName?: string;
  customTitle?: string;
  phone?: string;
  email?: string;
  passwordHash?: string; // stored password
  role: AdminRole;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  allowedSections: string[]; // e.g. ['products', 'orders', 'inventory', 'postchi', 'articles', 'promotions', 'reviews', 'notifications', 'audit-logs', 'seo', 'support', 'chatbot', 'reports', 'access']
}

export const ALL_ADMIN_SECTIONS = [
  { id: 'products', name: 'مدیریت محصولات', path: '/admin/products' },
  { id: 'inventory', name: 'موجودی و انبار', path: '/admin/inventory' },
  { id: 'orders', name: 'مدیریت سفارش‌ها', path: '/admin/orders' },
  { id: 'postchi', name: 'پستچی و مرسولات', path: '/admin/postchi' },
  { id: 'promotions', name: 'کوپن و تخفیف‌ها', path: '/admin/promotions' },
  { id: 'reviews', name: 'دیدگاه‌ها و نظرات', path: '/admin/reviews' },
  { id: 'notifications', name: 'پیامک و اعلان‌ها', path: '/admin/notifications' },
  { id: 'audit-logs', name: 'سوابق امنیتی (Audit)', path: '/admin/audit-logs' },
  { id: 'articles', name: 'دانشنامه و مقالات', path: '/admin/articles' },
  { id: 'seo', name: 'سئو و ریدایرکت‌ها', path: '/admin/seo' },
  { id: 'support', name: 'مشاور و پشتیبانی آنلاین', path: '/admin/support' },
  { id: 'chatbot', name: 'چت‌بات هوشمند', path: '/admin/chatbot' },
  { id: 'reports', name: 'گزارش‌ها و تحلیل مالی', path: '/admin/reports' },
  { id: 'access', name: 'سطوح دسترسی و مدیران', path: '/admin/access' },
];

export const INITIAL_SUPER_ADMINS: AdminUser[] = [
  {
    id: '2992c005-a44b-409e-aa99-fe81aa8cea5c',
    identifier: '09132391843',
    phone: '09132391843',
    fullName: 'احسان پویا (مدیر ارشد)',
    firstName: 'احسان',
    lastName: 'پویا',
    customTitle: 'احسان پویا (مدیر ارشد)',
    email: 'pqehsan@gmail.com',
    passwordHash: '@KamalGeraei990',
    role: 'super_admin',
    isSuperAdmin: true,
    mustChangePassword: false,
    isActive: true,
    createdAt: '۱۴۰۴/۰۱/۰۱',
    allowedSections: ALL_ADMIN_SECTIONS.map((s) => s.id),
  },
  {
    id: '530f1703-afea-42d7-9c48-cf1087f272ae',
    identifier: '09175929345',
    phone: '09175929345',
    fullName: 'مدیریت عملیات و مزرعه',
    firstName: 'مدیریت',
    lastName: 'عملیات و مزرعه',
    customTitle: 'مدیریت عملیات و مزرعه',
    email: 'info@iran-moringa.ir',
    passwordHash: '@KamalGeraei990',
    role: 'super_admin',
    isSuperAdmin: true,
    mustChangePassword: true,
    isActive: true,
    createdAt: '۱۴۰۴/۰۱/۰۱',
    allowedSections: ALL_ADMIN_SECTIONS.map((s) => s.id),
  },
  {
    id: '196c24ef-4362-4185-8a4f-8d866987bce3',
    identifier: 'pqehsan@gmail.com',
    email: 'pqehsan@gmail.com',
    fullName: 'احسان پویا',
    firstName: 'احسان',
    lastName: 'پویا',
    customTitle: 'احسان پویا',
    passwordHash: '@KamalGeraei990',
    role: 'super_admin',
    isSuperAdmin: true,
    mustChangePassword: true,
    isActive: true,
    createdAt: '۱۴۰۴/۰۱/۰۱',
    allowedSections: ALL_ADMIN_SECTIONS.map((s) => s.id),
  },
];

const STORAGE_ADMIN_USERS_KEY = 'moringa_admin_users_v2';
const STORAGE_ADMIN_SESSION_KEY = 'moringa_admin_current_session';

export function getAdminUsers(): AdminUser[] {
  if (typeof window === 'undefined') return INITIAL_SUPER_ADMINS;
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ADMIN_USERS_KEY, JSON.stringify(INITIAL_SUPER_ADMINS));
      return INITIAL_SUPER_ADMINS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUPER_ADMINS;
  }
}

export function saveAdminUsers(users: AdminUser[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ADMIN_USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

export async function fetchAdminUsersFromApi(): Promise<AdminUser[]> {
  try {
    const res = await fetch('/api/v1/admin/access');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const mapped: AdminUser[] = data.items.map((it: any) => ({
          id: it.id,
          userId: it.userId,
          roleId: it.roleId,
          identifier: (it.phone || it.email || '').toLowerCase(),
          fullName: it.fullName || it.customTitle || 'مدیر سیستم',
          firstName: it.firstName,
          lastName: it.lastName,
          customTitle: it.customTitle,
          phone: it.phone,
          email: it.email,
          passwordHash: it.hasPassword ? '••••••••' : '@KamalGeraei990',
          role: it.role || 'shop_manager',
          isSuperAdmin: Boolean(it.isSuperAdmin),
          mustChangePassword: Boolean(it.mustChangePassword),
          isActive: Boolean(it.isActive),
          createdAt: it.createdAt,
          allowedSections: it.allowedSections || ALL_ADMIN_SECTIONS.map((s) => s.id),
        }));
        saveAdminUsers(mapped);
        return mapped;
      }
    }
  } catch (e) {
    console.error('Failed to sync admins from API:', e);
  }
  return getAdminUsers();
}

export function findAdminByIdentifier(identifier: string): AdminUser | null {
  const norm = identifier.trim().toLowerCase().replace(/^(\+98|0098)/, '0');
  const users = getAdminUsers();
  return (
    users.find(
      (u) =>
        u.identifier.toLowerCase() === norm ||
        (u.phone && u.phone.replace(/^(\+98|0098)/, '0') === norm) ||
        (u.email && u.email.toLowerCase() === norm)
    ) || null
  );
}

export function getActiveAdminSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    // Both user session AND admin session must be present
    const hasUserSession = localStorage.getItem('moringa_user_session') === 'active';
    const hasCookie = document.cookie.includes('moringa_auth_session=authenticated');
    if (!hasUserSession && !hasCookie) {
      return null;
    }

    const raw = localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!raw) {
      // Check if logged in user is admin by phone
      const phone = localStorage.getItem('moringa_user_phone');
      if (phone) {
        const found = findAdminByIdentifier(phone);
        if (found && found.isActive) {
          localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(found));
          return found;
        }
      }
      return null;
    }

    const session = JSON.parse(raw);
    if (!session || !session.identifier) return null;

    // Refresh user data from current storage
    const current = findAdminByIdentifier(session.identifier);
    if (!current || !current.isActive) {
      return null;
    }
    return current;
  } catch {
    return null;
  }
}

export function setAdminSession(user: AdminUser) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(user));
    localStorage.setItem('moringa_user_session', 'active');
    if (user.phone) localStorage.setItem('moringa_user_phone', user.phone);
    if (user.fullName) localStorage.setItem('moringa_user_name', user.fullName);
    
    document.cookie = `moringa_auth_session=authenticated; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    document.cookie = `moringa_admin_session=authenticated; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    
    window.dispatchEvent(new Event('moringa_admin_session_updated'));
    window.dispatchEvent(new Event('moringa_auth_changed'));
  } catch (e) {}
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
    localStorage.removeItem('moringa_user_session');
    localStorage.removeItem('moringa_user_phone');
    localStorage.removeItem('moringa_user_name');

    // Clear all auth cookies
    document.cookie = 'moringa_auth_session=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'moringa_user_phone=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'moringa_user_name=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'moringa_admin_session=; path=/; max-age=0; SameSite=Lax';

    window.dispatchEvent(new Event('moringa_admin_session_updated'));
    window.dispatchEvent(new Event('moringa_auth_changed'));
  } catch (e) {}
}

export async function changeAdminPassword(adminId: string, newPass: string): Promise<boolean> {
  const users = getAdminUsers();
  const idx = users.findIndex((u) => u.id === adminId);
  if (idx !== -1) {
    users[idx].passwordHash = newPass;
    users[idx].mustChangePassword = false;
    saveAdminUsers(users);
  }

  // Update backend DB as well
  try {
    await fetch('/api/v1/admin/access/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: adminId, newPassword: newPass }),
    });
  } catch (e) {
    console.error('Failed to sync password change to API:', e);
  }

  // Update session if active
  const currentSession = getActiveAdminSession();
  if (currentSession && currentSession.id === adminId) {
    if (idx !== -1) {
      setAdminSession(users[idx]);
    }
  }
  return true;
}

export function isUserSuperAdmin(identifierOrPhone: string): boolean {
  if (typeof window !== 'undefined') {
    const hasUserSession = localStorage.getItem('moringa_user_session') === 'active';
    const hasCookie = document.cookie.includes('moringa_auth_session=authenticated');
    if (!hasUserSession && !hasCookie) {
      return false;
    }
  }
  const admin = findAdminByIdentifier(identifierOrPhone);
  return Boolean(admin && admin.isActive && admin.isSuperAdmin);
}
