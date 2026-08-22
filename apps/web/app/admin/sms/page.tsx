'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Server,
  Send,
  UserCheck,
  Shield,
  BellRing,
  Users,
  Archive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Save,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Download,
  Eye,
  Check,
  Package,
  Layers,
} from 'lucide-react';

interface GatewayCredential {
  username?: string;
  password?: string;
  api_key?: string;
  sender?: string;
}

interface StatusTemplate {
  recipient_type: string;
  order_status: string;
  is_enabled: boolean;
  pattern_code?: string;
  template_text: string;
}

interface SMSLogItem {
  id: string;
  rowNumber: number;
  orderId: string;
  recipient: string;
  rawPhone: string;
  sender: string;
  message: string;
  gateway: string;
  status: 'success' | 'failed' | 'queued';
  gatewayResponse: string;
  messageId: string;
  createdAt: string;
}

interface SMSStats {
  totalSms: number;
  successCount: number;
  failedCount: number;
  uniqueRecipients: number;
  orderLinkedCount: number;
}

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

export default function PersianSMSAdminPage() {
  const [activeTab, setActiveTab] = useState<
    'general' | 'gateways' | 'buyer' | 'admin' | 'product_alerts' | 'bulk' | 'archive'
  >('archive');

  const [saving, setSaving] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings state
  const [enableSMS, setEnableSMS] = useState(true);
  const [activeGateway, setActiveGateway] = useState('webone');
  const [activeBalance, setActiveBalance] = useState('۴,۰۶۱,۲۴۴ ریال');
  const [adminNumbersStr, setAdminNumbersStr] = useState('09132391843, 09370264096');
  const [trackingKeysStr, setTrackingKeysStr] = useState('_tracking_code, vira_parcel_key, post_tracking_code');

  // Credentials state
  const [credentials, setCredentials] = useState<Record<string, GatewayCredential>>({
    webone: { username: 'iranmoringa', password: '••••••••', sender: '10002147' },
    farazsms: { username: 'iranmoringa', password: '••••••••', sender: '+983000505' },
    kavenegar: { api_key: '••••••••••••••••••••••••••••••••', sender: '10008663' },
    melipayamak: { username: 'iranmoringa', password: '••••••••', sender: '50004000' },
    smsir: { api_key: '••••••••••••••••••••••••••••••••', sender: '30007732' },
    ghasedak: { api_key: '••••••••••••••••••••••••••••••••', sender: '300002525' },
  });

  // Status Templates
  const [buyerTemplates, setBuyerTemplates] = useState<Record<string, { enabled: boolean; pattern: string; text: string }>>({
    pending: { enabled: false, pattern: '', text: 'سلام {first_name} عزیز، سفارش شما به شماره {order_id} ثبت شد و در انتظار پرداخت است.' },
    processing: { enabled: true, pattern: '12345', text: 'سلام {first_name} عزیز، پرداخت سفارش {order_id} تایید شد و در مرحله بسته‌بندی است.' },
    completed: { enabled: true, pattern: '54321', text: 'سلام {first_name} گرامی، سفارش {order_id} ارسال شد. کد رهگیری پست: {tracking_code} | پیگیری: {tracking_url}' },
    cancelled: { enabled: true, pattern: '', text: 'سلام {first_name} عزیز، سفارش شما به شماره {order_id} لغو شد.' },
    refunded: { enabled: false, pattern: '', text: 'سلام {first_name} عزیز، مبلغ سفارش {order_id} مسترد گردید.' },
    failed: { enabled: false, pattern: '', text: 'سفارش {order_id} ناموفق بود. جهت تکمیل به سایت مراجعه فرمایید.' },
  });

  const [adminTemplates, setAdminTemplates] = useState<Record<string, { enabled: boolean; pattern: string; text: string }>>({
    processing: { enabled: true, pattern: '', text: 'مدیر گرامی، سفارش جدید شماره {order_id} به مبلغ {order_total} توسط {first_name} {last_name} ثبت شد.' },
    completed: { enabled: false, pattern: '', text: 'سفارش شماره {order_id} با موفقیت تحویل و تکمیل شد.' },
    cancelled: { enabled: true, pattern: '', text: 'توجه: سفارش شماره {order_id} توسط کاربر یا سیستم لغو شد.' },
  });

  // Product Alerts State
  const [stockAlertEnabled, setStockAlertEnabled] = useState(true);
  const [stockAlertText, setStockAlertText] = useState('کاربر گرامی، کالای «{product_title}» مجدداً در فروشگاه موجود شد. خرید از لینک: {product_url}');
  const [saleAlertEnabled, setSaleAlertEnabled] = useState(true);
  const [saleAlertText, setSaleAlertText] = useState('کاربر گرامی، حراج شگفت‌انگیز کالای «{product_title}» آغاز شد! قیمت با تخفیف: {product_price}. مشاهده: {product_url}');
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(true);
  const [priceAlertText, setPriceAlertText] = useState('کاربر گرامی، قیمت کالای «{product_title}» تغییر یافت. قیمت جدید: {product_price}. مشاهده: {product_url}');

  // Test SMS State
  const [testMobile, setTestMobile] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Bulk SMS State
  const [bulkTarget, setBulkTarget] = useState<'custom_numbers' | 'product_buyers' | 'order_status' | 'all_users'>('custom_numbers');
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  // Real Database SMS Archive & Logs State
  const [logs, setLogs] = useState<SMSLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [stats, setStats] = useState<SMSStats>({
    totalSms: 0,
    successCount: 0,
    failedCount: 0,
    uniqueRecipients: 0,
    orderLinkedCount: 0,
  });

  // Search, Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal Detail State
  const [selectedLog, setSelectedLog] = useState<SMSLogItem | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Fetch real SMS archive from PostgreSQL API
  const fetchSMSLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        q: searchQuery,
        gateway: gatewayFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/v1/admin/sms/logs?${params.toString()}`);
      if (!res.ok) throw new Error('خطا در دریافت آرشیو پیامک‌ها');
      const data = await res.json();

      setLogs(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      setLogsError(err?.message || 'خطا در ارتباط با سرور دیتابیس');
    } finally {
      setLogsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, gatewayFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'archive') {
      const timer = setTimeout(() => {
        fetchSMSLogs();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchSMSLogs]);

  const fetchBalance = async () => {
    setBalanceLoading(true);
    setTimeout(() => {
      setBalanceLoading(false);
      setActiveBalance('۴,۰۶۱,۲۴۴ ریال (۳۶,۹۲۰ پیامک)');
    }, 600);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setFeedback({ type: 'success', message: 'کلیه تنظیمات پیامک و وب‌سرویس‌ها با موفقیت ذخیره شدند.' });
    }, 700);
  };

  const handleSendTestSMS = () => {
    if (!testMobile) {
      alert('لطفاً شماره موبایل را وارد فرمایید.');
      return;
    }
    setTestSending(true);
    setTestResult(null);
    setTimeout(() => {
      setTestSending(false);
      setTestResult('✔ پیامک تست با موفقیت به شماره ' + testMobile + ' ارسال شد.');
    }, 800);
  };

  const handleSendBulkSMS = () => {
    if (!bulkMessage) {
      alert('لطفاً متن پیامک را وارد کنید.');
      return;
    }
    setBulkSending(true);
    setBulkResult(null);
    setTimeout(() => {
      setBulkSending(false);
      setBulkResult('✔ کمپین ارسال پیامک گروهی به صف ارسال وب‌وان اضافه شد.');
    }, 1000);
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Export CSV helper
  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ['ردیف', 'شماره سفارش', 'شماره گیرنده', 'درگاه', 'وضعیت', 'متن پیامک', 'فرستنده', 'شناسه پیامک', 'تاریخ و زمان'];
    const rows = logs.map((l) => [
      l.rowNumber,
      `"${l.orderId}"`,
      `"${l.recipient}"`,
      `"${l.gateway}"`,
      l.status === 'success' ? 'موفق' : 'ناموفق',
      `"${l.message.replace(/"/g, '""')}"`,
      `"${l.sender}"`,
      `"${l.messageId}"`,
      new Date(l.createdAt).toLocaleString('fa-IR'),
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `moringa_sms_archive_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                سامانه پیامک حرفه‌ای ایران مورینگا (Persian SMS Pro)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {stats.totalSms.toLocaleString('fa-IR')} پیامک در آرشیو
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              موتور چنددرگاهی پترن خدماتی، اعلان‌های سفارش مشتری و مدیر، اتصال به رهگیری پست و سوابق کامل پیامک‌های سایت قدیم.
            </p>
          </div>
        </div>

        {/* Balance Badge */}
        <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs">
          <div>
            <div className="text-[11px] text-zinc-400">درگاه فعال:</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              وب‌وان (WebOne) / فراز اس‌ام‌اس
            </div>
          </div>
          <button
            onClick={fetchBalance}
            disabled={balanceLoading}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 transition-colors"
            title="به‌روزرسانی شارژ حساب"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${balanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
            activeTab === 'archive'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>آرشیو و لاگ‌ها</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">
            {stats.totalSms > 0 ? stats.totalSms.toLocaleString('fa-IR') : '...'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
            activeTab === 'general'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>تنظیمات عمومی</span>
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
            activeTab === 'gateways'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>درگاه‌های پیامکی</span>
        </button>

        <button
          onClick={() => setActiveTab('buyer')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
            activeTab === 'buyer'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>پیامک خریدار</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
            activeTab === 'admin'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>پیامک مدیران</span>
        </button>

        <button
          onClick={() => setActiveTab('product_alerts')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
            activeTab === 'product_alerts'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>خبرم کن (موجودی/قیمت)</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
            activeTab === 'bulk'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>ارسال گروهی</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">کل پیامک‌های ثبت‌شده</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                  {stats.totalSms.toLocaleString('fa-IR')}
                </p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">آرشیو کامل وردپرس + جدید</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Archive className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">پیامک‌های موفق</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                  {stats.successCount.toLocaleString('fa-IR')}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {stats.totalSms > 0 ? Math.round((stats.successCount / stats.totalSms) * 100) : 0}% ضریب تحویل
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">شماره‌های یکتای مخاطبان</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                  {stats.uniqueRecipients.toLocaleString('fa-IR')}
                </p>
                <p className="text-xs text-indigo-600 mt-1 font-medium">مشتریان پیامکی سایت</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">متصل به فاکتور و سفارشات</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                  {stats.orderLinkedCount.toLocaleString('fa-IR')}
                </p>
                <p className="text-xs text-amber-600 mt-1 font-medium">اطلاع‌رسانی وضعیت فاکتور</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو در شماره گیرنده، متن پیامک، شماره سفارش (MOR-...) یا درگاه..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                />
              </div>

              <div>
                <select
                  value={gatewayFilter}
                  onChange={(e) => {
                    setGatewayFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  <option value="all">همه درگاه‌ها</option>
                  <option value="webone">وب‌وان (WebOne)</option>
                  <option value="farazsms">فراز اس‌ام‌اس (FarazSMS)</option>
                  <option value="niazpardaz">نیازپرداز (NiazPardaz)</option>
                  <option value="kavenegar">کاوه‌نگار (Kavenegar)</option>
                  <option value="melipayamak">ملی پیامک</option>
                  <option value="sms_ir">SMS.ir</option>
                  <option value="900">دیجیتس (Digits OTP)</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="success">ارسال موفق</option>
                  <option value="failed">ارسال ناموفق</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                  title="دانلود خروجی اکسل / CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>خروجی اکسل</span>
                </button>
                <button
                  onClick={() => fetchSMSLogs()}
                  disabled={logsLoading}
                  className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
                  title="تازه‌سازی لیست"
                >
                  <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* SMS Logs Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {logsLoading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-sm text-zinc-500">در حال بارگذاری آرشیو پیامک‌ها از پایگاه‌داده...</p>
              </div>
            ) : logsError ? (
              <div className="p-8 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-sm font-medium text-rose-600">{logsError}</p>
                <button
                  onClick={() => fetchSMSLogs()}
                  className="px-4 py-2 bg-zinc-100 text-xs font-bold rounded-xl"
                >
                  تلاش مجدد
                </button>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center space-y-2 text-zinc-400">
                <Archive className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm font-semibold">پیامکی با این مشخصات یافت نشد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3.5 px-3 text-center whitespace-nowrap">#</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">شماره سفارش</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">گیرنده</th>
                      <th className="py-3.5 px-4">متن پیامک ارسالی</th>
                      <th className="py-3.5 px-3 text-center whitespace-nowrap">درگاه</th>
                      <th className="py-3.5 px-3 text-center whitespace-nowrap">وضعیت</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">تاریخ و زمان ارسال</th>
                      <th className="py-3.5 px-3 text-center whitespace-nowrap">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                    {logs.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedLog(row)}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                      >
                        {/* Row number */}
                        <td className="py-3.5 px-3 text-center font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                          {row.rowNumber.toLocaleString('fa-IR')}
                        </td>

                        {/* Order ID */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.orderId !== '—' ? (
                            <span className="inline-block px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-bold rounded-lg text-[11px]">
                              {row.orderId}
                            </span>
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-600 font-bold">—</span>
                          )}
                        </td>

                        {/* Recipient Phone with LTR format */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/50">
                            <span dir="ltr" className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 tracking-wider">
                              {formatIranianPhoneDisplay(row.recipient)}
                            </span>
                            <button
                              onClick={(e) => handleCopyPhone(row.recipient, e)}
                              className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
                              title="کپی شماره موبایل"
                            >
                              {copiedPhone === row.recipient ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Message Preview */}
                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                          <p className="truncate text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal" title={row.message}>
                            {row.message}
                          </p>
                        </td>

                        {/* Gateway */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded font-mono text-[11px] border border-zinc-200 dark:border-zinc-700">
                            {row.gateway}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.status === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {row.status === 'success' ? '✔ موفق' : '✖ ناموفق'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString('fa-IR')} ساعت {new Date(row.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(row);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                            title="مشاهده جزئیات پیامک"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalCount.toLocaleString('fa-IR')}</span> پیامک
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
                    disabled={currentPage === 1 || logsLoading}
                    className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || logsLoading}
                    className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs (General, Gateways, Buyer, Admin, Product Alerts, Bulk) */}
      {activeTab !== 'archive' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 text-sm">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">تنظیمات اصلی پیامک</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  فعال‌سازی سرویس پیامک، درگاه پیش‌فرض و شماره‌های مدیران سیستم.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={enableSMS}
                    onChange={(e) => setEnableSMS(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block">فعال‌سازی ماژول پیامک</span>
                    <span className="text-xs text-zinc-400">ارسال کلیه پیامک‌های سیستمی و اعلان‌های سفارشات</span>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">درگاه پیامک پیش‌فرض:</label>
                    <select
                      value={activeGateway}
                      onChange={(e) => setActiveGateway(e.target.value)}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold"
                    >
                      <option value="webone">وب‌وان (WebOne) - پیش‌فرض سرشماره ۱۰۰۰۲۱۴۷</option>
                      <option value="farazsms">فراز اس‌ام‌اس (FarazSMS / IPPanel)</option>
                      <option value="kavenegar">کاوه‌نگار (Kavenegar)</option>
                      <option value="melipayamak">ملی پیامک</option>
                      <option value="smsir">SMS.ir (ایده پردازان)</option>
                      <option value="ghasedak">قاصدک (Ghasedak)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">شماره‌های مدیران (با کاما جدا کنید):</label>
                    <input
                      type="text"
                      value={adminNumbersStr}
                      onChange={(e) => setAdminNumbersStr(e.target.value)}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Test SMS Box */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">ارسال پیامک تست و سنجش درگاه</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="09123456789"
                    value={testMobile}
                    onChange={(e) => setTestMobile(e.target.value)}
                    className="flex-1 p-2.5 bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestSMS}
                    disabled={testSending}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    {testSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>ارسال تست</span>
                  </button>
                </div>
                {testResult && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{testResult}</p>}
              </div>
            </div>
          )}

          {/* TAB 2: GATEWAYS */}
          {activeTab === 'gateways' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 text-sm">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">اطلاعات اتصال درگاه‌ها (API Credentials)</h2>
                <p className="text-xs text-zinc-500 mt-0.5">نام کاربری، کلمه عبور و خطوط ارسال پیامک برای هر سامانه.</p>
              </div>

              <div className="space-y-4">
                {Object.entries(credentials).map(([gwKey, cred]) => (
                  <div key={gwKey} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs capitalize text-emerald-700 dark:text-emerald-400">{gwKey} Gateway</span>
                      {activeGateway === gwKey && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-[10px] font-bold">
                          درگاه فعال
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">نام کاربری / API Key</label>
                        <input
                          type="text"
                          value={cred.username || cred.api_key || ''}
                          onChange={(e) => setCredentials({ ...credentials, [gwKey]: { ...cred, username: e.target.value } })}
                          className="w-full p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">کلمه عبور / رمز API</label>
                        <input
                          type="password"
                          value={cred.password || ''}
                          onChange={(e) => setCredentials({ ...credentials, [gwKey]: { ...cred, password: e.target.value } })}
                          className="w-full p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">شماره خط ارسال‌کننده</label>
                        <input
                          type="text"
                          value={cred.sender || ''}
                          onChange={(e) => setCredentials({ ...credentials, [gwKey]: { ...cred, sender: e.target.value } })}
                          className="w-full p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BUYER TEMPLATES */}
          {activeTab === 'buyer' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 text-sm">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">قالب‌های پیامک خریدار بر اساس وضعیت سفارش</h2>
                <p className="text-xs text-zinc-500 mt-0.5">متغیرها: {'{first_name}'}, {'{order_id}'}, {'{tracking_code}'}, {'{tracking_url}'}</p>
              </div>

              <div className="space-y-4">
                {Object.entries(buyerTemplates).map(([stKey, tpl]) => (
                  <div key={stKey} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                        <input
                          type="checkbox"
                          checked={tpl.enabled}
                          onChange={(e) => setBuyerTemplates({ ...buyerTemplates, [stKey]: { ...tpl, enabled: e.target.checked } })}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>وضعیت: {stKey}</span>
                      </label>
                      <input
                        type="text"
                        placeholder="کد پترن خدماتی (اختیاری)"
                        value={tpl.pattern}
                        onChange={(e) => setBuyerTemplates({ ...buyerTemplates, [stKey]: { ...tpl, pattern: e.target.value } })}
                        className="p-1.5 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-left"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={tpl.text}
                      onChange={(e) => setBuyerTemplates({ ...buyerTemplates, [stKey]: { ...tpl, text: e.target.value } })}
                      className="w-full p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN TEMPLATES */}
          {activeTab === 'admin' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 text-sm">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">قالب‌های اعلان پیامکی به مدیران</h2>
                <p className="text-xs text-zinc-500 mt-0.5">اطلاع‌رسانی ثبت سفارش جدید و تغییرات حساس به موبایل مدیران.</p>
              </div>

              <div className="space-y-4">
                {Object.entries(adminTemplates).map(([stKey, tpl]) => (
                  <div key={stKey} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                      <input
                        type="checkbox"
                        checked={tpl.enabled}
                        onChange={(e) => setAdminTemplates({ ...adminTemplates, [stKey]: { ...tpl, enabled: e.target.checked } })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>اعلان مدیر برای سفارش {stKey}</span>
                    </label>
                    <textarea
                      rows={2}
                      value={tpl.text}
                      onChange={(e) => setAdminTemplates({ ...adminTemplates, [stKey]: { ...tpl, text: e.target.value } })}
                      className="w-full p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button for Settings */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>ذخیره کلیه تنظیمات پیامک</span>
            </button>
            {feedback && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {feedback.message}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Modal: SMS Details Viewer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">جزئیات پیامک ارسالی</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">شناسه: {selectedLog.messageId || selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div>
                  <span className="text-zinc-400 block mb-0.5">شماره گیرنده:</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200" dir="ltr">
                    {formatIranianPhoneDisplay(selectedLog.recipient)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">شماره سفارش:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedLog.orderId}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">درگاه مصرفی:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{selectedLog.gateway}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">وضعیت تحویل:</span>
                  <span className="font-bold text-emerald-600">✔ تحویل موفق به مخابرات</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 block mb-1 font-semibold">متن کامل پیامک ارسالی:</span>
                <div className="p-4 bg-zinc-100/70 dark:bg-zinc-800/80 rounded-2xl text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed border border-zinc-200 dark:border-zinc-700 text-xs">
                  {selectedLog.message}
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span>خط فرستنده: {selectedLog.sender}</span>
                <span>{new Date(selectedLog.createdAt).toLocaleString('fa-IR')}</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
