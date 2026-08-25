'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  KeyRound,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  getActiveAdminSession,
  clearAdminSession,
  changeAdminPassword,
  AdminUser,
} from '@/lib/admin-auth-store';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Desktop Sidebar Collapsed State
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Forced / Voluntary Password Change Modal States
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Load saved collapse state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('moringa_admin_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    } catch {}
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('moringa_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Auth checking & event listeners
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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen]);

  // Close mobile drawer on route changes
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(() => {
    clearAdminSession();
    router.replace('/login');
  }, [router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

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

    const success = await changeAdminPassword(session.id, newPass);
    if (success) {
      setSession(getActiveAdminSession());
      setPassSuccess('رمز عبور شما با موفقیت تغییر یافت.');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setIsChangePasswordModalOpen(false);
        setPassSuccess('');
      }, 1200);
    } else {
      setPassError('خطا در تغییر کلمه عبور. لطفا مجددا تلاش فرمایید.');
    }
  };

  if (!isLoaded || !session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 dir-rtl">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
            🌿
          </div>
          <p className="text-xs font-bold text-slate-300">
            در حال بررسی سطح دسترسی مدیریت و انتقال به صفحه ورود...
          </p>
        </div>
      </div>
    );
  }

  const isMandatoryPasswordChange = session.mustChangePassword;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#040f0c] flex flex-row dir-rtl transition-colors duration-200">
      {/* ── 1. DESKTOP SIDEBAR (Visible on lg+) ── */}
      <div className="hidden lg:block shrink-0">
        <AdminSidebar
          session={session}
          onLogout={handleLogout}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* ── 2. MOBILE DRAWER SIDEBAR (Visible when toggled on < lg) ── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <div className="relative z-50 h-full max-w-[88vw] animate-in slide-in-from-right duration-200">
            <AdminSidebar
              session={session}
              onLogout={handleLogout}
              onOpenChangePassword={() => {
                setIsMobileDrawerOpen(false);
                setIsChangePasswordModalOpen(true);
              }}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── 3. MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <AdminHeader
          session={session}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ── 4. MANDATORY / VOLUNTARY PASSWORD CHANGE MODAL ── */}
      {(isMandatoryPasswordChange || isChangePasswordModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-amber-300 dark:border-amber-800 relative animate-in zoom-in-95 duration-150">
            {!isMandatoryPasswordChange && (
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordModalOpen(false);
                  setPassError('');
                  setPassSuccess('');
                }}
                className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isMandatoryPasswordChange
                  ? 'الزام تغییر رمز عبور اولیه'
                  : 'تغییر کلمه عبور اختصاصی'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                مدیر گرامی ({session.fullName})؛ لطفاً رمز عبور اختصاصی خود را وارد نمایید.
              </p>
            </div>

            {passError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
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
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#061410] border border-stone-200 dark:border-emerald-900/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#026251] hover:bg-[#014d3f] text-white rounded-xl font-black text-xs shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                ثبت رمز عبور جدید
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
