'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Headset,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Phone,
  Settings,
  Sparkles,
  Save,
  User,
  Eye,
  Smartphone,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { SupportWidgetConfig } from '@/lib/support-config-store';

const EMOJI_OPTIONS = ['👨‍💼', '👩‍💼', '🧑‍⚕️', '🌿', '🎧', '📞', '✨', '🌱'];

export default function AdminSupportPage() {
  const [config, setConfig] = useState<SupportWidgetConfig>({
    consultantName: 'آقای کامیاب',
    consultantTitle: 'مشاور تخصصی و پاسخگوی سفارشات',
    consultantRoleDesc: 'کارشناس گیاهان دارویی و سوپرفود مورینگا',
    avatarEmoji: '👨‍💼',
    avatarUrl: '',
    phone: '09175929345',
    phoneDisplay: '۰۹۱۷۵۹۲۹۳۴۵',
    telegramHandle: '@Iranmoringa95',
    telegramUrl: 'https://t.me/Iranmoringa95',
    baleUrl: 'https://ble.ir/iranmoringa',
    whatsappUrl: 'https://wa.me/989175929345',
    whatsappNumber: '09175929345',
    workingHours: 'همه‌روزه ۸:۰۰ الی ۲۲:۰۰',
    responseTime: 'کمتر از ۵ دقیقه',
    enableWidget: true,
    enableGreetingBubble: true,
    greetingMessage: 'مشاوره تخصصی و ثبت سفارش آنلاین',
  });

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Fetch Consultant Config
  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/v1/support/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      // Silently handle
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSavedToast(false);

    try {
      const res = await fetch('/api/v1/support/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setConfigSavedToast(true);
        setTimeout(() => setConfigSavedToast(false), 4000);
      } else {
        alert('خطا در ذخیره تنظیمات پشتیبان.');
      }
    } catch {
      alert('مشکل در ارتباط با سرور.');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Headset className="w-6 h-6 text-[#176b39] dark:text-[#2ea355]" />
            <span>مدیریت مشاور و پشتیبانی آنلاین</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            تنظیم مشخصات مشاور، تصویر پروفایل، شماره تماس، و کانال‌های ارتباطی ویجت آنلاین فروشگاه
          </p>
        </div>

        <div className="flex items-center gap-2">
          {configSavedToast && (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-800 dark:text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تغییرات با موفقیت ذخیره شد!</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchConfig()}
            className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بازخوانی</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-card space-y-6">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#176b39] dark:text-[#2ea355]" />
              <span>مشخصات فردی و کانال‌های ارتباطی مشاور</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              این اطلاعات بلافاصله در دکمه و پنجره مشاوره زنده سایت برای کاربران سراسر کشور فعال می‌گردد.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5 text-xs">
            {/* Row 1: Name & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  نام و نام خانوادگی مشاور / پشتیبان
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: آقای کامیاب"
                  value={config.consultantName}
                  onChange={(e) => setConfig({ ...config, consultantName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-medium focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  سمت و عنوان تخصصی
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مشاور تخصصی و پاسخگوی سفارشات"
                  value={config.consultantTitle}
                  onChange={(e) => setConfig({ ...config, consultantTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-medium focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Row 2: Avatar Emoji & Photo URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  انتخاب چهره / آیکون سریع
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setConfig({ ...config, avatarEmoji: emoji })}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                        config.avatarEmoji === emoji
                          ? 'bg-[#176b39] text-white border-[#176b39] scale-110 shadow-xs'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  آدرس تصویر اختصاصی مشاور (اختیاری)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={config.avatarUrl}
                  onChange={(e) => setConfig({ ...config, avatarUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white text-left dir-ltr font-mono focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
                <span className="text-[10px] text-stone-400">
                  در صورت وارد کردن عکس، تصویر جایگزین آیکون خواهد شد.
                </span>
              </div>
            </div>

            {/* Row 3: Contact Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  شماره تماس مستقیم پشتیبان
                </label>
                <input
                  type="tel"
                  required
                  placeholder="09175929345"
                  value={config.phone}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      phone: e.target.value,
                      phoneDisplay: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono text-left dir-ltr font-bold focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  آیدی یا لینک کانال تلگرام
                </label>
                <input
                  type="text"
                  required
                  placeholder="@Iranmoringa95 یا https://t.me/Iranmoringa95"
                  value={config.telegramUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleanHandle = val.includes('t.me/') ? '@' + val.split('t.me/')[1] : val;
                    const cleanUrl = val.startsWith('http') ? val : `https://t.me/${val.replace('@', '')}`;
                    setConfig({
                      ...config,
                      telegramUrl: cleanUrl,
                      telegramHandle: cleanHandle,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono text-left dir-ltr focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Row 4: Bale & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  لینک ارتباط در پیام‌رسان بله (Bale)
                </label>
                <input
                  type="url"
                  placeholder="https://ble.ir/iranmoringa"
                  value={config.baleUrl}
                  onChange={(e) => setConfig({ ...config, baleUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono text-left dir-ltr focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  لینک یا شماره واتس‌اپ
                </label>
                <input
                  type="text"
                  placeholder="https://wa.me/989175929345"
                  value={config.whatsappUrl}
                  onChange={(e) => setConfig({ ...config, whatsappUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono text-left dir-ltr focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Row 5: Working Hours & Bubble Message */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  ساعات کاری و پاسخگویی
                </label>
                <input
                  type="text"
                  placeholder="همه‌روزه ۸:۰۰ الی ۲۲:۰۰"
                  value={config.workingHours}
                  onChange={(e) => setConfig({ ...config, workingHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-200">
                  متن حباب پیام اولیه (بالای دکمه)
                </label>
                <input
                  type="text"
                  placeholder="مشاوره تخصصی و ثبت سفارش آنلاین"
                  value={config.greetingMessage}
                  onChange={(e) => setConfig({ ...config, greetingMessage: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:border-[#176b39] focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="flex items-center gap-3 p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableWidget}
                  onChange={(e) => setConfig({ ...config, enableWidget: e.target.checked })}
                  className="w-4 h-4 rounded text-[#176b39] focus:ring-[#176b39]"
                />
                <div>
                  <span className="font-bold text-stone-900 dark:text-white block">فعال‌بودن دکمه شناور</span>
                  <span className="text-[10px] text-stone-500">نمایش دکمه سبز مشاوره در گوشه سایت</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableGreetingBubble}
                  onChange={(e) => setConfig({ ...config, enableGreetingBubble: e.target.checked })}
                  className="w-4 h-4 rounded text-[#176b39] focus:ring-[#176b39]"
                />
                <div>
                  <span className="font-bold text-stone-900 dark:text-white block">حباب پیام خودکار</span>
                  <span className="text-[10px] text-stone-500">نمایش پیام خودکار با دکمه ضربدر پس از ۵ ثانیه</span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={savingConfig}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#176b39] hover:bg-[#14552f] text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-card hover:shadow-float active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
              >
                {savingConfig ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره تنظیمات مشاور و پشتیبان</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-3xl border border-stone-200 dark:border-stone-700 space-y-3 sticky top-6">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#176b39]" />
                <span>پیش‌نمایش زنده در فروشگاه:</span>
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Live Preview
              </span>
            </div>

            {/* Bubble Mockup */}
            <div className="p-3.5 bg-white dark:bg-[#18221b] rounded-2xl shadow-float border border-[#c3e5cd] dark:border-[#1e8240]/40 text-[#17251c] dark:text-[#f2f9f4] space-y-2 relative">
              <span className="absolute top-2 left-2 w-5 h-5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center text-[10px]">
                ✕
              </span>
              <div className="flex items-center gap-2.5 pl-5">
                <div className="w-9 h-9 rounded-xl bg-[#176b39] text-white flex items-center justify-center text-base shrink-0 overflow-hidden">
                  {config.avatarUrl ? (
                    <img src={config.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    config.avatarEmoji || '👨‍💼'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#176b39] dark:text-[#97d2a7] truncate">
                    {config.consultantName || 'آقای کامیاب'}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-300 truncate mt-0.5">
                    {config.greetingMessage || 'مشاوره تخصصی و ثبت سفارش آنلاین'}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[10px] font-bold text-[#176b39] dark:text-[#97d2a7]">
                <span>گفتگو و مشاوره رایگان</span>
                <span>شروع گفتگو ←</span>
              </div>
            </div>

            {/* Trigger Button Mockup */}
            <div className="flex items-center justify-end pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-full bg-[#176b39] text-white shadow-float">
                <div className="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-base overflow-hidden">
                  {config.avatarUrl ? (
                    <img src={config.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    config.avatarEmoji || '👨‍💼'
                  )}
                </div>
                <div className="text-right leading-tight pr-0.5">
                  <span className="text-xs font-black text-white block">مشاوره و پشتیبانی</span>
                  <span className="text-[10px] text-emerald-100 font-medium">ارتباط با {config.consultantName}</span>
                </div>
              </div>
            </div>

            {/* Config Summary */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-700 text-xs space-y-2 text-stone-600 dark:text-stone-400">
              <div className="flex items-center justify-between">
                <span>تلفن:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">{config.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>تلگرام:</span>
                <span className="font-mono font-bold text-sky-600">{config.telegramHandle || '@Iranmoringa95'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ساعات پاسخگویی:</span>
                <span className="font-medium text-stone-900 dark:text-white">{config.workingHours}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
