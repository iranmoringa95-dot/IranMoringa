// Digits Replacement Map
const digitMap: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

// Arabic to Persian Characters Replacement Map
const charMap: Record<string, string> = {
  'ي': 'ی',
  'ك': 'ک',
  'ة': 'ه',
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
  'ؤ': 'و',
  'ئ': 'ی',
};

/**
 * Normalizes Persian (۰-۹) and Arabic (٠-٩) digits to ASCII English digits (0-9).
 */
export function normalizeDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[۰-۹٠-٩]/g, (w) => digitMap[w] || w);
}

/**
 * Normalizes Arabic characters (ي/ك) to Persian counterparts (ی/ک) and cleans extra spaces.
 */
export function normalizePersianText(str: string): string {
  if (!str) return '';
  let cleaned = str.trim();
  cleaned = cleaned.replace(/[يكةأإآؤئ]/g, (w) => charMap[w] || w);
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned;
}

/**
 * Normalizes an Iranian mobile phone number to canonical E.164 (+989xxxxxxxxx) format.
 */
export function normalizePhone(phone: string): string {
  let cleaned = normalizeDigits(phone).trim().replace(/[\s-]/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('+98')) return cleaned;
  if (cleaned.startsWith('0098')) return `+98${cleaned.slice(4)}`;
  if (cleaned.startsWith('98')) return `+98${cleaned.slice(2)}`;
  if (cleaned.startsWith('0')) return `+98${cleaned.slice(1)}`;
  return `+98${cleaned}`;
}
