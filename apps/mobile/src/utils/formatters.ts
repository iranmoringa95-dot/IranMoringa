import { OrderStatus } from '../types';
import { colors } from '../theme/colors';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: number | string | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  return str.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)]);
}

export function formatNumberWithCommas(num: number | string): string {
  if (!num && num !== 0) return '۰';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toPersianDigits(parts.join('.'));
}

export function formatToman(amountIRR: number): string {
  const toman = Math.floor(amountIRR / 10);
  return `${formatNumberWithCommas(toman)} تومان`;
}

export function formatDirectToman(amountToman: number): string {
  return `${formatNumberWithCommas(amountToman)} تومان`;
}

export function formatJalaliDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return toPersianDigits(dateStr);
    }
    // Simple Jalali conversion
    const gy = d.getFullYear();
    const gm = d.getMonth() + 1;
    const gd = d.getDate();

    const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy2 = gm > 2 ? gy : gy - 1;
    let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + gDaysInMonth[gm - 1];
    let jy = -1595 + 33 * Math.floor((days - 1) / 12053);
    days = (days - 1) % 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let jm = 0;
    let jd = 0;
    if (days < 186) {
      jm = 1 + Math.floor(days / 31);
      jd = 1 + (days % 31);
    } else {
      days -= 186;
      jm = 7 + Math.floor(days / 30);
      jd = 1 + (days % 30);
    }

    const pad = (n: number) => (n < 10 ? `۰${n}` : toPersianDigits(n));
    return `${toPersianDigits(jy)}/${pad(jm)}/${pad(jd)}`;
  } catch {
    return toPersianDigits(dateStr);
  }
}

export function getOrderStatusInfo(status: OrderStatus): { label: string; color: string; bg: string } {
  switch (status) {
    case 'pending_payment':
      return { label: 'در انتظار پرداخت', color: colors.status.pending, bg: colors.status.pendingBg };
    case 'paid':
      return { label: 'پرداخت شده', color: colors.status.paid, bg: colors.status.paidBg };
    case 'processing':
      return { label: 'در حال پردازش', color: colors.status.processing, bg: colors.status.processingBg };
    case 'packed':
      return { label: 'بسته‌بندی شده', color: colors.status.packed, bg: colors.status.packedBg };
    case 'shipped':
      return { label: 'ارسال شده', color: colors.status.shipped, bg: colors.status.shippedBg };
    case 'delivered':
      return { label: 'تحویل داده شده', color: colors.status.delivered, bg: colors.status.deliveredBg };
    case 'cancelled':
      return { label: 'لغو شده', color: colors.status.cancelled, bg: colors.status.cancelledBg };
    case 'refund_requested':
      return { label: 'درخواست بازگشت', color: colors.status.pending, bg: colors.status.pendingBg };
    case 'refunded':
      return { label: 'بازگشت وجه شده', color: colors.status.refunded, bg: colors.status.refundedBg };
    default:
      return { label: status, color: colors.neutral[600], bg: colors.neutral[100] };
  }
}

export function getProductStatusInfo(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'published':
      return { label: 'منتشر شده', color: colors.primary[700], bg: colors.primary[100] };
    case 'draft':
      return { label: 'پیش‌نویس', color: colors.accent.amber, bg: colors.accent.amberLight };
    case 'in_review':
      return { label: 'در حال بررسی', color: colors.accent.blue, bg: colors.accent.blueLight };
    case 'unpublished':
      return { label: 'غیرفعال', color: colors.neutral[600], bg: colors.neutral[200] };
    case 'archived':
      return { label: 'بایگانی شده', color: colors.accent.red, bg: colors.accent.redLight };
    default:
      return { label: status, color: colors.neutral[600], bg: colors.neutral[100] };
  }
}

export function getTierInfo(tier: string): { label: string; color: string; bg: string } {
  switch (tier) {
    case 'gold':
      return { label: 'طلایی', color: '#b45309', bg: '#fef3c7' };
    case 'silver':
      return { label: 'نقره‌ای', color: '#475569', bg: '#f1f5f9' };
    case 'bronze':
      return { label: 'برنزی', color: '#9a3412', bg: '#ffedd5' };
    default:
      return { label: 'عادی', color: colors.neutral[600], bg: colors.neutral[100] };
  }
}
