'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  Heart,
  ShoppingBag,
  Gift,
  Settings,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  getCustomerProfile,
  getCustomerOrders,
  saveCustomerProfile,
  customerLogout,
  INITIAL_ORDERS,
  INITIAL_COUPONS,
  CustomerAddress,
  CustomerOrder,
  CustomerProfile,
} from '@/lib/customer-store';
import { isUserSuperAdmin, getActiveAdminSession } from '@/lib/admin-auth-store';

export default function CustomerAccountDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'coupons' | 'wishlist' | 'settings'>('overview');

  // Address Modal & Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    title: 'منزل',
    recipientName: 'احسان پویا',
    phone: '09132391843',
    province: 'اصفهان',
    city: 'اصفهان',
    postalCode: '',
    addressLine: '',
    isDefault: false,
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    fullName: 'احسان پویا',
    email: 'ehsan.pouya@moringalab.ir',
    phone: '09132391843',
    nationalCode: '1289456721',
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    const prof = getCustomerProfile();
    setProfile(prof);
    setOrders(getCustomerOrders());
    const admin = getActiveAdminSession();
    setIsAdmin(isUserSuperAdmin(prof.phone || '') || Boolean(admin));

    setSettingsForm({
      fullName: prof.fullName || 'احسان پویا',
      email: prof.email || 'ehsan.pouya@moringalab.ir',
      phone: prof.phone || '09132391843',
      nationalCode: prof.nationalCode || '1289456721',
    });

    const handleOrdersUpdate = () => {
      setOrders(getCustomerOrders());
    };
    window.addEventListener('moringa_orders_updated', handleOrdersUpdate);
    return () => {
      window.removeEventListener('moringa_orders_updated', handleOrdersUpdate);
    };
  }, []);

  const handleLogout = () => {
    customerLogout();
    router.push('/');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated = saveCustomerProfile({
      fullName: settingsForm.fullName,
      email: settingsForm.email,
      phone: settingsForm.phone,
      nationalCode: settingsForm.nationalCode,
    });
    setProfile(updated);
    setSaveSuccessMsg('اطلاعات حساب کاربری شما با موفقیت ذخیره گردید.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    let updatedAddresses = [...profile.addresses];

    if (editingAddressId) {
      // Edit existing
      updatedAddresses = updatedAddresses.map((a) =>
        a.id === editingAddressId
          ? { ...a, ...addressForm }
          : addressForm.isDefault
          ? { ...a, isDefault: false }
          : a
      );
    } else {
      // Create new
      const newAddr: CustomerAddress = {
        id: `addr-${Date.now()}`,
        ...addressForm,
      };
      if (newAddr.isDefault) {
        updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
      }
      updatedAddresses.push(newAddr);
    }

    const updated = saveCustomerProfile({ addresses: updatedAddresses });
    setProfile(updated);
    setShowAddressModal(false);
    setEditingAddressId(null);
  };

  const handleDeleteAddress = (id: string) => {
    if (!profile || !confirm('آیا از حذف این آدرس مطمئن هستید؟')) return;
    const updated = saveCustomerProfile({
      addresses: profile.addresses.filter((a) => a.id !== id),
    });
    setProfile(updated);
  };

  const handleSetDefaultAddress = (id: string) => {
    if (!profile) return;
    const updated = saveCustomerProfile({
      addresses: profile.addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    });
    setProfile(updated);
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 3000);
  };

  const defaultAddr = profile?.addresses.find((a) => a.isDefault) || profile?.addresses[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Top User Profile Header Banner ── */}
      <div className="bg-gradient-to-r from-[#024a3d] via-[#026251] to-[#01382e] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#d0de41] text-[#026251] flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shrink-0">
            {profile?.fullName ? profile.fullName.slice(0, 1) : 'اح'}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{profile?.fullName || 'احسان پویا'}</h1>
              <span className="px-2.5 py-0.5 bg-[#d0de41] text-[#026251] text-[11px] font-black rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                عضو طلایی
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/90 font-mono dir-ltr text-right">
              {profile?.phone || '09132391843'} • {profile?.email || 'ehsan.pouya@moringalab.ir'}
            </p>
            <p className="text-[11px] text-emerald-300/70">تاریخ عضویت در باشگاه سبزینه: {profile?.joinDate || '۱۴۰۴/۰۵/۱۲'}</p>
          </div>
        </div>

        {/* Action Counters */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl text-center border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-bold">سفارش‌ها</span>
            <span className="text-lg font-black text-white">{orders.length.toLocaleString('fa-IR')}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl text-center border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-bold">کیف پول</span>
            <span className="text-base sm:text-lg font-black text-[#d0de41]">۴۰۶ هزار ت</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl text-center border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-bold">کد تخفیف</span>
            <span className="text-lg font-black text-white">{INITIAL_COUPONS.length.toLocaleString('fa-IR')}</span>
          </div>
        </div>
      </div>

      {/* ── Admin Direct Access Notice ── */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-[#026251]/20 border border-amber-300 dark:border-amber-700/60 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>شما به عنوان مدیر ارشد (Super Admin) در سیستم شناخته شده‌اید</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-black">
                  دسترسی کامل
                </span>
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                جهت مدیریت کاتالوگ محصولات، سفارش‌ها، مرسولات پستچی، مقالات و سوابق امنیتی وارد پنل مدیریت شوید.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="px-5 py-2.5 bg-[#026251] hover:bg-[#014d3f] text-[#d0de41] rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md shrink-0 transition-all hover:scale-105"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ورود به پیشخوان مدیریت 🛡️</span>
          </Link>
        </div>
      )}

      {/* ── Main Dashboard Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Sidebar: Navigation Tabs ── */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-[#071d17] p-3 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#026251] text-white shadow-sm font-black'
                  : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>پیشخوان حساب</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#026251] text-white shadow-sm font-black'
                  : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>سفارش‌ها و سوابق خرید</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#d0de41] text-[#026251] font-black">
                {orders.length.toLocaleString('fa-IR')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                activeTab === 'addresses'
                  ? 'bg-[#026251] text-white shadow-sm font-black'
                  : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                <span>آدرس‌های من</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                activeTab === 'coupons'
                  ? 'bg-[#026251] text-white shadow-sm font-black'
                  : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4" />
                <span>کدهای تخفیف و جوایز</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#d0de41] text-[#026251] font-black">
                ۲
              </span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                activeTab === 'wishlist'
                  ? 'bg-[#026251] text-white shadow-sm font-black'
                  : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" />
                <span>لیست علاقه‌مندی‌ها</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#026251] text-white shadow-sm font-black'
                  : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>اطلاعات حساب و امنیت</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-70" />
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-emerald-900/40">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 p-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold transition-all text-right"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب</span>
              </button>
            </div>
          </div>

          {/* Quick Cart Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-[#026251] dark:text-[#d0de41] font-black text-xs">
              <ShoppingBag className="w-4 h-4" />
              <span>سبد خرید و سفارش آنلاین</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              ارسال مستقیم پودر و کپسول ارگانیک مورینگا با پست پیشتاز به سراسر کشور.
            </p>
            <Link
              href="/cart"
              className="inline-block w-full py-2 bg-[#026251] hover:bg-[#024a3d] text-white text-center rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              مشاهده و تسویه سبد خرید ←
            </Link>
          </div>
        </aside>

        {/* ── Right Content Area ── */}
        <main className="lg:col-span-9 space-y-6">
          {/* ─────────────────────────────────────────────────────────────
              TAB 1: OVERVIEW (پیشخوان حساب)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#071d17] p-5 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-[#d0de41]">
                    <span className="text-xs font-bold">آخرین وضعیت سفارش</span>
                    <Truck className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">ارسال شده با پستچی</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">کد رهگیری: POST-IR-9448102376</p>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-[11px] text-[#026251] dark:text-[#d0de41] font-bold hover:underline block pt-1"
                  >
                    پیگیری مرسوله ←
                  </button>
                </div>

                <div className="bg-white dark:bg-[#071d17] p-5 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#026251] dark:text-[#d0de41]">
                    <span className="text-xs font-bold">آدرس پیش‌فرض تحویل</span>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {defaultAddr ? `${defaultAddr.city} - ${defaultAddr.title}` : 'آدرسی ثبت نشده'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {defaultAddr?.addressLine || 'جهت افزودن آدرس کلیک فرمایید'}
                  </p>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className="text-[11px] text-[#026251] dark:text-[#d0de41] font-bold hover:underline block pt-1"
                  >
                    مدیریت آدرس‌ها ←
                  </button>
                </div>

                <div className="bg-white dark:bg-[#071d17] p-5 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                    <span className="text-xs font-bold">تخفیف ویژه در دسترس</span>
                    <Gift className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">کد تخفیف ۱۵٪ MORINGA15</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">معتبر برای تمامی سوپرفودها</p>
                  <button
                    onClick={() => setActiveTab('coupons')}
                    className="text-[11px] text-[#026251] dark:text-[#d0de41] font-bold hover:underline block pt-1"
                  >
                    مشاهده کدهای من ←
                  </button>
                </div>
              </div>

              {/* Recent Orders Overview Box */}
              <div className="bg-white dark:bg-[#071d17] p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-900/40 pb-4">
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <Package className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
                    <span>سفارش‌های اخیر شما</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#026251] dark:text-[#d0de41] font-bold hover:underline"
                  >
                    مشاهده همه سفارش‌ها ({orders.length.toLocaleString('fa-IR')}) ←
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.slice(0, 2).map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-emerald-900/40 bg-slate-50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{order.orderNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                            }`}
                          >
                            {order.statusLabel}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {order.createdAt} • {order.items.length} قلم کالا • ارسال با {order.shippingMethod}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {order.totalToman.toLocaleString('fa-IR')} تومان
                        </span>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="px-3 py-1.5 bg-white dark:bg-emerald-900/40 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-200 rounded-xl font-bold text-[11px] hover:bg-[#026251] hover:text-white transition-colors"
                        >
                          جزئیات
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: ORDERS (سفارش‌ها و سابقه خرید)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-[#071d17] p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-900/40 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">تاریخچه و سوابق سفارش‌های شما</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    شامل فاکتور، کد رهگیری پستی و وضعیت پردازش بسته‌های ارگانیک مورینگا
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-[#026251] dark:text-[#d0de41] rounded-xl text-xs font-black">
                  مجموع: {orders.length.toLocaleString('fa-IR')} سفارش
                </span>
              </div>

              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/50 dark:bg-emerald-950/20 space-y-4 text-xs"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-emerald-900/40 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          }`}
                        >
                          {order.statusLabel}
                        </span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{order.createdAt}</span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#061813] border border-slate-100 dark:border-emerald-900/30"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.variant} • تعداد: {item.quantity} عدد
                            </p>
                          </div>
                          <span className="font-black text-slate-900 dark:text-white">
                            {(item.priceToman * item.quantity).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Info & Tracking */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                        {order.trackingCode && (
                          <p className="flex items-center gap-1 font-mono">
                            <Truck className="w-3.5 h-3.5 text-[#026251] dark:text-[#d0de41]" />
                            <span>کد رهگیری پستی (پستچی): <strong>{order.trackingCode}</strong></span>
                          </p>
                        )}
                        <p>آدرس تحویل: {order.address.addressLine}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-[#026251] dark:text-[#d0de41]">
                          مبلغ کل: {order.totalToman.toLocaleString('fa-IR')} تومان
                        </span>
                        <button
                          onClick={() => alert(`فاکتور سفارش ${order.orderNumber} برای شماره شما پیامک شد.`)}
                          className="px-3 py-1.5 bg-[#026251] hover:bg-[#024a3d] text-white rounded-xl text-[11px] font-bold transition-all shadow-xs"
                        >
                          دریافت فاکتور
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: ADDRESSES (آدرس‌های من)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'addresses' && (
            <div className="bg-white dark:bg-[#071d17] p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-900/40 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">مدیریت آدرس‌های ارسال و تحویل</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    تعیین آدرس پیش‌فرض جهت تسویه‌حساب خودکار و سریع
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddressId(null);
                    setAddressForm({
                      title: 'منزل',
                      recipientName: profile?.fullName || 'احسان پویا',
                      phone: profile?.phone || '09132391843',
                      province: 'اصفهان',
                      city: 'اصفهان',
                      postalCode: '',
                      addressLine: '',
                      isDefault: false,
                    });
                    setShowAddressModal(true);
                  }}
                  className="px-4 py-2 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن آدرس جدید</span>
                </button>
              </div>

              {/* Address Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-5 rounded-3xl border transition-all space-y-3 relative ${
                      addr.isDefault
                        ? 'border-[#026251] dark:border-[#d0de41] bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-emerald-900/40 bg-white dark:bg-[#061813]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{addr.title}</span>
                      </div>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 bg-[#d0de41] text-[#026251] text-[10px] font-black rounded-full">
                          پیش‌فرض ارسال
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p><strong>گیرنده:</strong> {addr.recipientName} ({addr.phone})</p>
                      <p><strong>شهر:</strong> {addr.province}، {addr.city}</p>
                      <p><strong>آدرس:</strong> {addr.addressLine}</p>
                      {addr.postalCode && <p className="font-mono"><strong>کد پستی:</strong> {addr.postalCode}</p>}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-emerald-900/30 flex items-center justify-between text-xs">
                      {!addr.isDefault ? (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs text-[#026251] dark:text-[#d0de41] font-bold hover:underline"
                        >
                          انتخاب به‌عنوان پیش‌فرض
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          آدرس پیش‌فرض منتخب
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAddressId(addr.id);
                            setAddressForm({
                              title: addr.title,
                              recipientName: addr.recipientName,
                              phone: addr.phone,
                              province: addr.province,
                              city: addr.city,
                              postalCode: addr.postalCode,
                              addressLine: addr.addressLine,
                              isDefault: addr.isDefault,
                            });
                            setShowAddressModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                          title="ویرایش آدرس"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف آدرس"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 4: COUPONS (کدهای تخفیف و جوایز)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'coupons' && (
            <div className="bg-white dark:bg-[#071d17] p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white">کدهای تخفیف و پروموشن‌های فعال شما</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  کدها را کپی کرده و در مرحله تسویه‌حساب اعمال نمایید.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INITIAL_COUPONS.map((coupon) => (
                  <div
                    key={coupon.code}
                    className="p-5 rounded-3xl border-2 border-dashed border-[#026251]/40 dark:border-emerald-700/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-[#026251] dark:text-[#d0de41]">{coupon.title}</span>
                      <span className="px-2 py-0.5 bg-[#d0de41] text-[#026251] text-[10px] font-black rounded-md">
                        فعال
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      حداقل مبلغ سفارش: {coupon.minOrderToman.toLocaleString('fa-IR')} تومان • مهلت اعتبار: {coupon.expiresAt}
                    </p>

                    <div className="flex items-center justify-between bg-white dark:bg-[#061813] p-2.5 rounded-2xl border border-slate-200 dark:border-emerald-900/40">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{coupon.code}</span>
                      <button
                        onClick={() => copyCouponCode(coupon.code)}
                        className="px-3 py-1.5 bg-[#026251] hover:bg-[#024a3d] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        {copiedCoupon === coupon.code ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#d0de41]" />
                            <span>کپی شد!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>کپی کد</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 5: WISHLIST (علاقه‌مندی‌ها)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'wishlist' && (
            <div className="bg-white dark:bg-[#071d17] p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white">لیست علاقه‌مندی‌های شما</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  سوپرفودها و محصولات گیاهی نشان‌شده برای خریدهای آینده
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-3xl border border-slate-200 dark:border-emerald-900/40 bg-slate-50 dark:bg-emerald-950/20 space-y-3">
                  <div className="w-full h-32 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-4xl">
                    🌿
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">پودر خالص برگ مورینگا اولیفرا</h3>
                  <p className="text-xs font-black text-[#026251] dark:text-[#d0de41]">۲۹۵,۰۰۰ تومان</p>
                  <Link
                    href="/shop"
                    className="block w-full py-2 bg-[#026251] hover:bg-[#024a3d] text-white text-center text-xs font-bold rounded-xl transition-all"
                  >
                    افزودن به سبد خرید
                  </Link>
                </div>

                <div className="p-4 rounded-3xl border border-slate-200 dark:border-emerald-900/40 bg-slate-50 dark:bg-emerald-950/20 space-y-3">
                  <div className="w-full h-32 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-4xl">
                    🧴
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">روغن احیاکننده پوست و ضدچروک مورینگا</h3>
                  <p className="text-xs font-black text-[#026251] dark:text-[#d0de41]">۶۸۰,۰۰۰ تومان</p>
                  <Link
                    href="/shop"
                    className="block w-full py-2 bg-[#026251] hover:bg-[#024a3d] text-white text-center text-xs font-bold rounded-xl transition-all"
                  >
                    افزودن به سبد خرید
                  </Link>
                </div>

                <div className="p-4 rounded-3xl border border-slate-200 dark:border-emerald-900/40 bg-slate-50 dark:bg-emerald-950/20 space-y-3">
                  <div className="w-full h-32 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-4xl">
                    💊
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">کپسول عصاره استانداردشده مورینگا</h3>
                  <p className="text-xs font-black text-[#026251] dark:text-[#d0de41]">۶۰۰,۰۰۰ تومان</p>
                  <Link
                    href="/shop"
                    className="block w-full py-2 bg-[#026251] hover:bg-[#024a3d] text-white text-center text-xs font-bold rounded-xl transition-all"
                  >
                    افزودن به سبد خرید
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 6: SETTINGS (اطلاعات حساب و امنیت)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#071d17] p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/60 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white">اطلاعات حساب کاربری و تماس</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ویرایش نام، کد ملی و مشخصات دریافت فاکتور
                </p>
              </div>

              {saveSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#d0de41]" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">نام و نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.fullName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, fullName: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">کد ملی (جهت صدور فاکتور رسمی)</label>
                    <input
                      type="text"
                      value={settingsForm.nationalCode}
                      onChange={(e) => setSettingsForm({ ...settingsForm, nationalCode: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl font-mono text-left dir-ltr text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">شماره موبایل (تاییدشده با OTP)</label>
                    <input
                      type="text"
                      disabled
                      value={settingsForm.phone}
                      className="w-full p-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-left dir-ltr text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">آدرس ایمیل</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl font-mono text-left dir-ltr text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl font-black text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>ذخیره تغییرات حساب</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ── Address Add/Edit Modal ── */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#071d17] p-6 rounded-3xl max-w-lg w-full space-y-4 animate-in fade-in duration-150 border border-slate-200 dark:border-emerald-900/60 shadow-2xl">
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {editingAddressId ? 'ویرایش آدرس تحویل' : 'افزودن آدرس جدید'}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان آدرس (مثال: منزل)</label>
                  <input
                    type="text"
                    required
                    value={addressForm.title}
                    onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام گیرنده</label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">استان</label>
                  <input
                    type="text"
                    required
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شهر</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">کد پستی (۱۰ رقمی)</label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl font-mono text-left dir-ltr text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نشانی دقیق پستی</label>
                <textarea
                  rows={2}
                  required
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#061813] border border-slate-300 dark:border-emerald-900/40 rounded-xl text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-[#026251] focus:ring-[#026251]"
                />
                <span>تعیین به‌عنوان آدرس پیش‌فرض ارسال</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#026251] hover:bg-[#024a3d] text-white rounded-xl font-bold transition-all shadow-md"
                >
                  ذخیره آدرس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
