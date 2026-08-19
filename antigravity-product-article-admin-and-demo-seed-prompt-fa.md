# پرامپت اجرایی Antigravity: مدیریت محصول و مقاله + داده نمایشی

## هدف

این Specification برای Repository موجود فروشگاه مورینگا با پشته `Next.js + Go + PostgreSQL` است. خروجی مورد انتظار:

- ماژول واقعی ساخت، ویرایش، انتشار و آرشیو محصول در پنل مدیریت.
- ماژول واقعی ساخت، ویرایش، پیش‌نمایش، انتشار و آرشیو مقاله در پنل مدیریت.
- نمایش عمومی فهرست و جزئیات محصولات و مقاله‌ها.
- دقیقاً ۱۰ محصول منتشرشده و ۱۰ مقاله منتشرشده به‌عنوان داده نمایشی Development/Test.
- داده‌ها از PostgreSQL و API خوانده شوند؛ هاردکد کردن کارت‌ها در React ممنوع است.
- Seed قابل تکرار باشد و با اجرای دوباره رکورد تکراری نسازد.

این فایل مکمل `moringa-antigravity-24-module-implementation-prompts-fa.md` است. قرارداد مشترک آن فایل و بخش‌های M03، M04، M05، M15، M19، M21 و M22 لازم‌الاجرا هستند.

---

# ترتیب اجرا

برای جلوگیری از نیمه‌کاره ماندن کار، این فایل دو پرامپت دارد:

1. ابتدا `PROMPT A` برای محصول و ۱۰ محصول نمایشی.
2. پس از عبور کامل تست‌ها، `PROMPT B` برای مقاله و ۱۰ مقاله نمایشی.

هر دو را هم‌زمان اجرا نکن. پس از هر پرامپت، Antigravity باید متوقف شود و نتیجه تست‌ها را نشان دهد.

---

# PROMPT A — ماژول مدیریت محصول و ۱۰ محصول نمایشی

## BEGIN PROMPT A

Repository موجود را بررسی کن و ماژول مدیریت محصول را به‌صورت یک Vertical Slice واقعی پیاده‌سازی یا تکمیل کن. پروژه را از نو نساز و تغییرات موجود کاربر را حذف نکن.

فایل‌های زیر را قبل از هر Edit کامل بخوان:

- `AGENTS.md` و دستورهای نزدیک هر پوشه.
- `README` و مستندات معماری.
- Migrationها و Schema فعلی PostgreSQL.
- OpenAPI و Generated Client موجود.
- فایل `moringa-antigravity-24-module-implementation-prompts-fa.md`، مخصوصاً قرارداد مشترک و M03، M04، M05، M19، M21 و M22.

## ۱. مرحله بررسی اجباری

ابتدا بدون تغییر کد مشخص کن کدام بخش‌ها اکنون واقعاً وجود دارند:

- Admin authentication و RBAC.
- جدول‌ها و APIهای Product/Variant.
- Category، Brand و Attribute.
- Media upload/library.
- Inventory ledger و Warehouse.
- Public product listing/detail.
- Seed runner و محیط Development.

وجود صفحه نمایشی یا داده Mock را `implemented` حساب نکن. در `docs/implementation-status.md` وضعیت هر بخش را با یکی از `missing|partial|implemented|verified|blocked` ثبت کن.

سپس Implementation Plan و Acceptance Checklist بساز. اگر Schema فعلی معادل قابل قبولی دارد، از آن استفاده کن؛ جدول موازی و منطق تکراری نساز.

## ۲. مدل داده محصول

Schema نهایی باید حداقل مفاهیم زیر را پوشش دهد. نام دقیق جدول‌ها را با معماری فعلی هماهنگ کن:

### `products`

- `id` از نوع UUID.
- `name` و `slug` یکتا.
- `short_description` و `description` فارسی و Sanitized.
- `status`: `draft|published|archived`.
- `product_type`: در نسخه فعلی حداقل `simple`؛ مدل باید Variant را پشتیبانی کند.
- `brand_id`، `featured`، `published_at`.
- `seo_title`, `seo_description`, `canonical_url` اختیاری.
- `version` برای Optimistic Concurrency.
- `created_at`, `updated_at`, `archived_at` با `timestamptz`.

