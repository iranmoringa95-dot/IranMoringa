import { normalizeDigits } from './normalize';

/**
 * Validates whether the given string is a valid 10-digit Iranian postal code.
 */
export function validatePostalCode(str: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!str) {
    return { isValid: false, error: 'کد پستی وارد نشده است.' };
  }

  const normalized = normalizeDigits(str).trim().replace(/[\s-]/g, '');

  if (!/^\d{10}$/.test(normalized)) {
    return { isValid: false, error: 'کد پستی باید دقیقاً یک عدد ۱۰ رقمی باشد.' };
  }

  return { isValid: true, normalized };
}
