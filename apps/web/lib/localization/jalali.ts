const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
];

/**
 * Formats a Date or ISO date string into Persian Shamsi (Jalali) format.
 */
export function toJalaliDate(date: Date | string, format: 'short' | 'long' = 'long'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    calendar: 'persian',
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: format === 'long' ? 'long' : '2-digit',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', options).format(d);
}
