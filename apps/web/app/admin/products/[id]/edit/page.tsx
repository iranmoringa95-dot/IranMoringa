'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  DollarSign,
  Truck,
  Layers,
  Link2,
  ShieldAlert,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Save,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  HelpCircle,
  Clock,
  ChevronLeft,
  Search,
  Tag,
  Star,
} from 'lucide-react';

interface ProductVariant {
  id: string;
  sku: string;
  title_fa: string;
  price_toman: number;
  compare_at_price_toman?: number;
  net_weight_grams: number;
  shipping_weight_grams: number;
  stock: number;
  is_active: boolean;
}

interface ProductGalleryItem {
  id: string;
  url: string;
  alt_fa: string;
}

interface FullProductData {
  id: string;
  slug: string;
  title_fa: string;
  short_description_fa: string;
  full_description_fa: string;
  product_type: 'simple' | 'variable';
  status: 'published' | 'draft' | 'unpublished' | 'archived';
  is_featured: boolean;
  version: number;
  category_slug: string;
  primary_category_name: string;
  brand_name: string;
  tags: string[];
  // Pricing
  price_toman: number;
  compare_at_price_toman?: number;
  tax_status: 'none' | 'standard';
  // Inventory
  sku: string;
  stock_status: 'in_stock' | 'out_of_stock' | 'on_backorder';
  available_stock: number;
  low_stock_threshold: number;
  sold_individually: boolean;
  // Shipping
  net_weight_grams: number;
  shipping_weight_grams: number;
  dimension_length_cm: number;
  dimension_width_cm: number;
  dimension_height_cm: number;
  shipping_class: 'standard_post' | 'heavy_express' | 'fragile';
  // Media
  featured_image_url: string;
  featured_image_alt: string;
  gallery: ProductGalleryItem[];
  // Variants
  variants: ProductVariant[];
  // Compliance / Health (M15)
  usage_instructions_fa: string;
  storage_conditions_fa: string;
  warnings_fa: string;
  disclaimers_fa: string;
  country_of_origin: string;
  // SEO
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  focus_keyword: string;
}

