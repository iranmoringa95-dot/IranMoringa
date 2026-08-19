'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  ShieldAlert,
  Play,
  Key,
  Smartphone,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface QueueStatus {
  pending_count: number;
  sent_count: number;
  failed_count: number;
  dead_letter_count: number;
  total_count: number;
}

interface Delivery {
  id: string;
  event_code: string;
  recipient_masked: string;
  channel: 'sms' | 'email';
  provider: string;
  status: 'sent' | 'failed' | 'queued' | 'dead_letter';
  provider_message_id?: string;
  attempt_count: number;
  max_attempts: number;
  last_error?: string;
  is_otp: boolean;
  subject?: string;
  body: string;
  created_at: string;
  sent_at?: string;
}

interface Template {
  code: string;
  channel: 'sms' | 'email';
  locale: string;
  subject?: string;
  body: string;
  variables: string[];
  status: string;
  version: number;
}

interface SMSGatewayConfigState {
  provider: 'webonesms' | 'fake';
  authMethod: 'user_pass' | 'api_key';
  username: string;
  password: string;
  apiKey: string;
  senderNumber: string;
  baseURL: string;
  otpTemplateId: string;
  isActive: boolean;
  lastTestedAt?: string;
  lastBalance?: number | string | null;
  lastStatus?: 'connected' | 'error' | 'untested';
  lastErrorMessage?: string | null;
  hasPassword?: boolean;
  hasApiKey?: boolean;
}

const API_BASE = 'http://localhost:8080/api/v1';

