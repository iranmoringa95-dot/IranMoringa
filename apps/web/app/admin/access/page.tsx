'use client';

import { useState, useEffect, useCallback } from 'react';
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
  UserCheck,
  UserX,
  RefreshCw,
  Eye,
  EyeOff,
  UserCog,
  Save,
  Check,
} from 'lucide-react';
import {
  AdminUser,
  AdminRole,
  ALL_ADMIN_SECTIONS,
  getActiveAdminSession,
  saveAdminUsers,
} from '@/lib/admin-auth-store';

interface SearchedUser {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  isAdmin: boolean;
  adminRole: string | null;
  isSuperAdmin: boolean;
}

export default function AdminAccessControlPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSession, setActiveSession] = useState<AdminUser | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Add Admin Mode: 'existing' (from users) vs 'new' (create new user)
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedExistingUser, setSelectedExistingUser] = useState<SearchedUser | null>(null);

  // New Admin Form State
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCustomTitle, setNewCustomTitle] = useState('');
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

  // Edit Admin Form State
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editCustomTitle, setEditCustomTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('shop_manager');
  const [editSections, setEditSections] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');

  // Password Change State
  const [newCustomPass, setNewCustomPass] = useState('');
  const [confirmCustomPass, setConfirmCustomPass] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Admins from API / PostgreSQL
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/admin/access');
      if (!res.ok) {
        throw new Error('خطا در دریافت لیست مدیران از پایگاه‌داده');
      }
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setAdminUsers(data.items);
        saveAdminUsers(data.items);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'خطا در برقراری ارتباط با پایگاه‌داده');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
    setActiveSession(getActiveAdminSession());
  }, [fetchAdmins]);

  // Search existing users in DB for promotion
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(
          `/api/v1/admin/access/search-users?q=${encodeURIComponent(userSearchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Handlers for Add Form Sections
  const handleToggleNewSection = (sectionId: string) => {
    if (newSections.includes(sectionId)) {
      setNewSections(newSections.filter((s) => s !== sectionId));
    } else {
      setNewSections([...newSections, sectionId]);
    }
  };

  const handleSelectAllNewSections = () => {
    setNewSections(ALL_ADMIN_SECTIONS.map((s) => s.id));
  };

  const handleDeselectAllNewSections = () => {
    setNewSections([]);
  };

  // Handlers for Edit Form Sections
  const handleToggleEditSection = (sectionId: string) => {
    if (editSections.includes(sectionId)) {
      setEditSections(editSections.filter((s) => s !== sectionId));
    } else {
      setEditSections([...editSections, sectionId]);
    }
  };

  const handleSelectAllEditSections = () => {
    setEditSections(ALL_ADMIN_SECTIONS.map((s) => s.id));
  };

  const handleDeselectAllEditSections = () => {
    setEditSections([]);
  };

  // Open Edit Modal
  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditCustomTitle(user.customTitle || user.fullName || '');
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditRole(user.role);
    setEditSections(
      user.isSuperAdmin ? ALL_ADMIN_SECTIONS.map((s) => s.id) : user.allowedSections || []
    );
    setEditIsActive(user.isActive);
    setEditPassword('');
    setFormError('');
    setFormSuccess('');
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const openAddModal = () => {
    setAddMode('existing');
    setSelectedExistingUser(null);
    setUserSearchQuery('');
    setSearchResults([]);
    setNewFirstName('');
    setNewLastName('');
    setNewCustomTitle('');
    setNewPhone('');
    setNewEmail('');
    setNewPassword('@KamalGeraei990');
    setNewRole('shop_manager');
    setNewSections(['products', 'orders', 'inventory', 'postchi']);
    setFormError('');
    setFormSuccess('');
    setIsAddModalOpen(true);
  };

  // Submit Edit Admin Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        id: selectedUser.id,
        userId: selectedUser.userId || selectedUser.id,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        customTitle: editCustomTitle.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        allowedSections: editRole === 'super_admin' ? ALL_ADMIN_SECTIONS.map((s) => s.id) : editSections,
        isActive: editIsActive,
        password: editPassword.trim() ? editPassword.trim() : undefined,
      };

      const res = await fetch('/api/v1/admin/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'خطا در ویرایش اطلاعات مدیر');
      }

      setFormSuccess(data.message || 'مشخصات مدیر با موفقیت به‌روزرسانی شد.');
      setTimeout(() => {
        setIsEditModalOpen(false);
        fetchAdmins();
      }, 500);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ویرایش مدیر');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Add Admin Form
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      let payload: any = {};

      if (addMode === 'existing') {
        if (!selectedExistingUser) {
          throw new Error('لطفاً ابتدا یک کاربر را از لیست جستجو انتخاب فرمایید.');
        }
        payload = {
          userId: selectedExistingUser.id,
          firstName: newFirstName.trim() || selectedExistingUser.firstName,
          lastName: newLastName.trim() || selectedExistingUser.lastName,
          customTitle: newCustomTitle.trim() || `${newFirstName || selectedExistingUser.firstName} ${newLastName || selectedExistingUser.lastName}`.trim(),
          phone: selectedExistingUser.phone,
          email: selectedExistingUser.email,
          role: newRole,
          allowedSections: newRole === 'super_admin' ? ALL_ADMIN_SECTIONS.map((s) => s.id) : newSections,
          password: newPassword.trim(),
          mustChangePassword: true,
          isActive: true,
        };
      } else {
        if (!newFirstName.trim() && !newLastName.trim()) {
          throw new Error('نام و نام خانوادگی مدیر الزامی است.');
        }
        if (!newPhone.trim() && !newEmail.trim()) {
          throw new Error('حداقل شماره موبایل یا ایمیل سازمانی مدیر را وارد کنید.');
        }
        if (newPassword.length < 6) {
          throw new Error('رمز عبور موقت باید حداقل ۶ کاراکتر باشد.');
        }

        payload = {
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          customTitle: newCustomTitle.trim() || `${newFirstName} ${newLastName}`.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          allowedSections: newRole === 'super_admin' ? ALL_ADMIN_SECTIONS.map((s) => s.id) : newSections,
          password: newPassword.trim(),
          mustChangePassword: true,
          isActive: true,
        };
      }

      const res = await fetch('/api/v1/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'خطا در ثبت دسترسی مدیر');
      }

      setFormSuccess(data.message || 'مدیر جدید با موفقیت ثبت شد.');
      setTimeout(() => {
        setIsAddModalOpen(false);
        fetchAdmins();
      }, 500);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت مدیر جدید');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (user: AdminUser) => {
    if (user.phone === '09132391843' || user.phone === '+989132391843' || user.email === 'pqehsan@gmail.com') {
      alert('امکان غیرفعال‌سازی حساب مدیر ارشد اصلی وجود ندارد.');
      return;
    }

    try {
      const res = await fetch('/api/v1/admin/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      if (res.ok) {
        setAdminUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Revoke / Delete Admin Role
  const handleDeleteUser = async (user: AdminUser) => {
    if (user.phone === '09132391843' || user.phone === '+989132391843' || user.email === 'pqehsan@gmail.com') {
      alert('امکان حذف یا لغو دسترسی مدیر ارشد اصلی سیستم وجود ندارد.');
      return;
    }

    if (
      confirm(
        `آیا از لغو دسترسی مدیریت کاربر «${user.fullName || user.customTitle}» اطمینان دارید؟\nاین کاربر به سطح مشتری عادی تغییر خواهد کرد.`
      )
    ) {
      try {
        const res = await fetch(`/api/v1/admin/access?id=${user.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          setAdminUsers((prev) => prev.filter((u) => u.id !== user.id));
          setFormSuccess('دسترسی مدیریت با موفقیت لغو گردید.');
        } else {
          alert(data.error || 'خطا در لغو دسترسی مدیریت');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Submit Change Password Form
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
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

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/access/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, newPassword: newCustomPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در تغییر رمز عبور');
      }

      setFormSuccess(`رمز عبور مدیر «${selectedUser.fullName}» با موفقیت در پایگاه‌داده ذخیره شد.`);
      setIsPasswordModalOpen(false);
      setNewCustomPass('');
      setConfirmCustomPass('');
      fetchAdmins();
    } catch (err: any) {
      setFormError(err.message || 'خطا در ذخیره‌سازی رمز عبور');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = adminUsers.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.customTitle && u.customTitle.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.includes(q))
    );
  });

  const getRoleBadge = (role: AdminRole, isSuper: boolean) => {
    if (isSuper || role === 'super_admin') {
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
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-800">
            مدیر فروشگاه و سفارش‌ها
          </span>
        );
      case 'content_editor':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-300 dark:border-blue-800">
            مدیر محتوا و مقالات
          </span>
        );
      case 'logistics_operator':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-full text-xs font-bold border border-purple-300 dark:border-purple-800">
            مسئول مرسولات و انبارداری
          </span>
        );
      case 'support_agent':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-700">
            پشتیبان و پاسخگوی مشتریان
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">مدیر سیستم</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#091f18] p-6 rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#026251] dark:text-[#d0de41] shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                مدیریت سطوح دسترسی و مدیران پنل
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold">
                  متصل به پایگاه‌داده کاربران PostgreSQL 🐘
                </span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                ویرایش نام و مشخصات مدیران، تبدیل کاربران سایت به مدیر و تنظیم دقیق مجوزهای دسترسی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-[#026251] hover:bg-[#014d3f] text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>افزودن مدیر جدید</span>
          </button>
          <button
            onClick={() => fetchAdmins()}
            disabled={loading}
            className="p-3 bg-stone-100 dark:bg-[#061410] hover:bg-stone-200 dark:hover:bg-[#0d2a21] text-stone-700 dark:text-stone-300 rounded-2xl transition-colors disabled:opacity-50"
            title="به‌روزرسانی اطلاعات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold">{formSuccess}</span>
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
          <span>مدیران ارشد رسمی متصل به پایگاه‌داده (Super Admins):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-700 dark:text-stone-300 pt-1">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#061410] border border-stone-200/80 dark:border-emerald-900/40">
            <span className="font-bold block text-slate-900 dark:text-white">شماره ۱: ۰۹۱۳۲۳۹۱۸۴۳</span>
            <span className="text-[11px] text-stone-500">احسان پویا (دسترسی کامل)</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#061410] border border-stone-200/80 dark:border-emerald-900/40">
            <span className="font-bold block text-slate-900 dark:text-white">شماره ۲: ۰۹۱۷۵۹۲۹۳۴۵</span>
            <span className="text-[11px] text-stone-500">مدیریت عملیات و مزرعه</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#061410] border border-stone-200/80 dark:border-emerald-900/40">
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
            placeholder="جستجو در نام، سمت، شماره موبایل، ایمیل یا نقش..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-[#091f18] border border-stone-200 dark:border-emerald-900/60 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400 font-bold">
          تعداد کل مدیران: {adminUsers.length} نفر (متصل به جدول کاربران)
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white dark:bg-[#091f18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-stone-500">در حال دریافت اطلاعات مدیران از پایگاه‌داده...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600">{error}</p>
            <button
              onClick={() => fetchAdmins()}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-xs rounded-xl font-bold"
            >
              تلاش مجدد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 dark:bg-[#061410] text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-emerald-900/40">
                <tr>
                  <th className="py-3.5 px-4 font-bold">نام، سمت و مشخصات مدیر</th>
                  <th className="py-3.5 px-4 font-bold">شماره موبایل / ایمیل</th>
                  <th className="py-3.5 px-4 font-bold">نقش و اختیارات سازمانی</th>
                  <th className="py-3.5 px-4 font-bold">وضعیت رمز عبور</th>
                  <th className="py-3.5 px-4 font-bold text-center">وضعیت حساب</th>
                  <th className="py-3.5 px-4 font-bold text-center">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-emerald-900/30 text-stone-800 dark:text-stone-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/70 dark:hover:bg-[#0d2a21]/50 transition-colors">
                    {/* Name & Title */}
                    <td className="py-3.5 px-4 font-bold">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                          {user.firstName ? user.firstName.slice(0, 1) : user.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 dark:text-white font-black text-sm">
                              {user.fullName || user.customTitle}
                            </span>
                            {user.customTitle && user.customTitle !== user.fullName && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-normal">
                                ({user.customTitle})
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-stone-400 font-normal mt-0.5">
                            عضویت: {user.createdAt}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3.5 px-4 font-mono">
                      {user.phone ? (
                        <div className="text-slate-900 dark:text-white font-bold" dir="ltr">
                          {user.phone}
                        </div>
                      ) : null}
                      {user.email && <div className="text-[11px] text-stone-500 font-normal" dir="ltr">{user.email}</div>}
                    </td>

                    {/* Role & Sections */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {getRoleBadge(user.role, user.isSuperAdmin)}
                        <div className="text-[10px] text-stone-400">
                          {user.isSuperAdmin || user.role === 'super_admin'
                            ? 'دسترسی کامل به تمام ۱۴ بخش سیستم'
                            : `${(user.allowedSections || []).length} بخش از ۱۴ بخش مجاز`}
                        </div>
                      </div>
                    </td>

                    {/* Password Status */}
                    <td className="py-3.5 px-4">
                      {user.mustChangePassword ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold inline-flex items-center gap-1">
                          <span>نیازمند تغییر رمز موقت ⚠️</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>رمز شخصی تنظیم‌شده ✓</span>
                        </span>
                      )}
                    </td>

                    {/* Account Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-300 dark:border-stone-700'
                        }`}
                        title="کلیک برای فعال یا غیرفعال‌سازی حساب"
                      >
                        {user.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        <span>{user.isActive ? 'فعال ✓' : 'غیرفعال ✕'}</span>
                      </button>
                    </td>

                    {/* Actions: Edit, Password, Revoke */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(user)}
                          title="ویرایش مشخصات و دسترسی‌های مدیر"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-[#026251] dark:text-[#d0de41] transition-all font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">ویرایش</span>
                        </button>

                        {/* Password Key */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormError('');
                            setNewCustomPass('');
                            setConfirmCustomPass('');
                            setIsPasswordModalOpen(true);
                          }}
                          title="تغییر رمز عبور"
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete / Revoke */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          title="لغو دسترسی مدیریت کاربر"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: EDIT ADMIN (ویرایش کامل مدیر)
          ───────────────────────────────────────────────────────────── */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 dark:border-emerald-900/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-emerald-900/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-[#026251] dark:text-[#d0de41] rounded-xl">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    ویرایش مشخصات و سطح دسترسی مدیر
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    شناسه کاربری: <span className="font-mono">{selectedUser.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Row 1: First Name, Last Name, Custom Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    نام
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: احسان"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    نام خانوادگی
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: پویا"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    عنوان / سمت سازمانی
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: مدیریت عملیات و مزرعه"
                    value={editCustomTitle}
                    onChange={(e) => setEditCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    شماره موبایل
                  </label>
                  <input
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs text-left font-mono font-bold dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ایمیل سازمانی
                  </label>
                  <input
                    type="email"
                    placeholder="manager@moringa.ir"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs text-left font-mono dark:text-white"
                  />
                </div>
              </div>

              {/* Row 3: Role Selector & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    نقش سازمانی مدیر
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                  >
                    <option value="shop_manager">مدیر فروشگاه و سفارش‌ها (Shop Manager)</option>
                    <option value="content_editor">مدیر محتوا و مقالات (Content Editor)</option>
                    <option value="logistics_operator">مسئول مرسولات و انبارداری (Logistics)</option>
                    <option value="support_agent">پشتیبان مشتریان (Support Agent)</option>
                    <option value="super_admin">مدیر ارشد با اختیار کامل (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    وضعیت حساب کاربری
                  </label>
                  <select
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                  >
                    <option value="active">فعال (دارای مجوز ورود)</option>
                    <option value="inactive">غیرفعال / مسدود</option>
                  </select>
                </div>
              </div>

              {/* Optional Password Update */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  تغییر رمز عبور (در صورت نیاز به رمز جدید وارد کنید)
                </label>
                <input
                  type="text"
                  placeholder="حداقل ۶ کاراکتر (اختیاری)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs font-mono dark:text-white"
                />
              </div>

              {/* Allowed Sections Selection */}
              {editRole !== 'super_admin' ? (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      بخش‌های مجاز در پنل برای این مدیر:
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={handleSelectAllEditSections}
                        className="text-emerald-600 dark:text-[#d0de41] font-bold hover:underline"
                      >
                        انتخاب همه
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllEditSections}
                        className="text-stone-400 hover:underline"
                      >
                        لغو همه
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-stone-50 dark:bg-[#061410] p-3 rounded-2xl border border-stone-200 dark:border-emerald-900/40">
                    {ALL_ADMIN_SECTIONS.filter((s) => s.id !== 'access').map((sec) => (
                      <label
                        key={sec.id}
                        className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 dark:text-stone-300 font-medium hover:text-emerald-600"
                      >
                        <input
                          type="checkbox"
                          checked={editSections.includes(sec.id)}
                          onChange={() => handleToggleEditSection(sec.id)}
                          className="rounded text-emerald-600"
                        />
                        <span>{sec.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>مدیر ارشد کل به تمامی ۱۴ بخش پنل دسترسی کامل دارد.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#026251] hover:bg-[#014d3f] text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>ذخیره تغییرات مدیر</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: ADD NEW ADMIN (افزودن مدیر جدید / ارتقای کاربر)
          ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 dark:border-emerald-900/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-emerald-900/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-[#026251] dark:text-[#d0de41] rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    افزودن مدیر جدید یا ارتقای کاربر به مدیر
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    امکان انتخاب از میان کاربران موجود سایت یا ثبت مشخصات کاربر جدید
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-stone-100 dark:bg-[#061410] p-1.5 rounded-2xl border border-stone-200 dark:border-emerald-900/40 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAddMode('existing');
                  setFormError('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  addMode === 'existing'
                    ? 'bg-[#026251] text-white shadow-md'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>۱. انتخاب از بین کاربران موجود (پیشنهادی)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMode('new');
                  setFormError('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  addMode === 'new'
                    ? 'bg-[#026251] text-white shadow-md'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>۲. ایجاد کاربر و مدیر جدید</span>
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              {/* Option 1: Pick from existing users */}
              {addMode === 'existing' && (
                <div className="space-y-3 p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
                  <label className="block font-bold text-stone-800 dark:text-stone-200">
                    جستجو و انتخاب کاربر از پایگاه‌داده:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="نام، شماره موبایل یا ایمیل کاربر مورد نظر را تایپ کنید..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-[#061410] border border-stone-300 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                    />
                    {searchingUsers && (
                      <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin absolute left-3.5 top-3" />
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && !selectedExistingUser && (
                    <div className="max-h-48 overflow-y-auto space-y-1 bg-white dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 p-2 rounded-2xl shadow-lg">
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedExistingUser(u);
                            setNewFirstName(u.firstName || '');
                            setNewLastName(u.lastName || '');
                            setNewPhone(u.phone || '');
                            setNewEmail(u.email || '');
                            setNewCustomTitle(u.fullName || '');
                          }}
                          className="p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{u.fullName}</span>
                            <span className="text-stone-400 font-mono text-[11px] mr-2">({u.phone})</span>
                          </div>
                          {u.isAdmin ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold">
                              از قبل مدیر است ({u.adminRole})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                              مشتری عادی
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected User Banner */}
                  {selectedExistingUser && (
                    <div className="p-3 bg-white dark:bg-[#061410] rounded-2xl border border-emerald-300 dark:border-emerald-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedExistingUser.fullName}
                          </span>
                          <span className="text-stone-500 font-mono text-[11px] mr-2">
                            ({selectedExistingUser.phone} {selectedExistingUser.email ? `• ${selectedExistingUser.email}` : ''})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedExistingUser(null)}
                        className="text-stone-400 hover:text-rose-600 text-xs font-bold"
                      >
                        تغییر انتخاب ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Option 2 or Shared User Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    نام *
                  </label>
                  <input
                    type="text"
                    required={addMode === 'new'}
                    placeholder="مثال: احسان"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    نام خانوادگی
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: پویا"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    عنوان / سمت سازمانی
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: مدیر بازرگانی"
                    value={newCustomTitle}
                    onChange={(e) => setNewCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white"
                  />
                </div>
              </div>

              {addMode === 'new' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      شماره موبایل *
                    </label>
                    <input
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs text-left font-mono font-bold dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      ایمیل سازمانی
                    </label>
                    <input
                      type="email"
                      placeholder="admin@iran-moringa.ir"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs text-left font-mono dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  رمز عبور اولیه / موقت (پیش‌فرض: @KamalGeraei990)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs font-mono dark:text-white"
                />
                <span className="text-[10px] text-stone-400 block mt-1">
                  کاربر با این رمز عبور موقت یا با ارسال کد پیامکی OTP می‌تواند وارد پنل شود.
                </span>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  نقش سازمانی و سطح دسترسی
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-bold"
                >
                  <option value="shop_manager">مدیر فروشگاه و سفارش‌ها (Shop Manager)</option>
                  <option value="content_editor">مدیر محتوا و مقالات (Content Editor)</option>
                  <option value="logistics_operator">مسئول مرسولات و انبارداری (Logistics)</option>
                  <option value="support_agent">پشتیبان مشتریان (Support Agent)</option>
                  <option value="super_admin">مدیر ارشد با اختیار کامل (Super Admin)</option>
                </select>
              </div>

              {/* Sections Selection */}
              {newRole !== 'super_admin' ? (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      بخش‌های مجاز در پنل:
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={handleSelectAllNewSections}
                        className="text-emerald-600 dark:text-[#d0de41] font-bold hover:underline"
                      >
                        انتخاب همه
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllNewSections}
                        className="text-stone-400 hover:underline"
                      >
                        لغو همه
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-stone-50 dark:bg-[#061410] p-3 rounded-2xl border border-stone-200 dark:border-emerald-900/40">
                    {ALL_ADMIN_SECTIONS.filter((s) => s.id !== 'access').map((sec) => (
                      <label
                        key={sec.id}
                        className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 dark:text-stone-300 font-medium hover:text-emerald-600"
                      >
                        <input
                          type="checkbox"
                          checked={newSections.includes(sec.id)}
                          onChange={() => handleToggleNewSection(sec.id)}
                          className="rounded text-emerald-600"
                        />
                        <span>{sec.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>مدیر ارشد کل به تمامی ۱۴ بخش سیستم دسترسی کامل دارد.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#026251] hover:bg-[#014d3f] text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>ثبت دسترسی مدیر</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: CHANGE PASSWORD (تغییر رمز عبور)
          ───────────────────────────────────────────────────────────── */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 dark:border-emerald-900/60">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-emerald-900/40 pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600 dark:text-[#d0de41]" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  تغییر رمز عبور: {selectedUser.fullName || selectedUser.customTitle}
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
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-mono"
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
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs dark:text-white font-mono"
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
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#026251] hover:bg-[#014d3f] text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>ذخیره رمز جدید در پایگاه‌داده</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
