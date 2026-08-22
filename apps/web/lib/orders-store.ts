'use client';

import { STORE_ORDERS, StoreOrder } from './orders-data';

const STORAGE_ADMIN_ORDERS_KEY = 'moringalab_admin_orders_v1';

export function getStoredAdminOrders(): StoreOrder[] {
  if (typeof window === 'undefined') return STORE_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ADMIN_ORDERS_KEY, JSON.stringify(STORE_ORDERS));
      return STORE_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return STORE_ORDERS;
  }
}

export function saveStoredAdminOrders(orders: StoreOrder[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ADMIN_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to localStorage:', e);
  }
}

export function addAdminOrder(order: StoreOrder): StoreOrder {
  const current = getStoredAdminOrders();
  const updated = [order, ...current];
  saveStoredAdminOrders(updated);
  return order;
}

export function updateAdminOrder(id: string, updates: Partial<StoreOrder>): StoreOrder | null {
  const current = getStoredAdminOrders();
  const idx = current.findIndex((o) => o.id === id || o.orderNumber === id);
  if (idx === -1) return null;

  current[idx] = { ...current[idx], ...updates };
  saveStoredAdminOrders(current);
  return current[idx];
}

export function deleteAdminOrder(id: string): boolean {
  const current = getStoredAdminOrders();
  const updated = current.filter((o) => o.id !== id && o.orderNumber !== id);
  saveStoredAdminOrders(updated);
  return true;
}
