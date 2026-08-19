'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Package, Download, RefreshCw, AlertTriangle, Layers, Calendar, BarChart3 } from 'lucide-react';

interface ExecutiveSummary {
  gross_sales_irr: number;
  discount_total_irr: number;
  shipping_revenue_irr: number;
  refunded_amount_irr: number;
  net_revenue_irr: number;
  total_orders: number;
  paid_orders: number;
  cancelled_orders: number;
  payment_success_rate: number;
  average_order_value_irr: number;
  low_stock_count: number;
  out_of_stock_count: number;
  generated_at: string;
  currency_unit: string;
}

interface ProductPerformance {
  product_id: string;
  sku: string;
  product_name_fa: string;
  units_sold: number;
  gross_sales_irr: number;
  net_revenue_irr: number;
}

const API_BASE = 'http://localhost:8080/api/v1';

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/admin/reports/summary`),
        fetch(`${API_BASE}/admin/reports/products?limit=10`),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handleExportCSV = async (reportType: string) => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/reports/exports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: reportType, requested_by: 'مدیر ارشد' }),
      });

      if (res.ok) {
        const job = await res.json();
        // Trigger file download
        window.open(`${API_BASE}${job.download_url}`, '_blank');
      } else {
        alert('خطا در صدور فایل اکسپورت گزارش.');
      }
    } catch {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setExporting(false);
    }
  };

  const toToman = (irr: number) => Math.floor(irr / 10).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">گزارش‌های مالی، تحلیلی و دشبورد مدیریتی</h1>
          <p className="text-xs text-slate-500">پایش لایو آمار فروش، درآمد خالص، عملکرد محصولات و خروجی گزارش‌ها</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => handleExportCSV('sales_summary')}
            disabled={exporting}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>خروجی اکسل/CSV فروش</span>
          </button>
          <button
            onClick={() => fetchReportsData()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="به‌روزرسانی آمار"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold">درآمد خالص (Net Revenue)</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-700">
              {toToman(summary.net_revenue_irr)} <span className="text-xs font-normal">تومان</span>
            </div>
            <div className="text-[10px] text-slate-400">
              فروش ناخالص: {toToman(summary.gross_sales_irr)} تومان
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold">سفارشات پرداخت‌شده</span>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">
              {summary.paid_orders.toLocaleString('fa-IR')} <span className="text-xs font-normal">سفارش</span>
            </div>
            <div className="text-[10px] text-slate-500">
              نرخ موفقیت پرداخت: {summary.payment_success_rate.toFixed(1)}٪
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold">میانگین سفارش (AOV)</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">
              {toToman(summary.average_order_value_irr)} <span className="text-xs font-normal">تومان</span>
            </div>
            <div className="text-[10px] text-slate-400">
              مجموع تخفیفات: {toToman(summary.discount_total_irr)} تومان
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold">هشدار موجودی انبار</span>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-700">
              {summary.low_stock_count.toLocaleString('fa-IR')} <span className="text-xs font-normal">محصول کم‌موجودی</span>
            </div>
            <div className="text-[10px] text-red-600 font-bold">
              اتمام موجودی: {summary.out_of_stock_count.toLocaleString('fa-IR')} مورد
            </div>
          </div>
        </div>
      )}

      {/* Top Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>پرفروش‌ترین محصولات (۱۰ محصول برتر)</span>
          </h3>
          <button
            onClick={() => handleExportCSV('products_performance')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            دانلود خروجی محصولات
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">در حال بارگذاری گزارش محصولات...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">هیچ داد‌ه‌ای یافت نشد</div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">رتبه</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">نام محصول</th>
                <th className="p-3.5">تعداد فروخته‌شده</th>
                <th className="p-3.5">درآمد خالص (تومان)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p, index) => (
                <tr key={p.product_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-400">#{index + 1}</td>
                  <td className="p-3.5 font-mono text-slate-600">{p.sku || 'N/A'}</td>
                  <td className="p-3.5 font-bold text-slate-900">{p.product_name_fa}</td>
                  <td className="p-3.5 font-bold text-emerald-700">{p.units_sold.toLocaleString('fa-IR')} عدد</td>
                  <td className="p-3.5 font-bold text-slate-900">{toToman(p.net_revenue_irr)} تومان</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