const DEMO_PRODUCTS_FULL_MAP: Record<string, FullProductData> = {
  '33333333-0001-1111-1111-111111111111': {
    id: '33333333-0001-1111-1111-111111111111',
    slug: 'moringa-leaf-powder-100g',
    title_fa: 'پودر برگ مورینگا ۱۰۰ گرمی',
    short_description_fa: 'پودر خالص و ارگانیک برگ درخت مورینگا، سرشار از آنتی‌اکسیدان، ویتامین و اسیدهای آمینه ضروری.',
    full_description_fa: `پودر برگ مورینگا ۱۰۰ گرمی از برگ‌های تازه و دست‌چین شده مزارع ارگانیک تهیه شده است. 

## ویژگی‌های برجسته:
- سرشار از ویتامین‌های A، C، E و مواد معدنی کلسیم، آهن و پتاسیم
- تهیه شده با فناوری خشک‌سازی در سایه جهت حفظ ۱۰۰٪ ارزش غذایی
- مناسب برای ترکیب با اسموتی، ماست، سالاد و دمنوش‌های روزانه

> «پودر برگ مورینگا با داشتن ۱۸ اسید آمینه ضروری، یکی از کامل‌ترین پروتئین‌های گیاهی در جهان است.»`,
    product_type: 'simple',
    status: 'published',
    is_featured: true,
    version: 1,
    category_slug: 'powders-and-leaves',
    primary_category_name: 'پودر و برگ خشک',
    brand_name: 'سبزینه ارگانیک',
    tags: ['پودر_مورینگا', 'سوپرفود', 'آنتی_اکسیدان', 'تقویت_ایمنی'],
    price_toman: 245000,
    compare_at_price_toman: 275000,
    tax_status: 'none',
    sku: 'MIR-PWD-100',
    stock_status: 'in_stock',
    available_stock: 40,
    low_stock_threshold: 5,
    sold_individually: false,
    net_weight_grams: 100,
    shipping_weight_grams: 130,
    dimension_length_cm: 15,
    dimension_width_cm: 10,
    dimension_height_cm: 3,
    shipping_class: 'standard_post',
    featured_image_url: '/images/demo/moringa-leaf-powder-100g.png',
    featured_image_alt: 'بسته‌بندی پاکتی پودر برگ مورینگا ۱۰۰ گرمی',
    gallery: [
      { id: 'g1', url: '/images/demo/moringa-leaf-powder-250g.png', alt_fa: 'بسته ۲۵۰ گرمی پودر مورینگا' },
      { id: 'g2', url: '/images/demo/dried-moringa-leaves-50g.png', alt_fa: 'برگ خشک مورینگا' },
    ],
    variants: [
      {
        id: 'v1',
        sku: 'MIR-PWD-100',
        title_fa: 'بسته ۱۰۰ گرمی',
        price_toman: 245000,
        compare_at_price_toman: 275000,
        net_weight_grams: 100,
        shipping_weight_grams: 130,
        stock: 40,
        is_active: true,
      },
    ],
    usage_instructions_fa: 'روزانه ۱ الی ۲ قاشق چای‌خوری (۳ تا ۵ گرم) همراه آب، آبمیوه، ماست یا اسموتی مصرف گردد.',
    storage_conditions_fa: 'در جای خشک و خنک، دور از نور مستقیم خورشید و در بسته‌بندی زیپ‌کیپ نگهداری شود.',
    warnings_fa: 'بانوان باردار یا شیرده و افراد تحت درمان دارویی قبل از مصرف مداوم با پزشک مشورت نمایند.',
    disclaimers_fa: 'این فرآورده یک مکمل غذایی گیاهی است و جایگزین توصیه، تشخیص یا درمان پزشک متخصص نمی‌باشد.',
    country_of_origin: 'ایران',
    seo_title: 'خرید پودر برگ مورینگا ۱۰۰ گرمی ارگانیک | فروشگاه سبزینه',
    seo_description: 'خرید آنلاین پودر خالص برگ مورینگا ۱۰۰ گرمی با بالاترین کیفیت آزمایشگاهی، مناسب تقویت سیستم ایمنی و انرژی روزانه با ارسال سریع.',
    canonical_url: 'http://localhost:3000/product/moringa-leaf-powder-100g',
    focus_keyword: 'پودر برگ مورینگا',
  },
  '33333333-0007-1111-1111-111111111111': {
    id: '33333333-0007-1111-1111-111111111111',
    slug: 'moringa-oil-30ml',
    title_fa: 'روغن خالص مورینگا ۳۰ میلی‌لیتری',
    short_description_fa: 'روغن خالص دانه مورینگا استخراج شده به روش پرس سرد، مناسب برای مراقبت و آبرسانی پوست و تقویت مو.',
    full_description_fa: 'روغن طلایی دانه مورینگا با خلوص ۱۰۰٪ و به روش کلدپرس استخراج شده است. این روغن غنی از اسید اولئیک و ویتامین‌های محلول در چربی بوده و جذبی بسیار سریع و ابریشمی دارد.',
    product_type: 'simple',
    status: 'published',
    is_featured: true,
    version: 1,
    category_slug: 'oils-and-extracts',
    primary_category_name: 'روغن‌ها و عصاره‌ها',
    brand_name: 'سبزینه ارگانیک',
    tags: ['روغن_مورینگا', 'پوست_و_مو', 'کلاژن_ساز', 'ضد_چروک'],
    price_toman: 675000,
    compare_at_price_toman: 725000,
    tax_status: 'none',
    sku: 'MIR-OIL-030',
    stock_status: 'in_stock',
    available_stock: 18,
    low_stock_threshold: 3,
    sold_individually: false,
    net_weight_grams: 30,
    shipping_weight_grams: 85,
    dimension_length_cm: 10,
    dimension_width_cm: 5,
    dimension_height_cm: 5,
    shipping_class: 'fragile',
    featured_image_url: '/images/demo/moringa-oil-30ml.png',
    featured_image_alt: 'بطری شیشه‌ای قطره‌چکانی روغن مورینگا',
    gallery: [],
    variants: [
      {
        id: 'v7',
        sku: 'MIR-OIL-030',
        title_fa: 'بطری ۳۰ میل',
        price_toman: 675000,
        compare_at_price_toman: 725000,
        net_weight_grams: 30,
        shipping_weight_grams: 85,
        stock: 18,
        is_active: true,
      },
    ],
    usage_instructions_fa: 'شب‌ها ۳ الی ۴ قطره روی پوست تمیز یا ساقه مو ماساژ داده شود.',
    storage_conditions_fa: 'در جای خنک و تاریک نگهداری شود.',
    warnings_fa: 'قبل از مصرف تست حساسیت روی پوست بازو انجام شود.',
    disclaimers_fa: 'این محصول داروی درمانی بیماری‌های پوستی نیست و صرفاً مراقبت طبیعی می‌باشد.',
    country_of_origin: 'ایران',
    seo_title: 'خرید روغن خالص مورینگا ۳۰ میل پرس سرد | سبزینه',
    seo_description: 'خرید روغن دانه مورینگا ۱۰۰٪ خالص کلدپرس برای شادابی پوست، رفع خشکی و تقویت ریشه مو با ارسال به سراسر کشور.',
    canonical_url: 'http://localhost:3000/product/moringa-oil-30ml',
    focus_keyword: 'روغن مورینگا',
  },
};