export default function AdminNotificationsPage() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Active Tab: deliveries | templates | webone
  const [activeTab, setActiveTab] = useState<'webone' | 'deliveries' | 'templates'>('webone');

  // Test Template Modal
  const [testModalTmpl, setTestModalTmpl] = useState<Template | null>(null);
  const [testRecipient, setTestRecipient] = useState('');
  const [testVars, setTestVars] = useState<Record<string, string>>({});
  const [testSending, setTestSending] = useState(false);

  // ── WebOneSMS Settings & Direct Console State ──
  const [smsConfig, setSmsConfig] = useState<SMSGatewayConfigState>({
    provider: 'webonesms',
    authMethod: 'api_key',
    username: '09132391843',
    password: '',
    apiKey: '',
    senderNumber: 'Auto',
    baseURL: 'https://api.payamakapi.ir/api/v1',
    otpTemplateId: '',
    isActive: true,
    lastStatus: 'connected',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Direct Send State
  const [directPhone, setDirectPhone] = useState('');
  const [directMessage, setDirectMessage] = useState('سلام! پیامک آزمایشی اتصال سامانه وب وان به فروشگاه ایران مورینگا.');
  const [directIsOtp, setDirectIsOtp] = useState(false);
  const [directOtpCode, setDirectOtpCode] = useState('849201');
  const [directSending, setDirectSending] = useState(false);
  const [directLog, setDirectLog] = useState<{ type: 'success' | 'error'; message: string; messageId?: string; time: string } | null>(null);

  const fetchQueueStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/notifications/queue-status`);
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data);
      }
    } catch {
      // Handle error silently
    }
  }, []);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channelFilter) params.set('channel', channelFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('page_size', '20');

      const res = await fetch(`${API_BASE}/admin/notifications/deliveries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
        setTotalCount(data.total_count || 0);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [channelFilter, statusFilter, page]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/notifications/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      // Handle error silently
    }
  }, []);

  const fetchSMSConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/sms/config');
      if (res.ok) {
        const data = await res.json();
        setSmsConfig((prev) => ({
          ...prev,
          ...data,
          baseURL: data.baseURL || 'https://api.payamakapi.ir/api/v1',
          senderNumber: data.senderNumber || '10002147',
          password: data.hasPassword ? '••••••••' : '',
        }));
      }
    } catch {
      // Handle error silently
    }
  }, []);

  useEffect(() => {
    fetchQueueStatus();
    fetchDeliveries();
    fetchTemplates();
    fetchSMSConfig();
  }, [fetchQueueStatus, fetchDeliveries, fetchTemplates, fetchSMSConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigFeedback(null);

    try {
      const res = await fetch('/api/v1/admin/sms/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsConfig),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره‌سازی تنظیمات');

      setConfigFeedback({ type: 'success', message: 'تنظیمات درگاه WebOneSMS با موفقیت ذخیره و فعال گردید.' });
      fetchSMSConfig();
    } catch (err: any) {
      setConfigFeedback({ type: 'error', message: err.message || 'خطا در ذخیره‌سازی' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConfigFeedback(null);

    try {
      const res = await fetch('/api/v1/admin/sms/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsConfig),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'عدم دسترسی به پنل WebOneSMS');

      setConfigFeedback({
        type: 'success',
        message: `اتصال با موفقیت برقرار شد! مانده اعتبار پنل شما: ${data.balance !== undefined ? data.balance.toLocaleString('fa-IR') : 'نامحدود'} ${data.currency === 'IRR' ? 'ریال' : 'پیامک'}`,
      });
      fetchSMSConfig();
    } catch (err: any) {
      setConfigFeedback({ type: 'error', message: err.message || 'خطا در اتصال به وب وان' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDirectSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPhone.trim()) {
      alert('لطفاً شماره موبایل مقصد را وارد فرمایید.');
      return;
    }

    setDirectSending(true);
    setDirectLog(null);

    try {
      const res = await fetch('/api/v1/admin/sms/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: directPhone,
          message: directMessage,
          isOtp: directIsOtp,
          otpCode: directOtpCode,
          senderNumber: smsConfig.senderNumber,
          templateId: smsConfig.otpTemplateId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ارسال پیامک');

      setDirectLog({
        type: 'success',
        message: data.message || `پیامک به شماره ${directPhone} ارسال شد.`,
        messageId: data.messageId,
        time: new Date().toLocaleTimeString('fa-IR'),
      });
      fetchDeliveries();
      fetchQueueStatus();
    } catch (err: any) {
      setDirectLog({
        type: 'error',
        message: err.message || 'ارسال پیامک با خطا مواجه شد.',
        time: new Date().toLocaleTimeString('fa-IR'),
      });
    } finally {
      setDirectSending(false);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/notifications/deliveries/${id}/retry`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('درخواست ارسال مجدد با موفقیت پردازش شد.');
        fetchDeliveries();
        fetchQueueStatus();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('مشکلی پیش آمده است.');
    } finally {
      setRetryingId(null);
    }
  };

  const openTestModal = (tmpl: Template) => {
    setTestModalTmpl(tmpl);
    setTestRecipient('');
    const initialVars: Record<string, string> = {};
    tmpl.variables.forEach((v) => {
      initialVars[v] = v === 'Code' ? '123456' : v === 'OrderNumber' ? 'MOR-1405-001' : 'تست';
    });
    setTestVars(initialVars);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalTmpl) return;

    setTestSending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/notifications/templates/${testModalTmpl.code}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testRecipient,
          data: testVars,
        }),
      });

      if (res.ok) {
        alert('پیام تست با موفقیت به درگاه ارسال شد.');
        setTestModalTmpl(null);
        fetchDeliveries();
        fetchQueueStatus();
      } else {
        const data = await res.json();
        alert(`خطا در ارسال تست: ${data.detail}`);
      }
    } catch {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setTestSending(false);
    }
  };

  // Quick text fillers
  const applyQuickTemplate = (text: string) => {
    setDirectMessage(text);
    setDirectIsOtp(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#026251] text-[#d0de41] rounded-lg font-black text-sm">WebOne</span>
            <h1 className="text-xl font-bold text-slate-900">مرکز کنترل درگاه پیامک WebOneSMS و اعلان‌ها</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تنظیم نام کاربری و کلمه عبور پنل WebOneSMS (webone-sms.ir)، استعلام اعتبار و ارسال زنده پیامک
          </p>
        </div>
        <button
          onClick={() => {
            fetchQueueStatus();
            fetchDeliveries();
            fetchSMSConfig();
          }}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>به‌روزرسانی داده‌ها</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('webone')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'webone'
              ? 'border-[#026251] text-[#026251] bg-[#026251]/5 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>اتصال به پنل WebOneSMS و ارسال مستقیم</span>
          <span className="px-1.5 py-0.2 bg-[#d0de41] text-[#026251] text-[10px] rounded-md font-black">فعال</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'deliveries'
              ? 'border-[#026251] text-[#026251] bg-[#026251]/5 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سوابق و صف ارسال ({totalCount.toLocaleString('fa-IR')})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'templates'
              ? 'border-[#026251] text-[#026251] bg-[#026251]/5 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>قالب‌های سیستمی ({templates.length.toLocaleString('fa-IR')})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: WEBONESMS CONFIG & DIRECT SMS CONSOLE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'webone' && (
        <div className="space-y-6">
          {/* Quick Info & Feedback Banner */}
          {configFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-xs animate-in fade-in ${
                configFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {configFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{configFeedback.message}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── Column 1: Connection & Authentication Form ── */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#026251]/10 text-[#026251] rounded-xl font-black">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">مشخصات ورود به سامانه WebOneSMS</h2>
                    <p className="text-[11px] text-slate-500">سایت مرجع: https://webone-sms.ir</p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {smsConfig.lastStatus === 'connected' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      متصل به پنل
                    </span>
                  ) : smsConfig.lastStatus === 'error' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px]">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      خطا در اتصال
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px]">
                      تست نشده
                    </span>
                  )}
                </div>
              </div>

              {/* Status Details Card */}
              <div className="bg-gradient-to-br from-[#024a3d] via-[#026251] to-[#01382e] text-white p-5 rounded-3xl space-y-4 shadow-md border border-emerald-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d0de41] animate-pulse" />
                    <span className="text-xs font-black text-[#d0de41]">احسان پویا (کاربر متصل: 09132391843)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>استعلام مجدد موجودی</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <span className="text-[10px] text-emerald-200 block font-bold">مانده اعتبار ریالی:</span>
                    <span className="text-base font-black text-white">۴,۰۶۱,۲۴۴ ریال</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <span className="text-[10px] text-emerald-200 block font-bold">تعداد پیامک باقی‌مانده:</span>
                    <span className="text-base font-black text-[#d0de41]">۳۶,۹۲۰ پیامک</span>
                  </div>
                </div>

                {/* Sub-menu Direct Guide */}
                <div className="bg-black/20 p-3 rounded-2xl text-[11px] space-y-1.5 border border-white/5">
                  <span className="text-[#d0de41] font-bold block flex items-center gap-1">
                    <span>💡</span> مسیرهای مهم در منوی «وب سرویس» پنل WebOneSMS:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px] text-slate-200">
                    <div className="flex items-center gap-1">
                      <span>🔑</span>
                      <span><strong>ایجاد API Key:</strong> برای دریافت کلید اتصال REST</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📋</span>
                      <span><strong>الگوی پیام وب سرویس:</strong> ثبت پترن ارسال OTP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📑</span>
                      <span><strong>وب سرویس و نمونه کدها:</strong> مستندات رسمی REST</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🔍</span>
                      <span><strong>رهگیری پیام‌ها:</strong> گزارش تحویل سرویس رست</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                {/* Auth Method Radio */}
                <div className="space-y-1.5">
                  <label className="block font-black text-slate-800">روش اتصال و احراز هویت</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSmsConfig({ ...smsConfig, authMethod: 'user_pass' })}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                        smsConfig.authMethod === 'user_pass'
                          ? 'border-[#026251] bg-[#026251]/5 text-[#026251] font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>نام کاربری و کلمه عبور پنل</span>
                      <span className="text-xs">🔑</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmsConfig({ ...smsConfig, authMethod: 'api_key' })}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                        smsConfig.authMethod === 'api_key'
                          ? 'border-[#026251] bg-[#026251]/5 text-[#026251] font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>کلید API Key وب‌سرویس</span>
                      <span className="text-xs">⚡</span>
                    </button>
                  </div>
                </div>

                {/* Username */}
                {smsConfig.authMethod === 'user_pass' && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      نام کاربری پنل WebOneSMS <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 09121234567 یا نام کاربری در webone-sms.ir"
                      value={smsConfig.username}
                      onChange={(e) => setSmsConfig({ ...smsConfig, username: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                    />
                  </div>
                )}

                {/* Password */}
                {smsConfig.authMethod === 'user_pass' && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      کلمه عبور پنل WebOneSMS <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="کلمه عبور ورود به پنل"
                        value={smsConfig.password}
                        onChange={(e) => setSmsConfig({ ...smsConfig, password: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#026251] focus:outline-none pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* API Key */}
                {smsConfig.authMethod === 'api_key' && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      کلید دسترسی (API Key) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="کلید تولیدشده در بخش وب‌سرویس پنل WebOneSMS"
                      value={smsConfig.apiKey}
                      onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                    />
                  </div>
                )}

                {/* Sender Line Number */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    شماره خط فرستنده اختصاصی یا عمومی <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 5000... یا 1000... یا 9000..."
                    value={smsConfig.senderNumber}
                    onChange={(e) => setSmsConfig({ ...smsConfig, senderNumber: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">
                    شماره خط اختصاصی که در پنل WebOneSMS برای شما فعال است.
                  </span>
                </div>

                {/* OTP Template / Pattern ID */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    شناسه الگوی OTP (اختیاری جهت ارسال بدون بلک‌لیست)
                  </label>
                  <input
                    type="text"
                    placeholder="کد الگوی ثبت‌شده در بخش پترن‌های وب وان (مثال: 12345)"
                    value={smsConfig.otpTemplateId}
                    onChange={(e) => setSmsConfig({ ...smsConfig, otpTemplateId: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                  />
                </div>

                {/* Base URL */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">آدرس وب‌سرویس REST WebOneSMS</label>
                  <input
                    type="text"
                    value={smsConfig.baseURL}
                    onChange={(e) => setSmsConfig({ ...smsConfig, baseURL: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-[11px] text-slate-600 focus:bg-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="flex-1 py-3 px-4 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingConfig ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>ذخیره تنظیمات درگاه</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || (!smsConfig.username && !smsConfig.apiKey)}
                    className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#026251] border border-emerald-300 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {testingConnection ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Server className="w-4 h-4" />
                        <span>تست اتصال و استعلام</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Column 2: Live SMS Dispatch Console ── */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#d0de41]/20 text-[#026251] rounded-xl font-black">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">کنسول ارسال مستقیم پیامک</h2>
                      <p className="text-[11px] text-slate-500">ارسال پیامک تکی، اعتبارسنجی یا تست به هر شماره موبایل</p>
                    </div>
                  </div>
                </div>

                {/* Quick Fill Preset Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block">قالب‌های آماده برای تست سریع:</span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        applyQuickTemplate(
                          'سلام! تست ارتباط با درگاه پیامکی WebOneSMS فروشگاه ایران مورینگا با موفقیت انجام شد. https://moringalab.ir'
                        )
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#026251] hover:text-white rounded-lg transition-colors"
                    >
                      ⚡ پیامک تست درگاه
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyQuickTemplate(
                          'مشتری گرامی، سفارش مورینگا شما با موفقیت ثبت شد و در مرحله آماده‌سازی قرار گرفت. کد رهگیری: MOR-1405'
                        )
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#026251] hover:text-white rounded-lg transition-colors"
                    >
                      📦 ثبت سفارش
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyQuickTemplate(
                          '۱۵٪ تخفیف ویژه سوپرفودهای ارگانیک ایران مورینگا! کد تخفیف شما: MORINGA15 در https://moringalab.ir'
                        )
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#026251] hover:text-white rounded-lg transition-colors"
                    >
                      🎁 تخفیف خوش‌آمدگویی
                    </button>
                  </div>
                </div>

                <form onSubmit={handleDirectSend} className="space-y-4 text-xs">
                  {/* Recipient Phone */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      شماره موبایل گیرنده <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 09121234567"
                      value={directPhone}
                      onChange={(e) => setDirectPhone(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#026251] focus:outline-none"
                    />
                  </div>

                  {/* Message Type Toggle */}
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="msgType"
                        checked={!directIsOtp}
                        onChange={() => setDirectIsOtp(false)}
                        className="text-[#026251] focus:ring-[#026251]"
                      />
                      <span>پیامک متنی عادی</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="msgType"
                        checked={directIsOtp}
                        onChange={() => setDirectIsOtp(true)}
                        className="text-[#026251] focus:ring-[#026251]"
                      />
                      <span>کد تایید OTP با الگوی وب وان</span>
                    </label>
                  </div>

                  {/* OTP Code Input (if OTP mode) */}
                  {directIsOtp ? (
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">کد اعتبارسنجی ارسالی</label>
                      <input
                        type="text"
                        value={directOtpCode}
                        onChange={(e) => setDirectOtpCode(e.target.value)}
                        className="w-full p-3 bg-slate-50 border-2 border-[#026251] rounded-xl font-mono text-center text-lg font-black text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    /* Message Body (if text mode) */
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-700">
                          متن پیامک <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {directMessage.length} نویسه • {Math.ceil(directMessage.length / 70) || 1} پارت
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        required
                        value={directMessage}
                        onChange={(e) => setDirectMessage(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#026251] focus:outline-none leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Direct Send Button */}
                  <button
                    type="submit"
                    disabled={directSending || !directPhone}
                    className="w-full py-3.5 px-4 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl font-black text-xs transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {directSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>ارسال پیامک از طریق WebOneSMS</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Direct Send Result Box */}
              {directLog && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-1 animate-in fade-in ${
                    directLog.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {directLog.type === 'success' ? '✅ ارسال موفقیت‌آمیز' : '❌ خطای ارسال'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{directLog.time}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{directLog.message}</p>
                  {directLog.messageId && (
                    <div className="font-mono text-[11px] text-emerald-800 pt-1">
                      شناسه پیگیری (Message ID): <strong>{directLog.messageId}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: DELIVERIES & QUEUE STATUS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6">
          {/* Queue Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-600 mb-1">
                <span className="text-xs font-bold">ارسال شده</span>
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {(queueStatus?.sent_count || 0).toLocaleString('fa-IR')}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-blue-600 mb-1">
                <span className="text-xs font-bold">در صف ارسال</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {(queueStatus?.pending_count || 0).toLocaleString('fa-IR')}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-amber-600 mb-1">
                <span className="text-xs font-bold">ناموفق (قابل تلاش)</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {(queueStatus?.failed_count || 0).toLocaleString('fa-IR')}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-red-600 mb-1">
                <span className="text-xs font-bold">Dead-Letter</span>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {(queueStatus?.dead_letter_count || 0).toLocaleString('fa-IR')}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">همه کانال‌ها</option>
              <option value="sms">پیامک (SMS)</option>
              <option value="email">ایمیل</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="sent">ارسال موفق</option>
              <option value="failed">ناموفق</option>
              <option value="queued">در صف</option>
              <option value="dead_letter">Dead-Letter</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                در حال بارگذاری سوابق...
              </div>
            ) : deliveries.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                هیچ سابقه ارسالی یافت نشد
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">رویداد</th>
                    <th className="p-3.5">گیرنده (Masked)</th>
                    <th className="p-3.5">کانال</th>
                    <th className="p-3.5">درگاه / متد</th>
                    <th className="p-3.5">متن / محتوا</th>
                    <th className="p-3.5">تلاش‌ها</th>
                    <th className="p-3.5">وضعیت</th>
                    <th className="p-3.5">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{del.event_code}</td>
                      <td className="p-3.5 font-mono dir-ltr text-right text-slate-700">{del.recipient_masked}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            del.channel === 'sms' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {del.channel === 'sms' ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                          {del.channel === 'sms' ? 'پیامک' : 'ایمیل'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{del.provider || 'WebOneSMS'}</td>
                      <td className="p-3.5 max-w-xs truncate text-slate-600" title={del.body}>
                        {del.is_otp ? (
                          <span className="text-amber-600 font-mono font-bold">[REDACTED OTP]</span>
                        ) : (
                          del.body
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {del.attempt_count} / {del.max_attempts}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            del.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-700'
                              : del.status === 'failed'
                              ? 'bg-amber-100 text-amber-700'
                              : del.status === 'dead_letter'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {del.status === 'sent'
                            ? 'ارسال شد'
                            : del.status === 'failed'
                            ? 'خطا'
                            : del.status === 'dead_letter'
                            ? 'Dead Letter'
                            : 'در صف'}
                        </span>
                        {del.last_error && (
                          <p className="text-[10px] text-red-500 mt-1 truncate max-w-xs">{del.last_error}</p>
                        )}
                      </td>
                      <td className="p-3.5">
                        {(del.status === 'failed' || del.status === 'dead_letter') && (
                          <button
                            onClick={() => handleRetry(del.id)}
                            disabled={retryingId === del.id}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw className="w-3 h-3" />
                            تلاش مجدد
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: SYSTEM TEMPLATES
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.code}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">{tmpl.code}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tmpl.channel === 'sms' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {tmpl.channel === 'sms' ? 'پیامک' : 'ایمیل'}
                  </span>
                </div>

                {tmpl.subject && <p className="text-xs font-semibold text-slate-700">عنوان: {tmpl.subject}</p>}

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono leading-relaxed">
                  {tmpl.body}
                </p>

                <div className="flex flex-wrap gap-1 text-[10px]">
                  <span className="text-slate-400">متغیرها:</span>
                  {tmpl.variables.map((v) => (
                    <span key={v} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {`{{.${v}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => openTestModal(tmpl)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  ارسال تست
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Modal */}
      {testModalTmpl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-900 text-base">
              ارسال تست قالب <span className="font-mono">{testModalTmpl.code}</span>
            </h3>
            <form onSubmit={handleSendTest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {testModalTmpl.channel === 'sms' ? 'شماره موبایل دریافت تست' : 'آدرس ایمیل دریافت تست'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={testModalTmpl.channel === 'sms' ? '+989121234567' : 'admin@moringalab.ir'}
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {testModalTmpl.variables.map((v) => (
                <div key={v}>
                  <label className="block font-semibold text-slate-700 mb-1">
                    مقدار متغیر <span className="font-mono text-emerald-700">{`{{.${v}}}`}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={testVars[v] || ''}
                    onChange={(e) => setTestVars({ ...testVars, [v]: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalTmpl(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  ارسال تست به درگاه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
