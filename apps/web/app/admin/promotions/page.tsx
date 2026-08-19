'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, RefreshCw, Play, CheckCircle2, XCircle, Clock, Percent, DollarSign, Layers, Users } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  code_normalized: string;
  discount_type: 'percentage' | 'fixed_amount';
  value_irr: number;
  percentage: number;
  min_order_amount: number;
  max_discount: number;
  total_usage_limit: number;
  used_count: number;
  reserved_count: number;
  usage_limit_per_user: number;
  is_first_order_only: boolean;
  stacking_policy: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
}

interface Redemption {
  id: string;
  coupon_code: string;
  user_id?: string;
  guest_identity?: string;
  amount_irr: number;
  status: 'reserved' | 'consumed' | 'released';
  reserved_at: string;
  consumed_at?: string;
}

interface SimulationResult {
  coupon_code: string;
  discount_type: string;
  subtotal_irr: number;
  eligible_subtotal_irr: number;
  discount_irr: number;
  discount_toman: number;
  final_total_irr: number;
  reason_fa?: string;
}

const API_BASE = 'http://localhost:8080/api/v1';

export default function AdminPromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'coupons' | 'simulator' | 'redemptions'>('coupons');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [percentage, setPercentage] = useState<number>(10);
  const [valueToman, setValueToman] = useState<number>(50000);
  const [minOrderToman, setMinOrderToman] = useState<number>(300000);
  const [maxDiscountToman, setMaxDiscountToman] = useState<number>(100000);
  const [totalLimit, setTotalLimit] = useState<number>(100);
  const [userLimit, setUserLimit] = useState<number>(1);
  const [isFirstOrderOnly, setIsFirstOrderOnly] = useState(false);
  const [creating, setCreating] = useState(false);

  // Simulator
  const [simCode, setSimCode] = useState('WELCOME10');
  const [simSubtotalToman, setSimSubtotalToman] = useState<number>(450000);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/promotions/coupons`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRedemptions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/promotions/redemptions`);
      if (res.ok) {
        const data = await res.json();
        setRedemptions(data.redemptions || []);
      }
    } catch {
      // Silently handle error
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetchRedemptions();
  }, [fetchCoupons, fetchRedemptions]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch(`${API_BASE}/admin/promotions/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          discount_type: discountType,
          percentage: discountType === 'percentage' ? percentage : 0,
          value_irr: discountType === 'fixed_amount' ? valueToman * 10 : 0,
          min_order_amount: minOrderToman * 10,
          max_discount: maxDiscountToman * 10,
          total_usage_limit: totalLimit,
          usage_limit_per_user: userLimit,
          is_first_order_only: isFirstOrderOnly,
          stacking_policy: 'exclusive',
        }),
      });

      if (res.ok) {
        alert('کد تخفیف جدید با موفقیت ایجاد شد.');
        setShowCreateModal(false);
        setNewCode('');
        fetchCoupons();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در ایجاد کد تخفیف.');
    } finally {
      setCreating(false);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    setSimError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/promotions/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: simCode,
          subtotal_irr: simSubtotalToman * 10,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      } else {
        const data = await res.json();
        setSimError(data.detail || 'امکان اعمال کد تخفیف وجود ندارد');
      }
    } catch {
      setSimError('خطا در ارتباط با سرور شبیه‌ساز.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">مدیریت پروموشن و کوپن‌های تخفیف</h1>
          <p className="text-xs text-slate-500">تعریف کدهای تخفیف درصدی و مبلغ ثابت، سقف‌های استفاده و شبیه‌ساز اعمال تخفیف</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs self-start"
        >
          <Plus className="w-4 h-4" />
          <span>ایجاد کد تخفیف جدید</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'coupons'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          لیست کوپن‌ها ({coupons.length.toLocaleString('fa-IR')})
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'simulator'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          شبیه‌ساز تخفیف (Simulator)
        </button>
        <button
          onClick={() => setActiveTab('redemptions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'redemptions'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          سوابق استفاده (Redemptions)
        </button>
      </div>

      {/* ── Coupons Tab ── */}
      {activeTab === 'coupons' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
              در حال بارگذاری کدهای تخفیف...
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <Tag className="w-8 h-8 mx-auto mb-2" />
              هیچ کد تخفیفی ثبت نشده است
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">کد تخفیف</th>
                  <th className="p-3.5">نوع</th>
                  <th className="p-3.5">مقدار تخفیف</th>
                  <th className="p-3.5">حداقل خرید (تومان)</th>
                  <th className="p-3.5">مصرف / سقف کل</th>
                  <th className="p-3.5">سقف هر کاربر</th>
                  <th className="p-3.5">شرایط</th>
                  <th className="p-3.5">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{c.code}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.discount_type === 'percentage' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {c.discount_type === 'percentage' ? 'درصدی' : 'مبلغ ثابت'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {c.discount_type === 'percentage' ? (
                        <span>٪{c.percentage.toLocaleString('fa-IR')} {c.max_discount > 0 && <span className="text-[10px] text-slate-500">(سقف {(c.max_discount / 10).toLocaleString('fa-IR')} تومان)</span>}</span>
                      ) : (
                        <span>{(c.value_irr / 10).toLocaleString('fa-IR')} تومان</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-700">{(c.min_order_amount / 10).toLocaleString('fa-IR')}</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {c.used_count.toLocaleString('fa-IR')} / {c.total_usage_limit === 0 ? 'نامحدود' : c.total_usage_limit.toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {c.usage_limit_per_user === 0 ? 'نامحدود' : `${c.usage_limit_per_user.toLocaleString('fa-IR')} بار`}
                    </td>
                    <td className="p-3.5">
                      {c.is_first_order_only ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">خرید اول</span>
                      ) : (
                        <span className="text-slate-400">عادی</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {c.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Simulator Tab ── */}
      {activeTab === 'simulator' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">شبیه‌ساز محاسبه تخفیف</h3>
            <p className="text-xs text-slate-500">تست کد تخفیف دقیقاً روی موتور محاسباتی پروداکشن</p>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">کد تخفیف</label>
              <input
                type="text"
                required
                placeholder="WELCOME10"
                value={simCode}
                onChange={(e) => setSimCode(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">مبلغ سبد خرید فرضی (تومان)</label>
              <input
                type="number"
                required
                value={simSubtotalToman}
                onChange={(e) => setSimSubtotalToman(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>اجرای شبیه‌سازی</span>
            </button>
          </form>

          {/* Result Output */}
          {simResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>کد تخفیف «{simResult.coupon_code}» قابل اعمال است</span>
              </div>
              <div className="space-y-1 text-slate-700 pt-2 border-t border-emerald-200/60">
                <div className="flex justify-between"><span>جمع اولیه سبد:</span><span>{(simResult.subtotal_irr / 10).toLocaleString('fa-IR')} تومان</span></div>
                <div className="flex justify-between text-emerald-700 font-bold"><span>مبلغ تخفیف:</span><span>−{simResult.discount_toman.toLocaleString('fa-IR')} تومان</span></div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-emerald-200/60"><span>مبلغ قابل پرداخت نهایی:</span><span>{(simResult.final_total_irr / 10).toLocaleString('fa-IR')} تومان</span></div>
              </div>
            </div>
          )}

          {simError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-2 text-red-800 text-xs font-semibold">
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{simError}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Redemptions Tab ── */}
      {activeTab === 'redemptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {redemptions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <Tag className="w-8 h-8 mx-auto mb-2" />
              هیچ سابقه استفاده‌ای ثبت نشده است
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">کد تخفیف</th>
                  <th className="p-3.5">شناسه کاربر / مهمان</th>
                  <th className="p-3.5">مبلغ تخفیف (تومان)</th>
                  <th className="p-3.5">وضعیت</th>
                  <th className="p-3.5">تاریخ رزرو</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{r.coupon_code}</td>
                    <td className="p-3.5 font-mono text-slate-600">{r.user_id || r.guest_identity || 'کاربر مهمان'}</td>
                    <td className="p-3.5 font-bold text-slate-900">{(r.amount_irr / 10).toLocaleString('fa-IR')}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'consumed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.status === 'reserved'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status === 'consumed' ? 'استفاده نهایی' : r.status === 'reserved' ? 'رزرو چک‌اوت' : 'آزادشده'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(r.reserved_at).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Create Coupon Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-900 text-base">ایجاد کد تخفیف جدید</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">کد تخفیف (مثال: SUMMER1405)</label>
                <input
                  type="text"
                  required
                  placeholder="SUMMER1405"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نوع تخفیف</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="percentage">درصدی (٪)</option>
                    <option value="fixed_amount">مبلغ ثابت (تومان)</option>
                  </select>
                </div>

                {discountType === 'percentage' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">درصد تخفیف (۱ تا ۱۰۰)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={percentage}
                      onChange={(e) => setPercentage(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">مبلغ تخفیف (تومان)</label>
                    <input
                      type="number"
                      required
                      value={valueToman}
                      onChange={(e) => setValueToman(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">حداقل مبلغ خرید (تومان)</label>
                  <input
                    type="number"
                    value={minOrderToman}
                    onChange={(e) => setMinOrderToman(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {discountType === 'percentage' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">سقف تخفیف درصدی (تومان)</label>
                    <input
                      type="number"
                      value={maxDiscountToman}
                      onChange={(e) => setMaxDiscountToman(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سقف کل استفاده (۰ = نامحدود)</label>
                  <input
                    type="number"
                    value={totalLimit}
                    onChange={(e) => setTotalLimit(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سقف هر کاربر (۰ = نامحدود)</label>
                  <input
                    type="number"
                    value={userLimit}
                    onChange={(e) => setUserLimit(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="firstOrderCheck"
                  checked={isFirstOrderOnly}
                  onChange={(e) => setIsFirstOrderOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="firstOrderCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  فقط برای اولین خرید مشتریان جدید قابل استفاده باشد
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  ثبت و ذخیره کد تخفیف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
