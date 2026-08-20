'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import {
  AdminUser,
  AdminRole,
  ALL_ADMIN_SECTIONS,
  getAdminUsers,
  saveAdminUsers,
  getActiveAdminSession,
  changeAdminPassword,
} from '@/lib/admin-auth-store';

export default function AdminAccessControlPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSession, setActiveSession] = useState<AdminUser | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // New Admin Form State
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('@KamalGeraei990');
  const [newRole, setNewRole] = useState<AdminRole>('shop_manager');
  const [newSections, setNewSections] = useState<string[]>([
    'products',
    'orders',
    'inventory',
    'postchi',
  ]);

  // Password Change State
  const [newCustomPass, setNewCustomPass] = useState('');
  const [confirmCustomPass, setConfirmCustomPass] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    setAdminUsers(getAdminUsers());
    setActiveSession(getActiveAdminSession());
  }, []);

  const handleToggleSection = (sectionId: string) => {
    if (newSections.includes(sectionId)) {
      setNewSections(newSections.filter((s) => s !== sectionId));
    } else {
      setNewSections([...newSections, sectionId]);
    }
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newFullName.trim()) {
      setFormError('نام و نام خانوادگی مدیر الزامی است.');
      return;
    }
    if (!newPhone.trim() && !newEmail.trim()) {
      setFormError('حداقل شماره موبایل یا ایمیل مدیر را وارد نمایید.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    const identifier = (newPhone.trim() || newEmail.trim()).toLowerCase();
    const existing = adminUsers.find(
      (u) =>
        u.identifier === identifier ||
        (u.phone && u.phone === newPhone.trim()) ||
        (u.email && u.email.toLowerCase() === newEmail.trim().toLowerCase())
    );

    if (existing) {
      setFormError('این شماره یا ایمیل قبلاً به عنوان مدیر در سامانه ثبت شده است.');
      return;
    }

    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      identifier,
      fullName: newFullName.trim(),
      phone: newPhone.trim() || undefined,
      email: newEmail.trim().toLowerCase() || undefined,
      passwordHash: newPassword,
      role: newRole,
      isSuperAdmin: newRole === 'super_admin',
      mustChangePassword: true,
      isActive: true,
      createdAt: new Intl.DateTimeFormat('fa-IR').format(new Date()),
      allowedSections:
        newRole === 'super_admin' ? ALL_ADMIN_SECTIONS.map((s) => s.id) : newSections,
    };

    const updated = [...adminUsers, newAdmin];
    setAdminUsers(updated);
    saveAdminUsers(updated);
    setIsAddModalOpen(false);
    setFormSuccess(`مدیر جدید «${newFullName}» با موفقیت افزوده شد.`);

    // Reset Form
    setNewFullName('');
    setNewPhone('');
    setNewEmail('');
    setNewPassword('@KamalGeraei990');
    setNewRole('shop_manager');
    setNewSections(['products', 'orders', 'inventory', 'postchi']);
  };

  const handleToggleActive = (userId: string) => {
    const updated = adminUsers.map((u) => {
      if (u.id === userId) {
        // Prevent disabling primary super admin
        if (u.phone === '09132391843' || u.email === 'pqehsan@gmail.com') {
          alert('امکان غیرفعال‌سازی حساب مدیر ارشد اصلی وجود ندارد.');
          return u;
        }
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });
    setAdminUsers(updated);
    saveAdminUsers(updated);
  };

  const handleDeleteUser = (userId: string, name: string) => {
    const target = adminUsers.find((u) => u.id === userId);
    if (target?.phone === '09132391843' || target?.email === 'pqehsan@gmail.com') {
      alert('امکان حذف مدیر ارشد اصلی سیستم وجود ندارد.');
      return;
    }
    if (confirm(`آیا از حذف دسترسی مدیر «${name}» اطمینان دارید؟`)) {
      const updated = adminUsers.filter((u) => u.id !== userId);
      setAdminUsers(updated);
      saveAdminUsers(updated);
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedUser) return;

    if (newCustomPass.length < 6) {
      setFormError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (newCustomPass !== confirmCustomPass) {
      setFormError('تکرار رمز عبور با رمز جدید مطابقت ندارد.');
      return;
    }

    changeAdminPassword(selectedUser.id, newCustomPass);
    setAdminUsers(getAdminUsers());
    setIsPasswordModalOpen(false);
    setFormSuccess(`رمز عبور مدیر «${selectedUser.fullName}» با موفقیت به‌روزرسانی شد.`);
    setNewCustomPass('');
    setConfirmCustomPass('');
  };

  const filteredUsers = adminUsers.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.role.includes(q)
    );
  });

  const getRoleBadge = (role: AdminRole, isSuper: boolean) => {
    if (isSuper) {
      return (
        <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-black border border-amber-300 dark:border-amber-800 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          مدیر ارشد کل (Super Admin)
        </span>
      );
    }
    switch (role) {
      case 'shop_manager':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            مدیر فروشگاه و سفارش‌ها
          </span>
        );
      case 'content_editor':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            مدیر محتوا و مقالات
          </span>
        );
      case 'logistics_operator':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            مسئول ارسال و پستچی
          </span>
        );
      case 'support_agent':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold">
            پشتیبان و پاسخگوی مشتریان
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">مدیر</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#091f18] p-6 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#026251] dark:text-[#d0de41]">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                مدیریت سطوح دسترسی و مدیران پنل
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                کنترل اختیارات کامل سوپرادمین‌ها، افزودن مدیران جدید و تنظیم رمزهای عبور
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setIsAddModalOpen(true);
          }}
          className="px-5 py-3 bg-[#026251] hover:bg-[#014d3f] text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>افزودن مدیر جدید</span>
        </button>
      </div>

      {/* Success Alert */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess('')} className="text-stone-400 hover:text-stone-600">
            ✕
          </button>
        </div>
      )}

      {/* Super Admin Notice Card */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-200/80 dark:border-amber-900/50 rounded-3xl space-y-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>مدیران ارشد رسمی دارای اختیار کامل (Super Admins):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-700 dark:text-stone-300 pt-1">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-[#061410] border border-stone-200/80 dark:border-emerald-900/40">
            <span className="font-bold block text-slate-900 dark:text-white">شماره ۱: ۰۹۱۳۲۳۹۱۸۴۳</span>
            <span className="text-[11px] text-stone-500">احسان پویا (دسترسی کامل)</span>
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-[#061410] border border-stone-200/80 dark:border-emerald-900/40">
            <span className="font-bold block text-slate-900 dark:text-white">شماره ۲: ۰۹۱۷۵۹۲۹۳۴۵</span>
            <span className="text-[11px] text-stone-500">مدیریت عملیات و پشتیبانی</span>
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-[#061410] border border-stone-200/80 dark:border-emerald-900/40">
            <span className="font-bold block text-slate-900 dark:text-white">ایمیل: pqehsan@gmail.com</span>
            <span className="text-[11px] text-stone-500">رمز اولیه: @KamalGeraei990</span>
          </div>
        </div>
      </div>

      {/* Search & Stats Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="جستجو با نام، شماره موبایل، ایمیل یا نقش..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-[#091f18] border border-stone-200 dark:border-emerald-900/60 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400 font-bold">
          تعداد کل مدیران: {adminUsers.length} نفر
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white dark:bg-[#091f18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-[#061410] text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-emerald-900/40">
              <tr>
                <th className="py-3.5 px-4 font-bold">نام و نام خانوادگی</th>
                <th className="py-3.5 px-4 font-bold">شماره موبایل / ایمیل</th>
                <th className="py-3.5 px-4 font-bold">نقش و سطح دسترسی</th>
                <th className="py-3.5 px-4 font-bold">وضعیت رمز</th>
                <th className="py-3.5 px-4 font-bold">وضعیت حساب</th>
                <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-emerald-900/30 text-stone-800 dark:text-stone-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50/70 dark:hover:bg-[#0d2a21]/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#d0de41] flex items-center justify-center font-black text-xs shrink-0">
                      {user.fullName.slice(0, 1)}
                    </div>
                    <div>
                      <span>{user.fullName}</span>
                      <span className="block text-[10px] text-stone-400">عضویت: {user.createdAt}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {user.phone && <div className="text-slate-900 dark:text-white">{user.phone}</div>}
                    {user.email && <div className="text-[11px] text-stone-500">{user.email}</div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      {getRoleBadge(user.role, user.isSuperAdmin)}
                      <div className="text-[10px] text-stone-400">
                        {user.isSuperAdmin
                          ? 'دسترسی کامل به تمام ۱۴ بخش سیستم'
                          : `${user.allowedSections.length} بخش مجاز`}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {user.mustChangePassword ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                        نیازمند تغییر رمز اولیه ⚠️
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        رمز شخصی تنظیم‌شده ✓
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        user.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {user.isActive ? 'فعال ✓' : 'غیرفعال ✕'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setFormError('');
                          setIsPasswordModalOpen(true);
                        }}
                        title="تغییر رمز عبور"
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        title="حذف مدیر"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Admin */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 dark:border-emerald-900/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-emerald-900/40 pb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600 dark:text-[#d0de41]" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  تعریف مدیر جدید و تنظیم سطح دسترسی
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  نام و نام خانوادگی مدیر *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: علی رضایی"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    شماره موبایل
                  </label>
                  <input
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs text-left font-mono dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ایمیل سازمانی
                  </label>
                  <input
                    type="email"
                    placeholder="manager@moringa.ir"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs text-left font-mono dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  رمز عبور موقت اولیه (پیش‌فرض: @KamalGeraei990)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs font-mono dark:text-white"
                />
                <span className="text-[10px] text-stone-400 block mt-1">
                  کاربر پس از اولین ورود ملزم به تغییر این رمز به رمز اختصاصی خواهد بود.
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  نقش سازمانی
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                >
                  <option value="shop_manager">مدیر فروشگاه و سفارش‌ها (Shop Manager)</option>
                  <option value="content_editor">مدیر محتوا و مقالات (Content Editor)</option>
                  <option value="logistics_operator">مسئول مرسولات و انبارداری (Logistics)</option>
                  <option value="support_agent">پشتیبان مشتریان (Support Agent)</option>
                  <option value="super_admin">مدیر ارشد با اختیار کامل (Super Admin)</option>
                </select>
              </div>

              {newRole !== 'super_admin' && (
                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-stone-700 dark:text-stone-300">
                    بخش‌های مجاز برای این مدیر:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-stone-50 dark:bg-[#061410] p-3 rounded-2xl border border-stone-200 dark:border-emerald-900/40">
                    {ALL_ADMIN_SECTIONS.filter((s) => s.id !== 'access').map((sec) => (
                      <label
                        key={sec.id}
                        className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 dark:text-stone-300 font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={newSections.includes(sec.id)}
                          onChange={() => handleToggleSection(sec.id)}
                          className="rounded text-emerald-600"
                        />
                        <span>{sec.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#026251] hover:bg-[#014d3f] text-white text-xs font-bold shadow-md"
                >
                  ثبت مدیر جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Change Password */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 dark:border-emerald-900/60">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-emerald-900/40 pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600 dark:text-[#d0de41]" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  تغییر رمز عبور: {selectedUser.fullName}
                </h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  رمز عبور جدید *
                </label>
                <input
                  type="password"
                  required
                  placeholder="حداقل ۶ کاراکتر"
                  value={newCustomPass}
                  onChange={(e) => setNewCustomPass(e.target.value)}
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
                  placeholder="تکرار رمز جدید"
                  value={confirmCustomPass}
                  onChange={(e) => setConfirmCustomPass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#026251] hover:bg-[#014d3f] text-white text-xs font-bold shadow-md"
                >
                  ذخیره رمز جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