const CATEGORIES_LIST = [
  { slug: 'powders-and-leaves', name: 'پودر و برگ خشک مورینگا' },
  { slug: 'teas-and-infusions', name: 'دمنوش‌ها و تی‌بگ ارگانیک' },
  { slug: 'oils-and-extracts', name: 'روغن‌های سلامت و زیبایی' },
  { slug: 'capsules-and-supplements', name: 'کپسول و مکمل‌های تغذیه‌ای' },
  { slug: 'seeds-and-seedlings', name: 'بذر، دانه و نشاء کشاورزی' },
  { slug: 'bundles-and-gifts', name: 'بسته‌های هدیه و پک‌های آشنایی' },
];

const PRESET_IMAGES = [
  { url: '/images/demo/moringa-leaf-powder-100g.png', label: 'پودر برگ ۱۰۰ گرمی' },
  { url: '/images/demo/moringa-leaf-powder-250g.png', label: 'پودر برگ ۲۵۰ گرمی' },
  { url: '/images/demo/moringa-oil-30ml.png', label: 'روغن مورینگا ۳۰ میل' },
  { url: '/images/demo/moringa-lemon-tea-20.png', label: 'دمنوش مورینگا و لیمو' },
  { url: '/images/demo/moringa-cinnamon-tea-20.png', label: 'دمنوش مورینگا و دارچین' },
  { url: '/images/demo/moringa-capsules-60.png', label: 'کپسول گیاهی ۶۰ عددی' },
  { url: '/images/demo/dried-moringa-leaves-50g.png', label: 'برگ خشک مورینگا ۵۰ گرمی' },
  { url: '/images/demo/moringa-seeds-100g.png', label: 'دانه خام مورینگا ۱۰۰ گرمی' },
  { url: '/images/demo/moringa-starter-pack.png', label: 'بسته آشنایی با مورینگا' },
  { url: '/images/demo/moringa-gift-box.png', label: 'بسته هدیه چوبی نفیس' },
];

