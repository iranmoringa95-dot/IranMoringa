'use client';

import { ALL_MORINGA_PRODUCTS, ProductItem } from './products-data';
import { calculateShippingQuotes, computeCartParcelMetrics } from './shipping';

export interface CartItem {
  productId: string;
  variantId?: string;
  slug: string;
  title_fa: string;
  subtitle_fa?: string;
  sku: string;
  price_irr: number;
  compare_at_price_irr?: number;
  quantity: number;
  imageUrl: string;
  category_name_fa?: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal_irr: number;
  discount_irr: number;
  shipping_fee_irr: number;
  grand_total_irr: number;
  couponCode?: string;
  couponDiscountPercent?: number;
  shippingMethod?: string;
  shippingMethodTitle?: string;
  chargedWeightGrams?: number;
  volumetricWeightGrams?: number;
  actualWeightGrams?: number;
  packagingTierFA?: string;
}

const CART_STORAGE_KEY = 'moringalab_cart_v1';
const CART_EVENT_NAME = 'moringalab_cart_updated';

/**
 * Get current cart items from localStorage
 */
export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save cart items to localStorage and trigger update event
 */
export function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: items }));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}

/**
 * Add product to cart or increment quantity
 */
export function addToCart(product: ProductItem, quantity = 1, variantId?: string): CartItem[] {
  const current = getStoredCart();
  const primaryMedia = product.media?.find((m) => m.is_primary) || product.media?.[0];
  const variant = variantId
    ? product.variants?.find((v) => v.id === variantId)
    : product.variants?.[0];

  const priceIrr = variant ? variant.price_irr : product.price_irr;
  const sku = variant ? variant.sku : product.sku;

  const existingIdx = current.findIndex(
    (item) => item.productId === product.id && (!variantId || item.variantId === variantId)
  );

  let updated: CartItem[];

  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx].quantity += quantity;
  } else {
    const newItem: CartItem = {
      productId: product.id,
      variantId: variant?.id,
      slug: product.slug,
      title_fa: product.title_fa,
      subtitle_fa: product.subtitle_fa,
      sku: sku,
      price_irr: priceIrr,
      compare_at_price_irr: product.compare_at_price_irr,
      quantity: quantity,
      imageUrl: primaryMedia ? primaryMedia.url : '/images/demo/moringa-leaf-powder-100g.png',
      category_name_fa: product.category_name_fa,
    };
    updated = [...current, newItem];
  }

  saveCart(updated);
  return updated;
}

/**
 * Update item quantity in cart
 */
export function updateCartQuantity(productId: string, quantity: number, variantId?: string): CartItem[] {
  const current = getStoredCart();
  let updated: CartItem[];

  if (quantity <= 0) {
    updated = current.filter(
      (item) => !(item.productId === productId && (!variantId || item.variantId === variantId))
    );
  } else {
    updated = current.map((item) => {
      if (item.productId === productId && (!variantId || item.variantId === variantId)) {
        return { ...item, quantity };
      }
      return item;
    });
  }

  saveCart(updated);
  return updated;
}

/**
 * Remove an item from cart
 */
export function removeFromCart(productId: string, variantId?: string): CartItem[] {
  const current = getStoredCart();
  const updated = current.filter(
    (item) => !(item.productId === productId && (!variantId || item.variantId === variantId))
  );
  saveCart(updated);
  return updated;
}

/**
 * Clear entire cart
 */
export function clearCart() {
  saveCart([]);
}

/**
 * Calculate cart breakdown and financial summary
 */
export function calculateCartSummary(
  items: CartItem[],
  couponCode?: string,
  shippingMethod?: string,
  province: string = 'اصفهان',
  city: string = 'اصفهان'
): CartSummary {
  const subtotal_irr = items.reduce((sum, item) => sum + item.price_irr * item.quantity, 0);

  let couponDiscountPercent = 0;
  if (couponCode) {
    const code = couponCode.trim().toUpperCase();
    if (code === 'MORINGA15') {
      couponDiscountPercent = 15;
    } else if (code === 'SUPERGREEN10') {
      couponDiscountPercent = 10;
    }
  }

  const discount_irr = Math.round((subtotal_irr * couponDiscountPercent) / 100);

  // Compute parcel metrics
  const parcelMetrics = computeCartParcelMetrics(items);

  // Calculate dynamic shipping quotes
  const quotes = calculateShippingQuotes(province, city, subtotal_irr, items);
  
  let selectedQuote = quotes.find((q) => q.code === shippingMethod);
  if (!selectedQuote) {
    selectedQuote = quotes[0] || {
      code: 'post_pishtaz',
      name_fa: 'پست پیشتاز سراسری',
      carrier: 'post',
      fee_irr: 380000,
      fee_toman: 38000,
      eta_min_days: 2,
      eta_max_days: 4,
      is_free: false,
      description: 'ارسال با پست پیشتاز',
      charged_weight_grams: 500,
      volumetric_weight_grams: 200,
      actual_weight_grams: 300,
      packaging_tier_fa: 'کارتن پستی استاندارد',
    };
  }

  const shipping_fee_irr = items.length === 0 ? 0 : selectedQuote.fee_irr;
  const grand_total_irr = Math.max(0, subtotal_irr - discount_irr + shipping_fee_irr);

  return {
    items,
    subtotal_irr,
    discount_irr,
    shipping_fee_irr,
    grand_total_irr,
    couponCode,
    couponDiscountPercent,
    shippingMethod: selectedQuote.code,
    shippingMethodTitle: selectedQuote.name_fa,
    chargedWeightGrams: parcelMetrics.charged_weight_grams,
    volumetricWeightGrams: parcelMetrics.volumetric_weight_grams,
    actualWeightGrams: parcelMetrics.actual_weight_grams,
    packagingTierFA: parcelMetrics.packaging_tier_fa,
  };
}

/**
 * Get total quantity count of all items in cart
 */
export function getCartItemsCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}
