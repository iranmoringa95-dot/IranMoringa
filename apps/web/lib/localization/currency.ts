import { normalizeDigits } from './normalize';

/**
 * Converts Rial (IRR) to Toman (10 IRR = 1 Toman).
 */
export function irrToToman(irr: number): number {
  return Math.floor(irr / 10);
}

/**
 * Converts Toman to Rial (IRR).
 */
export function tomanToIrr(toman: number): number {
  return toman * 10;
}

/**
 * Formats an IRR amount into human-readable Toman string (e.g., 12750000 -> "۱,۲۷۵,۰۰۰ تومان").
 */
export function formatToman(irr: number, options?: { usePersianDigits?: boolean }): string {
  const toman = irrToToman(irr);
  const formattedWithCommas = toman.toLocaleString('fa-IR');

  if (options?.usePersianDigits === false) {
    return `${toman.toLocaleString('en-US')} تومان`;
  }

  return `${formattedWithCommas} تومان`;
}

/**
 * Formats IRR amount for Admin dual display showing both Toman and IRR.
 */
export function formatDualPrice(irr: number): { tomanStr: string; irrStr: string } {
  const toman = irrToToman(irr);
  return {
    tomanStr: `${toman.toLocaleString('fa-IR')} تومان`,
    irrStr: `${irr.toLocaleString('fa-IR')} ریال`,
  };
}
