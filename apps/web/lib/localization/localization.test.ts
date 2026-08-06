import { normalizeDigits, normalizePersianText, normalizePhone } from './normalize';
import { irrToToman, formatToman } from './currency';
import { validatePostalCode } from './postal';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runLocalizationTests() {
  // 1. Digits
  assert(normalizeDigits('۰۹۱۲۳۴۵۶۷۸۹') === '09123456789', 'Persian digits');
  assert(normalizeDigits('٠٩١٢٣٤٥٦٧٨٩') === '09123456789', 'Arabic digits');

  // 2. Persian Text
  assert(normalizePersianText('مورينگا كبسول') === 'مورینگا کپسول', 'Arabic characters');

  // 3. Phone
  assert(normalizePhone('09123456789') === '+989123456789', 'Iranian phone standard');
  assert(normalizePhone('۰۹۱۲۳۴۵۶۷۸۹') === '+989123456789', 'Iranian phone Persian digits');
  assert(normalizePhone('+989123456789') === '+989123456789', 'Iranian phone E.164');

  // 4. Postal Code
  assert(validatePostalCode('۰۱۲۳۴۵۶۷۸۹').isValid === true, 'Postal code valid');
  assert(validatePostalCode('0123456789').normalized === '0123456789', 'Postal code normalized');
  assert(validatePostalCode('12345').isValid === false, 'Postal code invalid length');

  // 5. Currency
  assert(irrToToman(12750000) === 1275000, 'IRR to Toman conversion');
  assert(formatToman(12750000).includes('۱۲,۷۵۰,۰۰۰ تومان'), 'Toman formatting');

  return true;
}

// Run inline verification
runLocalizationTests();
