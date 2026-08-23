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
        throw new Error(data.detail || 'کد تأیید معتبر نیست');
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

      <div className="w-full max-w-lg mx-auto relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-6">
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
              {step === 'form' && 'ثبت‌نام و عضویت در ایران مورینگا'}
              {step === 'otp' && 'تأیید شماره موبایل با پیامک'}
              {step === 'success' && 'عضویت شما با موفقیت انجام شد! 🎉'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal leading-relaxed">
              {step === 'form' && 'با ایجاد حساب، به خانواده مصرف‌کنندگان سوپرفود خالص ایران مورینگا بپیوندید.'}
              {step === 'otp' && `کد فعال‌سازی پیامک‌شده به شماره ${phone} را وارد نمایید.`}
              {step === 'success' && 'کد تخفیف شما فعال گردید. در حال انتقال به حساب کاربری...'}
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-[#18221b] py-8 px-6 sm:px-9 shadow-card hover:shadow-float border border-[#e5e8de] dark:border-stone-800 rounded-[2rem] space-y-6 transition-all">
          {/* Welcome Discount Ribbon */}
          {step !== 'success' && (
            <div className="bg-[#114627] text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs border border-[#14552f]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#f47a24] text-white rounded-xl font-bold shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-[#f47a24]">هدیه ثبت‌نام ایران مورینگا</span>
                  <span className="block text-[11px] text-[#c3e5cd]">۱۵٪ تخفیف روی اولین سفارش شما</span>
                </div>
              </div>
              <span className="font-mono text-xs bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 font-bold">
                MORINGA15
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 shadow-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Development Mock OTP Alert */}
          {devOtp && step === 'otp' && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-950 dark:text-amber-200 text-xs p-3 rounded-2xl flex items-center justify-between">
              <span className="font-bold">کد تأیید آزمایشی:</span>
              <span className="font-mono font-bold text-sm bg-white dark:bg-stone-900 px-2.5 py-1 rounded-xl border border-amber-300 dark:border-amber-800">
                {devOtp}
              </span>
            </div>
          )}

          {/* ── Step 1: Registration Form ── */}
          {step === 'form' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="مثال: احسان پویا"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/80 focus:border-[#176b39] placeholder:text-stone-400 dark:placeholder:text-stone-500 placeholder:font-light text-sm font-medium text-[#17251c] dark:text-white transition-all shadow-xs min-h-[48px]"
                  />
                  <User className="w-5 h-5 text-stone-400 dark:text-stone-500 absolute right-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  شماره موبایل <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => {
                      const p2e: Record<string, string> = {
                        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
                        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
                        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
                        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
                      };
                      const cleaned = e.target.value.replace(/[۰-۹٠-٩]/g, (w) => p2e[w] || w);
                      setPhone(cleaned);
                    }}
                    className="w-full pl-4 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/80 focus:border-[#176b39] focus:ring-2 focus:ring-[#176b39]/10 text-right dir-rtl font-sans placeholder:text-stone-400 dark:placeholder:text-stone-500 placeholder:font-light placeholder:text-xs text-sm font-medium text-[#17251c] dark:text-white transition-all shadow-xs min-h-[48px]"
                  />
                  <Smartphone className="w-5 h-5 text-stone-400 dark:text-stone-500 absolute right-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal leading-relaxed">
                  پیامک فعال‌سازی حساب به این شماره ارسال خواهد شد.
                </p>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  آدرس ایمیل <span className="text-stone-400 font-normal">(اختیاری - جهت دریافت فاکتور)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/80 focus:border-[#176b39] text-left dir-ltr font-mono text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 text-[#17251c] dark:text-white transition-all shadow-xs min-h-[48px]"
                  />
                  <Mail className="w-5 h-5 text-stone-400 dark:text-stone-500 absolute right-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  کلمه عبور <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="حداقل ۶ کاراکتر"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/80 focus:border-[#176b39] text-left dir-ltr font-mono text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 text-[#17251c] dark:text-white transition-all shadow-xs min-h-[48px]"
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

              {/* Referral Code (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="referral" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  کد معرف یا تخفیف ویژه <span className="text-stone-400 font-normal">(اختیاری)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="referral"
                    type="text"
                    placeholder="کد دعوت دوستان"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 focus:border-[#176b39] text-xs font-mono placeholder:text-stone-400 text-[#17251c] dark:text-white transition-all min-h-[44px]"
                  />
                  <Tag className="w-4 h-4 text-stone-400 absolute right-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-[#176b39] focus:ring-[#176b39] border-stone-300"
                  />
                  <span>
                    <Link href="/terms" className="text-[#176b39] dark:text-[#97d2a7] font-bold hover:underline">
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
                className="w-full py-3.5 px-4 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl font-bold text-sm transition-all shadow-card hover:shadow-float active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-h-[48px]"
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
              <div className="space-y-2.5 text-center">
                <label htmlFor="otpCode" className="block text-xs font-bold text-[#17251c] dark:text-stone-200">
                  کد تأیید ۶ رقمی فعال‌سازی
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
                  className="w-full py-3 px-4 bg-[#fafbf8] dark:bg-stone-800/80 rounded-2xl border-2 border-[#176b39] text-center font-mono text-2xl font-bold tracking-widest text-[#17251c] dark:text-white focus:outline-none transition-all shadow-inner min-h-[50px]"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-0.5">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="hover:text-[#176b39] dark:hover:text-[#97d2a7] underline font-bold"
                >
                  ویرایش اطلاعات
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleRegisterSubmit}
                    className="text-[#176b39] dark:text-[#97d2a7] font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ارسال مجدد کد</span>
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
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تکمیل عضویت و دریافت هدیه</span>}
              </button>
            </form>
          )}

          {/* ── Step 3: Success Screen ── */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-[#c3e5cd] text-[#176b39] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#17251c] dark:text-white">عضویت با موفقیت انجام شد</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  حساب کاربری شما فعال شد و کد تخفیف <strong>MORINGA15</strong> برای شما در دسترس است.
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl text-xs font-bold shadow-card hover:shadow-float transition-all"
                >
                  <span>مشاهده محصولات فروشگاه</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Login Link */}
          {step !== 'success' && (
            <div className="pt-4 border-t border-[#e5e8de] dark:border-stone-800 text-center text-xs text-stone-600 dark:text-stone-400">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link
                href="/login"
                className="font-bold text-[#176b39] dark:text-[#97d2a7] hover:underline"
              >
                ورود به حساب کاربری
              </Link>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-stone-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#176b39] dark:text-[#2ea355]" />
          <span>حفاظت کامل از حریم خصوصی داده‌ها • احراز هویت پیامکی امن</span>
        </div>
      </div>
    </div>
  );
}


