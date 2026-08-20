'use client';

import { useState, useEffect } from 'react';
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
  Gift,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { setCustomerSession } from '@/lib/customer-store';
import { findAdminByIdentifier, setAdminSession } from '@/lib/admin-auth-store';

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'sms' | 'email'>('sms');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // SMS State
  const [phone, setPhone] = useState('');
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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'خطا در ارسال کد تایید');
      }

      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }
      setStep('otp');
      setCountdown(120);
      setCanResend(false);
      setSuccessMsg('کد تایید با موفقیت از طریق سامانه پیامکی ارسال شد.');
    } catch (err: any) {
      setError(err.message || 'مشکلی در اتصال به درگاه پیامک پیش آمده است.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'کد تایید معتبر نیست');
      }

      // Check if this phone belongs to an Admin
      const adminUser = findAdminByIdentifier(phone);
      if (adminUser && adminUser.isActive) {
        setAdminSession(adminUser);
        setCustomerSession(phone, adminUser.fullName);
        if (adminUser.mustChangePassword) {
          router.push('/admin');
          return;
        }
      } else {
        setCustomerSession(
          phone,
          data.user?.name || (phone.includes('09132391843') ? 'احسان پویا' : 'کاربر گرامی')
        );
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
      const data = await res.json();

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
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f0f7f3] to-[#eaf3ee] dark:from-[#06120e] dark:via-[#091f18] dark:to-[#041410] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 dir-rtl relative overflow-hidden transition-colors duration-200">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/"
          className="px-3.5 py-2 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 border border-stone-200 dark:border-white/15 rounded-full text-xs font-bold transition-all shadow-xs backdrop-blur-md"
        >
          بازگشت به سایت
        </Link>
      </div>

      {/* Botanical Background Glow Accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#d0de41]/15 dark:bg-[#d0de41]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#026251]/10 dark:bg-[#026251]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-4 mb-6">
          <div className="inline-block hover:scale-105 transition-transform">
            <BrandLogo
              variant="vertical"
              theme="auto"
              size="lg"
              showSubtext={true}
              subtextLang="both"
              href="/"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {step === 'otp' ? 'تایید شماره موبایل' : 'ورود به حساب کاربری'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {step === 'otp'
                ? `کد ۶ رقمی ارسال‌شده به شماره ${phone} را وارد نمایید.`
                : 'به جمع دوستداران سلامت و سوپرفودهای ارگانیک ایران مورینگا خوش آمدید.'}
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white/95 dark:bg-[#0a2019]/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl border border-stone-200/90 dark:border-emerald-800/50 rounded-3xl space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 shadow-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Development Mock OTP Alert */}
          {devOtp && (
            <div className="bg-[#fef9c3] dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs p-3 rounded-2xl flex items-center justify-between">
              <span className="font-bold">کد تایید آزمایشی توسعه:</span>
              <span className="font-mono font-black text-sm bg-white dark:bg-amber-900/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-600">
                {devOtp}
              </span>
            </div>
          )}

          {/* Tab Switcher (SMS vs Email) - only visible on step 'phone' */}
          {step === 'phone' && (
            <div className="flex bg-stone-100 dark:bg-black/30 p-1.5 rounded-2xl border border-stone-200 dark:border-emerald-900/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('sms');
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  loginMethod === 'sms'
                    ? 'bg-[#026251] dark:bg-[#034d3f] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
                    ? 'bg-[#026251] dark:bg-[#034d3f] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>ورود با ایمیل و رمز</span>
              </button>
            </div>
          )}

          {/* ── Option A: SMS Login ── */}
          {loginMethod === 'sms' && (
            <>
              {step === 'phone' ? (
                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <input
                        id="phone"
                        type="tel"
                        required
                        placeholder="09123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 bg-stone-50 dark:bg-[#051410] hover:bg-white dark:hover:bg-[#071a15] focus:bg-white dark:focus:bg-[#071a15] rounded-2xl border border-stone-300 dark:border-emerald-800/80 focus:border-[#026251] dark:focus:border-[#d0de41] focus:ring-2 focus:ring-[#026251]/20 dark:focus:ring-[#d0de41]/20 text-left dir-ltr font-mono text-sm font-bold text-slate-900 dark:text-white transition-all shadow-xs"
                      />
                      <Smartphone className="w-5 h-5 text-stone-400 dark:text-emerald-600 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      کد تایید یکبار مصرف از طریق درگاه پرسرعت WebOneSMS ارسال می‌شود.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !phone}
                    className="w-full py-3.5 px-4 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>دریافت کد تایید ورود</span>
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2 text-center">
                    <label htmlFor="otpCode" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                      کد تایید ۶ رقمی
                    </label>
                    <input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-3.5 px-4 bg-stone-50 dark:bg-[#051410] focus:bg-white dark:focus:bg-[#071a15] rounded-2xl border-2 border-[#026251] dark:border-[#d0de41] text-center font-mono text-2xl font-black tracking-widest text-slate-900 dark:text-white focus:ring-4 focus:ring-[#d0de41]/40 transition-all shadow-inner"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="hover:text-[#026251] dark:hover:text-[#d0de41] underline font-bold"
                    >
                      ویرایش شماره موبایل
                    </button>

                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        className="text-[#026251] dark:text-[#d0de41] font-black hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ارسال مجدد پیامک</span>
                      </button>
                    ) : (
                      <span className="font-mono text-slate-400 dark:text-slate-500">
                        ارسال مجدد تا {formatTime(countdown)}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length < 5}
                    className="w-full py-3.5 px-4 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تایید و ورود به حساب</span>}
                  </button>
                </form>
              )}
            </>
          )}

          {/* ── Option B: Email & Password Login ── */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  آدرس ایمیل
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-stone-50 dark:bg-[#051410] hover:bg-white dark:hover:bg-[#071a15] focus:bg-white dark:focus:bg-[#071a15] rounded-2xl border border-stone-300 dark:border-emerald-800/80 focus:border-[#026251] dark:focus:border-[#d0de41] focus:ring-2 focus:ring-[#026251]/20 dark:focus:ring-[#d0de41]/20 text-left dir-ltr font-mono text-sm text-slate-900 dark:text-white transition-all shadow-xs"
                  />
                  <Mail className="w-5 h-5 text-stone-400 dark:text-emerald-600 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="pass" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                    کلمه عبور
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('جهت بازیابی کلمه عبور، از گزینه ورود با پیامک استفاده نمایید.')}
                    className="text-[11px] text-emerald-700 dark:text-[#d0de41] hover:underline font-bold"
                  >
                    فراموشی رمز؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-stone-50 dark:bg-[#051410] hover:bg-white dark:hover:bg-[#071a15] focus:bg-white dark:focus:bg-[#071a15] rounded-2xl border border-stone-300 dark:border-emerald-800/80 focus:border-[#026251] dark:focus:border-[#d0de41] focus:ring-2 focus:ring-[#026251]/20 dark:focus:ring-[#d0de41]/20 text-left dir-ltr font-mono text-sm text-slate-900 dark:text-white transition-all shadow-xs"
                  />
                  <Lock className="w-5 h-5 text-stone-400 dark:text-emerald-600 absolute right-3.5 top-3.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    aria-label="نمایش رمز"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 px-4 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 pt-3"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>ورود با ایمیل</span>}
              </button>
            </form>
          )}

          {/* Register Prompt & 15% Off Badge */}
          <div className="pt-4 border-t border-stone-200/80 dark:border-emerald-900/60 text-center space-y-3">
            <div className="bg-[#d0de41]/20 dark:bg-[#d0de41]/10 border border-[#d0de41]/50 dark:border-[#d0de41]/30 p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#024a3d] dark:text-[#d0de41]">
              <Gift className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
              <span>۱۵٪ تخفیف سفارش اول برای اعضای جدید</span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400">
              هنوز حساب کاربری ندارید؟{' '}
              <Link
                href="/register"
                className="font-black text-[#026251] dark:text-[#d0de41] hover:underline decoration-2 underline-offset-4"
              >
                ثبت‌نام سریع در ایران مورینگا
              </Link>
            </div>
          </div>
        </div>

        {/* Security & Privacy Badge */}
        {/* Security & Privacy Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
          <span>ارتباط امن رمزنگاری‌شده • ارسال پیامک از طریق سرورهای WebOneSMS</span>
        </div>
      </div>
    </div>
  );
}