### `product_variants`

- هر محصول ساده دقیقاً یک Variant پیش‌فرض داشته باشد.
- `id`, `product_id`, `sku` یکتا، `barcode` اختیاری و `name`.
- `status`, `price_irr`, `compare_at_price_irr` اختیاری.
- `net_weight_g`, `shipping_weight_g`.
- `length_mm`, `width_mm`, `height_mm`.
- `is_default`, `version`, timestamps.

### طبقه‌بندی و رسانه

- Relation چندبه‌چند Product و Category.
- Brand مستقل با slug یکتا.
- اتصال مرتب تصاویر به Product با `role=primary|gallery` و `position`.
- اگر Media Library موجود است، از همان استفاده کن.
- اگر Media Library ناقص است، حداقل جریان واقعی Upload، اعتبارسنجی MIME/Magic Bytes، ذخیره Object و انتخاب تصویر اصلی را کامل کن؛ URL خارجی تصادفی یا Base64 داخل DB نگذار.

### موجودی

- موجودی مستقیم داخل `products` یا `product_variants` overwrite نشود.
- یک Warehouse پیش‌فرض Development ایجاد کن.
- موجودی اولیه محصولات Seed از طریق Inventory Ledger/Stock Movement ثبت شود.
- `available = on_hand - reserved` در Backend محاسبه شود.
- SKU و Reference حرکت اولیه یکتا باشند تا اجرای دوباره Seed موجودی را دوبرابر نکند.

### Registry داده نمایشی

برای مدیریت امن Seed یک Registry یا مکانیزم معادل ایجاد کن:

- `demo_seed_registry(seed_key, seed_version, entity_type, entity_id, created_at)` یا ساختار سازگار.
- Seed فقط در `development` و `test` اجرا شود.
- در `production` حتی با اشتباه اپراتور اجرا نشود و با پیام واضح Fail شود.
- اجرای دوباره باید Upsert امن انجام دهد و تعداد محصول‌ها یا موجودی را افزایش ندهد.
- هیچ داده واقعی کاربر هنگام Reset/Reseed حذف نشود.

## ۳. قواعد و Validation محصول

- مبلغ فقط Integer و برحسب ریال در DB/API؛ نمایش UI به تومان.
- Float برای پول ممنوع.
- `compare_at_price_irr` در صورت وجود باید بزرگ‌تر از `price_irr` باشد.
- محصول منتشرشده حداقل یک Variant فعال، SKU، قیمت مثبت، Category و تصویر اصلی داشته باشد.
- `shipping_weight_g >= net_weight_g`.
- SKU و Slug تکراری با `409` و کد خطای پایدار رد شوند.
- Product دارای Order حذف فیزیکی نشود؛ فقط Archive.
- تغییر هم‌زمان با `version` یا ETag کنترل شود و overwrite خاموش رخ ندهد.
- Product آرشیوشده در سفارش‌های قدیمی حفظ ولی از فروش عمومی حذف شود.
- متن محصول نباید ادعای درمان قطعی، پیشگیری قطعی یا جایگزینی دارو داشته باشد.

## ۴. API لازم

OpenAPI را منبع قرارداد قرار بده و Typed Client فرانت‌اند را دوباره تولید کن.

### Admin

- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `GET /api/v1/admin/products/{id}`
- `PATCH /api/v1/admin/products/{id}`
- `POST /api/v1/admin/products/{id}/publish`
- `POST /api/v1/admin/products/{id}/unpublish`
- `POST /api/v1/admin/products/{id}/archive`
- endpointهای لازم برای Variant، Media reorder و Category assignment.

فهرست Admin باید Search، Status/Category/Stock filter، Sort، Pagination و total count داشته باشد.

### Public

