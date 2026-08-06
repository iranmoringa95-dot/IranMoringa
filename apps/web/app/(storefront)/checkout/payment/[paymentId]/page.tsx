'use client';

import { useState, useEffect, use } from 'react';

interface PaymentDetail {
  id: string;
  order_id: string;
  order_number: string;
  amount_irr: number;
  status: string;
  gateway_name: string;
}

export default function FakePaymentGatewayPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = use(params);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function fetchPayment() {
      try {
        const res = await fetch(`http://localhost:8080/api/v1/payments/${paymentId}`);
        if (res.ok) {
          const data = await res.json();
          setPayment(data);
        }
      } catch (err) {
        setPayment(null);
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();
  }, [paymentId]);

  const handleVerify = async (success: boolean) => {
    setVerifying(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate_success: success }),
      });
      const data = await res.json();
      window.location.href = `/checkout/result?payment_id=${paymentId}&status=${data.status}&order_number=${data.order_number}`;
    } catch (err) {
      alert('خطا در ارتباط با درگاه پرداخت آزمایشی');
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="text-sm font-medium text-slate-600">در حال انتقال به درگاه پرداخت...</div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-md space-y-4">
          <h2 className="text-lg font-bold text-red-600">تراکنش یافت نشد</h2>
          <p className="text-xs text-slate-500">شناسه درگاه پرداخت معتبر نیست.</p>
        </div>
      </div>
    );
  }

  const amountToman = Math.round(payment.amount_irr / 10);

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700">
        {/* Gateway Header */}
        <div className="bg-blue-900 text-white p-6 text-center space-y-2 border-b border-blue-800">
          <div className="inline-block bg-blue-800 text-blue-200 text-xs px-3 py-1 rounded-full font-mono">
            درگاه پرداخت آزمایشی (SANDBOX)
          </div>
          <h2 className="text-xl font-black">شاپرک - به پرداخت ملت (توسعه)</h2>
          <p className="text-xs text-blue-200">سفارش شماره: {payment.order_number}</p>
        </div>

        {/* Payment Amount Box */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl text-center space-y-1 border border-slate-200">
            <span className="text-xs text-slate-500">مبلغ قابل پرداخت</span>
            <div className="text-2xl font-black text-slate-900">
              {amountToman.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-200 leading-relaxed text-center">
            این یک درگاه آزمایشی است. می‌توانید نتیجه پرداخت را شبیه‌سازی کنید.
          </div>

          {/* Simulate Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleVerify(true)}
              disabled={verifying}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {verifying ? 'در حال تایید...' : '✔ شبیه‌سازی پرداخت موفق'}
            </button>

            <button
              onClick={() => handleVerify(false)}
              disabled={verifying}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              ✖ شبیه‌سازی انصراف / پرداخت ناموفق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
