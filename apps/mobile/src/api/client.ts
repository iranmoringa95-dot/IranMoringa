import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, Product, Customer, DashboardStats, Category, OrderStatus, OrderTimelineEvent } from '../types';

export const CLOUDFLARE_API_URL = 'https://iranmoringa.iranmoringa95.workers.dev/api/v1';
export const EMULATOR_API_URL = 'http://10.0.2.2:8080/api/v1';
export const LOCALHOST_API_URL = 'http://localhost:8080/api/v1';

export const DEFAULT_BASE_URL = CLOUDFLARE_API_URL;

const STORAGE_KEY_BASE_URL = '@moringalab_api_base_url';
const STORAGE_KEY_ORDERS = '@moringalab_cached_orders';
const STORAGE_KEY_PRODUCTS = '@moringalab_cached_products';
const STORAGE_KEY_CUSTOMERS = '@moringalab_cached_customers';
const STORAGE_KEY_STATS = '@moringalab_cached_stats';
const STORAGE_KEY_SYNC_QUEUE = '@moringalab_sync_queue';

// In-Memory Fallback & Seed Data
const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ord-101',
    order_number: 'MOR-14030520-00001',
    status: 'processing',
    subtotal_irr: 4500000,
    discount_irr: 0,
    shipping_fee_irr: 450000,
    total_irr: 4950000,
    shipping_method: 'پست پیشتاز',
    notes: 'لطفاً قبل از ارسال هماهنگ شود',
    address: {
      recipient_name: 'علی رضایی',
      recipient_phone: '09121112233',
      province: 'تهران',
      city: 'تهران',
      postal_address: 'خیابان ولیعصر، بالاتر از میدان ونک، کوچه شادمان، پلاک ۱۲',
      postal_code: '1987654321',
    },
    items: [
      {
        id: 'item-1',
        product_id: 'prod-1',
        variant_id: 'var-1',
        product_title: 'پودر برگ مورینگا اولیفرا خالص (۱۰۰ گرم)',
        sku: 'MOR-PWD-100',
        unit_price_irr: 2250000,
        quantity: 2,
        subtotal_irr: 4500000,
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ord-102',
    order_number: 'MOR-14030519-00002',
    status: 'shipped',
    subtotal_irr: 7200000,
    discount_irr: 500000,
    shipping_fee_irr: 500000,
    total_irr: 7200000,
    shipping_method: 'تیپاکس',
    tracking_code: 'TPX-982347102',
    address: {
      recipient_name: 'سارا احمدی',
      recipient_phone: '09351234567',
      province: 'اصفهان',
      city: 'اصفهان',
      postal_address: 'خیابان چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲',
      postal_code: '8134567890',
    },
    items: [
      {
        id: 'item-2',
        product_id: 'prod-2',
        variant_id: 'var-2',
        product_title: 'روغن ارگانیک دانه مورینگا (۳۰ میلی‌لیتر)',
        sku: 'MOR-OIL-030',
        unit_price_irr: 3600000,
        quantity: 2,
        subtotal_irr: 7200000,
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ord-103',
    order_number: 'MOR-14030518-00003',
    status: 'pending_payment',
    subtotal_irr: 1850000,
    discount_irr: 0,
    shipping_fee_irr: 400000,
    total_irr: 2250000,
    shipping_method: 'پست سفارشی',
    address: {
      recipient_name: 'محمد حسینی',
      recipient_phone: '09187654321',
      province: 'فارس',
      city: 'شیراز',
      postal_address: 'بلوار زند، روبروی دانشکده مهندسی، مجتمع پردیس',
      postal_code: '7145678901',
    },
    items: [
      {
        id: 'item-3',
        product_id: 'prod-3',
        variant_id: 'var-3',
        product_title: 'دمنوش گیاهی مورینگا و به‌لیمو (۲۰ تی‌بگ)',
        sku: 'MOR-TEA-020',
        unit_price_irr: 1850000,
        quantity: 1,
        subtotal_irr: 1850000,
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title_fa: 'پودر برگ مورینگا اولیفرا خالص (۱۰۰ گرم)',
    slug: 'moringa-leaf-powder-100g',
    type: 'simple',
    status: 'published',
    category_id: 'cat-1',
    category_name: 'پودر و مکمل‌های گیاهی',
    description_fa: 'پودر ۱۰۰٪ طبیعی برگ درخت مورینگا اولیفرا غنی از آنتی‌اکسیدان، ویتامین‌ها و مواد معدنی مفید برای تقویت عمومی سیستم ایمنی و انرژی بدن.',
    short_description_fa: 'پودر خالص خشک‌شده در سایه بدون هرگونه افزودنی شیمیایی',
    price_irr: 2250000,
    compare_at_price_irr: 2600000,
    cost_price_irr: 1300000,
    sku: 'MOR-PWD-100',
    on_hand: 45,
    reserved: 2,
    available: 43,
    weight_grams: 100,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    specifications: [
      { key: 'نوع فرآوری', value: 'خشک‌شده در سایه دمای پایین' },
      { key: 'خلوص', value: '۱۰۰٪ ارگانیک' },
      { key: 'کشور تولیدکننده', value: 'ایران (مزرعه سبزینه جنوب)' },
    ],
  },
  {
    id: 'prod-2',
    title_fa: 'روغن ارگانیک دانه مورینگا (۳۰ میلی‌لیتر)',
    slug: 'moringa-seed-oil-30ml',
    type: 'simple',
    status: 'published',
    category_id: 'cat-2',
    category_name: 'روغن‌های درمانی و پوستی',
    description_fa: 'روغن خالص دانه مورینگا استخراج‌شده به روش کلدپرس (پرس سرد) با خواص جوانسازی فوق‌العاده پوست، آبرسانی عمیق و تقویت ریشه مو.',
    short_description_fa: 'روغن طبیعی پرس سرد بدون مواد نگهدارنده و اسانس',
    price_irr: 3600000,
    compare_at_price_irr: 4100000,
    cost_price_irr: 2100000,
    sku: 'MOR-OIL-030',
    on_hand: 18,
    reserved: 2,
    available: 16,
    weight_grams: 30,
    image_url: 'https://images.unsplash.com/photo-1608248597359-299342417e2c?w=400&q=80',
    specifications: [
      { key: 'روش استخراج', value: 'پرس سرد (Cold-Pressed)' },
      { key: 'نوع بسته‌بندی', value: 'قطره‌چکان شیشه‌ای تیره UV' },
    ],
  },
  {
    id: 'prod-3',
    title_fa: 'دمنوش گیاهی مورینگا و به‌لیمو (۲۰ تی‌بگ)',
    slug: 'moringa-lemon-verbena-tea',
    type: 'simple',
    status: 'published',
    category_id: 'cat-3',
    category_name: 'دمنوش و نوشیدنی‌های سلامتی',
    description_fa: 'ترکیب آرام‌بخش برگ مورینگا اولیفرا به همراه به‌لیموی معطر، مناسب برای رفع خستگی و استرس روزانه و بهبود خواب.',
    short_description_fa: 'دمنوش طبیعی هرمی بدون شکر و طعم‌دهنده مصنوعی',
    price_irr: 1850000,
    compare_at_price_irr: 2100000,
    cost_price_irr: 950000,
    sku: 'MOR-TEA-020',
    on_hand: 60,
    reserved: 1,
    available: 59,
    weight_grams: 50,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
    specifications: [
      { key: 'تعداد در بسته', value: '۲۰ عدد تی‌بگ هرمی' },
      { key: 'ترکیبات', value: 'برگ مورینگا، به‌لیمو ایرانی' },
    ],
  },
  {
    id: 'prod-4',
    title_fa: 'کپسول مکمل تغذیه‌ای مورینگا (۶۰ عددی)',
    slug: 'moringa-supplement-capsules-60',
    type: 'simple',
    status: 'published',
    category_id: 'cat-1',
    category_name: 'پودر و مکمل‌های گیاهی',
    description_fa: 'کپسول‌های ژلاتینی گیاهی حاوی ۵۰۰ میلی‌گرم پودر کنسانتره برگ مورینگا، تقویت‌کننده سیستم ایمنی و افزایش‌دهنده سوخت‌وساز بدن.',
    short_description_fa: 'مکمل رژیمی ۱۰۰٪ طبیعی استاندارد',
    price_irr: 3900000,
    compare_at_price_irr: 4500000,
    cost_price_irr: 2300000,
    sku: 'MOR-CAP-060',
    on_hand: 5,
    reserved: 0,
    available: 5,
    weight_grams: 60,
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    specifications: [
      { key: 'دوز مصرفی', value: 'روزانه ۲ کپسول با آب ولرم' },
      { key: 'تعداد', value: '۶۰ عدد' },
    ],
  },
];

const INITIAL_DEMO_CATEGORIES: Category[] = [
  { id: 'cat-1', name_fa: 'پودر و مکمل‌های گیاهی', slug: 'powders-supplements' },
  { id: 'cat-2', name_fa: 'روغن‌های درمانی و پوستی', slug: 'oils-skincare' },
  { id: 'cat-3', name_fa: 'دمنوش و نوشیدنی‌های سلامتی', slug: 'herbal-teas' },
  { id: 'cat-4', name_fa: 'بذر و نهال مورینگا', slug: 'seeds-plants' },
];

const INITIAL_DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    full_name: 'علی رضایی',
    phone: '09121112233',
    city: 'تهران',
    province: 'تهران',
    postal_address: 'خیابان ولیعصر، بالاتر از میدان ونک، کوچه شادمان، پلاک ۱۲',
    postal_code: '1987654321',
    total_orders: 4,
    total_spent_irr: 18500000,
    total_spent_toman: 1850000,
    tier: 'gold',
    last_order_date: '1403/05/20',
  },
  {
    id: 'cust-2',
    full_name: 'سارا احمدی',
    phone: '09351234567',
    city: 'اصفهان',
    province: 'اصفهان',
    postal_address: 'خیابان چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲',
    postal_code: '8134567890',
    total_orders: 2,
    total_spent_irr: 7200000,
    total_spent_toman: 720000,
    tier: 'silver',
    last_order_date: '1403/05/19',
  },
  {
    id: 'cust-3',
    full_name: 'محمد حسینی',
    phone: '09187654321',
    city: 'شیراز',
    province: 'فارس',
    postal_address: 'بلوار زند، روبروی دانشکده مهندسی، مجتمع پردیس',
    postal_code: '7145678901',
    total_orders: 1,
    total_spent_irr: 2250000,
    total_spent_toman: 225000,
    tier: 'bronze',
    last_order_date: '1403/05/18',
  },
];

class ApiClient {
  private baseURL: string = DEFAULT_BASE_URL;
  private localOrders: Order[] = [...INITIAL_DEMO_ORDERS];
  private localProducts: Product[] = [...INITIAL_DEMO_PRODUCTS];
  private localCustomers: Customer[] = [...INITIAL_DEMO_CUSTOMERS];
  private syncQueue: Array<{ type: string; payload: any; timestamp: number }> = [];

  // Helper fetch with timeout
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3500): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  async init(): Promise<void> {
    try {
      // 1. Load Base URL
      const savedURL = await AsyncStorage.getItem(STORAGE_KEY_BASE_URL);
      if (savedURL) {
        this.baseURL = savedURL;
      }

      // 2. Load Local Cached Orders
      const cachedOrders = await AsyncStorage.getItem(STORAGE_KEY_ORDERS);
      if (cachedOrders) {
        const parsed = JSON.parse(cachedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.localOrders = parsed;
        }
      } else {
        await this.persistOrders();
      }

      // 3. Load Local Cached Products
      const cachedProducts = await AsyncStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (cachedProducts) {
        const parsed = JSON.parse(cachedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.localProducts = parsed;
        }
      } else {
        await this.persistProducts();
      }

      // 4. Load Local Cached Customers
      const cachedCustomers = await AsyncStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (cachedCustomers) {
        const parsed = JSON.parse(cachedCustomers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.localCustomers = parsed;
        }
      } else {
        await this.persistCustomers();
      }

      // 5. Load Sync Queue
      const cachedQueue = await AsyncStorage.getItem(STORAGE_KEY_SYNC_QUEUE);
      if (cachedQueue) {
        this.syncQueue = JSON.parse(cachedQueue) || [];
      }
    } catch (e) {
      console.warn('Error initializing offline cache:', e);
    }
  }

  private async persistOrders(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.localOrders));
    } catch (e) {
      console.warn('Failed to persist orders:', e);
    }
  }

  private async persistProducts(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(this.localProducts));
    } catch (e) {
      console.warn('Failed to persist products:', e);
    }
  }

  private async persistCustomers(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(this.localCustomers));
    } catch (e) {
      console.warn('Failed to persist customers:', e);
    }
  }

  private async persistSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(this.syncQueue));
    } catch (e) {
      console.warn('Failed to persist sync queue:', e);
    }
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  async setBaseURL(url: string): Promise<void> {
    this.baseURL = url.trim();
    await AsyncStorage.setItem(STORAGE_KEY_BASE_URL, this.baseURL);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseURL}/health/live`, {}, 2500);
      return res.ok;
    } catch {
      // Check if root or storefront endpoint is reachable on Cloudflare
      try {
        const res = await this.fetchWithTimeout(this.baseURL, {}, 2500);
        return res.status < 500;
      } catch {
        return false;
      }
    }
  }

  // ─── Sync Pending Queue when Online ──────────────────────────────────────────
  async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;
    const remaining = [];
    for (const item of this.syncQueue) {
      try {
        if (item.type === 'create_order') {
          await this.fetchWithTimeout(`${this.baseURL}/admin/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
        } else if (item.type === 'update_order_status') {
          const { orderId, status, trackingCode, note } = item.payload;
          await this.fetchWithTimeout(`${this.baseURL}/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, tracking_code: trackingCode, note }),
          });
        }
      } catch {
        remaining.push(item);
      }
    }
    this.syncQueue = remaining;
    await this.persistSyncQueue();
  }

  // ─── Dashboard Stats ─────────────────────────────────────────────────────────
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseURL}/admin/dashboard/stats`);
      if (res.ok) {
        const stats = await res.json();
        await AsyncStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
        return stats;
      }
    } catch {
      // fallback to offline compute
    }

    let totalSalesIRR = 0;
    let pendingCount = 0;
    for (const ord of this.localOrders) {
      if (ord.status !== 'cancelled' && ord.status !== 'refunded') {
        totalSalesIRR += ord.total_irr;
      }
      if (ord.status === 'pending_payment' || ord.status === 'processing') {
        pendingCount++;
      }
    }

    const calculated: DashboardStats = {
      total_sales_irr: totalSalesIRR,
      total_sales_toman: Math.floor(totalSalesIRR / 10),
      total_orders: this.localOrders.length,
      pending_orders: pendingCount,
      low_stock_count: this.localProducts.filter((p) => p.on_hand <= 5).length,
    };

    await AsyncStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(calculated));
    return calculated;
  }

  // ─── Orders ─────────────────────────────────────────────────────────────────
  async getOrders(params?: { status?: string; q?: string }): Promise<Order[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.q) query.set('q', params.q);

      const res = await this.fetchWithTimeout(`${this.baseURL}/admin/orders?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          // Merge server orders with local cache
          const serverMap = new Map(data.orders.map((o: Order) => [o.id, o]));
          // Preserve any local offline created orders not yet on server
          const merged = [...data.orders];
          for (const localOrd of this.localOrders) {
            if (!serverMap.has(localOrd.id)) {
              merged.push(localOrd);
            }
          }
          this.localOrders = merged;
          await this.persistOrders();
          await this.processSyncQueue();
        }
      }
    } catch {
      // Offline fallback: Use locally cached orders
    }

    let list = [...this.localOrders];
    if (params?.status) {
      list = list.filter((o) => o.status === params.status);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.address.recipient_name.toLowerCase().includes(q) ||
          o.address.recipient_phone.includes(q)
      );
    }
    return list;
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseURL}/admin/orders/${id}`);
      if (res.ok) {
        const ord = await res.json();
        const idx = this.localOrders.findIndex((o) => o.id === ord.id);
        if (idx >= 0) {
          this.localOrders[idx] = ord;
          await this.persistOrders();
        }
        return ord;
      }
    } catch {
      // fallback
    }

    const found = this.localOrders.find((o) => o.id === id || o.order_number === id);
    return found || null;
  }

  async createOrder(payload: {
    recipient_name: string;
    recipient_phone: string;
    province: string;
    city: string;
    postal_address: string;
    postal_code: string;
    shipping_method: string;
    discount_irr?: number;
    shipping_fee_irr?: number;
    notes?: string;
    items: Array<{
      product_id: string;
      variant_id?: string;
      product_title: string;
      sku: string;
      unit_price_irr: number;
      quantity: number;
    }>;
  }): Promise<Order> {
    // 1. Prepare local order snapshot
    let subtotal = 0;
    const items = payload.items.map((item, idx) => {
      const lineSubtotal = item.unit_price_irr * item.quantity;
      subtotal += lineSubtotal;
      return {
        id: `item-${Date.now()}-${idx}`,
        product_id: item.product_id,
        variant_id: item.variant_id || item.product_id,
        product_title: item.product_title,
        sku: item.sku,
        unit_price_irr: item.unit_price_irr,
        quantity: item.quantity,
        subtotal_irr: lineSubtotal,
      };
    });

    const shippingFee = payload.shipping_fee_irr || 450000;
    const discount = payload.discount_irr || 0;
    const total = subtotal + shippingFee - discount;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: `MOR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'processing',
      subtotal_irr: subtotal,
      discount_irr: discount,
      shipping_fee_irr: shippingFee,
      total_irr: total > 0 ? total : 0,
      shipping_method: payload.shipping_method || 'پست پیشتاز',
      notes: payload.notes,
      address: {
        recipient_name: payload.recipient_name,
        recipient_phone: payload.recipient_phone,
        province: payload.province,
        city: payload.city,
        postal_address: payload.postal_address,
        postal_code: payload.postal_code,
      },
      items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save locally immediately
    this.localOrders.unshift(newOrder);
    await this.persistOrders();

    // 2. Try to sync to server
    try {
      const res = await this.fetchWithTimeout(`${this.baseURL}/admin/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        const idx = this.localOrders.findIndex((o) => o.id === newOrder.id);
        if (idx >= 0) {
          this.localOrders[idx] = created;
          await this.persistOrders();
          return created;
        }
      }
    } catch {
      // Network failed: Add to sync queue
      this.syncQueue.push({ type: 'create_order', payload, timestamp: Date.now() });
      await this.persistSyncQueue();
    }

    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingCode?: string, note?: string): Promise<boolean> {
    // 1. Update local cache immediately
    const ord = this.localOrders.find((o) => o.id === orderId || o.order_number === orderId);
    if (ord) {
      ord.status = status;
      if (trackingCode) ord.tracking_code = trackingCode;
      ord.updated_at = new Date().toISOString();
      await this.persistOrders();
    }

    // 2. Attempt sync to server
    try {
      const res = await this.fetchWithTimeout(`${this.baseURL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, tracking_code: trackingCode || '', note: note || '' }),
      });
      if (res.ok) {
        return true;
      }
    } catch {
      // Queue for later sync
      this.syncQueue.push({
        type: 'update_order_status',
        payload: { orderId, status, trackingCode, note },
        timestamp: Date.now(),
      });
      await this.persistSyncQueue();
    }

    return true;
  }

  // ─── Products ───────────────────────────────────────────────────────────────
  async getProducts(params?: { q?: string; category?: string }): Promise<Product[]> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseURL}/admin/products`);
      if (res.ok) {
        const data = await res.json();
        let list: Product[] = [];
        if (Array.isArray(data)) list = data;
        else if (data.products && Array.isArray(data.products)) list = data.products;

        if (list.length > 0) {
          this.localProducts = list;
          await this.persistProducts();
        }
      }
    } catch {
      // fallback to offline local products
    }

    let list = [...this.localProducts];
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter((p) => p.title_fa.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (params?.category) {
      list = list.filter((p) => p.category_id === params.category || p.category_name === params.category);
    }
    return list;
  }

  async createProduct(payload: {
    title_fa: string;
    slug?: string;
    category_id?: string;
    category_name?: string;
    price_irr: number;
    compare_at_price_irr?: number;
    cost_price_irr?: number;
    sku: string;
    on_hand: number;
    weight_grams?: number;
    short_description_fa?: string;
    description_fa?: string;
    image_url?: string;
    specifications?: Array<{ key: string; value: string }>;
  }): Promise<Product> {
    const slug = payload.slug || payload.title_fa.toLowerCase().replace(/\s+/g, '-').slice(0, 50);

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      title_fa: payload.title_fa,
      slug,
      type: 'simple',
      status: 'published',
      category_id: payload.category_id || 'cat-1',
      category_name: payload.category_name || 'پودر و مکمل‌های گیاهی',
      description_fa: payload.description_fa,
      short_description_fa: payload.short_description_fa,
      price_irr: payload.price_irr,
      compare_at_price_irr: payload.compare_at_price_irr,
      cost_price_irr: payload.cost_price_irr,
      sku: payload.sku,
      on_hand: payload.on_hand,
      reserved: 0,
      available: payload.on_hand,
      weight_grams: payload.weight_grams || 100,
      image_url: payload.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
      specifications: payload.specifications || [],
      created_at: new Date().toISOString(),
    };

    // Save locally
    this.localProducts.unshift(newProd);
    await this.persistProducts();

    // Try server
    try {
      const res = await this.fetchWithTimeout(`${this.baseURL}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_fa: payload.title_fa,
          slug,
          type: 'simple',
          category_id: payload.category_id,
          description_fa: payload.description_fa,
          short_description_fa: payload.short_description_fa,
          variants: [
            {
              title_fa: 'پیش‌فرض',
              sku: payload.sku,
              price_irr: payload.price_irr,
              compare_at_price_irr: payload.compare_at_price_irr,
              cost_price_irr: payload.cost_price_irr,
              on_hand: payload.on_hand,
              net_weight_grams: payload.weight_grams || 100,
            },
          ],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        const idx = this.localProducts.findIndex((p) => p.id === newProd.id);
        if (idx >= 0) {
          this.localProducts[idx] = created;
          await this.persistProducts();
          return created;
        }
      }
    } catch {
      // saved locally
    }

    return newProd;
  }

  async updateProductInventory(productId: string, newOnHand: number): Promise<boolean> {
    const prod = this.localProducts.find((p) => p.id === productId);
    if (prod) {
      prod.on_hand = newOnHand;
      prod.available = newOnHand - prod.reserved;
      await this.persistProducts();
      return true;
    }
    return false;
  }

  async updateProductStatus(productId: string, status: 'published' | 'unpublished' | 'archived'): Promise<boolean> {
    const prod = this.localProducts.find((p) => p.id === productId);
    if (prod) {
      prod.status = status;
      await this.persistProducts();
      return true;
    }
    return false;
  }

  // ─── Customers ─────────────────────────────────────────────────────────────
  async getCustomers(q?: string): Promise<Customer[]> {
    try {
      const url = q ? `${this.baseURL}/admin/customers?q=${encodeURIComponent(q)}` : `${this.baseURL}/admin/customers`;
      const res = await this.fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        if (data.customers && Array.isArray(data.customers)) {
          this.localCustomers = data.customers;
          await this.persistCustomers();
        }
      }
    } catch {
      // offline fallback
    }

    if (q) {
      const query = q.toLowerCase();
      return this.localCustomers.filter(
        (c) => c.full_name.toLowerCase().includes(query) || c.phone.includes(query) || c.city.includes(query)
      );
    }
    return this.localCustomers;
  }

  // ─── Categories ────────────────────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseURL}/catalog/categories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // fallback
    }
    return INITIAL_DEMO_CATEGORIES;
  }
}

export const api = new ApiClient();
