'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Truck,
  Check,
  Search,
  Clock,
  Eye,
  MessageSquarePlus,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Printer,
  X,
  Plus,
  Trash2,
  Calendar,
  ExternalLink,
  Phone,
  MapPin,
  User,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowUpDown,
} from 'lucide-react';
import { ALL_MORINGA_PRODUCTS } from '@/lib/products-data';
import { STORE_ORDERS } from '@/lib/orders-data';
import {
  getStoredAdminOrders,
  addAdminOrder,
  updateAdminOrder,
  deleteAdminOrder,
} from '@/lib/orders-store';

interface OrderItem {
  id?: string;
  product_id?: string;
  variant_id?: string;
  product_title: string;
  variant_title: string;
  sku: string;
  quantity: number;
  unit_price_irr: number;
  subtotal_irr: number;
}

interface TimelineEvent {
  id?: string;
  event_type?: string;
  old_status?: string;
  new_status?: string;
  actor_type?: string;
  note?: string;
  tracking_code?: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal_irr: number;
  shipping_fee_irr: number;
  discount_irr: number;
  total_irr: number;
  total_toman: number;
  tracking_code?: string;
  admin_notes?: string;
  customer_notes?: string;
  shipping_method?: string;
  payment_method?: string;
  payment_status?: string;
  guest_phone?: string;
  customer?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  address: {
    recipient_name: string;
    recipient_phone: string;
    province: string;
    city: string;
    postal_code: string;
    postal_address: string;
  };
  items: OrderItem[];
  created_at: string;
}

const API_BASE = '/api/v1';