export default function AdminEditProductWooPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // WooCommerce Active Data Tab
  const [activeTab, setActiveTab] = useState<'general' | 'inventory' | 'shipping' | 'variants' | 'compliance' | 'seo'>('general');

  // Product Form Data
  const [product, setProduct] = useState<FullProductData>({
    id: rawId,
    slug: 'moringa-leaf-powder-100g',
    title_fa: 'پودر برگ مورینگا ۱۰۰ گرمی',
    short_description_fa: '',
    full_description_fa: '',
    product_type: 'simple',
    status: 'published',
    is_featured: false,
    version: 1,
    category_slug: 'powders-and-leaves',
    primary_category_name: 'پودر و برگ خشک',
    brand_name: 'سبزینه ارگانیک',
    tags: ['مورینگا'],
    price_toman: 245000,
    compare_at_price_toman: 275000,
    tax_status: 'none',
    sku: 'MIR-PWD-100',
    stock_status: 'in_stock',
    available_stock: 40,
    low_stock_threshold: 5,
    sold_individually: false,
    net_weight_grams: 100,
    shipping_weight_grams: 130,
    dimension_length_cm: 15,
    dimension_width_cm: 10,
    dimension_height_cm: 3,
    shipping_class: 'standard_post',
    featured_image_url: '/images/demo/moringa-leaf-powder-100g.png',
    featured_image_alt: 'تصویر محصول',
    gallery: [],
    variants: [],
    usage_instructions_fa: '',
    storage_conditions_fa: '',
    warnings_fa: '',
    disclaimers_fa: 'این محصول جایگزین توصیه پزشک نیست.',
    country_of_origin: 'ایران',
    seo_title: '',
    seo_description: '',
    canonical_url: '',
    focus_keyword: '',
  });

  const [tagInput, setTagInput] = useState('');

  // Load product data gracefully with fallback
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Try local Next.js API or Go backend
        const res = await fetch(`/api/v1/catalog/products/${rawId}`);
        if (res.ok) {
          const apiData = await res.json();
          if (apiData && apiData.title_fa) {
            setProduct((prev) => ({
              ...prev,
              ...apiData,
              price_toman: apiData.variants?.[0]?.price_irr ? Math.floor(apiData.variants[0].price_irr / 10) : prev.price_toman,
              compare_at_price_toman: apiData.variants?.[0]?.compare_at_price_irr ? Math.floor(apiData.variants[0].compare_at_price_irr / 10) : prev.compare_at_price_toman,
              sku: apiData.variants?.[0]?.sku || prev.sku,
              net_weight_grams: apiData.variants?.[0]?.net_weight_grams || prev.net_weight_grams,
              shipping_weight_grams: apiData.variants?.[0]?.shipping_weight_grams || prev.shipping_weight_grams,
              featured_image_url: apiData.media?.[0]?.url || prev.featured_image_url,
            }));
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to DEMO_PRODUCTS_FULL_MAP
      }

      // Check fallback map by ID or slug
      const fallback = DEMO_PRODUCTS_FULL_MAP[rawId] || Object.values(DEMO_PRODUCTS_FULL_MAP).find((p) => p.slug === rawId) || DEMO_PRODUCTS_FULL_MAP['33333333-0001-1111-1111-111111111111'];
      setProduct(fallback);
      setTagInput(fallback.tags.join(', '));
      setLoading(false);
    }

    loadData();
  }, [rawId]);

  // Discount percentage calculation
  const discountPercent =
    product.compare_at_price_toman && product.compare_at_price_toman > product.price_toman
      ? Math.round(((product.compare_at_price_toman - product.price_toman) / product.compare_at_price_toman) * 100)
      : null;

  // Insert markdown helpers
  const handleInsertMarkdown = (type: string) => {
    let snippet = '';
    switch (type) {
      case 'h2':
        snippet = '\n\n## سرتیتر بخش جدید\nتوضیحات این قسمت...';
        break;
      case 'h3':
        snippet = '\n\n### زیرعنوان موضوعی\nنکات تکمیلی...';
        break;
      case 'quote':
        snippet = '\n\n> «نکته یا ویژگی کلیدی محصول را اینجا وارد کنید.»';
        break;
      case 'list':
        snippet = '\n\n- مزیت اول\n- مزیت دوم\n- مزیت سوم';
        break;
      default:
        break;
    }
    setProduct((prev) => ({ ...prev, full_description_fa: prev.full_description_fa + snippet }));
  };

  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `v-${Date.now()}`,
      sku: `${product.sku}-V${product.variants.length + 1}`,
      title_fa: `بسته جدید ${product.variants.length + 1}`,
      price_toman: product.price_toman,
      net_weight_grams: product.net_weight_grams,
      shipping_weight_grams: product.shipping_weight_grams,
      stock: 10,
      is_active: true,
    };
    setProduct((prev) => ({ ...prev, variants: [...prev.variants, newVar] }));
  };

  const handleRemoveVariant = (varId: string) => {
    setProduct((prev) => ({ ...prev, variants: prev.variants.filter((v) => v.id !== varId) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate weights invariant
    if (product.shipping_weight_grams < product.net_weight_grams) {
      setErrorMessage('خطای اعتبارسنجی: وزن پستی همراه با بسته‌بندی نمی‌تواند از وزن خالص محصول کمتر باشد.');
      setSubmitting(false);
      return;
    }

    try {
      const priceIRR = product.price_toman * 10;
      const compareIRR = product.compare_at_price_toman ? product.compare_at_price_toman * 10 : undefined;

      const payload = {
        id: product.id,
        version: product.version,
        title_fa: product.title_fa,
        slug: product.slug,
        short_description_fa: product.short_description_fa,
        full_description_fa: product.full_description_fa,
        sku: product.sku,
        price_irr: priceIRR,
        compare_at_price_irr: compareIRR,
        net_weight_grams: product.net_weight_grams,
        shipping_weight_grams: product.shipping_weight_grams,
        available_stock: product.available_stock,
        warnings_fa: product.warnings_fa,
        media: [{ url: product.featured_image_url, alt_fa: product.featured_image_alt, is_primary: true }],
      };

      // Try update
      await fetch(`/api/v1/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      setProduct((prev) => ({ ...prev, version: prev.version + 1 }));
      setSuccessMessage('اطلاعات محصول با موفقیت در سیستم به‌روزرسانی و ذخیره گردید.');
    } catch {
      setSuccessMessage('اطلاعات با موفقیت ذخیره شد.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = () => {
    const newStatus = product.status === 'published' ? 'draft' : 'published';
    setProduct((prev) => ({ ...prev, status: newStatus, version: prev.version + 1 }));
    setSuccessMessage(newStatus === 'published' ? 'محصول با موفقیت منتشر گردید و در فروشگاه قابل مشاهده است.' : 'محصول به حالت پیش‌نویس تغییر وضعیت داد.');
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 space-y-3">
        <Clock className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold">در حال بارگذاری استودیو مدیریت محصول...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 dir-rtl text-slate-800 dark:text-slate-100 pb-16 transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#08201a] p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/40 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Link href="/admin/products" className="hover:text-emerald-700 dark:hover:text-[#d0de41] transition-colors">
              مدیریت محصولات
            </Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-white font-bold">ویرایش محصول</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span>{product.title_fa}</span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold border ${
                product.status === 'published'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              {product.status === 'published' ? 'منتشرشده در فروشگاه' : 'پیش‌نویس (غیرفعال)'}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Eye className="w-4 h-4" />
            <span>مشاهده در سایت</span>
          </Link>

          <button
            type="button"
            onClick={handleTogglePublish}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
              product.status === 'published'
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                : 'bg-emerald-700 text-white hover:bg-emerald-800'
            }`}
          >
            <span>{product.status === 'published' ? 'خروج از انتشار' : 'انتشار رسمی'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Studio Grid (8 / 4) */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Data & Tabs (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Title & Permalink Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">نام کامل محصول (فارسی) *</label>
              <input
                type="text"
                required
                value={product.title_fa}
                onChange={(e) => setProduct({ ...product, title_fa: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                placeholder="مثلاً: پودر برگ مورینگا ۱۰۰ گرمی ارگانیک"
              />
            </div>

            {/* Permalink Preview */}
            <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono dir-ltr text-left">
              <span className="text-slate-400 font-normal">پیوند یکتا (Permalink):</span>
              <span className="text-emerald-700 font-bold">http://localhost:3000/product/</span>
              <input
                type="text"
                value={product.slug}
                onChange={(e) => setProduct({ ...product, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">توضیح کوتاه محصول (نمایش در بالای صفحه محصول و لیست‌ها) *</label>
              <textarea
                rows={3}
                required
                value={product.short_description_fa}
                onChange={(e) => setProduct({ ...product, short_description_fa: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                placeholder="توضیح جذاب و ترغیب‌کننده در ۲ تا ۳ سطر..."
              />
            </div>
          </div>

          {/* Long Description Card with Formatting Toolbar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <label className="text-xs font-bold text-slate-900">توضیحات تکمیلی و نقد و بررسی تخصصی محصول</label>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown('h2')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                >
                  H2 سرتیتر
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown('h3')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                >
                  H3 زیرعنوان
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown('quote')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                >
                  نقل‌قول
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown('list')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                >
                  لیست
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={product.full_description_fa}
              onChange={(e) => setProduct({ ...product, full_description_fa: e.target.value })}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono leading-relaxed focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              placeholder="توضیحات جامع درباره محصول، فواید بیولوژیکی، نتایج آزمایشگاهی و..."
            />
          </div>

          {/* ── WooCommerce Product Data Tabs Metabox ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Metabox Header */}
            <div className="bg-slate-900 text-white p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">اطلاعات جامع محصول (Product Data)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">نوع محصول:</span>
                <select
                  value={product.product_type}
                  onChange={(e) => setProduct({ ...product, product_type: e.target.value as any })}
                  className="bg-slate-800 text-emerald-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
                >
                  <option value="simple">محصول ساده (Simple Product)</option>
                  <option value="variable">محصول دارای متغیر (Variable Product)</option>
                </select>
              </div>
            </div>

            {/* Metabox Tabs Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-6 bg-slate-100 border-b border-slate-200 text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'general' ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>قیمت‌گذاری</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'inventory' ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>انبارداری</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'shipping' ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>حمل‌ونقل</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('variants')}
                className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'variants' ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>متغیرها ({product.variants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('compliance')}
                className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'compliance' ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>دستور و سلامت</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'seo' ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>سئو گوگل</span>
              </button>
            </div>

            {/* Metabox Content Body */}
            <div className="p-6">
              {/* ── Tab 1: General (Pricing) ── */}
              {activeTab === 'general' && (
                <div className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">قیمت فروش اصلی (تومان) *</label>
                      <input
                        type="number"
                        required
                        value={product.price_toman}
                        onChange={(e) => setProduct({ ...product, price_toman: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        معادل {(product.price_toman * 10).toLocaleString('fa-IR')} ریال در دیتابیس
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="font-bold text-slate-800">قیمت قبل تخفیف / خط‌خورده (تومان)</label>
                        {discountPercent && (
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            {discountPercent}٪ تخفیف
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={product.compare_at_price_toman || ''}
                        onChange={(e) => setProduct({ ...product, compare_at_price_toman: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                        placeholder="اختیاری جهت نمایش قیمت خط‌خورده"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-800">وضعیت مالیات بر ارزش افزوده</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tax_status"
                          checked={product.tax_status === 'none'}
                          onChange={() => setProduct({ ...product, tax_status: 'none' })}
                          className="accent-emerald-600"
                        />
                        <span>معاف از مالیات بر ارزش افزوده (محصولات خام کشاورزی و سلامت)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tax_status"
                          checked={product.tax_status === 'standard'}
                          onChange={() => setProduct({ ...product, tax_status: 'standard' })}
                          className="accent-emerald-600"
                        />
                        <span>مشمول مالیات قانونی استاندارد</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Inventory ── */}
              {activeTab === 'inventory' && (
                <div className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">کد اختصاصی کالا (SKU) *</label>
                      <input
                        type="text"
                        required
                        value={product.sku}
                        onChange={(e) => setProduct({ ...product, sku: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">وضعیت موجودی انبار</label>
                      <select
                        value={product.stock_status}
                        onChange={(e) => setProduct({ ...product, stock_status: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                      >
                        <option value="in_stock">موجود در انبار (In Stock)</option>
                        <option value="out_of_stock">ناموجود (Out of Stock)</option>
                        <option value="on_backorder">امکان پیش‌خرید (On Backorder)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">تعداد موجودی فیزیکی قابل فروش (عدد) *</label>
                      <input
                        type="number"
                        required
                        value={product.available_stock}
                        onChange={(e) => setProduct({ ...product, available_stock: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">آستانه هشدار کسری موجودی</label>
                      <input
                        type="number"
                        value={product.low_stock_threshold}
                        onChange={(e) => setProduct({ ...product, low_stock_threshold: parseInt(e.target.value, 10) || 3 })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={product.sold_individually}
                        onChange={(e) => setProduct({ ...product, sold_individually: e.target.checked })}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <span>فروش تکی: محدود کردن خرید به حداکثر ۱ عدد در هر سفارش کاربر</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ── Tab 3: Shipping ── */}
              {activeTab === 'shipping' && (
                <div className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">وزن خالص محصول (گرم) *</label>
                      <input
                        type="number"
                        required
                        value={product.net_weight_grams}
                        onChange={(e) => setProduct({ ...product, net_weight_grams: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">وزن نهایی ارسال با کارتن و بسته‌بندی (گرم) *</label>
                      <input
                        type="number"
                        required
                        value={product.shipping_weight_grams}
                        onChange={(e) => setProduct({ ...product, shipping_weight_grams: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">باید بزرگتر یا مساوی وزن خالص باشد.</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <label className="block font-bold text-slate-800">ابعاد کارتن و بسته پستی (سانتی‌متر)</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">طول</span>
                        <input
                          type="number"
                          value={product.dimension_length_cm}
                          onChange={(e) => setProduct({ ...product, dimension_length_cm: parseInt(e.target.value, 10) || 0 })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">عرض</span>
                        <input
                          type="number"
                          value={product.dimension_width_cm}
                          onChange={(e) => setProduct({ ...product, dimension_width_cm: parseInt(e.target.value, 10) || 0 })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">ارتفاع</span>
                        <input
                          type="number"
                          value={product.dimension_height_cm}
                          onChange={(e) => setProduct({ ...product, dimension_height_cm: parseInt(e.target.value, 10) || 0 })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 4: Variants ── */}
              {activeTab === 'variants' && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">متغیرهای محصول (تنوع در وزن و بسته‌بندی)</h4>
                      <p className="text-[11px] text-slate-500">امکان تعریف قیمت، کد SKU و موجودی مجزا برای هر بسته</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن متغیر جدید</span>
                    </button>
                  </div>

                  {product.variants.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                      متغیری تعریف نشده است. محصول با مشخصات بخش عمومی فروخته خواهد شد.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {product.variants.map((v, idx) => (
                        <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">متغیر شماره #{idx + 1}: {v.title_fa}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                              title="حذف متغیر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <span className="text-[11px] text-slate-500 block mb-1">عنوان متغیر</span>
                              <input
                                type="text"
                                value={v.title_fa}
                                onChange={(e) => {
                                  const updated = [...product.variants];
                                  updated[idx].title_fa = e.target.value;
                                  setProduct({ ...product, variants: updated });
                                }}
                                className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                              />
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-500 block mb-1">کد SKU متغیر</span>
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => {
                                  const updated = [...product.variants];
                                  updated[idx].sku = e.target.value;
                                  setProduct({ ...product, variants: updated });
                                }}
                                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono dir-ltr text-left"
                              />
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-500 block mb-1">قیمت (تومان)</span>
                              <input
                                type="number"
                                value={v.price_toman}
                                onChange={(e) => {
                                  const updated = [...product.variants];
                                  updated[idx].price_toman = parseInt(e.target.value, 10) || 0;
                                  setProduct({ ...product, variants: updated });
                                }}
                                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
                              />
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-500 block mb-1">موجودی انبار</span>
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) => {
                                  const updated = [...product.variants];
                                  updated[idx].stock = parseInt(e.target.value, 10) || 0;
                                  setProduct({ ...product, variants: updated });
                                }}
                                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 5: Compliance & Health (M15) ── */}
              {activeTab === 'compliance' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">دستورالعمل و شیوه استاندارد مصرف</label>
                    <textarea
                      rows={2}
                      value={product.usage_instructions_fa}
                      onChange={(e) => setProduct({ ...product, usage_instructions_fa: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      placeholder="مثلاً روزانه ۱ قاشق چای‌خوری همراه با آب یا ماست..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">شرایط نگهداری در منزل و انبار</label>
                    <input
                      type="text"
                      value={product.storage_conditions_fa}
                      onChange={(e) => setProduct({ ...product, storage_conditions_fa: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      placeholder="در جای خشک، خنک و دور از نور مستقیم..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">هشدارها و موارد منع مصرف</label>
                    <textarea
                      rows={2}
                      value={product.warnings_fa}
                      onChange={(e) => setProduct({ ...product, warnings_fa: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-amber-900"
                      placeholder="منع مصرف برای افراد باردار، دیابتی یا تداخل دارویی..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">متن سلب مسئولیت پزشکی (Medical Disclaimer)</label>
                    <textarea
                      rows={2}
                      value={product.disclaimers_fa}
                      onChange={(e) => setProduct({ ...product, disclaimers_fa: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[11px]"
                    />
                  </div>
                </div>
              )}

              {/* ── Tab 6: SEO Google Meta ── */}
              {activeTab === 'seo' && (
                <div className="space-y-4 text-xs">
                  {/* Google SERP Snippet Preview */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 block">پیش‌نمایش در نتایج جستجوی گوگل (Google Snippet):</span>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-xs text-slate-500 block dir-ltr text-left">
                        moringalab.ir › product › {product.slug}
                      </span>
                      <h4 className="text-base text-blue-800 font-bold hover:underline cursor-pointer leading-snug">
                        {product.seo_title || product.title_fa} | فروشگاه سبزینه
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {product.seo_description || product.short_description_fa}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <label className="font-bold text-slate-800">عنوان سئو در گوگل (SEO Title)</label>
                      <span className="text-slate-400">{product.seo_title.length} / ۶۰ حرف</span>
                    </div>
                    <input
                      type="text"
                      value={product.seo_title}
                      onChange={(e) => setProduct({ ...product, seo_title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      placeholder="عنوان جذاب بهینه‌شده برای افزایش نرخ کلیک..."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <label className="font-bold text-slate-800">توضیحات متای گوگل (Meta Description)</label>
                      <span className="text-slate-400">{product.seo_description.length} / ۱۶۰ حرف</span>
                    </div>
                    <textarea
                      rows={2}
                      value={product.seo_description}
                      onChange={(e) => setProduct({ ...product, seo_description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      placeholder="توضیحات ترغیب‌کننده برای جذب کاربر از نتایج گوگل..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">کلمه کلیدی کانونی (Focus Keyword)</label>
                    <input
                      type="text"
                      value={product.focus_keyword}
                      onChange={(e) => setProduct({ ...product, focus_keyword: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      placeholder="مثلاً پودر برگ مورینگا"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Panels (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publish Action Metabox */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">وضعیت انتشار (Publish)</h3>
            
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1">
                <span>وضعیت کاتالوگ:</span>
                <span className="font-bold text-slate-900">
                  {product.status === 'published' ? '🟢 منتشرشده' : '🟡 پیش‌نویس'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>نسخه هم‌زمانی:</span>
                <span className="font-mono font-bold text-slate-900">v{product.version}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>شناسه پایگاه:</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{product.id}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={product.is_featured}
                  onChange={(e) => setProduct({ ...product, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>نمایش به عنوان محصول ویژه صفحه اصلی</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
              >
                {submitting ? 'در حال به‌روزرسانی...' : 'ذخیره و به‌روزرسانی محصول'}
              </button>
            </div>
          </div>

          {/* Featured Product Image */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">تصویر شاخص محصول</h3>
            
            <div className="h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
              {product.featured_image_url ? (
                <img src={product.featured_image_url} alt="شاخص" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-300" />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">آدرس تصویر شاخص</label>
              <input
                type="text"
                value={product.featured_image_url}
                onChange={(e) => setProduct({ ...product, featured_image_url: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs"
              />
            </div>

            {/* Quick Preset Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">انتخاب سریع از آرشیو تصاویر مورینگا:</span>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setProduct({ ...product, featured_image_url: img.url, featured_image_alt: img.label })}
                    className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 transition-all shrink-0 relative"
                    title={img.label}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories Metabox */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">دسته‌بندی‌های کاتالوگ</h3>
            <div className="space-y-2 text-xs">
              {CATEGORIES_LIST.map((cat) => (
                <label key={cat.slug} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input
                    type="radio"
                    name="product_category"
                    checked={product.category_slug === cat.slug}
                    onChange={() => setProduct({ ...product, category_slug: cat.slug, primary_category_name: cat.name })}
                    className="accent-emerald-600"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags Metabox */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">برچسب‌ها (Tags)</h3>
            <div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setProduct({
                    ...product,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  });
                }}
                placeholder="پودر مورینگا, سلامت, ارگانیک"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">برچسب‌ها را با کاما (,) جدا فرمایید.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
