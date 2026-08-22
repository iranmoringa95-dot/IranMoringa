import { CartItem } from './cart';
import { ALL_MORINGA_PRODUCTS } from './products-data';

export interface ShippingQuote {
  code: 'post_pishtaz' | 'courier_isfahan';
  name_fa: string;
  carrier: 'post' | 'courier';
  fee_irr: number;
  fee_toman: number;
  eta_min_days: number;
  eta_max_days: number;
  is_free: boolean;
  description: string;
  estimated_hours?: string;
  charged_weight_grams: number;
  volumetric_weight_grams: number;
  actual_weight_grams: number;
  packaging_tier_fa: string;
}

export interface ShippingParcelMetrics {
  actual_weight_grams: number;
  volumetric_weight_grams: number;
  charged_weight_grams: number;
  total_volume_cm3: number;
  packaging_tier_fa: string;
}

const ISFAHAN_NEIGHBORING_PROVINCES = [
  'چهارمحال و بختیاری',
  'چهارمحال',
  'یزد',
  'مرکزی',
  'فارس',
  'قم',
  'لرستان',
  'سمنان',
];

export function isCityIsfahan(city?: string): boolean {
  if (!city) return false;
  const c = city.trim();
  return c.includes('اصفهان') || c.toLowerCase() === 'isfahan' || c.toLowerCase() === 'esfahan';
}

export type ProvinceZone = 'intra_province' | 'neighboring' | 'non_neighboring';

export function detectProvinceZone(province?: string): ProvinceZone {
  if (!province) return 'non_neighboring';
  const clean = province.trim();
  if (clean.includes('اصفهان')) {
    return 'intra_province';
  }
  for (const p of ISFAHAN_NEIGHBORING_PROVINCES) {
    if (clean.includes(p)) {
      return 'neighboring';
    }
  }
  return 'non_neighboring';
}

/**
 * Compute total actual weight, volume, and volumetric weight from cart items
 */
export function computeCartParcelMetrics(items: CartItem[]): ShippingParcelMetrics {
  let actualWeightGrams = 0;
  let totalVolumeCM3 = 0;

  for (const item of items) {
    const qty = item.quantity > 0 ? item.quantity : 1;
    const prod = ALL_MORINGA_PRODUCTS.find((p) => p.id === item.productId || p.slug === item.slug);

    let weight = prod?.shipping_weight_grams || prod?.weight_grams || 200;
    actualWeightGrams += weight * qty;

    const dims = prod?.dimensions_cm || { length: 10, width: 10, height: 5 };
    const itemVol = dims.length * dims.width * dims.height;
    totalVolumeCM3 += itemVol * qty;
  }

  if (actualWeightGrams === 0) actualWeightGrams = 300;
  if (totalVolumeCM3 === 0) totalVolumeCM3 = 1000;

  // Standard postal formula: Volumetric Weight (g) = (Volume cm3 / 5000) * 1000 = Volume / 5
  const volumetricWeightGrams = Math.round(totalVolumeCM3 / 5);
  const chargedWeightGrams = Math.max(actualWeightGrams, volumetricWeightGrams);

  let packaging_tier_fa = 'کارتن پستی سایز ۲ (استاندارد)';
  if (totalVolumeCM3 <= 1000) {
    packaging_tier_fa = 'کارتن پستی سایز ۱ (کوچک)';
  } else if (totalVolumeCM3 <= 5000) {
    packaging_tier_fa = 'کارتن پستی سایز ۳ و ۴ (متوسط)';
  } else {
    packaging_tier_fa = 'کارتن پستی سایز ۵ و ۶ (بزرگ و مقاوم)';
  }

  return {
    actual_weight_grams: actualWeightGrams,
    volumetric_weight_grams: volumetricWeightGrams,
    charged_weight_grams: chargedWeightGrams,
    total_volume_cm3: totalVolumeCM3,
    packaging_tier_fa,
  };
}

export const FREE_SHIPPING_THRESHOLD_IRR = 15000000; // 1,500,000 Toman

/**
 * Calculate dynamic shipping options for destination
 */