- `GET /api/v1/products`
- `GET /api/v1/products/{slug}`
- Filter براساس Category، Availability و Price.
- Sort حداقل `newest|price_asc|price_desc|featured`.
- فقط Product منتشرشده و Variant فعال برگردد.
- پاسخ قیمت، تصویر اصلی، SKU و وضعیت موجودی داشته باشد ولی اطلاعات داخلی یا Audit را افشا نکند.

## ۵. پنل مدیریت محصول

مسیرهای زیر یا معادل هماهنگ با پروژه را بساز:

- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]/edit`

### جدول محصولات

ستون‌ها:

- تصویر اصلی.
- نام و SKU.
- Category.
- قیمت تومان با Tooltip یا نمایش کوچک ریال.
- موجودی `available`.
- وضعیت.
- آخرین ویرایش.
- Actions: مشاهده، ویرایش، انتشار/عدم انتشار و آرشیو.

### فرم ساخت/ویرایش

حداقل بخش‌ها:

- اطلاعات عمومی: نام، slug خودکار قابل ویرایش، توضیح کوتاه و توضیح کامل.
- قیمت و SKU.
- وزن خالص، وزن ارسال و ابعاد.
- Category و Brand.
- تصویر اصلی و Gallery قابل مرتب‌سازی.
- موجودی اولیه فقط هنگام ساخت یا از طریق Stock Adjustment کنترل‌شده.
- SEO title و description.
- وضعیت Draft/Published.

فرم باید Validation Client و Server، خطای فارسی کنار فیلد، dirty-form warning، loading/error/success state و RTL کامل داشته باشد. انتشار بدون الزامات باید با فهرست دقیق کمبودها رد شود.

RBAC سروری:

- `products.read`
- `products.create`
- `products.update`
- `products.publish`
- `products.archive`
- `inventory.adjust`

تمام Create، Update، Publish، Archive و Stock Adjustment در Audit ثبت شود.

## ۶. Storefront محصول

- صفحه فهرست محصولات با Grid responsive، تصویر، نام، Category، قیمت، موجودی و CTA.
- صفحه جزئیات با Gallery، قیمت، SKU، وزن، توضیح، موجودی و Add to Cart در صورت وجود ماژول سبد.
- اگر Cart هنوز پیاده نشده، دکمه جعلی موفق نساز؛ CTA را Disabled با توضیح Development یا لینک واقعی موجود نگه دار و وضعیت dependency را گزارش کن.
- Loading، empty، error، not-found و out-of-stock state.
- `390px`, `768px`, `1440px` و RTL تست شوند.

## ۷. دقیقاً ۱۰ محصول نمایشی

یک Command مانند زیر یا معادل Task Runner پروژه بساز:

```bash
make seed-demo-products
```

Seed باید دقیقاً این ۱۰ محصول را با `status=published` ایجاد کند. هر محصول یک Variant پیش‌فرض فعال، تصویر نمایشی محلی، Category، Brand، قیمت، وزن، موجودی و متن فارسی قابل قبول داشته باشد.

| # | نام محصول | Slug | SKU | دسته | قیمت ریال | قیمت مقایسه‌ای ریال | وزن خالص | وزن ارسال | موجودی |
|---|---|---|---|---|---:|---:|---:|---:|---:|
| ۱ | پودر برگ مورینگا ۱۰۰ گرمی | `moringa-leaf-powder-100g` | `MIR-PWD-100` | پودر و برگ | 2,450,000 | 2,750,000 | 100g | 130g | 40 |
| ۲ | پودر برگ مورینگا ۲۵۰ گرمی | `moringa-leaf-powder-250g` | `MIR-PWD-250` | پودر و برگ | 5,450,000 | 5,950,000 | 250g | 290g | 30 |
| ۳ | برگ خشک مورینگا ۵۰ گرمی | `dried-moringa-leaves-50g` | `MIR-LEAF-050` | پودر و برگ | 1,650,000 | null | 50g | 80g | 35 |
| ۴ | دمنوش مورینگا و لیمو ۲۰ عددی | `moringa-lemon-tea-20` | `MIR-TEA-LEM-20` | دمنوش | 2,850,000 | 3,100,000 | 40g | 90g | 25 |
| ۵ | دمنوش مورینگا و دارچین ۲۰ عددی | `moringa-cinnamon-tea-20` | `MIR-TEA-CIN-20` | دمنوش | 2,950,000 | 3,200,000 | 40g | 90g | 25 |
| ۶ | کپسول مورینگا ۶۰ عددی | `moringa-capsules-60` | `MIR-CAP-060` | کپسول | 4,950,000 | 5,400,000 | 45g | 85g | 20 |
| ۷ | روغن مورینگا ۳۰ میلی‌لیتری | `moringa-oil-30ml` | `MIR-OIL-030` | روغن | 6,750,000 | 7,250,000 | 30g | 85g | 18 |
| ۸ | دانه مورینگا ۱۰۰ گرمی | `moringa-seeds-100g` | `MIR-SEED-100` | دانه | 3,250,000 | null | 100g | 140g | 22 |
| ۹ | بسته آشنایی با مورینگا | `moringa-starter-pack` | `MIR-PACK-START` | بسته‌ها | 7,900,000 | 8,600,000 | 290g | 380g | 15 |
| ۱۰ | بسته هدیه مورینگا | `moringa-gift-box` | `MIR-PACK-GIFT` | بسته‌ها | 12,500,000 | 13,500,000 | 520g | 700g | 10 |

### Category و Brand Seed

- Brand: `مورینگا ایران` با slug برابر `moringa-iran`.
- Categoryها: `پودر و برگ`، `دمنوش`، `کپسول`، `روغن`، `دانه` و `بسته‌ها`.
- همه Categoryها slug پایدار و parent/position مشخص داشته باشند.

### محتوای محصول

- برای هر محصول توضیح کوتاه یکتا بین ۳۰ تا ۶۰ کلمه.
- توضیح کامل یکتا حداقل ۱۲۰ کلمه شامل معرفی، محتویات بسته، روش نگهداری و هشدار عمومی.
- Lorem ipsum، متن تکراری و ادعای پزشکی ممنوع.
- برای مواد خوراکی جمله «این محصول جایگزین توصیه پزشک یا درمان دارویی نیست» در جای مناسب و بدون ترساندن کاربر درج شود.
- محتوای کپسول، روغن و دانه دستور مصرف پزشکی یا دوز درمانی نسازد؛ اگر اطلاعات رسمی محصول موجود نیست، متن صرفاً معرفی و نگهداری باشد.

### تصاویر نمایشی

- برای هر محصول یک تصویر اصلی مجزا و یکدست در Development ایجاد/وارد کن.
- تصویر باید Local و بدون وابستگی Hotlink به سایت دیگر باشد.
- نسبت پیشنهادی `1:1`، نام فایل پایدار و alt فارسی یکتا.
- روی تصویر عبارت «نمونه» یا Badge ظریف داشته باشد تا با عکس واقعی محصول اشتباه نشود.
- مسیر و Relation تصویر باید از Media layer خوانده شود، نه رشته هاردکد در Product card.

## ۸. Test و شواهد پذیرش

حداقل این Testها اجباری‌اند:

- Unit: قیمت، compare-at، وزن، publish rules، slug و SKU.
- Integration: Product CRUD، Category assignment، media relation، inventory ledger و optimistic concurrency.
- Seed test: اجرای اول دقیقاً ۱۰ محصول ایجاد کند؛ اجرای دوم همچنان ۱۰ محصول و همان موجودی را نگه دارد.
- Production guard: Seed در `APP_ENV=production` حتماً Fail شود.
- API: Public فقط ۱۰ محصول Published را برگرداند؛ Draft fixture تستی را برنگرداند.
- Authorization: کاربر بدون Permission از URL مستقیم نیز `403` بگیرد.
- E2E Admin: ساخت یک محصول یازدهم به‌صورت Draft، تکمیل، انتشار، مشاهده در Storefront، ویرایش و Archive.
- E2E Storefront: فهرست ۱۰ محصول Seed و بازشدن جزئیات هر ۱۰ Slug.
- Mobile/RTL و keyboard accessibility فرم محصول.

در پایان format، lint، typecheck، unit، integration، build و E2E مرتبط را اجرا کن. نتیجه واقعی هر Command را گزارش کن. `docs/implementation-status.md` و مستند `docs/modules/M03-product-catalog.md` را به‌روزرسانی کن، سپس متوقف شو و منتظر تأیید من بمان.

## END PROMPT A

---

# PROMPT B — ماژول مدیریت مقاله و ۱۰ مقاله نمایشی

## BEGIN PROMPT B

این Prompt را فقط بعد از کامل و Verified شدن PROMPT A اجرا کن. Repository را مجدداً بررسی و ماژول مدیریت مقاله را به‌صورت واقعی پیاده‌سازی یا تکمیل کن. قرارداد مشترک فایل ۲۴ ماژول و M15، M16، M19، M21 و M22 لازم‌الاجراست.

## ۱. مدل داده محتوا

حداقل مفاهیم زیر را پیاده‌سازی یا با Schema فعلی تطبیق بده:

### `articles`

- `id` UUID، `title`، `slug` یکتا.
- `excerpt` و `body` فارسی Sanitized.
- `status`: حداقل `draft|in_review|published|archived`؛ اگر Workflow کامل M15 وجود دارد، از همان استفاده کن.
- `author_id`, `reviewer_id` اختیاری طبق Workflow.
- `featured_media_id`.
- `published_at`, `scheduled_at`, timestamps با UTC.
- `seo_title`, `seo_description`, `canonical_url`.
- `version` برای Optimistic Concurrency.

### طبقه‌بندی و Revision

- `content_categories`, `content_tags` و Relationها.
- Revision پس از هر Save مهم؛ امکان مشاهده Diff و Restore بدون حذف تاریخچه.
- Relation مقاله مرتبط و Product مرتبط در صورت وجود.
- تصویر شاخص از Media Library و alt فارسی.

### محتوای سلامت

- Article Seed نباید ادعای درمان قطعی یا توصیه شخصی پزشکی داشته باشد.
- Rich text باید Sanitized شود.
- اگر متن Health claim دارد، انتشار فقط با Source و Reviewer طبق M15 مجاز باشد.
- ۱۰ مقاله Seed این Task باید آموزشی و عمومی باشند و `health_claims=[]` داشته باشند.
- Disclaimer عمومی: «این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.»

## ۲. API لازم

### Admin

- `GET /api/v1/admin/articles`
- `POST /api/v1/admin/articles`
- `GET /api/v1/admin/articles/{id}`
- `PATCH /api/v1/admin/articles/{id}`
- `POST /api/v1/admin/articles/{id}/submit-review` در صورت Workflow کامل.
- `POST /api/v1/admin/articles/{id}/publish`
- `POST /api/v1/admin/articles/{id}/unpublish`
- `POST /api/v1/admin/articles/{id}/archive`
- Revision list/detail/restore.

### Public

- `GET /api/v1/articles`
- `GET /api/v1/articles/{slug}`
- Category/Tag/Search، Pagination و Sort براساس newest.
- فقط Publishedها نمایش داده شوند.
- Response شامل title، excerpt، body، تصویر، نویسنده، تاریخ انتشار، Category/Tags، SEO metadata و Related items باشد.

OpenAPI و Generated Client باید با Implementation هماهنگ و بدون drift باشند.

## ۳. پنل مدیریت مقاله

مسیرها:

- `/admin/articles`
- `/admin/articles/new`
- `/admin/articles/[id]/edit`

### فهرست

- عنوان، تصویر، نویسنده، Category، Status، تاریخ انتشار/آخرین ویرایش و Actions.
- Search، Status/Category filter، Sort، Pagination و empty/loading/error states.

### Editor

- عنوان، slug، excerpt، body، تصویر شاخص، Category، Tags، Product مرتبط، SEO و Status.
- Editor باید خروجی Sanitized و قابل دسترس تولید کند؛ HTML خام ناامن ممنوع.
- Preview امن Draft، dirty-form warning و Revision history.
- خطای فارسی کنار فیلد و RTL کامل.

RBAC سروری:

- `articles.read`
- `articles.create`
- `articles.update`
- `articles.review`
- `articles.publish`
- `articles.archive`

Create، Update، Publish، Archive و Revision Restore در Audit ثبت شوند.

## ۴. صفحات عمومی مقاله

- صفحه فهرست مقاله با کارت‌های responsive.
- صفحه جزئیات با title، تصویر شاخص، تاریخ، نویسنده، body، Category/Tags، Disclaimer، مقالات مرتبط و محصولات مرتبط.
- Metadata، canonical و Open Graph مطابق M16.
- Structured data از نوع `Article` فقط با داده واقعی موجود.
- Empty، loading، error و 404.
- HTML semantic، heading hierarchy، alt و keyboard accessibility.

## ۵. دقیقاً ۱۰ مقاله نمایشی

یک Command مانند زیر بساز:

```bash
make seed-demo-articles
```

Seed باید در Development/Test دقیقاً ۱۰ مقاله Published ایجاد کند و در Production Fail شود. اجرای دوباره نباید Article، Revision، Category، Tag یا Relation تکراری بسازد.

| # | عنوان | Slug | دسته | محور محتوای الزامی |
|---|---|---|---|---|
| ۱ | مورینگا چیست؟ آشنایی ساده با این گیاه | `what-is-moringa` | آشنایی با مورینگا | معرفی گیاه، بخش‌های گیاه و کاربردهای عمومی بدون ادعای درمانی |
| ۲ | تفاوت پودر مورینگا و برگ خشک مورینگا | `moringa-powder-vs-dried-leaves` | راهنمای محصولات | تفاوت شکل، بافت، بسته‌بندی و شیوه انتخاب براساس کاربرد معمول |
| ۳ | راهنمای نگهداری صحیح پودر مورینگا | `how-to-store-moringa-powder` | نگهداری | رطوبت، نور، ظرف دربسته، تاریخ تولید و نشانه‌های فساد ظاهری |
| ۴ | روش ساده آماده‌کردن دمنوش مورینگا | `how-to-prepare-moringa-tea` | آموزش استفاده | ابزار، آب، زمان دم‌کشیدن عمومی و نگهداری؛ بدون دوز درمانی |
| ۵ | هنگام خرید محصولات مورینگا به چه نکاتی توجه کنیم؟ | `moringa-buying-guide` | راهنمای خرید | برچسب، ترکیبات، وزن، بسته‌بندی، تاریخ و اطلاعات فروشنده |
| ۶ | آشنایی با دانه مورینگا و شیوه نگهداری آن | `moringa-seeds-guide` | آشنایی با مورینگا | معرفی ظاهری، بسته‌بندی و نگهداری؛ بدون توصیه پزشکی |
| ۷ | روغن مورینگا چیست و چگونه نگهداری می‌شود؟ | `moringa-oil-storage-guide` | راهنمای محصولات | نوع بسته‌بندی، نور، دما، تست حساسیت عمومی و عدم ادعای درمان |
| ۸ | راهنمای خواندن برچسب محصولات مورینگا | `read-moringa-product-labels` | راهنمای خرید | وزن خالص، ترکیبات، تولیدکننده، تاریخ، شرایط نگهداری و هشدارها |
| ۹ | تفاوت وزن خالص و وزن ارسال در فروشگاه آنلاین | `net-weight-vs-shipping-weight` | راهنمای خرید | توضیح شفاف اختلاف وزن بسته‌بندی و محاسبه حمل‌ونقل |
| ۱۰ | پرسش‌های متداول درباره سفارش محصولات مورینگا | `moringa-order-faq` | راهنمای سفارش | ثبت سفارش، پرداخت، ارسال، رهگیری، لغو و ارتباط با پشتیبانی |

### استاندارد محتوای Seed

- هر مقاله حداقل ۵۰۰ و حداکثر ۹۰۰ کلمه فارسی یکتا داشته باشد.
- هر مقاله: excerpt یکتا، مقدمه، حداقل سه Heading، جمع‌بندی و Disclaimer.
- Lorem ipsum، متن کپی‌شده، تکرار پاراگراف و Keyword stuffing ممنوع.
- اطلاعاتی که به Policy واقعی فروشگاه وابسته است، با برچسب روشن «نمونه آزمایشی» نوشته شود و وعده ساختگی ایجاد نکند.
- شماره ۱۰ باید از تنظیمات واقعی Shipping/Payment/Support موجود بخواند یا متن عمومی غیرقطعی داشته باشد؛ زمان ارسال و امکان مرجوعی اختراع نشود.
- برای هر مقاله SEO title حداکثر حدود ۶۰ کاراکتر و meta description طبیعی حدود ۱۲۰ تا ۱۶۰ کاراکتر ایجاد شود.
- هر مقاله تصویر شاخص محلی متفاوت یا مجموعه یکدست Demo با alt فارسی داشته باشد؛ Hotlink ممنوع.
- تاریخ انتشار ۱۰ مقاله در ۱۰ روز متفاوت گذشته قرار گیرد تا Sort و Archive قابل مشاهده باشد؛ زمان‌ها UTC ذخیره و شمسی نمایش داده شوند.
- Categoryها و Tagها با Seed Registry و Slug پایدار ایجاد شوند.
- حداقل ۵ مقاله به محصول مرتبط منطقی متصل شود، اما Relation ساختگی بی‌ربط نساز.

## ۶. Test و شواهد پذیرش

- Unit: Workflow transition، slug، publish validation، sanitization و SEO validation.
- Integration: CRUD، Category/Tags، Revision، publish/archive، media و related products.
- XSS: script، event handler، unsafe URL و HTML مخرب حذف شوند.
- Seed test: اجرای اول دقیقاً ۱۰ Article منتشرشده؛ اجرای دوم همچنان ۱۰ مورد و بدون Revision تکراری.
- Production guard حتماً Test شود.
- Public API و UI دقیقاً ۱۰ Article Published Seed را نشان دهند.
- E2E Admin: ساخت مقاله یازدهم Draft، Preview، Edit، Publish، مشاهده عمومی و Archive.
- E2E Public: بازشدن هر ۱۰ Slug، heading درست، metadata و 404 نامعتبر.
- RTL، موبایل و keyboard accessibility.

در پایان format، lint، typecheck، unit، integration، build و E2E مرتبط را اجرا کن. نتیجه واقعی هر Command را گزارش کن. `docs/implementation-status.md` و `docs/modules/M15-content-cms.md` را به‌روزرسانی کن، سپس متوقف شو.

## END PROMPT B

---

# Definition of Done نهایی این الحاقیه

کار فقط زمانی کامل است که:

- پنل مدیریت واقعاً بتواند محصول و مقاله جدید بسازد و ویرایش/انتشار/آرشیو کند.
- داده‌ها از PostgreSQL و Go API بیایند و در React هاردکد نشده باشند.
- Storefront بدون ورود، دقیقاً ۱۰ محصول Published و ۱۰ مقاله Published Seed را نشان دهد.
- اجرای دوباره Seed هیچ Duplicate یا افزایش موجودی ایجاد نکند.
- Seed در Production قابل اجرا نباشد.
- Admin Mutationها RBAC و Audit داشته باشند.
- قیمت‌ها Integer IRR، تاریخ‌ها UTC و UI فارسی/RTL باشد.
- Product و Article ساخته‌شده از پنل، بدون تغییر کد در صفحات عمومی ظاهر شوند.
- Commandهای Test و نتیجه واقعی آن‌ها در Walkthrough نهایی ثبت شده باشد.
