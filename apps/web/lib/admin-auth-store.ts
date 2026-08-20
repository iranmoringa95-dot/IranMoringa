'use client';

export type AdminRole = 'super_admin' | 'shop_manager' | 'content_editor' | 'logistics_operator' | 'support_agent';

export interface AdminPermission {
  id: string;
  name: string;
  category: 'products' | 'orders' | 'content' | 'users' | 'settings' | 'reports';
}

export interface AdminUser {
  id: string;
  identifier: string; // phone or email
  fullName: string;
  phone?: string;
  email?: string;
  passwordHash: string; // stored password (plain/hash in localStorage store)
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
  { id: 'support', name: 'پشتیبانی تیکت‌ها', path: '/admin/support' },
  { id: 'chatbot', name: 'چت‌بات هوشمند', path: '/admin/chatbot' },
  { id: 'reports', name: 'گزارش‌ها و تحلیل مالی', path: '/admin/reports' },
  { id: 'access', name: 'سطوح دسترسی و مدیران', path: '/admin/access' },
];

export const INITIAL_SUPER_ADMINS: AdminUser[] = [
  {
    id: 'adm-001',
    identifier: '09132391843',
    phone: '09132391843',
    fullName: 'احسان پویا (مدیر ارشد)',
    email: 'pqehsan@gmail.com',
    passwordHash: '@KamalGeraei990',
    role: 'super_admin',
    isSuperAdmin: true,
    mustChangePassword: true,
    isActive: true,
    createdAt: '۱۴۰۴/۰۱/۰۱',
    allowedSections: ALL_ADMIN_SECTIONS.map((s) => s.id),
  },
  {
    id: 'adm-002',
    identifier: '09175929345',
    phone: '09175929345',
    fullName: 'مدیریت عملیات و مزرعه',
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
    id: 'adm-003',
    identifier: 'pqehsan@gmail.com',
    email: 'pqehsan@gmail.com',
    fullName: 'احسان پویا',
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
  localStorage.setItem(STORAGE_ADMIN_USERS_KEY, JSON.stringify(users));
}

export function findAdminByIdentifier(identifier: string): AdminUser | null {
  const norm = identifier.trim().toLowerCase().replace(/^(\+98|0098)/, '0');
  const users = getAdminUsers();
  return (
    users.find(
      (u) =>
        u.identifier.toLowerCase() === norm ||
        (u.phone && u.phone === norm) ||
        (u.email && u.email.toLowerCase() === norm)
    ) || null
  );
}

export function getActiveAdminSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Refresh user data from current storage
    const current = findAdminByIdentifier(session.identifier);
    return current || session;
  } catch {
    return null;
  }
}

export function setAdminSession(user: AdminUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('moringa_admin_session_updated'));
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event('moringa_admin_session_updated'));
}

export function changeAdminPassword(adminId: string, newPass: string): boolean {
  const users = getAdminUsers();
  const idx = users.findIndex((u) => u.id === adminId);
  if (idx === -1) return false;

  users[idx].passwordHash = newPass;
  users[idx].mustChangePassword = false;
  saveAdminUsers(users);

  // Update session if active
  const currentSession = getActiveAdminSession();
  if (currentSession && currentSession.id === adminId) {
    setAdminSession(users[idx]);
  }
  return true;
}

export function isUserSuperAdmin(identifierOrPhone: string): boolean {
  const admin = findAdminByIdentifier(identifierOrPhone);
  return Boolean(admin && admin.isActive && admin.isSuperAdmin);
}