const STATUS_OPTIONS: { value: string; label: string; color: string; bgBadge: string }[] = [
  { value: '', label: 'همه سفارش‌ها', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', bgBadge: 'bg-slate-500' },
  { value: 'pending_payment', label: 'در انتظار پرداخت', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40', bgBadge: 'bg-amber-500' },
  { value: 'paid', label: 'پرداخت شده', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40', bgBadge: 'bg-emerald-500' },
  { value: 'processing', label: 'در حال پردازش', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/40', bgBadge: 'bg-blue-500' },
  { value: 'packed', label: 'بسته‌بندی شده', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300/40', bgBadge: 'bg-indigo-500' },
  { value: 'shipped', label: 'ارسال شده', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/40', bgBadge: 'bg-purple-500' },
  { value: 'delivered', label: 'تحویل داده شده', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300/40', bgBadge: 'bg-teal-500' },
  { value: 'cancelled', label: 'لغو شده', color: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300/40', bgBadge: 'bg-red-500' },
  { value: 'refunded', label: 'بازگشت وجه', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40', bgBadge: 'bg-rose-500' },
];

const DATE_PRESETS = [
  { value: 'all', label: 'همه زمان‌ها' },
  { value: 'today', label: 'امروز' },
  { value: 'yesterday', label: 'دیروز' },
  { value: 'last_7_days', label: '۷ روز اخیر' },
  { value: 'last_30_days', label: '۳۰ روز اخیر' },
  { value: 'last_90_days', label: '۳ ماه اخیر' },
  { value: 'this_year', label: 'سال جاری' },
];

function getStatusBadge(status: string) {
  const found = STATUS_OPTIONS.find((s) => s.value === status);
  return found || { value: status, label: status || 'نامشخص', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', bgBadge: 'bg-slate-500' };
}

function formatPersianDateTime(dateStr?: string) {
  if (!dateStr) return { date: '—', shortDate: '—', time: '—', full: '—', relative: '' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: '—', shortDate: '—', time: '—', full: '—', relative: '' };

    const date = d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const shortDate = d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const time = d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let relative = '';
    if (diffDays === 0) relative = 'امروز';
    else if (diffDays === 1) relative = 'دیروز';
    else if (diffDays > 1 && diffDays < 30) relative = `${diffDays.toLocaleString('fa-IR')} روز پیش`;

    return { date, shortDate, time, full: `${date} ساعت ${time}`, relative };
  } catch {
    return { date: '—', shortDate: '—', time: '—', full: '—', relative: '' };
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('processing');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalMode, setModalMode] = useState<'details' | 'transition' | 'timeline' | 'note' | 'invoice' | 'create_order' | null>(null);
  
  // Status transition state
  const [newStatus, setNewStatus] = useState('processing');
  const [trackingCode, setTrackingCode] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Order Details editing state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState({
    recipient_name: '',
    recipient_phone: '',
    province: '',
    city: '',
    postal_code: '',
    postal_address: '',
  });

  // Timeline events state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [adminNote, setAdminNote] = useState('');

  // ─── Manual Create Order Form State ─────────────────────────────────────────
  const [createCustomerName, setCreateCustomerName] = useState('');
  const [createCustomerPhone, setCreateCustomerPhone] = useState('');
  const [createCustomerEmail, setCreateCustomerEmail] = useState('');
  const [createProvince, setCreateProvince] = useState('');
  const [createCity, setCreateCity] = useState('');
  const [createPostalAddress, setCreatePostalAddress] = useState('');
  const [createPostalCode, setCreatePostalCode] = useState('');
  const [createShippingMethod, setCreateShippingMethod] = useState('post_pishtaz');
  const [createShippingFeeToman, setCreateShippingFeeToman] = useState(38000);
  const [createDiscountToman, setCreateDiscountToman] = useState(0);
  const [createPaymentMethod, setCreatePaymentMethod] = useState('card_to_card');
  const [createPaymentStatus, setCreatePaymentStatus] = useState('paid');
  const [createOrderStatus, setCreateOrderStatus] = useState('processing');
  const [createAdminNotes, setCreateAdminNotes] = useState('');
  const [createTrackingCode, setCreateTrackingCode] = useState('');
  
  // Create Order Line Items
  interface NewOrderItem {
    product_id: string;
    variant_id: string;
    product_title: string;
    variant_title: string;
    sku: string;
    unit_price_toman: number;
    quantity: number;
  }
  const [createItems, setCreateItems] = useState<NewOrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Load catalog products for order creation modal
  useEffect(() => {
    fetch(`${API_BASE}/admin/products`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.products || data.items)) {
          setCatalogProducts(data.products || data.items);
        } else {
          setCatalogProducts(ALL_MORINGA_PRODUCTS);
        }
      })
      .catch(() => {
        setCatalogProducts(ALL_MORINGA_PRODUCTS);
      });
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (datePreset && datePreset !== 'all') params.set('date_preset', datePreset);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (sortBy) params.set('sort_by', sortBy);
      params.set('page', String(page));
      params.set('limit', String(pageSize));

      let hasApiData = false;
      try {
        const res = await fetch(`${API_BASE}/admin/orders?${params}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            const list = data.items || data.orders || [];
            setOrders(list);
            setTotalCount(data.total || data.total_count || list.length);
            if (data.status_counts) {
              setStatusCounts(data.status_counts);
            }
            hasApiData = true;
          }
        }
      } catch (e) {}

      if (!hasApiData) {
        // Fallback to pre-bundled and locally-persisted orders dataset
        const sourceOrders = getStoredAdminOrders();
        let allOrders: Order[] = sourceOrders.map((so) => ({
          id: so.id,
          order_number: so.orderNumber,
          status: so.status,
          subtotal_irr: so.totalIrr,
          shipping_fee_irr: 0,
          discount_irr: 0,
          total_irr: so.totalIrr,
          total_toman: so.totalToman,
          tracking_code: so.trackingCode,
          shipping_method: so.shippingMethod,
          payment_method: so.paymentMethod,
          guest_phone: so.customerPhone,
          customer: {
            first_name: so.customerName,
            phone: so.customerPhone,
          },
          address: {
            recipient_name: so.address?.recipientName || so.customerName,
            recipient_phone: so.address?.phone || so.customerPhone,
            province: so.address?.province || 'اصفهان',
            city: so.address?.city || 'اصفهان',
            postal_address: so.address?.addressLine || 'آدرس ثبت شده در سفارش',
            postal_code: so.address?.postalCode || '',
          },
          items: [],
          created_at: so.createdAt,
        }));

        // Calculate status counts
        const sc: Record<string, number> = {};
        for (const o of allOrders) {
          sc[o.status] = (sc[o.status] || 0) + 1;
        }
        setStatusCounts(sc);

        // Filter
        let filtered = allOrders.filter((o) => {
          if (statusFilter && o.status !== statusFilter) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            const matchNum = o.order_number.toLowerCase().includes(q);
            const matchName = (o.address?.recipient_name || '').toLowerCase().includes(q);
            const matchPhone = (o.address?.recipient_phone || o.guest_phone || '').toLowerCase().includes(q);
            const matchTrack = (o.tracking_code || '').toLowerCase().includes(q);
            if (!matchNum && !matchName && !matchPhone && !matchTrack) return false;
          }
          return true;
        });

        setTotalCount(filtered.length);
        const startIdx = (page - 1) * pageSize;
        const paged = filtered.slice(startIdx, startIdx + pageSize);
        setOrders(paged);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, datePreset, searchQuery, sortBy, page, pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(orders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`آیا از تغییر وضعیت ${selectedOrderIds.length} سفارش به «${getStatusBadge(bulkStatus).label}» اطمینان دارید؟`)) {
      return;
    }

    setBulkLoading(true);
    let success = false;
    try {
      const res = await fetch(`${API_BASE}/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_ids: selectedOrderIds,
          status: bulkStatus,
        }),
      });

      if (res.ok) {
        success = true;
      }
    } catch (e) {}

    // Fallback: update in orders-store
    for (const oid of selectedOrderIds) {
      updateAdminOrder(oid, { status: bulkStatus as any, statusLabel: getStatusBadge(bulkStatus).label });
    }

    setSelectedOrderIds([]);
    fetchOrders();
    alert('وضعیت سفارش‌های انتخابی با موفقیت به‌روزرسانی شد.');
    setBulkLoading(false);
  };

  const openOrderDetails = (ord: Order) => {
    setSelectedOrder(ord);
    setEditAddress({
      recipient_name: ord.address?.recipient_name || '',
      recipient_phone: ord.address?.recipient_phone || ord.guest_phone || '',
      province: ord.address?.province || '',
      city: ord.address?.city || '',
      postal_code: ord.address?.postal_code || '',
      postal_address: ord.address?.postal_address || '',
    });
    setTrackingCode(ord.tracking_code || '');
    setAdminNote(ord.admin_notes || '');
    setIsEditingAddress(false);
    setModalMode('details');

    // Fetch timeline events for this order
    fetch(`${API_BASE}/admin/orders/${ord.id}/timeline`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.events) {
          setTimelineEvents(data.events);
        } else {
          setTimelineEvents([]);
        }
      })
      .catch(() => setTimelineEvents([]));
  };

  const handleSaveAddress = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          address: editAddress,
        }),
      });
    } catch (e) {}

    // Fallback: update in orders-store
    updateAdminOrder(selectedOrder.id, {
      customerName: editAddress.recipient_name,
      customerPhone: editAddress.recipient_phone,
      address: {
        recipientName: editAddress.recipient_name,
        phone: editAddress.recipient_phone,
        province: editAddress.province,
        city: editAddress.city,
        postalCode: editAddress.postal_code,
        addressLine: editAddress.postal_address,
      },
    });

    setIsEditingAddress(false);
    fetchOrders();
    alert('آدرس تحویل‌گیرنده با موفقیت اصلاح شد.');
    setActionLoading(false);
  };

  const handleSaveTrackingCode = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          tracking_code: trackingCode,
        }),
      });
    } catch (e) {}

    // Fallback: update in orders-store
    updateAdminOrder(selectedOrder.id, {
      trackingCode: trackingCode,
    });

    fetchOrders();
    alert('کد رهگیری پستی با موفقیت ذخیره شد.');
    setActionLoading(false);
  };

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          status: newStatus,
          tracking_code: trackingCode,
          note: statusNote,
        }),
      });
    } catch (e) {}

    // Fallback: update in orders-store
    updateAdminOrder(selectedOrder.id, {
      status: newStatus as any,
      statusLabel: getStatusBadge(newStatus).label,
      trackingCode: trackingCode || selectedOrder.tracking_code,
    });

    setModalMode(null);
    setSelectedOrder(null);
    setTrackingCode('');
    setStatusNote('');
    fetchOrders();
    setActionLoading(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !adminNote.trim()) return;

    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          admin_notes: adminNote,
        }),
      });
    } catch (e) {}

    setModalMode(null);
    setSelectedOrder(null);
    setAdminNote('');
    fetchOrders();
    alert('یادداشت داخلی با موفقیت ذخیره شد.');
    setActionLoading(false);
  };

  // Add item in Create Order modal
  const handleAddProductToCreateOrder = (prod: any, variant?: any) => {
    const unitPriceToman = variant?.price_irr
      ? Math.round(variant.price_irr / 10)
      : prod.price_irr
      ? Math.round(prod.price_irr / 10)
      : 150000;

    const newItem: NewOrderItem = {
      product_id: prod.id || '',
      variant_id: variant?.id || '',
      product_title: prod.title_fa || prod.name || 'محصول مورینگا',
      variant_title: variant?.title_fa || variant?.sku || '',
      sku: variant?.sku || prod.sku || `PROD-${Date.now()}`,
      unit_price_toman: unitPriceToman,
      quantity: 1,
    };

    setCreateItems((prev) => [...prev, newItem]);
    setProductSearch('');
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCustomerPhone.trim()) {
      alert('شماره موبایل خریدار الزامی است.');
      return;
    }
    if (createItems.length === 0) {
      alert('حداقل یک محصول باید به سفارش اضافه شود.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        customer_name: createCustomerName,
        customer_phone: createCustomerPhone,
        customer_email: createCustomerEmail,
        province: createProvince,
        city: createCity,
        postal_address: createPostalAddress,
        postal_code: createPostalCode,
        shipping_method: createShippingMethod,
        shipping_fee_irr: createShippingFeeToman * 10,
        discount_irr: createDiscountToman * 10,
        payment_method: createPaymentMethod,
        payment_status: createPaymentStatus,
        status: createOrderStatus,
        admin_notes: createAdminNotes,
        tracking_code: createTrackingCode,
        items: createItems.map((it) => ({
          product_id: it.product_id,
          variant_id: it.variant_id,
          product_title: it.product_title,
          variant_title: it.variant_title,
          sku: it.sku,
          unit_price_irr: it.unit_price_toman * 10,
          quantity: it.quantity,
        })),
      };

      let apiSuccess = false;
      try {
        const res = await fetch(`${API_BASE}/admin/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          apiSuccess = true;
        }
      } catch (e) {}

      if (!apiSuccess) {
        // Fallback to local persistent store
        const itemsTotalToman = createItems.reduce((s, it) => s + it.unit_price_toman * it.quantity, 0);
        const grandTotalToman = Math.max(0, itemsTotalToman + createShippingFeeToman - createDiscountToman);
        const newOrderNum = `MOR-${Date.now().toString().slice(-5)}`;
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        addAdminOrder({
          id: `ord-${Date.now()}`,
          orderNumber: newOrderNum,
          createdAt: dateStr,
          status: createOrderStatus as any,
          statusLabel: getStatusBadge(createOrderStatus).label,
          customerName: createCustomerName || 'مشتری تلفنی',
          customerPhone: createCustomerPhone,
          totalIrr: grandTotalToman * 10,
          totalToman: grandTotalToman,
          trackingCode: createTrackingCode || '',
          shippingMethod: createShippingMethod || 'پست پیشتاز',
          paymentMethod: createPaymentMethod || 'کارت به کارت',
          address: {
            recipientName: createCustomerName || 'مشتری',
            phone: createCustomerPhone,
            province: createProvince || 'اصفهان',
            city: createCity || 'اصفهان',
            postalCode: createPostalCode || '',
            addressLine: createPostalAddress || 'ثبت شده توسط مدیریت',
          },
        });
      }

      alert('سفارش جدید با موفقیت در سامانه ثبت و صادر شد.');
      setModalMode(null);
      // Reset form
      setCreateCustomerName('');
      setCreateCustomerPhone('');
      setCreateCustomerEmail('');
      setCreateProvince('');
      setCreateCity('');
      setCreatePostalAddress('');
      setCreatePostalCode('');
      setCreateItems([]);
      setCreateAdminNotes('');
      setCreateTrackingCode('');
      fetchOrders();
    } catch {
      alert('خطا در ثبت سفارش.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const headers = [
        'شماره سفارش',
        'تاریخ ثبت (شمسی)',
        'ساعت ثبت',
        'نام تحویل‌گیرنده',
        'تلفن همراه',
        'استان',
        'شهر',
        'نشانی پستی',
        'کد پستی',
        'کد رهگیری پستی',
        'روش ارسال',
        'جمع اقلام (تومان)',
        'هزینه ارسال (تومان)',
        'تخفیف (تومان)',
        'مبلغ نهایی (تومان)',
        'وضعیت',
        'یادداشت ادمین',
      ];

      const exportSource = selectedOrderIds.length > 0
        ? orders.filter((o) => selectedOrderIds.includes(o.id))
        : orders;

      const rows = exportSource.map((ord) => {
        const dt = formatPersianDateTime(ord.created_at);
        const badge = getStatusBadge(ord.status);
        return [
          `"${ord.order_number}"`,
          `"${dt.date}"`,
          `"${dt.time}"`,
          `"${ord.address?.recipient_name || ''}"`,
          `"${ord.address?.recipient_phone || ''}"`,
          `"${ord.address?.province || ''}"`,
          `"${ord.address?.city || ''}"`,
          `"${(ord.address?.postal_address || '').replace(/"/g, '""')}"`,
          `"${ord.address?.postal_code || ''}"`,
          `"${ord.tracking_code || ''}"`,
          `"${ord.shipping_method || 'پست پیشتاز'}"`,
          `"${Math.round(ord.subtotal_irr / 10)}"`,
          `"${Math.round(ord.shipping_fee_irr / 10)}"`,
          `"${Math.round(ord.discount_irr / 10)}"`,
          `"${Math.round(ord.total_irr / 10)}"`,
          `"${badge.label}"`,
          `"${(ord.admin_notes || '').replace(/"/g, '""')}"`,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `iranmoringa_orders_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('خطا در دانلود فایل اکسل');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Calculations for Create Order modal
  const createSubtotalToman = createItems.reduce(
    (sum, it) => sum + it.unit_price_toman * it.quantity,
    0
  );
  const createTotalToman = Math.max(
    0,
    createSubtotalToman + Number(createShippingFeeToman) - Number(createDiscountToman)
  );

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#08201a] p-6 rounded-3xl shadow-xs border border-slate-200 dark:border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-2xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                مدیریت جامع سفارش‌ها و فاکتورها
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                بررسی تاریخ و ساعت دقیق ثبت، رهگیری پستی، چاپ فاکتور رسمی و ثبت سفارشات تلفنی/حضوری
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setModalMode('create_order');
              setCreateItems([]);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-2xl transition-all flex items-center gap-2 shadow-md shadow-emerald-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت سفارش جدید (تلفنی / دستی)</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 border border-slate-200 dark:border-emerald-800/40 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{exporting ? 'آماده‌سازی...' : 'خروجی اکسل (CSV)'}</span>
          </button>

          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            title="بروزرسانی لیست"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#08201a] p-4 rounded-2xl border border-slate-200 dark:border-emerald-900/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">کل سفارش‌ها</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {totalCount.toLocaleString('fa-IR')}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">اتصال کامل به تاریخچه ۲۶۴۶ سفارش</span>
        </div>

        <div className="bg-white dark:bg-[#08201a] p-4 rounded-2xl border border-slate-200 dark:border-emerald-900/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">در انتظار پرداخت</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {(statusCounts['pending_payment'] || 0).toLocaleString('fa-IR')}
          </p>
          <span className="text-[10px] text-slate-400">نیازمند پیگیری مالی</span>
        </div>

        <div className="bg-white dark:bg-[#08201a] p-4 rounded-2xl border border-slate-200 dark:border-emerald-900/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">در حال پردازش و انبار</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-2 font-mono">
            {((statusCounts['processing'] || 0) + (statusCounts['paid'] || 0) + (statusCounts['packed'] || 0)).toLocaleString('fa-IR')}
          </p>
          <span className="text-[10px] text-slate-400">آماده‌سازی جهت تحویل به پست</span>
        </div>

        <div className="bg-white dark:bg-[#08201a] p-4 rounded-2xl border border-slate-200 dark:border-emerald-900/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">تحویل شده و موفق</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {((statusCounts['delivered'] || 0) + (statusCounts['shipped'] || 0)).toLocaleString('fa-IR')}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">تکمیل شده</span>
        </div>
      </div>

      {/* Date Presets Bar */}
      <div className="bg-white dark:bg-[#08201a] p-3 rounded-2xl border border-slate-200 dark:border-emerald-900/40 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold shrink-0 px-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>بازه زمانی:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {DATE_PRESETS.map((dp) => (
            <button
              key={dp.value}
              onClick={() => {
                setDatePreset(dp.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                datePreset === dp.value
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {dp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => {
          const count = s.value === '' ? totalCount : statusCounts[s.value] || 0;
          return (
            <button
              key={s.value}
              onClick={() => {
                setStatusFilter(s.value);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === s.value
                  ? `${s.color} ring-2 ring-emerald-500/50 shadow-xs scale-102`
                  : 'bg-white dark:bg-[#08201a] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{s.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {count.toLocaleString('fa-IR')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="جست‌وجو با شماره سفارش (ORD-...)، نام خریدار، شماره موبایل، شهر، یا کد رهگیری پستی..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-[#08201a] border border-slate-200 dark:border-emerald-900/40 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="sm:col-span-4 flex gap-2">
          <div className="relative flex-1">
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full pr-8 pl-3 py-2.5 bg-white dark:bg-[#08201a] border border-slate-200 dark:border-emerald-900/40 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            >
              <option value="created_at_desc">مرتب‌سازی: جدیدترین تاریخ</option>
              <option value="created_at_asc">مرتب‌سازی: قدیمی‌ترین تاریخ</option>
              <option value="total_desc">مرتب‌سازی: بیشترین مبلغ</option>
              <option value="total_asc">مرتب‌سازی: کمترین مبلغ</option>
            </select>
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2.5 bg-white dark:bg-[#08201a] border border-slate-200 dark:border-emerald-900/40 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
          >
            <option value={20}>۲۰ تایی</option>
            <option value={50}>۵۰ تایی</option>
            <option value={100}>۱۰۰ تایی</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{selectedOrderIds.length.toLocaleString('fa-IR')} سفارش انتخاب شده است</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-200">تغییر وضعیت به:</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-emerald-950 border border-emerald-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="processing">در حال پردازش انبار</option>
              <option value="packed">بسته‌بندی شده</option>
              <option value="shipped">ارسال شده (تحویل پست)</option>
              <option value="delivered">تحویل داده شده</option>
              <option value="cancelled">لغو شده</option>
            </select>

            <button
              onClick={handleBulkStatusUpdate}
              disabled={bulkLoading}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
            >
              {bulkLoading ? 'در حال اعمال...' : 'اعمال گروهی'}
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-xl text-xs transition-all"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* Main Orders Table */}
      <div className="bg-white dark:bg-[#08201a] rounded-3xl border border-slate-200 dark:border-emerald-900/40 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-600" />
            <span>در حال بارگذاری سفارش‌ها و تاریخچه...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 dark:text-slate-300">سفارشی با این فیلترها یافت نشد</p>
            <p className="text-xs text-slate-400 mt-1">می‌توانید فیلتر تاریخ یا وضعیت را تغییر دهید یا سفارش جدید ثبت کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-[#041410] text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-emerald-900/30">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">شماره سفارش</th>
                  <th className="p-4">تاریخ و ساعت ثبت</th>
                  <th className="p-4">تحویل‌گیرنده و تماس</th>
                  <th className="p-4">شهر / استان</th>
                  <th className="p-4">مبلغ (تومان)</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/20">
                {orders.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  const dt = formatPersianDateTime(ord.created_at);
                  const isSelected = selectedOrderIds.includes(ord.id);

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-emerald-950/30 transition-colors ${
                        isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(ord.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {ord.order_number}
                          </span>
                          <button
                            onClick={() => handleCopy(ord.order_number, ord.id)}
                            title="کپی شماره سفارش"
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600"
                          >
                            {copiedId === ord.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {ord.tracking_code && (
                          <div className="flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 font-mono mt-0.5">
                            <span>کد رهگیری:</span>
                            <span className="font-bold">{ord.tracking_code}</span>
                          </div>
                        )}
                      </td>

                      {/* Date & Time (Persian Shamsi) */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{dt.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{dt.time}</span>
                            {dt.relative && (
                              <span className="mr-1 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-sans">
                                {dt.relative}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Recipient & Phone */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {ord.address?.recipient_name || 'مشتری گرامی'}
                          </p>
                          {ord.address?.recipient_phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <a
                                href={`tel:${ord.address.recipient_phone}`}
                                className="hover:text-emerald-600 hover:underline"
                              >
                                {ord.address.recipient_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* City & Province */}
                      <td className="p-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {ord.address?.province && ord.address?.province !== 'نامشخص'
                              ? `${ord.address.province}، ${ord.address.city}`
                              : ord.address?.city || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {(ord.total_irr / 10).toLocaleString('fa-IR')}
                          <span className="text-[10px] font-sans font-normal text-slate-500 mr-1">تومان</span>
                        </div>
                        {ord.items && ord.items.length > 0 && (
                          <span className="text-[10px] text-slate-400">
                            {ord.items.length.toLocaleString('fa-IR')} قلم کالا
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${badge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.bgBadge}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openOrderDetails(ord)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 rounded-xl transition-all"
                            title="مشاهده و مدیریت کامل سفارش"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setNewStatus(ord.status);
                              setTrackingCode(ord.tracking_code || '');
                              setModalMode('transition');
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 rounded-xl transition-all"
                            title="تغییر وضعیت سفارش"
                          >
                            <Truck className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setModalMode('invoice');
                            }}
                            className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 rounded-xl transition-all flex items-center gap-1 text-[11px] font-bold"
                            title="چاپ فاکتور رسمی"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>فاکتور</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setAdminNote(ord.admin_notes || '');
                              setModalMode('note');
                            }}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 rounded-xl transition-all"
                            title="ثبت یادداشت ادمین"
                          >
                            <MessageSquarePlus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#08201a] p-4 rounded-2xl border border-slate-200 dark:border-emerald-900/40">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            نمایش {((page - 1) * pageSize + 1).toLocaleString('fa-IR')} تا {Math.min(page * pageSize, totalCount).toLocaleString('fa-IR')} از {totalCount.toLocaleString('fa-IR')} سفارش
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-3">
              صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: Create Manual Order (ثبت سفارش دستی / تلفنی توسط ادمین)
      ═══════════════════════════════════════════════════════════════════════ */}
      {modalMode === 'create_order' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-[#091f18] text-slate-900 dark:text-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-emerald-900/60 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-2xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    ثبت سفارش جدید (دستی / تلفنی)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    صدور فاکتور و ایجاد سفارش مستقیم در سامانه توسط مدیریت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-6 text-xs">
              {/* Customer Info Section */}
              <div className="bg-slate-50 dark:bg-[#041410] p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/30 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-emerald-400 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>۱. اطلاعات خریدار و نشانی تحویل</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      نام و نام خانوادگی خریدار
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: علی احمدی"
                      value={createCustomerName}
                      onChange={(e) => setCreateCustomerName(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      شماره تلفن همراه <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0912xxxxxxx"
                      value={createCustomerPhone}
                      onChange={(e) => setCreateCustomerPhone(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ایمیل (اختیاری)
                    </label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={createCustomerEmail}
                      onChange={(e) => setCreateCustomerEmail(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none dir-ltr text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      استان
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: اصفهان"
                      value={createProvince}
                      onChange={(e) => setCreateProvince(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      شهر
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: اصفهان"
                      value={createCity}
                      onChange={(e) => setCreateCity(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      کد پستی ۱۰ رقمی
                    </label>
                    <input
                      type="text"
                      placeholder="81938xxxxx"
                      value={createPostalCode}
                      onChange={(e) => setCreatePostalCode(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none dir-ltr text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="آدرس کامل جهت ارسال بسته پستی..."
                    value={createPostalAddress}
                    onChange={(e) => setCreatePostalAddress(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="bg-slate-50 dark:bg-[#041410] p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/30 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-emerald-400 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>۲. انتخاب و افزودن محصولات به سفارش</span>
                </h4>

                {/* Product Search / Selector */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="جست‌وجوی نام محصول برای افزودن به لیست سفارش..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />

                  {/* Dropdown Suggestions */}
                  {productSearch.trim() && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-[#08201a] border border-slate-200 dark:border-emerald-900 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-emerald-900/40">
                      {catalogProducts
                        .filter(
                          (p) =>
                            p.title_fa?.includes(productSearch) ||
                            p.name?.includes(productSearch) ||
                            p.slug?.includes(productSearch)
                        )
                        .map((prod) => (
                          <div
                            key={prod.id}
                            className="p-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {prod.title_fa || prod.name}
                              </p>
                              <span className="text-[11px] text-slate-500 font-mono">
                                قیمت پایه: {Math.round((prod.price_irr || 0) / 10).toLocaleString('fa-IR')} تومان
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddProductToCreateOrder(prod)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all"
                            >
                              + افزودن
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Items Table */}
                {createItems.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-300 dark:border-emerald-900/40 rounded-2xl text-slate-400">
                    محصولی انتخاب نشده است. نام محصول را جست‌وجو کرده و اضافه کنید.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse border border-slate-200 dark:border-emerald-900/40">
                      <thead>
                        <tr className="bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-emerald-900/40">
                          <th className="p-2.5">ردیف</th>
                          <th className="p-2.5">شرح کالا</th>
                          <th className="p-2.5 w-24">تعداد</th>
                          <th className="p-2.5 w-36">قیمت واحد (تومان)</th>
                          <th className="p-2.5">جمع (تومان)</th>
                          <th className="p-2.5 w-12">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                        {createItems.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-emerald-950/20">
                            <td className="p-2.5 text-center font-mono">{idx + 1}</td>
                            <td className="p-2.5 font-bold">
                              <input
                                type="text"
                                value={it.product_title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCreateItems((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, product_title: val } : item))
                                  );
                                }}
                                className="w-full bg-transparent border-b border-slate-300 focus:outline-none focus:border-emerald-500"
                              />
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCreateItems((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
                                      )
                                    )
                                  }
                                  className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) => {
                                    const q = Math.max(1, parseInt(e.target.value || '1', 10));
                                    setCreateItems((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, quantity: q } : item))
                                    );
                                  }}
                                  className="w-10 text-center font-mono font-bold bg-white dark:bg-[#08201a] border border-slate-300 rounded p-1"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCreateItems((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, quantity: item.quantity + 1 } : item
                                      )
                                    )
                                  }
                                  className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                value={it.unit_price_toman}
                                onChange={(e) => {
                                  const p = Math.max(0, parseInt(e.target.value || '0', 10));
                                  setCreateItems((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, unit_price_toman: p } : item))
                                  );
                                }}
                                className="w-full bg-white dark:bg-[#08201a] border border-slate-300 rounded p-1 font-mono font-bold text-left dir-ltr"
                              />
                            </td>
                            <td className="p-2.5 font-mono font-bold">
                              {(it.unit_price_toman * it.quantity).toLocaleString('fa-IR')}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => setCreateItems((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Shipping, Discounts & Financial Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#041410] p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/30 space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>۳. روش ارسال و پرداخت</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        روش ارسال
                      </label>
                      <select
                        value={createShippingMethod}
                        onChange={(e) => setCreateShippingMethod(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl"
                      >
                        <option value="post_pishtaz">پست پیشتاز سراسری</option>
                        <option value="tipax">تیپاکس (پس‌کرایه/سفارشی)</option>
                        <option value="courier_isfahan">پیک فوری اصفهان</option>
                        <option value="in_person">تحویل حضوری در دفتر</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        هزینه ارسال (تومان)
                      </label>
                      <input
                        type="number"
                        value={createShippingFeeToman}
                        onChange={(e) => setCreateShippingFeeToman(Number(e.target.value))}
                        className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        روش پرداخت
                      </label>
                      <select
                        value={createPaymentMethod}
                        onChange={(e) => setCreatePaymentMethod(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl"
                      >
                        <option value="card_to_card">کارت به کارت مستقیم</option>
                        <option value="online_gateway">درگاه پرداخت اینترنتی</option>
                        <option value="cash_on_delivery">پرداخت در محل</option>
                        <option value="cash_in_person">تسویه نقدی حضوری</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        وضعیت پرداخت
                      </label>
                      <select
                        value={createPaymentStatus}
                        onChange={(e) => setCreatePaymentStatus(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl"
                      >
                        <option value="paid">پرداخت شده (تسویه کامل)</option>
                        <option value="pending_payment">در انتظار واریز</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        وضعیت اولیه سفارش
                      </label>
                      <select
                        value={createOrderStatus}
                        onChange={(e) => setCreateOrderStatus(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl"
                      >
                        <option value="processing">در حال پردازش انبار</option>
                        <option value="packed">بسته‌بندی شده</option>
                        <option value="pending_payment">در انتظار پرداخت</option>
                        <option value="shipped">ارسال شده به پست</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        تخفیف دستی (تومان)
                      </label>
                      <input
                        type="number"
                        value={createDiscountToman}
                        onChange={(e) => setCreateDiscountToman(Number(e.target.value))}
                        className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="bg-slate-50 dark:bg-[#041410] p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/30 flex flex-col justify-between space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>۴. محاسبه و جمع کل صورت‌حساب</span>
                  </h4>

                  <div className="space-y-2 bg-white dark:bg-[#08201a] p-4 rounded-xl border border-slate-200 dark:border-emerald-900/40 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">جمع قیمت اقلام:</span>
                      <span className="font-mono font-bold">
                        {createSubtotalToman.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">هزینه ارسال:</span>
                      <span className="font-mono font-bold text-blue-600">
                        +{Number(createShippingFeeToman).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>

                    {createDiscountToman > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>تخفیف اعمال‌شده:</span>
                        <span className="font-mono">-{Number(createDiscountToman).toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-slate-200 dark:border-emerald-900/40 pt-2 text-sm font-black text-emerald-900 dark:text-emerald-300">
                      <span>مبلغ قابل پرداخت نهایی:</span>
                      <span className="font-mono text-base">{createTotalToman.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      یادداشت داخلی ادمین (اختیاری)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="توضیحات تکمیلی در رابطه با سفارش تلفنی/حضوری..."
                      value={createAdminNotes}
                      onChange={(e) => setCreateAdminNotes(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-slate-200 transition-colors font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-700/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoading ? 'در حال ثبت سفارش...' : 'تایید و صدور نهایی سفارش'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: Full Order Details & Management Drawer/Modal
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedOrder && modalMode === 'details' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-[#091f18] text-slate-900 dark:text-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-emerald-900/60 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-emerald-900/40 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    {selectedOrder.order_number}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(selectedOrder.status).color}`}>
                    {getStatusBadge(selectedOrder.status).label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ثبت‌شده در: {formatPersianDateTime(selectedOrder.created_at).full}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode('invoice')}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ فاکتور</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewStatus(selectedOrder.status);
                    setTrackingCode(selectedOrder.tracking_code || '');
                    setModalMode('transition');
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all shadow-sm"
                >
                  <Truck className="w-4 h-4" />
                  <span>تغییر وضعیت</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode(null);
                    setSelectedOrder(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Tracking Code Bar */}
            <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <div>
                  <span className="font-bold text-xs text-purple-950 dark:text-purple-200">
                    کد رهگیری مرسوله پستی:
                  </span>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400">
                    شرکت ملی پست جمهوری اسلامی ایران
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="کد ۲۴ رقمی پست..."
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="p-2 bg-white dark:bg-[#08201a] border border-purple-300 dark:border-purple-800 rounded-xl text-xs font-mono text-left dir-ltr focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <button
                  onClick={handleSaveTrackingCode}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  ذخیره کد
                </button>

                {selectedOrder.tracking_code && (
                  <a
                    href={`https://tracking.post.ir/?id=${selectedOrder.tracking_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white dark:bg-[#08201a] text-purple-700 dark:text-purple-300 hover:text-purple-900 border border-purple-300 dark:border-purple-800 rounded-xl text-xs flex items-center gap-1 font-bold"
                    title="مشاهده مستقیم در سایت پست"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>سامانه پست</span>
                  </a>
                )}
              </div>
            </div>

            {/* Grid 2-col: Customer info & Financials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recipient / Customer Details */}
              <div className="bg-slate-50 dark:bg-[#041410] p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>مشخصات تحویل‌گیرنده و نشانی</span>
                  </h4>
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-[11px] text-emerald-600 hover:underline font-bold"
                  >
                    {isEditingAddress ? 'انصراف از ویرایش' : 'ویرایش نشانی'}
                  </button>
                </div>

                {!isEditingAddress ? (
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <p>
                      <span className="text-slate-400 ml-1">نام:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedOrder.address?.recipient_name || 'مشتری گرامی'}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-slate-400">تلفن:</span>
                      <span className="font-mono font-bold">{selectedOrder.address?.recipient_phone || '—'}</span>
                      {selectedOrder.address?.recipient_phone && (
                        <a
                          href={`https://wa.me/${selectedOrder.address.recipient_phone.replace('+', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mr-2 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 px-1.5 py-0.5 rounded font-bold"
                        >
                          واتس‌اپ
                        </a>
                      )}
                    </p>
                    <p>
                      <span className="text-slate-400 ml-1">استان و شهر:</span>
                      <span>
                        {selectedOrder.address?.province || '—'} / {selectedOrder.address?.city || '—'}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400 ml-1">کد پستی:</span>
                      <span className="font-mono font-bold">{selectedOrder.address?.postal_code || '—'}</span>
                    </p>
                    <p className="leading-relaxed">
                      <span className="text-slate-400 ml-1">نشانی:</span>
                      <span>{selectedOrder.address?.postal_address || '—'}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="نام تحویل‌گیرنده"
                      value={editAddress.recipient_name}
                      onChange={(e) => setEditAddress({ ...editAddress, recipient_name: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-[#08201a] border border-slate-300 rounded-xl text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="استان"
                        value={editAddress.province}
                        onChange={(e) => setEditAddress({ ...editAddress, province: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-[#08201a] border border-slate-300 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="شهر"
                        value={editAddress.city}
                        onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-[#08201a] border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="نشانی پستی دقیق"
                      value={editAddress.postal_address}
                      onChange={(e) => setEditAddress({ ...editAddress, postal_address: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-[#08201a] border border-slate-300 rounded-xl text-xs"
                    />
                    <button
                      onClick={handleSaveAddress}
                      disabled={actionLoading}
                      className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700"
                    >
                      ذخیره تغییرات نشانی
                    </button>
                  </div>
                )}
              </div>

              {/* Financial & Status Summary */}
              <div className="bg-slate-50 dark:bg-[#041410] p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/30 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>خلاصه مالی و تسویه</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">جمع کل کالاها:</span>
                    <span className="font-mono font-bold">
                      {Math.round(selectedOrder.subtotal_irr / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  {selectedOrder.discount_irr > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>تخفیف:</span>
                      <span className="font-mono font-bold">
                        -{Math.round(selectedOrder.discount_irr / 10).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-500">هزینه ارسال:</span>
                    <span className="font-mono font-bold text-blue-600">
                      {selectedOrder.shipping_fee_irr === 0
                        ? 'رایگان'
                        : `+${Math.round(selectedOrder.shipping_fee_irr / 10).toLocaleString('fa-IR')} تومان`}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 dark:border-emerald-900/40 pt-2 text-sm font-black text-emerald-900 dark:text-emerald-300">
                    <span>مبلغ نهایی پرداختی:</span>
                    <span className="font-mono text-base">
                      {Math.round(selectedOrder.total_irr / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>روش ارسال: {selectedOrder.shipping_method || 'پست پیشتاز'}</span>
                    <span>روش پرداخت: {selectedOrder.payment_method || 'درگاه آنلاین'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>اقلام سفارش</span>
              </h4>

              <div className="overflow-x-auto border border-slate-200 dark:border-emerald-900/40 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-[#041410] text-slate-500 font-bold border-b border-slate-200 dark:border-emerald-900/30">
                    <tr>
                      <th className="p-3">ردیف</th>
                      <th className="p-3">شرح کالا</th>
                      <th className="p-3 text-center">تعداد</th>
                      <th className="p-3">قیمت واحد (تومان)</th>
                      <th className="p-3">جمع کل (تومان)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/20">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {it.product_title} {it.variant_title && `(${it.variant_title})`}
                            {it.sku && <span className="block text-[10px] text-slate-400 font-mono font-normal">کد SKU: {it.sku}</span>}
                          </td>
                          <td className="p-3 text-center font-mono font-bold">{it.quantity}</td>
                          <td className="p-3 font-mono">{Math.round(it.unit_price_irr / 10).toLocaleString('fa-IR')}</td>
                          <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {Math.round(it.subtotal_irr / 10).toLocaleString('fa-IR')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          اطلاعات اقلام تفکیکی در دسترس نیست
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Notes Section */}
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <MessageSquarePlus className="w-4 h-4" />
                  یادداشت‌های ادمین برای این سفارش:
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ثبت یادداشت جدید..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="flex-1 p-2 bg-white dark:bg-[#08201a] border border-amber-300 dark:border-amber-800 rounded-xl text-xs"
                />
                <button
                  onClick={handleAddNote}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  ذخیره یادداشت
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: Status Transition Modal
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedOrder && modalMode === 'transition' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] text-slate-900 dark:text-white p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-emerald-900/60 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              تغییر وضعیت سفارش <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedOrder.order_number}</span>
            </h3>
            <div className="text-xs text-slate-500">
              وضعیت فعلی: <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusBadge(selectedOrder.status).color}`}>{getStatusBadge(selectedOrder.status).label}</span>
            </div>

            <form onSubmit={handleTransition} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت جدید
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="pending_payment">در انتظار پرداخت</option>
                  <option value="paid">پرداخت شده (تایید تراکنش)</option>
                  <option value="processing">در حال پردازش انبار</option>
                  <option value="packed">بسته‌بندی شده</option>
                  <option value="shipped">ارسال شده (تحویل به پست)</option>
                  <option value="delivered">تحویل داده شده به مشتری</option>
                  <option value="cancelled">لغو سفارش</option>
                  <option value="refunded">بازگشت وجه</option>
                </select>
              </div>

              {newStatus === 'shipped' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کد رهگیری مرسوله پستی
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="کد ۲۴ رقمی رهگیری پست پیشتاز"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl text-xs font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و دلیل تغییر وضعیت (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="توضیحات مرتبط با تغییر وضعیت..."
                  className="w-full p-2.5 bg-white dark:bg-[#08201a] border border-slate-300 dark:border-emerald-900/60 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode(null);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'در حال ثبت...' : 'تایید و به‌روزرسانی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4: Note Modal
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedOrder && modalMode === 'note' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] text-slate-900 dark:text-white p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-emerald-900/60 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              یادداشت برای سفارش <span className="font-mono text-emerald-600">{selectedOrder.order_number}</span>
            </h3>
            <form onSubmit={handleAddNote} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">متن یادداشت</label>
                <textarea
                  required
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="یادداشت ادمین برای این سفارش..."
                  className="w-full p-3 border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs bg-slate-50 dark:bg-[#041410] dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode(null);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'در حال ثبت...' : 'ثبت یادداشت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 5: Official Persian Invoice Print Modal
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedOrder && modalMode === 'invoice' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-300 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Header & Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-black text-slate-900">پیش‌نمایش فاکتور رسمی فروشگاه</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#026251] hover:bg-[#014d3f] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ فاکتور (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode(null);
                    setSelectedOrder(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-6 border-2 border-slate-300 rounded-2xl space-y-6 text-xs bg-white text-slate-900" id="official-invoice-sheet">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-black text-emerald-950">فروشگاه تخصصی ایران مورینگا</h2>
                  <p className="text-[11px] text-slate-600">تولید و توزیع سوپرفودهای ارگانیک و فرآورده‌های مورینگا اولیفرا</p>
                  <p className="text-[10px] text-slate-500 font-mono">شناسه ملی: 14009876543 • کد اقتصادی: 411678912345</p>
                </div>

                <div className="text-left space-y-1">
                  <div className="text-xs font-bold text-slate-900">
                    شماره فاکتور: <span className="font-mono text-emerald-800">{selectedOrder.order_number}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    تاریخ و ساعت ثبت: {formatPersianDateTime(selectedOrder.created_at).full}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    کد رهگیری پستی: <span className="font-mono font-bold">{selectedOrder.tracking_code || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Buyer & Seller Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-emerald-900 block">مشخصات خریدار:</span>
                  <p className="text-slate-800 font-bold">نام: {selectedOrder.address.recipient_name}</p>
                  <p className="text-slate-700">تلفن تماس: <span className="font-mono">{selectedOrder.address.recipient_phone}</span></p>
                  <p className="text-slate-700">کد پستی: <span className="font-mono">{selectedOrder.address.postal_code}</span></p>
                  <p className="text-slate-700">نشانی: {selectedOrder.address.province}، {selectedOrder.address.city}، {selectedOrder.address.postal_address}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-emerald-900 block">مشخصات فروشنده:</span>
                  <p className="text-slate-800 font-bold">شرکت زیست فرآورده ایران مورینگا</p>
                  <p className="text-slate-700">تلفن پشتیبانی: 09132391843</p>
                  <p className="text-slate-700">نشانی دفتر: اصفهان، چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲</p>
                  <p className="text-slate-700">سامانه پیامکی: WebOneSMS (30008899)</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                      <th className="p-2.5 border-l border-slate-300 w-10 text-center">ردیف</th>
                      <th className="p-2.5 border-l border-slate-300">شرح کالا و خدمات</th>
                      <th className="p-2.5 border-l border-slate-300 w-16 text-center">تعداد</th>
                      <th className="p-2.5 border-l border-slate-300">قیمت واحد (تومان)</th>
                      <th className="p-2.5">مبلغ کل (تومان)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2.5 border-l border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-2.5 border-l border-slate-300 font-medium">
                            {it.product_title} {it.variant_title && `(${it.variant_title})`}
                          </td>
                          <td className="p-2.5 border-l border-slate-300 text-center font-mono font-bold">{it.quantity}</td>
                          <td className="p-2.5 border-l border-slate-300 font-mono">{Math.round(it.unit_price_irr / 10).toLocaleString('fa-IR')}</td>
                          <td className="p-2.5 font-mono font-bold">{Math.round(it.subtotal_irr / 10).toLocaleString('fa-IR')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 border-l border-slate-300 text-center font-mono">۱</td>
                        <td className="p-2.5 border-l border-slate-300 font-medium">محصولات ارگانیک مورینگا اولیفرا (اقلام سفارش)</td>
                        <td className="p-2.5 border-l border-slate-300 text-center font-mono font-bold">۱</td>
                        <td className="p-2.5 border-l border-slate-300 font-mono">{Math.round(selectedOrder.total_irr / 10).toLocaleString('fa-IR')}</td>
                        <td className="p-2.5 font-mono font-bold">{Math.round(selectedOrder.total_irr / 10).toLocaleString('fa-IR')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-xs border border-slate-300 p-3.5 rounded-xl bg-slate-50">
                  <div className="flex justify-between">
                    <span className="text-slate-600">جمع کل اقلام:</span>
                    <span className="font-mono font-bold">{Math.round(selectedOrder.subtotal_irr / 10).toLocaleString('fa-IR')} تومان</span>
                  </div>
                  {selectedOrder.discount_irr > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>تخفیف اعمال‌شده:</span>
                      <span className="font-mono font-bold">-{Math.round(selectedOrder.discount_irr / 10).toLocaleString('fa-IR')} تومان</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">هزینه بسته‌بندی و ارسال پیشتاز:</span>
                    <span className="font-mono font-bold">
                      {selectedOrder.shipping_fee_irr === 0 ? 'رایگان' : `${Math.round(selectedOrder.shipping_fee_irr / 10).toLocaleString('fa-IR')} تومان`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-emerald-950">
                    <span>مبلغ نهایی پرداخت‌شده:</span>
                    <span className="font-mono text-emerald-800">{Math.round(selectedOrder.total_irr / 10).toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp & Sign */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-[11px] text-slate-500">
                <span>فاکتور رسمی الکترونیک صادرشده از سامانه یکپارچه ایران مورینگا</span>
                <div className="text-center font-bold text-emerald-900 border-2 border-dashed border-emerald-700 px-4 py-2 rounded-xl">
                  مهر و امضای فروشگاه ایران مورینگا 🌿
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
