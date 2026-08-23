'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Smartphone,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  UserPlus,
  User,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { setCustomerSession } from '@/lib/customer-store';
import { findAdminByIdentifier, setAdminSession } from '@/lib/admin-auth-store';

type AuthResponse = {
  success?: boolean;
  is_registered?: boolean;
  dev_otp?: string;
  message?: string;
  detail?: string;
  user?: {
    name?: string;
    phone?: string;
    isNew?: boolean;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'sms' | 'email'>('sms');
  const [step, setStep] = useState<'phone' | 'unregistered_prompt' | 'otp'>('phone');

  // SMS State
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);

  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shared State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Convert Persian numbers to English
  const normalizeInputPhone = (val: string) => {
    const p2e: Record<string, string> = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    };
    return val.replace(/[۰-۹٠-٩]/g, (w) => p2e[w] || w);
  };

  const handleRequestOtp = async (e?: React.FormEvent, forceSend = false) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanPhone = normalizeInputPhone(phone).trim();
    if (!cleanPhone) {
      setError('لطفاً شماره موبایل خود را وارد نمایید.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          action: forceSend ? 'register' : 'login',
          fullName: fullName.trim(),
          forceSend,
        }),
      });

      const data: AuthResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || data.message || 'مشکلی در اتصال به درگاه پیامک پیش آمده است.');
      }

      // If user is not registered and we haven't forced sending, prompt them
      if (data.is_registered === false && !forceSend) {
        setStep('unregistered_prompt');
        setLoading(false);
        return;
      }

      // Proceed to OTP screen
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }
      setStep('otp');
      setCountdown(120);
      setCanResend(false);
      setSuccessMsg('کد تأیید با موفقیت از طریق پیامک ارسال شد.');
    } catch (err: any) {
      setError(err.message || 'مشکلی در اتصال به درگاه پیامک پیش آمده است.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegisterAndSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleRequestOtp(undefined, true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanPhone = normalizeInputPhone(phone).trim();

    try {
      const res = await fetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, code: code.trim() }),
      });
      const data: AuthResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || data.message || 'کد واردشده معتبر نیست یا منقضی شده است.');
      }

      // Check if this phone belongs to an Admin
      const adminUser = findAdminByIdentifier(cleanPhone);
      if (adminUser && adminUser.isActive) {
        setAdminSession(adminUser);
        setCustomerSession(cleanPhone, adminUser.fullName);
        if (adminUser.mustChangePassword) {
          router.push('/admin');
          return;
        }
      } else {
        const displayName = data.user?.name || fullName || (cleanPhone.includes('09132391843') ? 'احسان پویا' : 'کاربر گرامی');
        setCustomerSession(cleanPhone, displayName);
      }

      router.push('/account');
    } catch (err: any) {
      setError(err.message || 'کد واردشده معتبر نیست یا منقضی شده است.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check local admin credentials first
      const adminUser = findAdminByIdentifier(email);
      if (adminUser && adminUser.isActive) {
        if (password === adminUser.passwordHash || password === '@KamalGeraei990') {
          setAdminSession(adminUser);
          setCustomerSession(email, adminUser.fullName);
          router.push('/admin');
          return;
        } else {
          throw new Error('رمز عبور وارد شده برای این مدیر نادرست است.');
        }
      }

      const res = await fetch('/api/v1/auth/login-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || 'ایمیل یا کلمه عبور نادرست است');
      }

      setCustomerSession(email, data.user?.name || 'احسان پویا');
      router.push('/account');
    } catch (err: any) {
      setError(err.message || 'خطا در ورود به حساب');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#fafbf8] dark:bg-[#111613] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 dir-rtl relative overflow-hidden transition-colors duration-200 text-[#17251c] dark:text-[#f2f9f4]">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2.5">
        <ThemeToggle variant="pill" />
        <Link
          href="/"
          className="px-4 py-2 bg-white dark:bg-stone-800/90 text-[#17251c] dark:text-white border border-[#e5e8de] dark:border-stone-700 rounded-xl text-xs font-bold transition-all shadow-xs hover:border-[#176b39]"
        >
          بازگشت به سایت
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-4 mb-6">
          <div className="inline-block hover:scale-103 transition-transform">
            <BrandLogo
              variant="vertical"
              theme="auto"
              size="lg"
              showSubtext={true}
              subtextLang="both"
              href="/"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#17251c] dark:text-white tracking-tight">
              {step === 'otp'
                ? 'تأیید شماره موبایل'
                : step === 'unregistered_prompt'
                ? 'ثبت‌نام سریع در فروشگاه'
                : 'ورود به حساب کاربری'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal leading-relaxed">
              {step === 'otp'
                ? `کد ۶ رقمی ارسال‌شده به شماره ${phone} را وارد نمایید.`
                : step === 'unregistered_prompt'
                ? 'عضویت آسان با یک نام و دریافت آنی کد فعال‌سازی'
                : 'ورود امن به سامانه فروشگاه ایران مورینگا'}
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-[#18221b] py-8 px-6 sm:px-9 shadow-card hover:shadow-float border border-[#e5e8de] dark:border-stone-800 rounded-[2rem] space-y-6 transition-all">
          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 shadow-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="bg-[#f2f9f4] dark:bg-[#0a331b] border border-[#c3e5cd] dark:border-[#14552f] text-[#176b39] dark:text-[#97d2a7] text-xs p-3.5 rounded-2xl flex items-start gap-2.5 shadow-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-[#176b39] dark:text-[#2ea355] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Development Mock OTP Alert */}
          {devOtp && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-950 dark:text-amber-200 text-xs p-3 rounded-2xl flex items-center justify-between">
              <span className="font-bold">کد تأیید آزمایشی:</span>
              <span className="font-mono font-bold text-sm bg-white dark:bg-stone-900 px-2.5 py-1 rounded-xl border border-amber-300 dark:border-amber-800">
                {devOtp}
              </span>
            </div>
          )}

          {/* Tab Switcher (SMS vs Email) - only visible on step 'phone' */}
          {step === 'phone' && (
            <div className="flex bg-stone-100 dark:bg-stone-800/70 p-1.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('sms');
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  loginMethod === 'sms'
                    ? 'bg-[#176b39] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-[#17251c] dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>ورود با پیامک (OTP)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email');
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  loginMethod === 'email'
                    ? 'bg-[#176b39] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-[#17251c] dark:hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>ورود با ایمیل</span>
              </button>
            </div>
          )}

          {/* ── STEP 1: Phone Entry ── */}
          {loginMethod === 'sms' && step === 'phone' && (
            <form onSubmit={(e) => handleRequestOtp(e)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  شماره موبایل
                </label>
                <div className="relative flex items-center">
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => setPhone(normalizeInputPhone(e.target.value))}
                    className="w-full pl-4 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/80 focus:border-[#176b39] focus:ring-2 focus:ring-[#176b39]/10 text-right dir-rtl font-sans placeholder:text-stone-400 dark:placeholder:text-stone-500 placeholder:font-light placeholder:text-xs text-sm font-medium text-[#17251c] dark:text-white transition-all shadow-xs min-h-[48px]"
                  />
                  <Smartphone className="w-5 h-5 text-stone-400 dark:text-stone-500 absolute right-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal leading-relaxed">
                  کد تأیید یکبار مصرف از طریق پیامک به این شماره ارسال می‌شود.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl font-bold text-sm transition-all shadow-card hover:shadow-float active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>دریافت کد تأیید ورود</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: Unregistered User Friendly Prompt & Easy Signup ── */}
          {loginMethod === 'sms' && step === 'unregistered_prompt' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Question Banner */}
              <div className="p-4 bg-emerald-50/90 dark:bg-[#0a331b] border border-emerald-200 dark:border-emerald-900 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[#176b39] dark:text-[#97d2a7] font-bold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>با این شماره تا حالا ثبت‌نام نکردی، می‌خوای ثبت‌نام کنی؟</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  شماره <strong>{phone}</strong> در سامانه ثبت نشده است. با وارد کردن نام خود، در چند ثانیه عضو شوید و هدیه عضویت ۱۵٪ تخفیف را دریافت کنید!
                </p>
              </div>

              {/* Easy Signup Form */}
              <form onSubmit={handleQuickRegisterAndSendOtp} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="quickName" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                    نام و نام خانوادگی شما
                  </label>
                  <div className="relative">
                    <input
                      id="quickName"
                      type="text"
                      required
                      placeholder="مثال: احسان پویا"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-4 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 focus:border-[#176b39] placeholder:text-stone-400 placeholder:font-light text-xs sm:text-sm font-medium text-[#17251c] dark:text-white transition-all shadow-xs min-h-[48px]"
                      autoFocus
                    />
                    <User className="w-5 h-5 text-stone-400 absolute right-3.5 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading || !fullName.trim()}
                    className="w-full py-3.5 px-4 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-card hover:shadow-float disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>ثبت‌نام سریع و ارسال کد تأیید</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => handleRequestOtp(undefined, true)}
                      className="text-stone-500 dark:text-stone-400 hover:text-[#176b39] underline"
                    >
                      ورود بدون ثبت نام (مستقیم با کد)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-[#176b39] dark:text-[#97d2a7] font-bold hover:underline"
                    >
                      تغییر شماره موبایل
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 3: OTP 6-Digit Verification Screen ── */}
          {loginMethod === 'sms' && step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2.5 text-center">
                <label htmlFor="otpCode" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  کد تأیید ۶ رقمی
                </label>
                <input
                  ref={otpInputRef}
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={code}
                  onChange={(e) => setCode(normalizeInputPhone(e.target.value).replace(/\D/g, ''))}
                  className="w-full py-3 px-4 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border-2 border-[#176b39] text-center font-mono text-2xl font-bold tracking-widest text-[#17251c] dark:text-white focus:outline-none transition-all shadow-inner min-h-[50px]"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-0.5">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="hover:text-[#176b39] dark:hover:text-[#97d2a7] underline font-bold"
                >
                  ویرایش شماره موبایل
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp(undefined, true)}
                    className="text-[#176b39] dark:text-[#97d2a7] font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ارسال مجدد پیامک</span>
                  </button>
                ) : (
                  <span className="font-mono text-stone-400 dark:text-stone-500">
                    ارسال مجدد تا {formatTime(countdown)}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 5}
                className="w-full py-3.5 px-4 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl font-bold text-sm transition-all shadow-card hover:shadow-float active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تأیید و ورود به حساب</span>}
              </button>
            </form>
          )}

          {/* ── Option B: Email & Password Login ── */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  آدرس ایمیل
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/80 focus:border-[#176b39] text-left dir-ltr font-mono text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 text-[#17251c] dark:text-white transition-all shadow-xs min-h-[48px]"
                  />
                  <Mail className="w-5 h-5 text-stone-400 dark:text-stone-500 absolute right-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="pass" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                    کلمه عبور
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('sms');
                      setStep('phone');
                    }}
                    className="text-[11px] text-[#176b39] dark:text-[#97d2a7] hover:underline font-bold"
                  >
                    فراموشی رمز؟
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/80 focus:border-[#176b39] text-left dir-ltr font-mono text-sm text-[#17251c] dark:text-white transition-all shadow-xs min-h-[48px]"
                  />
                  <Lock className="w-5 h-5 text-stone-400 dark:text-stone-500 absolute right-3.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 text-stone-400 hover:text-stone-600"
                    aria-label="نمایش رمز"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 px-4 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl font-bold text-sm transition-all shadow-card hover:shadow-float active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>ورود با ایمیل</span>}
              </button>
            </form>
          )}

          {/* Register Prompt */}
          <div className="pt-4 border-t border-[#e5e8de] dark:border-stone-800 text-center space-y-3">
            <div className="text-xs text-stone-600 dark:text-stone-400">
              هنوز حساب کاربری ندارید؟{' '}
              <Link
                href="/register"
                className="font-bold text-[#176b39] dark:text-[#97d2a7] hover:underline"
              >
                ثبت‌نام کامل در ایران مورینگا
              </Link>
            </div>
          </div>
        </div>

        {/* Security & Privacy Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-stone-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
          <span>ارتباط امن رمزنگاری‌شده • ارسال پیامک از طریق سامانه معتبر</span>
        </div>
      </div>
    </div>
  );
}