export function calculateShippingQuotes(
  province: string,
  city: string,
  subtotalIrr: number,
  items: CartItem[]
): ShippingQuote[] {
  const metrics = computeCartParcelMetrics(items);
  const zone = detectProvinceZone(province);
  const isfahanCity = isCityIsfahan(city);

  const baseRate = 380000; // 38,000 Toman base
  const perExtraKg = 120000;
  let postageBase = baseRate;

  // 1. Compute Base Postage depending on zone and charged weight
  if (zone === 'intra_province') {
    if (metrics.charged_weight_grams <= 500) {
      postageBase = baseRate;
    } else if (metrics.charged_weight_grams <= 1000) {
      postageBase = Math.round(baseRate * 1.21); // ~46,000 Toman
    } else if (metrics.charged_weight_grams <= 2000) {
      postageBase = Math.round(baseRate * 1.53); // ~58,000 Toman
    } else {
      const extraKg = Math.ceil((metrics.charged_weight_grams - 2000) / 1000);
      postageBase = Math.round(baseRate * 1.53) + extraKg * perExtraKg;
    }
  } else if (zone === 'neighboring') {
    if (metrics.charged_weight_grams <= 500) {
      postageBase = Math.round(baseRate * 1.26); // ~48,000 Toman
    } else if (metrics.charged_weight_grams <= 1000) {
      postageBase = Math.round(baseRate * 1.55); // ~59,000 Toman
    } else if (metrics.charged_weight_grams <= 2000) {
      postageBase = Math.round(baseRate * 1.97); // ~75,000 Toman
    } else {
      const extraKg = Math.ceil((metrics.charged_weight_grams - 2000) / 1000);
      postageBase = Math.round(baseRate * 1.97) + extraKg * Math.round(perExtraKg * 1.33);
    }
  } else {
    // Non-neighboring (e.g. Tehran, Khorasan, Gilan, Khuzestan, Tabriz...)
    if (metrics.charged_weight_grams <= 500) {
      postageBase = Math.round(baseRate * 1.53); // ~58,000 Toman
    } else if (metrics.charged_weight_grams <= 1000) {
      postageBase = Math.round(baseRate * 1.89); // ~72,000 Toman
    } else if (metrics.charged_weight_grams <= 2000) {
      postageBase = Math.round(baseRate * 2.39); // ~91,000 Toman
    } else {
      const extraKg = Math.ceil((metrics.charged_weight_grams - 2000) / 1000);
      postageBase = Math.round(baseRate * 2.39) + extraKg * Math.round(perExtraKg * 1.58);
    }
  }

  // 2. Packaging Box Fee
  let packagingFee = 80000;
  if (metrics.total_volume_cm3 <= 1000) {
    packagingFee = 80000;
  } else if (metrics.total_volume_cm3 <= 5000) {
    packagingFee = 140000;
  } else {
    packagingFee = 220000;
  }

  // 3. Insurance Fee & VAT (10%)
  const insuranceFee = 80000;
  const subtotalPost = postageBase + packagingFee + insuranceFee;
  const vat = Math.round((subtotalPost * 10) / 100);
  let totalPostIrr = subtotalPost + vat;

  // Round up to nearest 1,000 Toman (10,000 IRR)
  const remainder = totalPostIrr % 10000;
  if (remainder > 0) totalPostIrr += 10000 - remainder;

  const isPishtazFree = subtotalIrr >= FREE_SHIPPING_THRESHOLD_IRR;
  const finalPostIrr = isPishtazFree ? 0 : totalPostIrr;

  const options: ShippingQuote[] = [];

  // Option 1: Post Pishtaz (Always Available for all cities in Iran)
  options.push({
    code: 'post_pishtaz',
    name_fa: 'پست پیشتاز سراسری (شرکت ملی پست)',
    carrier: 'post',
    fee_irr: finalPostIrr,
    fee_toman: Math.round(finalPostIrr / 10),
    eta_min_days: zone === 'intra_province' ? 1 : 2,
    eta_max_days: zone === 'intra_province' ? 2 : 4,
    is_free: isPishtazFree,
    description: 'تحویل درب منزل توسط مأمور توزیع پست به همراه شناسه رهگیری ۲۴ رقمی رسمی',
    charged_weight_grams: metrics.charged_weight_grams,
    volumetric_weight_grams: metrics.volumetric_weight_grams,
    actual_weight_grams: metrics.actual_weight_grams,
    packaging_tier_fa: metrics.packaging_tier_fa,
  });

  // Option 2: Isfahan Courier (EXCLUSIVELY for Isfahan City)
  if (isfahanCity) {
    const courierFeeIrr = 550000; // 55,000 Toman
    options.push({
      code: 'courier_isfahan',
      name_fa: 'پیک موتوری فوری (ویژه شهر اصفهان)',
      carrier: 'courier',
      fee_irr: courierFeeIrr,
      fee_toman: Math.round(courierFeeIrr / 10),
      eta_min_days: 0,
      eta_max_days: 1,
      is_free: false,
      estimated_hours: '۲ الی ۴ ساعت کاری',
      description: 'تحویل اکسپرس درون‌شهری در تمامی مناطق ۱۵‌گانه شهر اصفهان با هماهنگی تلفنی',
      charged_weight_grams: metrics.charged_weight_grams,
      volumetric_weight_grams: metrics.volumetric_weight_grams,
      actual_weight_grams: metrics.actual_weight_grams,
      packaging_tier_fa: 'بسته‌بندی اختصاصی نایلونی ضدضربه',
    });
  }

  return options;
}
