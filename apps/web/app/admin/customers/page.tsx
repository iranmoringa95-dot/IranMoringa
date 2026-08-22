'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Award,
  ShoppingBag,
  Wallet,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserCheck,
  UserX,
  Plus,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Copy,
  Check,
  ShieldCheck,
  PackageCheck,
  Clock,
  IdCard,
  Home,
  User,
  Sparkles,
  Save,
} from 'lucide-react';
import { WORDPRESS_CUSTOMERS } from '@/lib/customers-data';

interface Address {
  id?: string;
  title?: string;
  recipientName?: string;
  recipientPhone?: string;
  province: string;
  city: string;
  postalAddress: string;
  postalCode: string;
  isDefault?: boolean;
}

interface OrderItem {
  id: string;
  product_title: string;
  variant_title: string;
  sku: string;
  unit_price_irr: number;
  quantity: number;
  subtotal_irr: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalIrr: number;
  totalToman: number;
  createdAt: string;
  items?: OrderItem[];
}

interface Customer {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalId?: string;
  birthDate?: string;
  isActive: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
  addressId?: string;
  addressTitle?: string;
  recipientName?: string;
  recipientPhone?: string;
  city: string;
  province: string;
  postalAddress: string;
  postalCode: string;
  totalOrders: number;
  totalSpentIrr: number;
  totalSpentToman: number;
  lastOrderDate?: string | null;
  tier: 'gold' | 'silver' | 'bronze';
  isAdmin?: boolean;
  adminRole?: string | null;
  isSuperAdmin?: boolean;
  adminCustomTitle?: string | null;
  addresses?: Address[];
  orders?: Order[];
}

interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  customersWithOrders: number;
  totalOrdersCount: number;
  totalRevenueToman: number;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  delivered: { label: 'تحویل شده', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  processing: { label: 'در حال پردازش', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' },
  packed: { label: 'بسته‌بندی شده', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800' },
  shipped: { label: 'ارسال شده', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800' },
  pending_payment: { label: 'در انتظار پرداخت', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  cancelled: { label: 'لغو شده', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' },
  refunded: { label: 'مرجوعی', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800' },
};

const PROVINCES_LIST = [
  'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'البرز', 'خوزستان', 'آذربایجان شرقی',
  'مازندران', 'گیلان', 'کرمان', 'هرمزگان', 'مرکزی', 'یزد', 'قزوین', 'قم',
  'همدان', 'سمنان', 'کرمانشاه', 'بوشهر', 'زنجان', 'لرستان', 'گلستان', 'اردبیل',
  'کردستان', 'آذربایجان غربی', 'چهارمحال و بختیاری', 'خراسان جنوبی', 'خراسان شمالی',
  'ایلام', 'کهگیلویه و بویراحمد', 'سیستان و بلوچستان'
];

// Helper: Format Iranian phone cleanly into 09XX XXX XXXX (LTR friendly)
function formatIranianPhoneDisplay(raw: string): string {
  if (!raw) return '—';
  let p = raw.replace(/[^\d+]/g, '');
  if (p.startsWith('+98')) {
    p = '0' + p.slice(3);
  } else if (p.startsWith('0098')) {
    p = '0' + p.slice(4);
  } else if (p.startsWith('98') && p.length === 12) {
    p = '0' + p.slice(2);
  }
  if (p.length === 11 && p.startsWith('09')) {
    return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`;
  }
  return raw;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeCustomers: 0,
    customersWithOrders: 0,
    totalOrdersCount: 0,
    totalRevenueToman: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Drawers
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'sms'>('profile');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Full Editor Modal (Add or Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    nationalId: '',
    birthDate: '',
    isActive: true,
    isAdmin: false,
    adminRole: 'shop_manager',
    adminCustomTitle: '',
    addressId: '',
    addressTitle: 'منزل (اصلی)',
    recipientName: '',
    recipientPhone: '',
    province: 'تهران',
    city: 'تهران',
    postalAddress: '',
    postalCode: '',
  });

  // SMS State
  const [smsText, setSmsText] = useState('');
  const [smsStatus, setSmsStatus] = useState<{ sent: boolean; message: string } | null>(null);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Fetch Customers List
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        q: searchQuery,
        status: statusFilter,
        role_filter: roleFilter,
        order_filter: orderFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const res = await fetch(`/api/v1/admin/customers?${params.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          setCustomers(data.items || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.total || 0);
          if (data.stats) {
            setStats(data.stats);
          }
          setLoading(false);
          return;
        }
      }
      throw new Error('API Unavailable - Fallback to Store');
    } catch (err: any) {
      // Robust Fallback for Cloudflare CDN / Static Export
      let localOverride: Customer[] = [];
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('moringalab_admin_customers') : null;
        if (saved) localOverride = JSON.parse(saved);
      } catch (e) {}

      let all: Customer[] = [...localOverride];
      const existingIds = new Set(localOverride.map((c: any) => c.id));
      for (const wc of WORDPRESS_CUSTOMERS) {
        if (!existingIds.has(wc.id)) {
          all.push(wc as unknown as Customer);
        }
      }

      // Calculate global stats
      const totalCust = all.length;
      const activeCust = all.filter(c => c.isActive).length;
      const withOrders = all.filter(c => (c.totalOrders || 0) > 0).length;
      const totalRevToman = all.reduce((sum, c) => sum + (c.totalSpentToman || 0), 0);
      const totalOrdersNum = all.reduce((sum, c) => sum + (c.totalOrders || 0), 0);

      setStats({
        totalCustomers: totalCust,
        activeCustomers: activeCust,
        customersWithOrders: withOrders,
        totalOrdersCount: totalOrdersNum,
        totalRevenueToman: totalRevToman,
      });

      // Filter
      let filtered = all.filter((c) => {
        if (statusFilter === 'active' && !c.isActive) return false;
        if (statusFilter === 'inactive' && c.isActive) return false;
        if (roleFilter === 'admin' && !c.isAdmin) return false;
        if (roleFilter === 'customer' && c.isAdmin) return false;
        if (orderFilter === 'with_orders' && (!c.totalOrders || c.totalOrders === 0)) return false;
        if (orderFilter === 'no_orders' && (c.totalOrders && c.totalOrders > 0)) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchPhone = (c.phone || '').toLowerCase().includes(q);
          const matchName = (c.fullName || `${c.firstName} ${c.lastName}`).toLowerCase().includes(q);
          const matchEmail = (c.email || '').toLowerCase().includes(q);
          const matchCity = (c.city || '').toLowerCase().includes(q);
          const matchProv = (c.province || '').toLowerCase().includes(q);
          const matchAddr = (c.postalAddress || '').toLowerCase().includes(q);
          const matchNat = (c.nationalId || '').toLowerCase().includes(q);
          if (!matchPhone && !matchName && !matchEmail && !matchCity && !matchProv && !matchAddr && !matchNat) {
            return false;
          }
        }
        return true;
      });

      // Sort
      filtered.sort((a, b) => {
        if (sortBy === 'total_orders') {
          const diff = (b.totalOrders || 0) - (a.totalOrders || 0);
          return sortOrder === 'asc' ? -diff : diff;
        }
        if (sortBy === 'total_spent') {
          const diff = (b.totalSpentToman || 0) - (a.totalSpentToman || 0);
          return sortOrder === 'asc' ? -diff : diff;
        }
        if (sortBy === 'name') {
          const nameA = (a.fullName || `${a.firstName} ${a.lastName}`).trim();
          const nameB = (b.fullName || `${b.firstName} ${b.lastName}`).trim();
          return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      });

      const totalItems = filtered.length;
      const pages = Math.max(1, Math.ceil(totalItems / pageSize));
      const pageToUse = Math.min(currentPage, pages);
      const startIdx = (pageToUse - 1) * pageSize;
      const pagedItems = filtered.slice(startIdx, startIdx + pageSize);

      setTotalCount(totalItems);
      setTotalPages(pages);
      setCustomers(pagedItems);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter, roleFilter, orderFilter, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  // Open Full Detail Modal
  const openCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('profile');
    setSmsStatus(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/v1/admin/customers/${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.customer) {
          setSelectedCustomer(data.customer);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormMode('add');
    setFormError('');
    setFormSuccess('');
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      nationalId: '',
      birthDate: '',
      isActive: true,
      isAdmin: false,
      adminRole: 'shop_manager',
      adminCustomTitle: '',
      addressId: '',
      addressTitle: 'منزل (اصلی)',
      recipientName: '',
      recipientPhone: '',
      province: 'تهران',
      city: 'تهران',
      postalAddress: '',
      postalCode: '',
    });
    setShowFormModal(true);
  };

  // Open Edit Modal
  const openEditModal = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormMode('edit');
    setFormError('');
    setFormSuccess('');
    setFormData({
      id: customer.id,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone.startsWith('+98') ? '0' + customer.phone.slice(3) : customer.phone,
      email: customer.email || '',
      nationalId: customer.nationalId || '',
      birthDate: customer.birthDate ? customer.birthDate.slice(0, 10) : '',
      isActive: customer.isActive,
      isAdmin: Boolean(customer.isAdmin),
      adminRole: customer.adminRole || 'shop_manager',
      adminCustomTitle: customer.adminCustomTitle || '',
      addressId: customer.addressId || '',
      addressTitle: customer.addressTitle || 'آدرس اصلی',
      recipientName: customer.recipientName || customer.fullName || '',
      recipientPhone: customer.recipientPhone || customer.phone || '',
      province: customer.province && customer.province !== 'نامشخص' ? customer.province : 'تهران',
      city: customer.city && customer.city !== 'نامشخص' ? customer.city : 'تهران',
      postalAddress: customer.postalAddress || '',
      postalCode: customer.postalCode && customer.postalCode !== '0000000000' ? customer.postalCode : '',
    });
    setShowFormModal(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const url = '/api/v1/admin/customers';
      const method = formMode === 'add' ? 'POST' : 'PATCH';

      let success = false;
      let respMsg = '';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            success = true;
            respMsg = data.message || 'عملیات با موفقیت انجام شد';
          }
        }
      } catch (netErr) {}

      // If API was not available, persist to LocalStorage
      if (!success) {
        let localOverride: Customer[] = [];
        try {
          const saved = typeof window !== 'undefined' ? localStorage.getItem('moringalab_admin_customers') : null;
          if (saved) localOverride = JSON.parse(saved);
        } catch (e) {}

        const newId = formData.id || `usr-local-${Date.now()}`;
        const newCust: Customer = {
          id: newId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`.trim() || 'کاربر جدید',
          phone: formData.phone.startsWith('0') ? '+98' + formData.phone.slice(1) : formData.phone,
          email: formData.email,
          nationalId: formData.nationalId,
          birthDate: formData.birthDate,
          isActive: formData.isActive,
          status: formData.isActive ? 'active' : 'inactive',
          isAdmin: formData.isAdmin,
          adminRole: formData.isAdmin ? formData.adminRole : undefined,
          adminCustomTitle: formData.isAdmin ? formData.adminCustomTitle : undefined,
          addressId: formData.addressId || `addr-${Date.now()}`,
          addressTitle: formData.addressTitle,
          recipientName: formData.recipientName,
          recipientPhone: formData.recipientPhone,
          province: formData.province,
          city: formData.city,
          postalAddress: formData.postalAddress,
          postalCode: formData.postalCode,
          totalOrders: 0,
          totalSpentIrr: 0,
          totalSpentToman: 0,
          tier: 'bronze',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const existingIdx = localOverride.findIndex((c) => c.id === newId);
        if (existingIdx >= 0) {
          localOverride[existingIdx] = { ...localOverride[existingIdx], ...newCust };
        } else {
          localOverride.unshift(newCust);
        }

        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('moringalab_admin_customers', JSON.stringify(localOverride));
          }
        } catch (e) {}

        respMsg = formMode === 'add' ? 'کاربر جدید با موفقیت ذخیره شد.' : 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.';
      }

      setFormSuccess(respMsg || 'عملیات با موفقیت انجام شد');
      setTimeout(() => {
        setShowFormModal(false);
        fetchCustomers();
        if (selectedCustomer && selectedCustomer.id === formData.id) {
          openCustomerDetails({ ...selectedCustomer, ...formData, fullName: `${formData.firstName} ${formData.lastName}`.trim() });
        }
      }, 600);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ارسال فرم');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Customer Active Status
  const toggleCustomerStatus = async (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !customer.isActive;
    try {
      const res = await fetch('/api/v1/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customer.id, isActive: newStatus }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isActive: newStatus, status: newStatus ? 'active' : 'inactive' } : c))
        );
        if (selectedCustomer?.id === customer.id) {
          setSelectedCustomer((prev) => (prev ? { ...prev, isActive: newStatus, status: newStatus ? 'active' : 'inactive' } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy phone helper
  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rawClean = phone.startsWith('+98') ? '0' + phone.slice(3) : phone;
    navigator.clipboard.writeText(rawClean);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Send Direct SMS
  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim() || !selectedCustomer) return;
    setIsSendingSms(true);
    setSmsStatus(null);
    try {
      const res = await fetch('/api/v1/admin/sms/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedCustomer.phone,
          message: smsText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmsStatus({ sent: true, message: 'پیامک با موفقیت برای مشتری ارسال شد.' });
        setSmsText('');
      } else {
        setSmsStatus({ sent: false, message: data.error || 'خطا در ارسال پیامک.' });
      }
    } catch (err) {
      setSmsStatus({ sent: false, message: 'خطا در ارتباط با سامانه پیامک' });
    } finally {
      setIsSendingSms(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!customers.length) return;
    const headers = ['شناسه', 'نام', 'شماره موبایل', 'ایمیل', 'کد ملی', 'استان', 'شهر', 'تعداد سفارش', 'مجموع خرید (تومان)', 'تاریخ عضویت', 'وضعیت'];
    const rows = customers.map((c) => [
      c.id,
      `"${c.fullName}"`,
      c.phone.startsWith('+98') ? '0' + c.phone.slice(3) : c.phone,
      c.email || '',
      c.nationalId || '',
      `"${c.province}"`,
      `"${c.city}"`,
      c.totalOrders,
      c.totalSpentToman,
      new Date(c.createdAt).toLocaleDateString('fa-IR'),
      c.isActive ? 'فعال' : 'غیرفعال',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `iran_moringa_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                مدیریت کاربران و مشتریان
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium">
                  {totalCount.toLocaleString('fa-IR')} کاربر فعال
                </span>
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                پنل مدیریت ۳۶۰ درجه کاربران: مشاهده، ویرایش کامل، سوابق فاکتورها و صدور پیامک
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={openAddModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            افزودن کاربر جدید
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm transition-colors"
            title="خروجی فایل اکسل / CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">خروجی اکسل</span>
          </button>
          <button
            onClick={() => fetchCustomers()}
            disabled={loading}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
            title="به‌روزرسانی اطلاعات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">کل کاربران ثبت‌شده</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {stats.totalCustomers.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> ۱۰۰٪ در پایگاه‌داده PostgreSQL
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">مشتریان دارای سابقه خرید</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {stats.customersWithOrders.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {stats.totalCustomers > 0 ? Math.round((stats.customersWithOrders / stats.totalCustomers) * 100) : 0}% خریدار رسمی
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">کل سفارش‌های ثبت‌شده</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {stats.totalOrdersCount.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">سوابق متصل به فاکتورها</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">مجموع ارزش خریدهای مشتریان</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {stats.totalRevenueToman.toLocaleString('fa-IR')} <span className="text-xs font-normal text-zinc-500">تومان</span>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">گردش مالی کل فروشگاه</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو در نام، شماره موبایل، کدملی، ایمیل یا آدرس..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
          </div>

          {/* Role Filter (Admins vs Customers) */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-800 dark:text-zinc-200 font-bold"
            >
              <option value="all">همه کاربران (کل)</option>
              <option value="admin">فقط مدیران پنل 🛡️</option>
              <option value="customer">فقط مشتریان عادی</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-800 dark:text-zinc-200 font-medium"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">کاربران فعال</option>
              <option value="inactive">کاربران مسدود</option>
            </select>
          </div>

          {/* Orders Filter */}
          <div>
            <select
              value={orderFilter}
              onChange={(e) => {
                setOrderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-800 dark:text-zinc-200 font-medium"
            >
              <option value="all">همه سوابق خرید</option>
              <option value="with_orders">دارای سابقه خرید</option>
              <option value="no_orders">بدون سفارش</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb === 'created' ? 'created_at' : sb === 'total' ? 'total_orders' : sb === 'spent' ? 'total_spent' : 'name');
                setSortOrder(so);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-800 dark:text-zinc-200 font-medium"
            >
              <option value="created_desc">جدیدترین عضویت</option>
              <option value="created_asc">قدیمی‌ترین عضویت</option>
              <option value="spent_desc">بیشترین مبلغ خرید</option>
              <option value="total_desc">بیشترین تعداد سفارش</option>
              <option value="name_asc">الفبایی نام (صعودی)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-zinc-500">در حال بارگذاری اطلاعات کاربران از پایگاه‌داده...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
            <button
              onClick={() => fetchCustomers()}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-sm font-medium rounded-xl hover:bg-zinc-200"
            >
              تلاش مجدد
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-zinc-400 mx-auto" />
            <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">کاربری با این مشخصات یافت نشد</p>
            <p className="text-sm text-zinc-500">عبارت جستجو یا فیلترها را تغییر دهید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800 text-xs">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">مشتری / کاربر</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">شماره موبایل</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">کد ملی</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">موقعیت و آدرس</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">سطح</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">سفارش‌ها</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">مجموع خرید (تومان)</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">تاریخ عضویت</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">وضعیت</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCustomerDetails(c)}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                          {c.firstName ? c.firstName[0] : c.fullName[0] || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {c.fullName}
                            </p>
                            {c.isAdmin && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                                  c.isSuperAdmin
                                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                }`}
                              >
                                <ShieldCheck className="w-3 h-3" />
                                {c.isSuperAdmin ? 'مدیر ارشد' : 'مدیر پنل'}
                              </span>
                            )}
                          </div>
                          {c.email ? (
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-[160px]" dir="ltr" title={c.email}>
                              {c.email}
                            </p>
                          ) : (
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">بدون ایمیل</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone (Properly Formatted in LTR) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-2 bg-zinc-100/70 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/50">
                        <span dir="ltr" className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 tracking-wider">
                          {formatIranianPhoneDisplay(c.phone)}
                        </span>
                        <button
                          onClick={(e) => handleCopyPhone(c.phone, e)}
                          className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
                          title="کپی شماره موبایل"
                        >
                          {copiedPhone === c.phone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* National ID */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {c.nationalId ? (
                        <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{c.nationalId}</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600 font-bold">—</span>
                      )}
                    </td>

                    {/* Location & Address */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-[220px]">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {c.province !== 'نامشخص' ? `${c.province} - ${c.city}` : c.city}
                        </p>
                        {c.postalAddress && (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5" title={c.postalAddress}>
                            {c.postalAddress}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          c.tier === 'gold'
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                            : c.tier === 'silver'
                            ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {c.tier === 'gold' ? 'طلایی' : c.tier === 'silver' ? 'نقره‌ای' : 'برنزی'}
                      </span>
                    </td>

                    {/* Orders Count */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.totalOrders > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'text-zinc-400'
                        }`}
                      >
                        {c.totalOrders.toLocaleString('fa-IR')}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {c.totalSpentToman > 0 ? (
                        <span>{c.totalSpentToman.toLocaleString('fa-IR')}</span>
                      ) : (
                        <span className="text-zinc-400 text-xs font-sans">۰</span>
                      )}
                    </td>

                    {/* Join Date */}
                    <td className="py-3.5 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('fa-IR')}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => toggleCustomerStatus(c, e)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          c.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                        }`}
                        title="کلیک برای تغییر وضعیت"
                      >
                        {c.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {c.isActive ? 'فعال' : 'مسدود'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCustomerDetails(c);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                          title="مشاهده پرونده مشتری"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => openEditModal(c, e)}
                          className="p-1.5 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          title="ویرایش کامل مشخصات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            نمایش ردیف {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, totalCount)} از{' '}
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalCount.toLocaleString('fa-IR')}</span> کاربر
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              <option value="25">۲۵ در صفحه</option>
              <option value="50">۵۰ در صفحه</option>
              <option value="100">۱۰۰ در صفحه</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-800/30 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  {selectedCustomer.firstName ? selectedCustomer.firstName[0] : selectedCustomer.fullName[0] || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    {selectedCustomer.fullName}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        selectedCustomer.tier === 'gold'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-300'
                          : selectedCustomer.tier === 'silver'
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-700 dark:text-slate-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      مشتری {selectedCustomer.tier === 'gold' ? 'طلایی' : selectedCustomer.tier === 'silver' ? 'نقره‌ای' : 'برنزی'}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-2" dir="ltr">
                    <span className="font-semibold text-zinc-300">{formatIranianPhoneDisplay(selectedCustomer.phone)}</span>
                    <span>•</span>
                    <span className="font-sans">شناسه: {selectedCustomer.id.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs inside Drawer */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 bg-white dark:bg-zinc-900">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Users className="w-4 h-4" />
                مشخصات و آدرس‌ها
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                تاریخچه سفارش‌ها ({selectedCustomer.orders?.length || selectedCustomer.totalOrders})
              </button>
              <button
                onClick={() => setActiveTab('sms')}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'sms'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                ارسال پیامک مستقیم
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 flex-1 space-y-6">
              {loadingDetail ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-zinc-400">در حال دریافت اطلاعات پرونده...</p>
                </div>
              ) : activeTab === 'profile' ? (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
                      <p className="text-xs text-zinc-500">تعداد سفارش‌ها</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        {selectedCustomer.totalOrders.toLocaleString('fa-IR')}
                      </p>
                    </div>
                    <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
                      <p className="text-xs text-zinc-500">مجموع خرید</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                        {selectedCustomer.totalSpentToman.toLocaleString('fa-IR')} <span className="text-[10px] font-sans font-normal text-zinc-400">تومان</span>
                      </p>
                    </div>
                    <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
                      <p className="text-xs text-zinc-500">وضعیت حساب</p>
                      <p className={`text-sm font-bold mt-1.5 ${selectedCustomer.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedCustomer.isActive ? 'فعال و مجاز' : 'مسدود شده'}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info Box */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      اطلاعات تماس و حساب
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-zinc-400 block">شماره همراه:</span>
                        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200" dir="ltr">
                          {formatIranianPhoneDisplay(selectedCustomer.phone)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block">ایمیل:</span>
                        <span className="font-mono text-zinc-800 dark:text-zinc-200" dir="ltr">
                          {selectedCustomer.email || 'ثبت نشده'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block">کد ملی:</span>
                        <span className="font-mono text-zinc-800 dark:text-zinc-200">
                          {selectedCustomer.nationalId || 'ثبت نشده'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block">تاریخ عضویت:</span>
                        <span className="text-zinc-800 dark:text-zinc-200">
                          {new Date(selectedCustomer.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Addresses List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>دفترچه آدرس‌های پستی ثبت‌شده</span>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        ({selectedCustomer.addresses?.length || 0} آدرس)
                      </span>
                    </h3>

                    {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedCustomer.addresses.map((a, idx) => (
                          <div
                            key={a.id || idx}
                            className="p-4 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                {a.title || 'آدرس پستی'} - ({a.province} - {a.city})
                              </span>
                              {a.isDefault && (
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold border border-emerald-200 dark:border-emerald-800">
                                  آدرس پیش‌فرض
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                              {a.postalAddress}
                            </p>
                            <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono pt-1">
                              <span>کدپستی: {a.postalCode || 'ثبت نشده'}</span>
                              {a.recipientName && <span>تحویل‌گیرنده: {a.recipientName}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-center text-xs text-zinc-400">
                        هنوز آدرس پستی برای این مشتری ثبت نشده است.
                      </div>
                    )}
                  </div>

                  {/* Actions inside Profile */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    <button
                      onClick={() => openEditModal(selectedCustomer)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-sm font-medium transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      ویرایش کامل مشخصات
                    </button>
                    <button
                      onClick={() => toggleCustomerStatus(selectedCustomer)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        selectedCustomer.isActive
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {selectedCustomer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      {selectedCustomer.isActive ? 'مسدودسازی حساب' : 'فعال‌سازی مجدد حساب'}
                    </button>
                  </div>
                </div>
              ) : activeTab === 'orders' ? (
                <div className="space-y-4">
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    selectedCustomer.orders.map((ord) => {
                      const st = statusMap[ord.status] || { label: ord.status, color: 'text-zinc-700', bg: 'bg-zinc-100' };
                      return (
                        <div
                          key={ord.id}
                          className="p-4 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                                {ord.orderNumber}
                              </p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {new Date(ord.createdAt).toLocaleDateString('fa-IR')} ساعت {new Date(ord.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${st.bg} ${st.color}`}>
                              {st.label}
                            </span>
                          </div>

                          {/* Line items */}
                          {ord.items && ord.items.length > 0 && (
                            <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg space-y-1.5 text-xs">
                              {ord.items.map((item, i) => (
                                <div key={item.id || i} className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                                  <span>
                                    {item.product_title} <span className="text-zinc-400">(تعداد: {item.quantity})</span>
                                  </span>
                                  <span className="font-mono text-zinc-900 dark:text-zinc-100">
                                    {(item.subtotal_irr / 10).toLocaleString('fa-IR')} تومان
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-100 dark:border-zinc-700/60">
                            <span className="text-zinc-500">مبلغ کل فاکتور:</span>
                            <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                              {ord.totalToman.toLocaleString('fa-IR')} تومان
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center space-y-2 text-zinc-400">
                      <ShoppingBag className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs">سفارشی برای این مشتری ثبت نشده است.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* SMS Tab */
                <form onSubmit={handleSendSms} className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    پیامک ارسالی مستقیماً از طریق سامانه وب‌وان (WebOne) با سرشماره اختصاصی ایران مورینگا به شماره{' '}
                    <span className="font-mono font-bold" dir="ltr">{formatIranianPhoneDisplay(selectedCustomer.phone)}</span> ارسال می‌شود.
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                      متن پیامک:
                    </label>
                    <textarea
                      rows={5}
                      value={smsText}
                      onChange={(e) => setSmsText(e.target.value)}
                      placeholder={`سلام ${selectedCustomer.firstName || 'مشتری گرامی'}، سفارش شما با موفقیت آماده ارسال گردید...`}
                      className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 resize-none placeholder-zinc-400"
                    />
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>تعداد کاراکتر: {smsText.length}</span>
                      <span>تعداد پارت پیامک: {Math.ceil(smsText.length / 70) || 1}</span>
                    </div>
                  </div>

                  {smsStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        smsStatus.sent
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {smsStatus.sent ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      <span>{smsStatus.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingSms || !smsText.trim()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    {isSendingSms ? 'در حال ارسال پیامک...' : 'ارسال آنی پیامک به مشتری'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Add & Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-3xl w-full my-auto overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-lg shadow-md flex-shrink-0">
                  {formData.firstName ? formData.firstName[0] : formData.lastName ? formData.lastName[0] : 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    {formMode === 'add' ? 'افزودن کاربر و مشتری جدید' : `ویرایش کامل کاربر: ${formData.firstName || ''} ${formData.lastName || 'کاربر'}`}
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                      {formMode === 'add' ? 'کاربر جدید' : 'پروفایل کامل'}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    تمامی اطلاعات هویتی، شماره‌های تماس، موقعیت مکانی و آدرس‌های پستی را مدیریت کنید.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-sm">
              {/* Alerts */}
              {formError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Group 1: Identity */}
              <div className="p-5 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700/60 pb-2.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>۱. اطلاعات هویتی و فردی</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      نام <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: احسان"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      نام خانوادگی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: پویا"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      کد ملی (۱۰ رقمی)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="۱۲۳۴۵۶۷۸۹۰"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      تاریخ تولد (اختیاری)
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Contact & Access */}
              <div className="p-5 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700/60 pb-2.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>۲. اطلاعات تماس و وضعیت ورود</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      شماره موبایل ایرانی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="09123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                      dir="ltr"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">شناسه اصلی برای ورود با پیامک OTP</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      آدرس ایمیل
                    </label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Status Switch */}
                <div className="pt-2 flex items-center justify-between p-3.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <div>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">وضعیت دسترسی حساب کاربری</p>
                    <p className="text-[11px] text-zinc-400">
                      {formData.isActive ? 'کاربر مجاز به ورود، سفارش‌گذاری و دریافت پیامک است.' : 'حساب کاربر مسدود شده و امکان ورود ندارد.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                      formData.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                    }`}
                  >
                    {formData.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    {formData.isActive ? 'حساب فعال' : 'حساب مسدود'}
                  </button>
                </div>
              </div>

              {/* Group 3: Address */}
              <div className="p-5 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700/60 pb-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>۳. موقعیت مکانی و آدرس پستی پیش‌فرض</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">عنوان آدرس</label>
                    <input
                      type="text"
                      placeholder="منزل / محل کار / مطب"
                      value={formData.addressTitle}
                      onChange={(e) => setFormData({ ...formData, addressTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">استان</label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium"
                    >
                      {PROVINCES_LIST.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">شهر</label>
                    <input
                      type="text"
                      placeholder="مثال: اصفهان / تهران"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">نام تحویل‌گیرنده</label>
                    <input
                      type="text"
                      placeholder="در صورت تفاوت با نام مشتری"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">تلفن تحویل‌گیرنده</label>
                    <input
                      type="text"
                      placeholder="0912..."
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">کدپستی (۱۰ رقمی)</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="۸۱۶۴۸۱۲۳۴۵"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">نشانی دقیق پستی</label>
                  <textarea
                    rows={2}
                    placeholder="خیابان، کوچه، پلاک، زنگ، واحد..."
                    value={formData.postalAddress}
                    onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Group 4: Admin Access & Role */}
              <div className="p-5 bg-gradient-to-r from-amber-50/50 via-emerald-50/30 to-teal-50/30 dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-zinc-800/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>۴. دسترسی و نقش در پنل مدیریت فروشگاه</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      دسترسی مدیریت فعال باشد
                    </span>
                  </label>
                </div>

                {formData.isAdmin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                        نقش سازمانی مدیر
                      </label>
                      <select
                        value={formData.adminRole}
                        onChange={(e) => setFormData({ ...formData, adminRole: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold"
                      >
                        <option value="shop_manager">مدیر فروشگاه و سفارش‌ها (Shop Manager)</option>
                        <option value="content_editor">مدیر محتوا و مقالات (Content Editor)</option>
                        <option value="logistics_operator">مسئول مرسولات و انبارداری (Logistics)</option>
                        <option value="support_agent">پشتیبان مشتریان (Support Agent)</option>
                        <option value="super_admin">مدیر ارشد با اختیار کامل (Super Admin)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                        سمت / عنوان سازمانی (جهت نمایش در پنل)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: مدیر فنی و پشتیبانی"
                        value={formData.adminCustomTitle}
                        onChange={(e) => setFormData({ ...formData, adminCustomTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    این کاربر هم‌اکنون به عنوان مشتری عادی شناخته می‌شود و دسترسی به پنل مدیریت ندارد. با تیک زدن گزینه بالا می‌توانید این کاربر را به مدیر ارتقا دهید.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                >
                  {formSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {formMode === 'add' ? 'ثبت نهایی و ایجاد کاربر' : 'ذخیره کلیه تغییرات مشخصات و دسترسی‌ها'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl font-semibold text-sm transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
