export interface ProductVariant {
  id: string;
  sku: string;
  weight_grams: number;
  price_irr: number;
  stock_quantity: number;
  package_type: string;
}

export interface ProductItem {
  id: string;
  slug: string;
  sku: string;
  title_fa: string;
  subtitle_fa: string;
  description_fa: string;
  category_slug: string;
  category_name_fa: string;
  price_irr: number;
  compare_at_price_irr?: number;
  inventory_quantity: number;
  weight_grams: number;
  shipping_weight_grams: number;
  dimensions_cm?: { length: number; width: number; height: number };
  media: { url: string; is_primary: boolean; alt_fa: string }[];
  variants: ProductVariant[];
  health_claims_fa: string;
  usage_instructions_fa: string;
  storage_conditions_fa: string;
  warnings_fa: string;
  is_featured?: boolean;
}

export const ALL_MORINGA_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-001',
    slug: 'moringa-tablets',
    sku: 'MOR-TAB-120',
    title_fa: 'قرص مورینگا اولیفرا خالص',
    subtitle_fa: 'مکمل فشرده گیاهی ارگانیک ۱۲۰ عددی',
    description_fa: 'قرص خوراکی مورینگا اولیفرا خالص تهیه شده از پودر برگ میکرونیزه بدون هیچ‌گونه ماده افزودنی شیمیایی یا پرکننده. منبع سرشار از ویتامین‌های A، C، E، کلسیم، آهن و تمامی اسیدهای آمینه ضروری برای مصرف روزانه آسان.',
    category_slug: 'supplements',
    category_name_fa: 'مکمل و کپسول',
    price_irr: 1840000,
    compare_at_price_irr: 2100000,
    inventory_quantity: 45,
    weight_grams: 120,
    shipping_weight_grams: 160,
    dimensions_cm: { length: 8, width: 8, height: 12 },
    media: [
      { url: '/images/products/moringa-tablets.jpg', is_primary: true, alt_fa: 'قرص مورینگا اولیفرا اصل' },
      { url: '/images/demo/moringa-capsules-60.png', is_primary: false, alt_fa: 'کپسول مورینگا' },
    ],
    variants: [
      { id: 'var-tab-120', sku: 'MOR-TAB-120', weight_grams: 120, price_irr: 1840000, stock_quantity: 45, package_type: 'قوطی ۱۲۰ عددی' },
    ],
    health_claims_fa: 'تقویت سیستم دفاعی بدن، تامین انرژی پایدار، کاهش خستگی مزمن و بهبود سلامت پوست و مو.',
    usage_instructions_fa: 'روزی ۲ الی ۴ عدد قرص همراه با آب کافی پس از وعده‌های غذایی میل شود.',
    storage_conditions_fa: 'در جای خشک و خنک (زیر ۲۵ درجه) و دور از تابش مستقیم خورشید نگهداری شود.',
    warnings_fa: 'خانم‌های باردار و مادران شیرده با مشورت پزشک مصرف نمایند.',
    is_featured: true,
  },

  {
    id: 'prod-002',
    slug: 'moringa-bulk-leaves-1kg',
    sku: 'MOR-LEAF-1KG',
    title_fa: 'برگ مورینگا یک کیلوگرم (عمده)',
    subtitle_fa: 'برگ خشک سایه‌خشک صادراتی فله ۱۰۰۰ گرمی با قیمت مزرعه',
    description_fa: 'برگ خشک خالص مورینگا اولیفرا دست‌چین و خشک‌شده در محیط استاندارد سایه به منظور حفظ حداکثری کلروفیل، ویتامین‌ها و املاح معدنی. انتخابی اقتصادی و ایده‌آل برای عطاری‌ها، کارگاه‌های فرآوری و مصرف‌کنندگان دائمی.',
    category_slug: 'bulk',
    category_name_fa: 'فله و عمده',
    price_irr: 7500000,
    compare_at_price_irr: 8200000,
    inventory_quantity: 30,
    weight_grams: 1000,
    shipping_weight_grams: 1200,
    dimensions_cm: { length: 30, width: 25, height: 15 },
    media: [
      { url: '/images/products/moringa-bulk-leaves-1kg.webp', is_primary: true, alt_fa: 'برگ یک کیلو مورینگا' },
      { url: '/images/demo/dried-moringa-leaves-50g.png', is_primary: false, alt_fa: 'برگ خشک مورینگا' },
    ],
    variants: [
      { id: 'var-leaf-1kg', sku: 'MOR-LEAF-1KG', weight_grams: 1000, price_irr: 7500000, stock_quantity: 30, package_type: 'کارتن ۱ کیلوگرمی' },
    ],
    health_claims_fa: 'غنی از آنتی‌اکسیدان‌های قوی، تسویه سموم خون و کاهش التهابات مفاصل.',
    usage_instructions_fa: 'جهت تهیه دمنوش: ۱ قاشق غذاخوری برگ خشک در یک لیوان آب جوش به مدت ۱۰ دقیقه دم بکشد.',
    storage_conditions_fa: 'در کیسه نفوذناپذیر در محیط خشک و خنک نگهداری شود.',
    warnings_fa: 'در دوران بارداری با احتیاط و نظارت پزشک مصرف شود.',
    is_featured: false,
  },

  {
    id: 'prod-003',
    slug: 'moringa-bulk-powder-1kg',
    sku: 'MOR-POW-1KG',
    title_fa: 'پودر مورینگا یک کیلوگرم (عمده)',
    subtitle_fa: 'پودر برگ خالص میکرونیزه درجه یک ۱۰۰۰ گرمی با قیمت مزرعه',
    description_fa: 'پودر برگ خالص مورینگا اولیفرا با درجه نرمی مش ۲۰۰ (میکرونیزه) و رنگ سبز زمردی باکیفیت. بدون هرگونه ناخالصی یا ساقه ضخیم. مناسب برای کارگاه‌های داروسازی گیاهی، تولید مکمل، اسموتی بارها و باشگاه‌ها.',
    category_slug: 'bulk',
    category_name_fa: 'فله و عمده',
    price_irr: 7800000,
    compare_at_price_irr: 8900000,
    inventory_quantity: 25,
    weight_grams: 1000,
    shipping_weight_grams: 1150,
    dimensions_cm: { length: 25, width: 20, height: 12 },
    media: [
      { url: '/images/products/moringa-bulk-powder-1kg.jpg', is_primary: true, alt_fa: 'پودر یک کیلو مورینگا' },
      { url: '/images/demo/moringa-leaf-powder-250g.png', is_primary: false, alt_fa: 'پودر مورینگا' },
    ],
    variants: [
      { id: 'var-pow-1kg', sku: 'MOR-POW-1KG', weight_grams: 1000, price_irr: 7800000, stock_quantity: 25, package_type: 'بسته متالایز ۱۰۰۰ گرمی' },
    ],
    health_claims_fa: 'تقویت کامل قوای جسمانی، ساخت پروتئین عضلانی و کاهش کلسترول بد خون.',
    usage_instructions_fa: 'روزانه ۱ الی ۲ قاشق مرباخوری همراه ماست، اسموتی، عسل یا آبمیوه طبیعی میل شود.',
    storage_conditions_fa: 'در جای تاریک، خنک و دور از رطوبت نگهداری گردد.',
    warnings_fa: 'افراد دارای اختلالات تیروئیدی با فاصله ۴ ساعته از قرص لووتیروکسین میل کنند.',
    is_featured: true,
  },

  {
    id: 'prod-004',
    slug: 'moringa-oil-20ml',
    sku: 'MOR-OIL-20',
    title_fa: 'روغن خالص مورینگا (شیشه ۲۰ میل)',
    subtitle_fa: 'پرس سرد ارگانیک برای ترمیم پوست، تقویت ریشه مو و ضد لک',
    description_fa: 'روغن ۱۰۰٪ خالص استخراج شده به روش پرس سرد هیدرولیک از دانه‌های اصلاح‌شده مورینگا. سرشار از اسید بهنیک و ویتامین E طبیعی با جذب فوق‌العاده سریع بدون ایجاد حس چربی و سنگینی روی پوست.',
    category_slug: 'oils',
    category_name_fa: 'روغن‌های درمانی',
    price_irr: 2920000,
    compare_at_price_irr: 3400000,
    inventory_quantity: 60,
    weight_grams: 80,
    shipping_weight_grams: 120,
    dimensions_cm: { length: 5, width: 5, height: 10 },
    media: [
      { url: '/images/products/moringa-oil-20ml.webp', is_primary: true, alt_fa: 'روغن خالص مورینگا ۲۰ میل' },
      { url: '/images/demo/moringa-oil-30ml.png', is_primary: false, alt_fa: 'روغن مورینگا' },
    ],
    variants: [
      { id: 'var-oil-20', sku: 'MOR-OIL-20', weight_grams: 80, price_irr: 2920000, stock_quantity: 60, package_type: 'شیشه قطره‌چکانی ۲۰ میل' },
    ],
    health_claims_fa: 'آبرسانی عمیق بافت پوست، محو تدریجی لک‌های آفتاب‌سوختگی، توقف ریزش و موخوره.',
    usage_instructions_fa: 'شب‌ها ۳ تا ۴ قطره روی پوست تمیز یا کف سر ریخته و به آرامی ماساژ دهید.',
    storage_conditions_fa: 'در دمای اتاق و دور از نور مستقیم خورشید نگهداری شود.',
    warnings_fa: 'فقط مصرف موضعی؛ از تماس مستقیم با چشم خودداری شود.',
    is_featured: true,
  },

  {
    id: 'prod-005',
    slug: 'moringa-tea-50g',
    sku: 'MOR-TEA-50',
    title_fa: 'بسته چای مورینگا (۵۰ گرمی)',
    subtitle_fa: 'برگ خشک خالص سایه‌خشک ۵۰ گرمی مخصوص دمنوش سلامت',
    description_fa: 'برگ‌های معطر و خالص مورینگا اولیفرا سایه‌خشک بسته‌بندی شده در پاکت بهداشتی پنجره‌دار. مناسب برای افرادی که به دنبال یک دمنوش آرام‌بخش، ضد نفخ و تسکین‌دهنده استرس‌های روزمره هستند.',
    category_slug: 'teas',
    category_name_fa: 'دمنوش و چای',
    price_irr: 990000,
    compare_at_price_irr: 1200000,
    inventory_quantity: 80,
    weight_grams: 50,
    shipping_weight_grams: 90,
    dimensions_cm: { length: 12, width: 5, height: 18 },
    media: [
      { url: '/images/products/moringa-tea-50g.webp', is_primary: true, alt_fa: 'بسته چای مورینگا ۵۰ گرم' },
      { url: '/images/demo/dried-moringa-leaves-50g.png', is_primary: false, alt_fa: 'برگ خشک مورینگا' },
    ],
    variants: [
      { id: 'var-tea-50', sku: 'MOR-TEA-50', weight_grams: 50, price_irr: 990000, stock_quantity: 80, package_type: 'پاکت زیپ‌کیپ ۵۰ گرمی' },
    ],
    health_claims_fa: 'کاهش استرس، بهبود کیفیت خواب شبانه و پاکسازی سموم کبد.',
    usage_instructions_fa: 'یک قاشق مرباخوری را در قوری آب جوش ریخته و پس از ۵ تا ۷ دقیقه دم کشیدن میل کنید.',
    storage_conditions_fa: 'در جای خشک و خنک نگهداری شود.',
    warnings_fa: 'فاقد هرگونه منع مصرف حاد در مقادیر دمنوش روزانه.',
    is_featured: false,
  },

  {
    id: 'prod-006',
    slug: 'moringa-oil-30ml',
    sku: 'MOR-OIL-30',
    title_fa: 'روغن مورینگا خالص ۳۰ میل (ضد لک قوی)',
    subtitle_fa: 'اکسیر طلایی ضد چروک، شفاف‌کننده و تقویت‌کننده ساقه مو',
    description_fa: 'روغن خالص دانه مورینگا اولیفرا با خلوص صددرصد در شیشه قهوه‌ای ضد اشعه ۳۰ میلی‌لیتری. غنی‌ترین منبع اسیدهای چرب امگا ۹ و فلاونوئیدهای جوان‌ساز با خاصیت بستن منافذ باز و درمان آکنه‌های ملتهب.',
    category_slug: 'oils',
    category_name_fa: 'روغن‌های درمانی',
    price_irr: 4350000,
    compare_at_price_irr: 4900000,
    inventory_quantity: 50,
    weight_grams: 110,
    shipping_weight_grams: 150,
    dimensions_cm: { length: 6, width: 6, height: 12 },
    media: [
      { url: '/images/products/moringa-oil-30ml.jpg', is_primary: true, alt_fa: 'روغن مورینگا ۳۰ میل اصل' },
      { url: '/images/demo/moringa-oil-30ml.png', is_primary: false, alt_fa: 'روغن مورینگا' },
    ],
    variants: [
      { id: 'var-oil-30', sku: 'MOR-OIL-30', weight_grams: 110, price_irr: 4350000, stock_quantity: 50, package_type: 'شیشه قطره‌چکانی ۳۰ میل' },
    ],
    health_claims_fa: 'کلاژن‌سازی طبیعی، رفع چین و چروک ریز دور چشم و خط لبخند، درخشش بی‌نظیر ساقه مو.',
    usage_instructions_fa: 'هر شب پس از شستشوی صورت، ۴ الی ۶ قطره را با نوک انگشتان روی صورت ماساژ دهید.',
    storage_conditions_fa: 'در دمای متعادل اتاق و دور از تابش مستقیم آفتاب نگهداری شود.',
    warnings_fa: 'توصیه می‌شود تست حساسیت روی پوست بازو پیش از مصرف انجام گردد.',
    is_featured: true,
  },

  {
    id: 'prod-007',
    slug: 'moringa-book',
    sku: 'MOR-BOOK-01',
    title_fa: 'کتاب مورینگا اعجاز طبیعت',
    subtitle_fa: 'راهنمای جامع شناخت، خواص درمانی و پرورش مورینگا در ایران',
    description_fa: 'کتاب مرجع تالیف‌شده توسط کارشناسان گیاه‌پزشکی شامل تاریخچه، جدول کامل آنالیزهای بیوشیمیایی، دستورهای غذایی با پودر مورینگا، روش‌های استخراج روغن و راهنمای گام‌به‌گام احداث باغات تجاری در کشور.',
    category_slug: 'books',
    category_name_fa: 'کتاب و آموزش',
    price_irr: 1350000,
    compare_at_price_irr: 1600000,
    inventory_quantity: 40,
    weight_grams: 280,
    shipping_weight_grams: 350,
    dimensions_cm: { length: 21, width: 14, height: 2 },
    media: [
      { url: '/images/products/moringa-book.jpg', is_primary: true, alt_fa: 'کتاب مورینگا اعجاز طبیعت' },
    ],
    variants: [
      { id: 'var-book-1', sku: 'MOR-BOOK-01', weight_grams: 280, price_irr: 1350000, stock_quantity: 40, package_type: 'جلد شومیز رنگی' },
    ],
    health_claims_fa: 'افزایش آگاهی عمومی درباره سوپرفودها و تغذیه ارگانیک بر پایه علم روز.',
    usage_instructions_fa: 'مطالعه روزانه برای علاقه‌مندان به طب سنتی، سلامت، تغذیه و زراعت پایدار.',
    storage_conditions_fa: 'در کتابخانه و به دور از رطوبت نگهداری شود.',
    warnings_fa: 'مناسب برای کلیه رده‌های سنی.',
    is_featured: false,
  },

  {
    id: 'prod-008',
    slug: 'moringa-powder-100g',
    sku: 'MOR-POW-100',
    title_fa: 'بسته پودر مورینگا (۱۰۰ گرمی)',
    subtitle_fa: 'پودر برگ خالص مورینگا اولیفرا آماده مصرف خانگی',
    description_fa: 'پودر برگ خالص و صددرصد ارگانیک مورینگا اولیفرا با بسته‌بندی متالایز زیپ‌دار محافظ نور. انتخابی ایده‌آل برای شروع دوره مصرف ۲۰ روزه، افزودن به ماست، شیر بادام، سالاد و تهیه اسموتی‌های انرژی‌بخش.',
    category_slug: 'powders',
    category_name_fa: 'پودر برگ مورینگا',
    price_irr: 1950000,
    compare_at_price_irr: 2300000,
    inventory_quantity: 95,
    weight_grams: 100,
    shipping_weight_grams: 140,
    dimensions_cm: { length: 14, width: 4, height: 20 },
    media: [
      { url: '/images/products/moringa-powder-100g.jpg', is_primary: true, alt_fa: 'بسته پودر مورینگا ۱۰۰ گرم' },
      { url: '/images/demo/moringa-leaf-powder-100g.png', is_primary: false, alt_fa: 'پودر مورینگا' },
    ],
    variants: [
      { id: 'var-pow-100', sku: 'MOR-POW-100', weight_grams: 100, price_irr: 1950000, stock_quantity: 95, package_type: 'پاکت کرافت متالایز ۱۰۰ گرمی' },
    ],
    health_claims_fa: 'تامین ویتامین‌های ضروری، کاهش احساس گرسنگی کاذب، تقویت تمرکز و نشاط روزانه.',
    usage_instructions_fa: 'روزی یک قاشق چای‌خوری (۳ تا ۵ گرم) همراه با صبحانه یا ناهار میل شود.',
    storage_conditions_fa: 'پس از هر بار مصرف زیپ پاکت را محکم بسته و در جای خشک نگهداری کنید.',
    warnings_fa: 'از مصرف بیش از حد مجاز روزانه خودداری نمایید.',
    is_featured: true,
  },

  {
    id: 'prod-009',
    slug: 'moringa-seeds-20',
    sku: 'MOR-SEED-20',
    title_fa: 'بذر قابل کشت مورینگا اولیفیرا (۲۰ عدد)',
    subtitle_fa: 'بذر تازه، جوانه‌زنی بالای ۸۵٪ و اصلاح‌شده مناسب کاشت',
    description_fa: 'دانه‌های بالدار تازه و درجه یک مورینگا اولیفرا با قوه نامیه بسیار بالا (بالای ۸۵ درصد). مناسب برای کشت خانگی در گلدان، باغچه و احداث مزارع در مناطق معتدل و گرمسیری ایران همراه با راهنمای گام‌به‌گام جوانه‌زنی.',
    category_slug: 'seeds',
    category_name_fa: 'بذر و نهال',
    price_irr: 1500000,
    compare_at_price_irr: 1800000,
    inventory_quantity: 70,
    weight_grams: 30,
    shipping_weight_grams: 60,
    dimensions_cm: { length: 10, width: 2, height: 15 },
    media: [
      { url: '/images/products/moringa-seeds-20.jpg', is_primary: true, alt_fa: 'بذر مورینگا ۲۰ عدد' },
      { url: '/images/demo/moringa-seeds-100g.png', is_primary: false, alt_fa: 'دانه مورینگا' },
    ],
    variants: [
      { id: 'var-seed-20', sku: 'MOR-SEED-20', weight_grams: 30, price_irr: 1500000, stock_quantity: 70, package_type: 'بسته ۲۰ عددی وکیوم' },
    ],
    health_claims_fa: 'حاوی دانه‌های ارگانیک با بازدهی زیستی فوق‌العاده برای رشد سریع درخت زندگی.',
    usage_instructions_fa: 'پیش از کاشت ۲۴ ساعت در آب ولرم خیسانده و در عمق ۲ سانتی‌متری خاک بکارید.',
    storage_conditions_fa: 'در جای خشک و خنک و دور از رطوبت نگهداری شود.',
    warnings_fa: 'غیرقابل مصرف خوراکی مستقیم؛ صرفاً جهت کشت و بذرگیری.',
    is_featured: false,
  },

  {
    id: 'prod-010',
    slug: 'moringa-tea-100g',
    sku: 'MOR-TEA-100',
    title_fa: 'چای مورینگا اولیفیرا (۱۰۰ گرمی)',
    subtitle_fa: 'برگ خشک ممتاز دست‌چین ۱۰۰ گرمی',
    description_fa: 'برگ‌های درشت و دست‌چین درخت مورینگا با رنگ سبز شاداب و عطر ملایم گیاهی. غنی از پلی‌فنول‌ها و آنتی‌اکسیدان‌ها، مناسب برای دمنوش‌های سلامتی عصرگاهی و جایگزین سالم چای سیاه.',
    category_slug: 'teas',
    category_name_fa: 'دمنوش و چای',
    price_irr: 1950000,
    compare_at_price_irr: 2300000,
    inventory_quantity: 65,
    weight_grams: 100,
    shipping_weight_grams: 140,
    dimensions_cm: { length: 15, width: 6, height: 22 },
    media: [
      { url: '/images/products/moringa-tea-100g.jpg', is_primary: true, alt_fa: 'چای مورینگا ۱۰۰ گرم' },
      { url: '/images/demo/dried-moringa-leaves-50g.png', is_primary: false, alt_fa: 'برگ خشک مورینگا' },
    ],
    variants: [
      { id: 'var-tea-100', sku: 'MOR-TEA-100', weight_grams: 100, price_irr: 1950000, stock_quantity: 65, package_type: 'پاکت کرافت ۱۰۰ گرمی' },
    ],
    health_claims_fa: 'تقویت سیستم قلبی عروقی، بهبود متابولیسم قند و پاکسازی دستگاه گوارش.',
    usage_instructions_fa: 'یک قاشق غذاخوری برگ خشک را در قوری آب جوش دم کرده و با عسل یا لیمو میل کنید.',
    storage_conditions_fa: 'در جای خشک و خنک به دور از نور نگهداری شود.',
    warnings_fa: 'فاقد عوارض جانبی در مقادیر معمول مصرف روزانه.',
    is_featured: true,
  },
];
