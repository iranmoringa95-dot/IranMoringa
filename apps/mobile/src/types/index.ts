export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund_requested'
  | 'refunded';

export interface OrderItemSnapshot {
  id: string;
  product_id: string;
  variant_id: string;
  product_title: string;
  variant_title?: string;
  sku: string;
  unit_price_irr: number;
  quantity: number;
  subtotal_irr: number;
  weight_grams?: number;
}

export interface OrderAddressSnapshot {
  recipient_name: string;
  recipient_phone: string;
  province: string;
  city: string;
  postal_address: string;
  postal_code: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  guest_phone?: string;
  status: OrderStatus;
  subtotal_irr: number;
  discount_irr: number;
  shipping_fee_irr: number;
  total_irr: number;
  shipping_method: string;
  tracking_code?: string;
  notes?: string;
  address: OrderAddressSnapshot;
  items: OrderItemSnapshot[];
  created_at: string;
  updated_at: string;
}

export interface OrderTimelineEvent {
  id: string;
  order_id: string;
  event_type: string;
  new_status?: OrderStatus;
  actor_type: string;
  note?: string;
  created_at: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  title_fa: string;
  slug: string;
  type: 'simple' | 'variable';
  status: 'draft' | 'in_review' | 'published' | 'unpublished' | 'archived';
  category_id?: string;
  category_name?: string;
  description_fa?: string;
  short_description_fa?: string;
  price_irr: number;
  compare_at_price_irr?: number;
  cost_price_irr?: number;
  sku: string;
  on_hand: number;
  reserved: number;
  available: number;
  weight_grams?: number;
  image_url?: string;
  specifications?: ProductSpecification[];
  created_at?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  province: string;
  postal_address: string;
  postal_code: string;
  total_orders: number;
  total_spent_irr: number;
  total_spent_toman: number;
  tier: 'gold' | 'silver' | 'bronze';
  last_order_date?: string;
}

export interface DashboardStats {
  total_sales_irr: number;
  total_sales_toman: number;
  total_orders: number;
  pending_orders: number;
  low_stock_count: number;
}

export interface Category {
  id: string;
  name_fa: string;
  slug: string;
}

export type RootTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Products: undefined;
  Customers: undefined;
  Settings: undefined;
};
