'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Smartphone,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Gift,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { setCustomerSession } from '@/lib/customer-store';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // OTP Verification Fields
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Timer
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError('لطفاً شرایط و قوانین عضویت در ایران مورینگا را بپذیرید.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          password,
          referralCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'خطا در ثبت‌نام کاربر');
      }

      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }

      setStep('otp');
      setCountdown(120);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'مشکلی در ارتباط با سرور یا سامانه پیامکی پیش آمده است.');
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

      setCustomerSession(phone, fullName || 'احسان پویا');
      setStep('success');
      setTimeout(() => {
        router.push('/account');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'کد واردشده اشتباه یا منقضی شده است.');
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

      {/* Background Decorative Blurs */}
      <div className="absolute -top-32 -right-32 w-[450px] h-[450px] bg-[#d0de41]/20 dark:bg-[#d0de41]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-[#026251]/15 dark:bg-[#026251]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-6">
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
              {step === 'form' && 'ثبت‌نام و عضویت در باشگاه سلامتی'}
              {step === 'otp' && 'تایید شماره موبایل با پیامک'}
              {step === 'success' && 'عضویت شما با موفقیت انجام شد! 🎉'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {step === 'form' && 'با ایجاد حساب، به خانواده مصرف‌کنندگان سوپرفود خالص ایران مورینگا بپیوندید.'}
              {step === 'otp' && `کد فعال‌سازی پیامک‌شده به شماره ${phone} را وارد فرمایید.`}
              {step === 'success' && 'کد تخفیف ۱۵ درصدی شما فعال گردید. در حال انتقال به فروشگاه...'}
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white/95 dark:bg-[#0a2019]/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl border border-stone-200/90 dark:border-emerald-800/50 rounded-3xl space-y-6">
          {/* Welcome Discount Ribbon */}
          {step !== 'success' && (
            <div className="bg-gradient-to-r from-[#024a3d] via-[#026251] to-[#01382e] text-white p-3.5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#d0de41] text-[#026251] rounded-xl font-black shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black text-xs text-[#d0de41]">هدیه خوش‌آمدگویی ایران مورینگا</span>
                  <span className="block text-[11px] text-white/90">۱۵٪ تخفیف روی کل سبد خرید اول</span>
                </div>
              </div>
              <span className="font-mono text-xs bg-white/20 px-2.5 py-1 rounded-lg border border-white/20 font-bold">
                MORINGA15
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Development Mock OTP Alert */}
          {devOtp && step === 'otp' && (
            <div className="bg-[#fef9c3] dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs p-3 rounded-2xl flex items-center justify-between">
              <span className="font-bold">کد تایید آزمایشی توسعه:</span>
              <span className="font-mono font-black text-sm bg-white dark:bg-amber-900/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-600">
                {devOtp}
              </span>
            </div>
          )}

          {/* ── Step 1: Registration Form ── */}
          {step === 'form' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label htmlFor="fullName" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="مثال: سارا احمدی"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-stone-50 dark:bg-[#051410] hover:bg-white dark:hover:bg-[#071a15] focus:bg-white dark:focus:bg-[#071a15] rounded-2xl border border-stone-300 dark:border-emerald-800/80 focus:border-[#026251] dark:focus:border-[#d0de41] focus:ring-2 focus:ring-[#026251]/20 dark:focus:ring-[#d0de41]/20 text-sm font-medium text-slate-900 dark:text-white transition-all shadow-xs"
                  />
                  <User className="w-5 h-5 text-stone-400 dark:text-emerald-600 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label htmlFor="phone" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  شماره موبایل <span className="text-rose-500">*</span>
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
                  پیامک فعال‌سازی حساب از طریق WebOneSMS ارسال می‌گردد.
                </span>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  آدرس ایمیل <span className="text-slate-400 font-normal">(اختیاری - جهت دریافت فاکتور)</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-stone-50 dark:bg-[#051410] hover:bg-white dark:hover:bg-[#071a15] focus:bg-white dark:focus:bg-[#071a15] rounded-2xl border border-stone-300 dark:border-emerald-800/80 focus:border-[#026251] dark:focus:border-[#d0de41] focus:ring-2 focus:ring-[#026251]/20 dark:focus:ring-[#d0de41]/20 text-left dir-ltr font-mono text-sm text-slate-900 dark:text-white transition-all shadow-xs"
                  />
                  <Mail className="w-5 h-5 text-stone-400 dark:text-emerald-600 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  کلمه عبور <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="حداقل ۶ کاراکتر"
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

              {/* Referral Code (Optional) */}
              <div className="space-y-1">
                <label htmlFor="referral" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  کد معرف یا تخفیف ویژه <span className="text-slate-400 font-normal">(اختیاری)</span>
                </label>
                <div className="relative">
                  <input
                    id="referral"
                    type="text"
                    placeholder="کد دعوت دوستان یا جشنواره"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 bg-stone-50 dark:bg-[#051410] hover:bg-white dark:hover:bg-[#071a15] focus:bg-white dark:focus:bg-[#071a15] rounded-2xl border border-stone-300 dark:border-emerald-800/80 focus:border-[#026251] text-xs font-mono text-slate-800 dark:text-white transition-all"
                  />
                  <Tag className="w-4 h-4 text-stone-400 dark:text-emerald-600 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-[#026251] focus:ring-[#026251] border-stone-300"
                  />
                  <span>
                    <Link href="/terms" className="text-[#026251] dark:text-[#d0de41] font-bold hover:underline">
                      قوانین و حریم خصوصی
                    </Link>{' '}
                    ایران مورینگا را می‌پذیرم.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !fullName || !phone || !password}
                className="w-full py-3.5 px-4 bg-[#026251] hover:bg-[#024a3d] text-white rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 pt-3"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>ثبت‌نام و دریافت کد پیامکی</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP Verification ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2 text-center">
                <label htmlFor="otpCode" className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  کد تایید ۶ رقمی فعال‌سازی
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
                  onClick={() => setStep('form')}
                  className="hover:text-[#026251] dark:hover:text-[#d0de41] underline font-bold"
                >
                  ویرایش اطلاعات
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleRegisterSubmit}
                    className="text-[#026251] dark:text-[#d0de41] font-black hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ارسال مجدد کد</span>
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
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تکمیل عضویت و دریافت هدیه</span>}
              </button>
            </form>
          )}

          {/* ── Step 3: Success Screen ── */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4 animate-scaleUp">
              <div className="w-16 h-16 bg-[#d0de41]/30 text-[#026251] dark:text-[#d0de41] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#d0de41]/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">تبریک! به جمع ما پیوستید</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  حساب کاربری شما با موفقیت فعال شد و کد تخفیف <strong>MORINGA15</strong> برای شما اعمال گردید.
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#026251] text-white rounded-2xl text-xs font-black shadow-lg hover:bg-[#024a3d] transition-all"
                >
                  <span>ورود مستقیم به فروشگاه</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Login Link */}
          {step !== 'success' && (
            <div className="pt-4 border-t border-stone-200/80 dark:border-emerald-900/60 text-center text-xs text-slate-600 dark:text-slate-400">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link
                href="/login"
                className="font-black text-[#026251] dark:text-[#d0de41] hover:underline decoration-2 underline-offset-4"
              >
                ورود به حساب کاربری
              </Link>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#026251] dark:text-[#d0de41]" />
          <span>حفاظت ۱۰۰٪ از داده‌ها • احراز هویت پیامکی از طریق WebOneSMS</span>
        </div>
      </div>
    </div>
  );
}

