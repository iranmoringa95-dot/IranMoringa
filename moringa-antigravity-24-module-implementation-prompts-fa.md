# بسته ۲۴ پرامپت اجرایی پروژه ایران مورینگا برای Google Antigravity

مدل هدف: `Gemini 3.6 Flash (High)`

پشته هدف: Next.js + Go + PostgreSQL

این فایل برای پروژه‌ای نوشته شده که اسکلت اولیه آن قبلاً با Antigravity ایجاد شده است. عامل باید وضع موجود Repository را بررسی و اصلاح کند؛ نباید بدون بررسی، پروژه را از نو بسازد یا تغییرات موجود را حذف کند.

---

## راهنمای استفاده

1. این فایل را در ریشه Repository یا در `docs/antigravity-prompts.md` قرار بده.
2. در Antigravity مدل `Gemini 3.6 Flash (High)` و Browser Tools را فعال کن.
3. تمام ۲۴ ماژول را در یک Conversation اجرا نکن.
4. برای هر ماژول Conversation جدا باز کن و به عامل بگو «قرارداد مشترک این فایل و بخش Mxx را اجرا کن».
5. عامل پیش از کدنویسی باید `AGENTS.md`، مستندات، Migrationها، OpenAPI و Testهای موجود را بخواند.
6. هر ماژول فقط پس از پاس‌شدن Definition of Done همان ماژول کامل محسوب می‌شود.
7. اگر Context یا Quota رو به پایان بود، عامل باید `docs/STATUS.md` و `docs/NEXT_TASK.md` را به‌روزرسانی کند و کار را کامل اعلام نکند.

### ترتیب پیشنهادی اجرا

| موج | ماژول‌ها | هدف |
|---|---|---|
| ۰ | M22، M23، M21 | بومی‌سازی، زیرساخت و پنل امن |
| ۱ | M19، M04، M03، M05 | رسانه، طبقه‌بندی، محصول و موجودی |
| ۲ | M01، M02 | ورود و حساب مشتری |
| ۳ | M06، M13، M09، M10، M07، M08 | جریان کامل خرید |
| ۴ | M11، M12، M14، M15، M16، M20 | عملیات، محتوا، SEO و گزارش |
| ۵ | M17، M18، M24 | پشتیبانی، چت‌بات و اتصال خارجی |

اگر بخشی از این ماژول‌ها قبلاً ساخته شده است، عامل باید Gap Analysis انجام دهد و فقط کمبودها یا خطاها را اصلاح کند.

---

# قرارداد مشترک تمام پرامپت‌ها

این قرارداد همراه تمام ماژول‌های M01 تا M24 لازم‌الاجرا است.

## نقش و روش کار عامل

تو مهندس ارشد Full-stack، معمار نرم‌افزار، مهندس امنیت، مهندس داده و مسئول تست این ماژول هستی. خروجی باید کد واقعی، قابل اجرا و تست‌شده باشد؛ نه Mock ظاهری، TODO، صفحه Static یا صرفاً پیشنهاد معماری.

قبل از هر Edit:

1. وضعیت Git و تغییرات موجود کاربر را بررسی کن.
2. `AGENTS.md` و نزدیک‌ترین مستندات را کامل بخوان.
3. ساختار فعلی Go، Next.js، PostgreSQL، Docker و CI را بررسی کن.
4. وابستگی‌ها و قراردادهای ماژول‌های قبلی را شناسایی کن.
5. یک `Implementation Plan` و `Task List` با Scope، فایل‌های درگیر، Migration، API، UI، Test و ریسک‌ها ایجاد کن.
6. اگر تصمیم کوچکی نامشخص است، پیش‌فرض امن انتخاب و در `docs/DECISIONS.md` ثبت کن. فقط برای تصمیم مؤثر بر پول، امنیت، داده واقعی، سلامت یا Production سؤال بپرس.

## معماری غیرقابل‌مذاکره

- Backend یک Modular Monolith با Go باشد.
- Frontend فروشگاه و پنل مدیریت با Next.js App Router و TypeScript Strict باشند.
- PostgreSQL منبع حقیقت داده‌های تراکنشی باشد.
- منطق تجاری فقط در Serviceهای Go باشد؛ در React، Server Action یا Handler تکرار نشود.
- قرارداد میان Go و Next.js با OpenAPI باشد و Client تایپ‌شده تولید شود.
- دسترسی دیتابیس با `pgx/v5` و Queryهای Type-safe مانند `sqlc` باشد.
- Migrationها نسخه‌بندی و Append-only باشند؛ Migration اجراشده ویرایش نشود.
- شناسه داخلی UUID و شماره‌های عمومی مانند Order Number مستقل و غیرقابل حدس باشند.
- مبلغ در دیتابیس `bigint` و برحسب ریال ذخیره شود؛ استفاده از Float ممنوع است.
- نمایش رابط به تومان باشد و تبدیل فقط در لایه Presentation انجام شود.
- همه زمان‌ها در PostgreSQL با `timestamptz` و UTC ذخیره شوند؛ تاریخ شمسی فقط نمایش باشد.
- Interfaces فقط در مرزهای واقعی مانند SMS، Payment، Shipping، Storage و LLM ایجاد شوند.
- داده‌های سفارش، پرداخت و موجودی باید Strong Consistency و Transaction داشته باشند.
- Notification، Analytics و Jobهای غیرحیاتی می‌توانند Eventual Consistency داشته باشند.
- Secret، Token، Merchant ID، Password و داده مشتری هرگز داخل Git، Log، Prompt یا Frontend قرار نگیرند.
- Provider واقعی فقط پس از ارائه Credential امن و تأیید صریح فعال شود؛ در توسعه Fake Adapter لازم است.

## استاندارد Backend

هر ماژول تا حد امکان این مرزها را داشته باشد:

- `domain`: Entity، Value Object، State و invariant.
- `application`: Use case، Command، Query و orchestration.
- `ports`: Interfaceهای خارجی واقعی.
- `adapters`: PostgreSQL، HTTP، Provider و Worker.
- `transport/http`: Handler، DTO و Validation.
- `tests`: Unit و Integration.

Handler فقط Parse، Validate، Authorize و فراخوانی Use case انجام دهد. SQL، محاسبات تجاری و Transition در Handler قرار نگیرد.

## استاندارد API

- Base path نسخه اول: `/api/v1`.
- پاسخ موفق و خطا Envelope ثابت داشته باشند.
- خطا دارای `code` پایدار، پیام کاربرپسند فارسی، `request_id` و جزئیات Validation باشد.
- Pagination به‌صورت Cursor یا Page استاندارد و ثابت انتخاب شود.
- عملیات حساس از `Idempotency-Key` استفاده کنند.
- Authorization سمت سرور اجباری است؛ مخفی‌کردن دکمه در UI امنیت محسوب نمی‌شود.
- OpenAPI، Generated Client و Implementation همیشه Sync باشند.

## استاندارد Frontend و Admin

- رابط `fa-IR`، RTL واقعی و Responsive باشد.
- Loading، Skeleton، Empty، Error، Unauthorized، Disabled و Success state طراحی شوند.
- فرم‌ها با Validation سمت Client و Server باشند؛ Server منبع حقیقت است.
- Admin دارای جدول، Search، Filter، Sort، Pagination و Detail/Timeline مناسب باشد.
- دسترسی Keyboard، Focus واضح، Label، Contrast و حداقل عرض‌های `390px`، `768px` و `1440px` تست شوند.
- هیچ رشته انگلیسی ناخواسته و هیچ عدد/تاریخ ناسازگار در UI باقی نماند.

## استاندارد امنیت و داده

- Threatهای IDOR، CSRF، XSS، SSRF، SQL Injection، Brute force، Replay، Race condition و Mass assignment بررسی شوند.
- Cookieهای Session دارای `HttpOnly`، `Secure` و `SameSite` مناسب باشند.
- ورودی Rich text Sanitized شود.
- فایل Upload با Magic bytes، MIME، Size و Permission کنترل شود.
- Log شامل OTP، Token، Secret، متن کامل اطلاعات پرداخت یا PII غیرضروری نباشد.
- Admin Mutation در Audit Log ثبت شود.

## استاندارد تست

عامل باید متناسب با ماژول این موارد را اجرا کند:

- Unit test برای invariant و محاسبات.
- Integration test با PostgreSQL واقعی.
- Contract test برای OpenAPI و Client.
- Component test برای UIهای حساس.
- E2E با Browser برای Happy path و حداقل یک Failure path.
- Concurrency test برای موجودی، پرداخت، کوپن و سایر نقاط رقابتی.

برای سبزکردن Build، Test را Skip یا Assertion را ضعیف نکن.

## خروجی اجباری هر ماژول

- کد Backend، Frontend و Admin لازم.
- Migration و Queryهای جدید.
- OpenAPI و Client تولیدشده.
- Testها و Fixture/Seed لازم.
- مستند ماژول در `docs/modules/Mxx-*.md`.
- به‌روزرسانی `docs/STATUS.md` و `docs/NEXT_TASK.md`.
- Artifactهای Antigravity شامل Implementation Plan، Task List، Walkthrough و Browser Evidence.
- خلاصه Diff و فرمان‌های اجراشده.

ماژول فقط زمانی Done است که Build و Test مرتبط پاس شوند، رفتار End-to-end اثبات شود و هیچ Placeholder بحرانی باقی نماند.

---

# M01 — پرامپت ورود و ثبت‌نام پیامکی

## BEGIN PROMPT M01

قرارداد مشترک این فایل را رعایت کن و ماژول M01 را در Repository موجود پیاده‌سازی یا تکمیل کن.

### مأموریت

یک سیستم ورود و ثبت‌نام با شماره موبایل ایرانی و رمز یک‌بارمصرف بساز که جایگزین Digits وردپرس شود. کاربر باید با یک فرم مشترک شماره را وارد کند؛ اگر حساب ندارد پس از Verify به‌صورت امن ایجاد شود و اگر حساب دارد وارد شود. تجربه کاربری ساده باشد ولی امنیت و Rate limit کامل رعایت شود.

### وابستگی‌ها

- M22 برای Normalize شماره و اعداد فارسی.
- M23 برای Config، Rate limit، Worker و Logging.
- M11 در صورت پیاده‌سازی؛ در غیر این صورت Port پیامک و FakeSMS Adapter بساز تا بعداً به M11 متصل شود.
- اگر Auth فعلی وجود دارد، Migration سازگار و بدون شکستن Sessionهای معتبر طراحی کن.

### مدل داده حداقلی

Migrationهای لازم را برای این ساختار یا معادل سازگار آن ایجاد کن:

- `users`: `id`, `phone_e164`, `phone_national`, `status`, `phone_verified_at`, `last_login_at`, `created_at`, `updated_at`, `deleted_at`.
- `otp_challenges`: `id`, `phone_e164`, `purpose`, `code_hash`, `expires_at`, `resend_available_at`, `attempt_count`, `max_attempts`, `consumed_at`, `blocked_at`, `request_ip_hash`, `user_agent_hash`, `created_at`.
- `sessions`: `id`, `user_id`, `token_hash`, `expires_at`, `last_seen_at`, `revoked_at`, `created_at`.
- `auth_events`: رخدادهای Request، Verify موفق/ناموفق، Rate limit و Logout بدون ذخیره OTP یا Token خام.

قواعد دیتابیس:

- شماره Normalize‌شده Unique و Case-independent باشد.
- OTP فقط Hash‌شده ذخیره شود.
- Challenge مصرف‌شده دوباره قابل استفاده نباشد.
- برای Verify هم‌زمان از Transaction/Lock مناسب استفاده شود.
- Session Token خام در دیتابیس ذخیره نشود.

### API

- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- Endpoint تمدید Session فقط اگر معماری فعلی واقعاً به آن نیاز دارد.

Request OTP همیشه پاسخ عمومی یکسان بدهد تا Account enumeration رخ ندهد. `purpose` حداقل `login` و در آینده `sensitive_action` را پشتیبانی کند.

### قواعد امنیتی

- اعتبار OTP پیش‌فرض ۲ دقیقه، قابلیت تنظیم از Environment.
- Resend cooldown و سقف درخواست براساس Phone، IP و Device fingerprint غیرحساس.
- سقف تلاش Verify و Block موقت.
- OTP شش‌رقمی CSPRNG؛ استفاده از `math/rand` ممنوع.
- مقایسه Hash در زمان ثابت.
- Cookie امن، Rotation Session پس از ورود و Revoke هنگام Logout.
- CSRF برای Mutationهای Cookie-based.
- پیام خطا نباید وجود یا عدم وجود حساب را لو دهد.

### Frontend

- Modal و صفحه مستقل ورود.
- گام شماره، گام OTP و نتیجه.
- تبدیل اعداد فارسی/عربی به لاتین قبل از ارسال.
- Countdown ارسال مجدد بدون اتکا به ساعت Client به‌عنوان منبع حقیقت.
- Paste کامل OTP، Auto-focus و دسترسی Keyboard.
- حفظ Return URL امن و جلوگیری از Open redirect.
- نمایش خطای Rate limit، انقضا، کد غلط و قطعی سرویس.

### Admin

- فهرست کاربران با شماره Mask‌شده، وضعیت، زمان Verify و آخرین ورود.
- Revoke تمام Sessionهای یک کاربر با Permission مشخص و Audit.
- نمایش Auth eventهای خلاصه بدون OTP و PII اضافی.

### Testهای اجباری

- Normalize تمام قالب‌های `09xx`، `+989xx`، `00989xx` و اعداد فارسی.
- Request موفق با FakeSMS.
- OTP غلط، منقضی، مصرف‌شده و بیش از حد تلاش.
- دو Verify هم‌زمان فقط یک Session/حساب معتبر بسازند.
- Rate limit Phone و IP.
- Session rotation، Logout و Logout-all.
- IDOR و CSRF.
- E2E ورود موفق و خطای کد منقضی در Mobile.

### Definition of Done

- ورود و ثبت‌نام End-to-end با FakeSMS کار کند.
- هیچ OTP یا Session Token خام در DB/Log نباشد.
- Rate limit و Concurrency test پاس شوند.
- حساب تکراری برای قالب‌های مختلف یک شماره ایجاد نشود.
- UI موبایل و RTL با Browser Evidence اثبات شود.

## END PROMPT M01

---

# M02 — پرامپت حساب مشتری

## BEGIN PROMPT M02

قرارداد مشترک را رعایت و ماژول M02 را پیاده‌سازی کن.

### مأموریت

یک حساب مشتری مدرن و ساده بساز که جایگزین صفحه سفارشی YITH/WooCommerce شود و کاربر بتواند پروفایل، آدرس‌ها، سفارش‌ها، اعلان‌ها و Sessionهای خود را مدیریت کند.

### وابستگی‌ها

- M01 احراز هویت.
- M10 برای تاریخچه سفارش؛ اگر هنوز آماده نیست Contract و Empty state تعریف کن.
- M11 برای ترجیحات اعلان.
- M22 برای شماره، آدرس ایران و نمایش تاریخ.

### مدل داده

- `customer_profiles`: `user_id`, `first_name`, `last_name`, `email`, `birth_date` اختیاری، `created_at`, `updated_at`.
- `customer_addresses`: `id`, `user_id`, `label`, `recipient_name`, `phone_e164`, `province_code`, `city_code`, `postal_code`, `address_line`, `plate`, `unit`, `latitude`, `longitude`, `is_default_shipping`, `is_default_billing`, timestamps, `deleted_at`.
- `customer_preferences`: زبان، کانال‌های اعلان و تنظیمات Privacy.
- در صورت نیاز `consent_records` برای ثبت نوع رضایت، نسخه متن و زمان.

### قواعد تجاری

- هر کاربر حداکثر تعداد قابل تنظیم آدرس داشته باشد.
- آدرس حذف‌شده سفارش تاریخی را تغییر ندهد؛ سفارش Snapshot مستقل دارد.
- Postal code و Phone با قواعد ایران Validate شوند.
- Default address باید در Transaction تغییر کند و فقط یک Default از هر نوع وجود داشته باشد.
- Email اختیاری ولی در صورت وجود Normalize و Verify workflow جدا داشته باشد.
- Mass assignment ممنوع؛ فقط فیلدهای مجاز Update شوند.

### API

- `GET/PATCH /api/v1/account/profile`
- `GET/POST /api/v1/account/addresses`
- `GET/PATCH/DELETE /api/v1/account/addresses/{id}`
- `POST /api/v1/account/addresses/{id}/set-default`
- `GET /api/v1/account/sessions`
- `DELETE /api/v1/account/sessions/{id}`
- `GET/PATCH /api/v1/account/preferences`
- `GET /api/v1/account/orders` پس از M10.

### Frontend

- Dashboard خلاصه حساب.
- Profile form.
- کارت و فرم آدرس با استان/شهر وابسته.
- فهرست سفارش و صفحه جزئیات با Timeline.
- تنظیم اعلان.
- مدیریت Session با نام Device تقریبی و زمان آخرین فعالیت، بدون نمایش داده Fingerprint حساس.
- Empty state برای کاربر بدون سفارش و آدرس.

### Admin

- Customer detail با پروفایل، تعداد سفارش، آدرس‌های Mask‌شده و Timeline فعالیت مجاز.
- هیچ Admin نتواند Session کاربر را جعل یا Impersonate کند مگر Feature جداگانه با تأیید صریح، Permission و Audit؛ در این نسخه پیاده‌سازی نکن.

### امنیت و Privacy

- تمام Queryها با `user_id` Session Scope شوند و IDOR test داشته باشند.
- PII در Log ثبت نشود.
- Export/Delete account فقط با Re-auth و Workflow جدا؛ Scaffold و مستندات آماده شود، حذف واقعی سفارش مالی ممنوع.

### Test و DoD

- CRUD آدرس، Default transaction و محدودیت مالکیت.
- عدم تغییر Snapshot سفارش با ویرایش آدرس.
- IDOR برای آدرس و Session.
- E2E ویرایش پروفایل و افزودن آدرس روی Mobile.
- تمام صفحات حساب RTL، Accessible و دارای Loading/Error/Empty باشند.

## END PROMPT M02

---

# M03 — پرامپت کاتالوگ محصول

## BEGIN PROMPT M03

قرارداد مشترک را رعایت و ماژول M03 را پیاده‌سازی کن.

### مأموریت

کاتالوگ کامل محصول را جایگزین WooCommerce کن. محصول ساده و متغیر باید یک مدل واحد داشته باشند: هر محصول قابل فروش حداقل یک Variant پیش‌فرض دارد و قیمت، SKU، وزن ارسال و موجودی روی Variant مدیریت می‌شود.

### وابستگی‌ها

- M04 دسته، برند و ویژگی.
- M19 رسانه.
- M22 بومی‌سازی پول و عدد.
- M21 Permissionهای Admin.
- M05 موجودی بعد از ایجاد Variant متصل شود.

### مدل داده

- `products`: `id`, `slug`, `name`, `short_description`, `description`, `status`, `product_type`, `brand_id`, `featured`, `published_at`, SEO fields, timestamps, `version`.
- `product_variants`: `id`, `product_id`, `sku`, `barcode` اختیاری، `name`, `status`, `price_irr`, `compare_at_price_irr`, `net_weight_g`, `shipping_weight_g`, `length_mm`, `width_mm`, `height_mm`, `is_default`, timestamps, `version`.
- `product_variant_values`: اتصال Variant به Attribute value.
- `product_media`: اتصال مرتب Product/Variant به M19 با `role`, `position`, `alt_override`.
- `product_relations`: related، cross-sell و up-sell.
- `product_change_log` یا استفاده از Audit M21.

### Invariantها

- Product فعال حداقل یک Variant فعال داشته باشد.
- SKU در سطح فروشگاه Unique باشد.
- قیمت منفی و `compare_at` کمتر یا مساوی قیمت مجاز نباشد.
- `net_weight_g` و `shipping_weight_g` جدا باشند؛ وزن ارسال نمی‌تواند از وزن خالص کمتر باشد مگر ADR مستند.
- Slug Unique، پایدار و قابل Redirect باشد.
- Product آرشیوشده در سفارش قدیمی باقی بماند ولی قابل خرید نباشد.
- حذف فیزیکی محصول دارای سفارش ممنوع؛ Archive استفاده شود.

### API عمومی

- `GET /api/v1/products`
- `GET /api/v1/products/{slug}`
- `GET /api/v1/products/{id}/availability`
- Filter براساس Category، Brand، Price، Availability و Attribute.
- Sort براساس newest، price، popularity و featured با تعریف پایدار.

### API Admin

- CRUD Product و Variant.
- Publish/Unpublish/Archive با Transition مشخص.
- Reorder media و related products.
- Bulk publish/archive فقط با Permission و Audit.
- Optimistic concurrency با `version` یا ETag برای جلوگیری از overwrite ویرایش هم‌زمان.

### Storefront

- Product card با تصویر، نام، دسته، قیمت، وضعیت موجودی و CTA درست.
- صفحه Product با Gallery، قیمت، Variant selector، مقدار، SKU، وزن/ابعاد، توضیحات، FAQ hook، Review hook و Related products.
- Product ناموجود CTA «خبرم کن» پس از M11 داشته باشد؛ به‌جای Add to cart.
- Product متغیر تا انتخاب ترکیب معتبر قیمت/موجودی درست نشان ندهد.

### Admin

- جدول Product با تصویر، نام، SKU، دسته، قیمت، موجودی، وضعیت و زمان تغییر.
- فرم Tabbed: General، Variants، Media، Classification، Shipping، SEO و Relations.
- Preview draft با URL امن و موقت.

### Testهای اجباری

- SKU و Slug تکراری.
- Product بدون Variant.
- Publish نامعتبر.
- Price/weight validation.
- Concurrency edit.
- Filter/sort/pagination.
- E2E ایجاد محصول، انتشار و مشاهده در Storefront.

### DoD

- یک محصول ساده و یک محصول متغیر با Seed ساخته شوند.
- Product admin تا Storefront End-to-end کار کند.
- هیچ قیمت Float و هیچ موجودی مستقیم داخل Product نباشد.
- OpenAPI و Client Sync باشند.

## END PROMPT M03

---

# M04 — پرامپت دسته، برند و ویژگی محصول

## BEGIN PROMPT M04

قرارداد مشترک را رعایت و M04 را پیاده‌سازی کن.

### مأموریت

سیستم طبقه‌بندی محصول شامل Category درختی، Brand، Tag، Attribute و Attribute Value بساز که جایگزین Taxonomyهای WooCommerce شود و برای Filter، SEO و Variant قابل استفاده باشد.

### مدل داده

- `categories`: `id`, `parent_id`, `slug`, `name`, `description`, `media_id`, `position`, `status`, SEO fields, timestamps.
- `brands`: `id`, `slug`, `name`, `description`, `logo_media_id`, `status`, SEO fields.
- `tags`: `id`, `slug`, `name`.
- `attributes`: `id`, `code`, `name`, `display_type`, `filterable`, `variant_defining`, `position`.
- `attribute_values`: `id`, `attribute_id`, `code`, `label`, `color_hex`, `media_id`, `position`.
- جداول اتصال Product به Category/Tag و Variant به Attribute Value.

### قواعد

- Category cycle ممنوع و با Test اثبات شود.
- Depth Category محدود و قابل تنظیم باشد.
- Slug در Namespace مربوط Unique باشد.
- Attribute استفاده‌شده در Variant بدون Migration داده‌ای حذف نشود.
- Swatch رنگ فقط Hex معتبر؛ Swatch تصویر فقط Media امن.
- Category/Brand غیرفعال Product را حذف نکند ولی در Public navigation نشان داده نشود.

### API و UI

- Public Category tree و landing page.
- Product filter metadata برای ساخت Facet.
- صفحات Brand و Category با SEO.
- Admin tree با reorder امن، Search و Edit.
- Admin Attribute builder با نوع Select، Button، Color و Image.
- در Product form انتخاب دسته اصلی و دسته‌های فرعی مشخص باشد.

### Test و DoD

- Cycle، duplicate slug، reorder و deletion constraint.
- Filter محصول با چند Attribute.
- E2E ایجاد Category/Brand/Attribute و استفاده در Product.
- Navigation و URLهای SEO-friendly.

## END PROMPT M04

---

# M05 — پرامپت موجودی و انبار

## BEGIN PROMPT M05

قرارداد مشترک را رعایت و M05 را با تمرکز ویژه بر Transaction و Concurrency پیاده‌سازی کن.

### مأموریت

یک سیستم موجودی Ledger-based بساز که جایگزین موجودی WooCommerce شود، تمام تغییرات قابل حسابرسی باشند و Overselling حتی در Checkoutهای هم‌زمان رخ ندهد.

### مدل داده

- `warehouses`: حداقل یک انبار فعال.
- `inventory_items`: `variant_id`, `warehouse_id`, `on_hand`, `reserved`, `safety_stock`, `reorder_point`, `version`, timestamps.
- `inventory_movements`: `id`, `variant_id`, `warehouse_id`, `type`, `quantity_delta`, `before_on_hand`, `after_on_hand`, `reference_type`, `reference_id`, `reason`, `actor_id`, `idempotency_key`, `created_at`.
- `inventory_reservations`: `id`, `variant_id`, `warehouse_id`, `cart_or_order_id`, `quantity`, `status`, `expires_at`, `released_at`, `consumed_at`, timestamps.
- در صورت نیاز `stock_alert_subscriptions` با M11 ادغام شود.

### تعریف‌ها

- `available = on_hand - reserved - safety_stock`.
- Quantityها Integer و غیرمنفی باشند.
- Adjustment بدون Movement ممنوع.
- Movement و تغییر Balance در یک Transaction باشند.
- Reservation دارای state: `active`, `consumed`, `released`, `expired`.

### Use caseها

- دریافت موجودی قابل فروش.
- Manual adjustment با reason اجباری.
- Receive stock.
- Reserve برای Checkout.
- Extend محدود Reservation فقط با Rule مشخص.
- Release در لغو/انقضا/پرداخت ناموفق نهایی.
- Consume پس از Transition تعریف‌شده سفارش.
- Reconciliation و گزارش اختلاف.

### Concurrency

- Row lock یا روش اتمیک مناسب PostgreSQL استفاده شود.
- دو درخواست هم‌زمان نباید `available` را منفی کنند.
- `idempotency_key` Adjustment و Reservation تکراری را خنثی کند.
- Worker انقضای Reservation قابل Retry و Idempotent باشد.

### API و Admin

- Public availability فقط مقدار لازم برای UX را افشا کند.
- Admin inventory table با SKU، on-hand، reserved، available، reorder point و status.
- Adjustment modal با نوع، مقدار، دلیل و Preview نتیجه.
- Movement ledger با Filter، Reference و Actor.
- Low-stock dashboard و Export.

### Testهای اجباری

- حداقل ۲۰ Checkout هم‌زمان روی موجودی محدود.
- Adjustment تکراری با یک Idempotency key.
- Expire و Release دوباره.
- Consume/Release transition نامعتبر.
- Transaction rollback وسط Movement.
- Permission و Audit.

### DoD

- Overselling در Integration test رخ ندهد.
- هر تغییر Balance دقیقاً یک Movement قابل رهگیری داشته باشد.
- موجودی هیچ‌گاه منفی نشود.
- Admin و Storefront مقدار سازگار ببینند.

## END PROMPT M05

---

# M06 — پرامپت سبد خرید

## BEGIN PROMPT M06

قرارداد مشترک را رعایت و M06 را پیاده‌سازی کن.

### مأموریت

سبد خرید مهمان و کاربر بساز که جایگزین Cart WooCommerce و افزونه Cart All-in-One شود. سبد باید سریع و ساده باشد ولی قیمت، موجودی و تخفیف را همیشه از Backend مجدداً محاسبه کند.

### وابستگی‌ها

- M03 Product/Variant.
- M05 availability.
- M01 برای Merge پس از Login.
- M13 برای Promotion؛ در نبود آن Hook قیمت‌گذاری تعریف شود.

### مدل داده

- `carts`: `id`, `user_id` nullable، `guest_token_hash`, `status`, `currency`, `expires_at`, timestamps, `version`.
- `cart_items`: `id`, `cart_id`, `variant_id`, `quantity`, `unit_price_snapshot_irr`, timestamps، Unique روی Cart+Variant.
- محاسبه نهایی در response انجام شود؛ Snapshot منبع حقیقت Checkout نیست.

### قواعد

- Cart فعال برای هر کاربر/Guest طبق Rule واحد باشد.
- Guest token امن، HttpOnly یا معماری امن معادل.
- Add تکراری Quantity را اتمیک افزایش دهد.
- Quantity از Available و سقف خرید بیشتر نشود.
- Product/Variant غیرفعال، تغییر قیمت و کاهش موجودی در Refresh مشخص شوند.
- Merge Cart پس از Login deterministic باشد: Quantityها جمع و سپس Limit اعمال شود؛ Conflict به کاربر گزارش شود.
- Cart expiration و cleanup Worker.

### API

- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/{id}`
- `DELETE /api/v1/cart/items/{id}`
- `DELETE /api/v1/cart`
- `POST /api/v1/cart/merge` فقط در Flow امن Login یا خودکار سمت Backend.

Response شامل Subtotal، Discount hook، Shipping-not-calculated، Grand-total provisional، Item warning و `version` باشد.

### Frontend

- Cart drawer و صفحه کامل Cart.
- Quantity stepper، remove، undo کوتاه‌مدت و optimistic UI کنترل‌شده.
- اعلام تغییر قیمت، ناموجودشدن یا محدودشدن Quantity.
- CTA Checkout فقط وقتی Cart معتبر است.
- Empty state کاربردی و ادامه خرید.
- Double-click نباید Item تکراری بسازد.

### Test و DoD

- Guest Cart، User Cart و Merge.
- Add هم‌زمان و Quantity limit.
- Product inactive، price changed، stock decreased.
- Expired cart.
- IDOR و Guest token forgery.
- E2E افزودن، تغییر تعداد، Login و Merge.
- Backend همیشه مقدار نهایی را محاسبه و Client هیچ مبلغی را تحمیل نکند.

## END PROMPT M06

---

# M07 — پرامپت Checkout

## BEGIN PROMPT M07

قرارداد مشترک را رعایت و M07 را پیاده‌سازی کن.

### مأموریت

Checkout کوتاه، قابل اعتماد و Mobile-first بساز که جایگزین WooCommerce Checkout و Checkout Field Editor شود. خرید مهمان مجاز باشد و Backend تمام قیمت، تخفیف، ارسال، موجودی و سفارش را دوباره محاسبه کند.

### وابستگی‌ها

- M06 سبد خرید.
- M05 Reservation موجودی.
- M09 Quote ارسال.
- M10 ایجاد سفارش و Snapshot.
- M13 تخفیف.
- M01/M02 برای کاربر واردشده؛ مهمان نباید مجبور به ثبت‌نام شود.
- M08 پس از ایجاد سفارش برای پرداخت متصل شود.

### مدل داده

- `checkout_sessions`: `id`, `cart_id`, `user_id`, `guest_phone`, `status`, `cart_version`, `quote_hash`, `expires_at`, timestamps.
- `checkout_quotes`: Snapshot اقلام، Subtotal، Discount، Shipping، Tax در صورت نیاز، Grand total و زمان اعتبار.
- آدرس موقت Checkout یا اتصال امن به Address کاربر؛ Order در M10 Snapshot نهایی می‌گیرد.
- Idempotency key برای Commit Checkout.

### مراحل Checkout

1. دریافت/انتخاب نام گیرنده و موبایل.
2. دریافت آدرس، استان، شهر، کدپستی، پلاک و واحد.
3. دریافت روش‌های معتبر ارسال از M09.
4. اعمال Coupon از M13.
5. نمایش Review سفارش و Quote دارای Expiry.
6. Commit اتمیک: Refresh cart، Validate product، Validate price، Reserve inventory، Create order و ثبت Snapshot.
7. انتقال به M08 برای Payment initiation.

### قواعد

- هیچ مبلغ، تخفیف، وزن، نرخ ارسال یا Product title از Client پذیرفته نشود.
- Quote دارای نسخه Cart و Hash باشد؛ Cart تغییرکرده Quote را باطل کند.
- Double submit با Idempotency key فقط یک Order بسازد.
- Commit شکست‌خورده Reservation نیمه‌کاره باقی نگذارد.
- Checkout session و Quote زمان‌دار باشند.
- Consent بازاریابی اختیاری و پیش‌فرض خاموش باشد.
- فیلدهای غیرضروری حذف شوند؛ Company و Email فقط در صورت نیاز واقعی.

### API

- `POST /api/v1/checkout/sessions`
- `GET/PATCH /api/v1/checkout/sessions/{id}`
- `POST /api/v1/checkout/sessions/{id}/quote`
- `POST /api/v1/checkout/sessions/{id}/commit`
- `GET /api/v1/checkout/sessions/{id}/status`

### Frontend

- Stepper حداکثر سه مرحله‌ای یا صفحه واحد واضح.
- Address selector برای کاربر و فرم مهمان.
- Shipping methods با قیمت و ETA.
- Order summary همیشه قابل مشاهده، بدون مزاحمت Mobile.
- Errorهای قیمت تغییرکرده، موجودی ناکافی، Coupon نامعتبر، شهر پشتیبانی‌نشده و Quote منقضی.
- دکمه Commit هنگام درخواست Disable و در برابر Double-click مقاوم.

### Testهای اجباری

- Guest و Logged-in Checkout.
- Cart version mismatch.
- Price/stock change بین Quote و Commit.
- دو Commit هم‌زمان با یک/دو Idempotency key.
- Rollback Reservation در خطای Order.
- آدرس و City validation.
- E2E از Cart تا صفحه شروع پرداخت و Failure state.

### DoD

- یک Checkout کامل با Fake payment آماده باشد.
- Duplicate order و Overselling رخ ندهد.
- خرید مهمان بدون ثبت‌نام کار کند.
- تمام Totals با Backend و IRR integer تولید شوند.

## END PROMPT M07

---

# M08 — پرامپت پرداخت ملت، زرین‌پال و زیبال

## BEGIN PROMPT M08

قرارداد مشترک را رعایت و M08 را به‌صورت Payment Orchestration امن پیاده‌سازی کن.

### مأموریت

لایه پرداخت Provider-agnostic بساز که Fake Gateway را در توسعه و Adapterهای به‌پرداخت ملت، زرین‌پال و زیبال را پس از ارائه مستندات و Secret معتبر پشتیبانی کند. موفقیت پرداخت هرگز صرفاً از Query String یا Redirect پذیرفته نشود.

### محدودیت اختیار

- بدون Credential امن و تأیید کاربر، درخواست واقعی مالی ارسال نکن.
- Merchant ID، Terminal ID، Username، Password، Private key و Callback secret را در کد یا Prompt قرار نده.
- ابتدا Fake Adapter و Contract test کامل بساز.
- Adapter واقعی فقط براساس مستند رسمی همان Provider پیاده شود و Version/Endpoint در ADR ثبت شود.

### مدل داده

- `payments`: `id`, `order_id`, `provider`, `amount_irr`, `currency`, `status`, `idempotency_key`, `provider_reference`, `provider_transaction_id`, `failure_code`, timestamps, `version`.
- `payment_attempts`: Request/response metadata Sanitized، attempt number، latency و نتیجه؛ بدون Secret یا Payload حساس.
- `payment_callbacks`: `provider`, `dedupe_key`, payload hash، received_at، processed_at، result.
- `refunds`: `id`, `payment_id`, `amount_irr`, `status`, `reason`, `provider_reference`, actor، timestamps.
- Unique constraint برای جلوگیری از ثبت دوباره Reference و Callback.

### State machine

- `created`
- `initiating`
- `pending`
- `paid`
- `failed`
- `cancelled`
- `partially_refunded`
- `refunded`

Transitionها Explicit باشند. `paid` برگشت‌پذیر به `pending` نیست. Refund مسیر مستقل و Audit‌شده دارد.

### Port مشترک Provider

- `Initiate(ctx, payment)`
- `ParseCallback(request)`
- `Verify(ctx, providerReference, expectedAmount)`
- `Refund(ctx, payment, amount)` فقط اگر Provider پشتیبانی کند.
- Error taxonomy مشترک: timeout، rejected، invalid_callback، amount_mismatch، duplicate، unavailable، unknown.

### Flow پرداخت

1. Order قابل پرداخت و Amount از DB خوانده شود.
2. Payment با Idempotency key ساخته شود.
3. Initiate و Redirect URL امن دریافت شود.
4. Callback فقط Input موقت است.
5. Backend با Provider Verify کند.
6. Amount، Currency، Reference و وضعیت تطبیق داده شوند.
7. در Transaction، Payment `paid` و Order Transition شود.
8. Outbox event پرداخت موفق/ناموفق ساخته شود.

### API

- `POST /api/v1/orders/{orderNumber}/payments`
- `GET /api/v1/payments/{id}/status`
- Callback جدا برای هر Provider با URL ثابت.
- `POST /api/v1/admin/payments/{id}/verify` با Permission و Rate limit.
- `POST /api/v1/admin/payments/{id}/refunds`

### Frontend و Admin

- انتخاب درگاه فقط از Providerهای Enabled.
- صفحه بازگشت پرداخت با Poll status؛ Query String منبع حقیقت نباشد.
- Retry پرداخت ناموفق برای همان Order طبق Rule، بدون Order جدید.
- Admin لیست Payment با Provider، Amount، status، reference، attempt و timeline.
- Refund modal با مبلغ، دلیل، تأیید و Permission جدا.

### امنیت

- Callback replay، جعل Reference، Amount mismatch و SSRF بررسی شوند.
- Callback log Redacted.
- Timeout و Retry با Backoff محدود؛ Initiate کورکورانه Retry نشود مگر idempotency Provider مشخص باشد.
- Circuit breaker سبک فقط در صورت نیاز واقعی.

### Testهای اجباری

- Fake success، fail، cancel، timeout و delayed success.
- Callback جعلی و Replay.
- Verify amount mismatch.
- دو Callback هم‌زمان.
- Retry بعد از Failure بدون Duplicate Order.
- Partial/full refund و refund بیش از مبلغ.
- Contract test هر Adapter واقعی با Fixture Sanitized.
- E2E Checkout → Fake gateway → Verify → Order paid.

### DoD

- Fake Gateway تمام حالت‌ها را از Admin قابل انتخاب کند.
- Duplicate payment/order در تست هم‌زمانی رخ ندهد.
- هیچ موفقیتی بدون Verify پذیرفته نشود.
- Adapterهای واقعی در نبود Credential Disabled و Health-safe باشند.

## END PROMPT M08

---

# M09 — پرامپت حمل‌ونقل و محاسبه ارسال

## BEGIN PROMPT M09

قرارداد مشترک را رعایت و M09 را پیاده‌سازی کن.

### مأموریت

سیستم ارسال ایران شامل پست، تیپاکس، پیک شهری و نرخ ثابت/شرطی بساز که جایگزین افزونه‌های حمل‌ونقل ووکامرس شود. نسخه اول با Rule engine داخلی و Fake carrier کار کند و Adapter API واقعی فقط پس از ارائه قرارداد رسمی اضافه شود.

### مدل داده

- `provinces`, `cities`: Code پایدار، نام فارسی، active و shipping metadata.
- `shipping_zones`: مجموعه استان/شهر/کدپستی.
- `shipping_methods`: `code`, `name`, `carrier`, `type`, `active`, `eta_min_days`, `eta_max_days`.
- `shipping_rules`: Zone، min/max weight، min/max cart amount، product/category restriction، base price، per-weight price، free threshold، priority و validity.
- `shipping_quotes`: checkout، method، amount، ETA، expires_at، input_hash.
- `shipments`: order، method، carrier، status، tracking_code، shipped_at، delivered_at.
- `tracking_events`: shipment، code، title، description، occurred_at، source.

### قواعد نرخ

- وزن ارسال از مجموع `shipping_weight_g * quantity` محاسبه شود.
- Destination، Cart amount، Category restriction و Free-shipping threshold بررسی شوند.
- Rule conflict با Priority و Strategy مستند حل شود؛ نتیجه deterministic باشد.
- نرخ منفی یا روش بدون Zone معتبر ممنوع.
- Quote منقضی در Commit دوباره محاسبه شود.
- پیک فقط برای شهرهای تعریف‌شده.
- Tracking code Unique در محدوده Carrier باشد.

### Carrier Port

- `Quote`
- `CreateShipment`
- `CancelShipment`
- `Track`

برای Post، Tipax و Tapin ابتدا Adapter Mock/Fake و Contract تعریف کن. اگر API رسمی در دسترس نیست، روش Manual shipment کاملاً قابل استفاده باشد.

### API و UI

- `POST /api/v1/shipping/quotes`
- Public province/city lookup.
- Account/Admin shipment tracking.
- Admin CRUD Zone، Method و Rule با Simulator نرخ.
- Admin Create shipment، ثبت Tracking و Event.
- Checkout نمایش قیمت، ETA و توضیح روش.
- صفحه رهگیری عمومی به M10 متصل شود.

### Testها

- شهر پشتیبانی‌نشده، وزن مرزی، Threshold رایگان و Rule conflict.
- Quote tampering و expiry.
- Tracking transition.
- Carrier timeout/failure با Manual fallback.
- E2E انتخاب روش ارسال و نمایش در Order.

### DoD

- حداقل سه روش Seed: پست، تیپاکس و پیک شهری.
- Simulator Admin و Quote Checkout یک نتیجه تولید کنند.
- Ruleها Audit و Version داشته باشند.
- API خارجی نبودن، Flow دستی را متوقف نکند.

## END PROMPT M09

---

# M10 — پرامپت سفارش و رهگیری

## BEGIN PROMPT M10

قرارداد مشترک را رعایت و M10 را به‌عنوان هسته Order Management پیاده‌سازی کن.

### مأموریت

سیستم سفارش با Snapshot کامل، State machine صریح، Timeline و رهگیری مهمان/کاربر بساز که جایگزین WooCommerce Orders و افزونه رهگیری سفارش شود.

### مدل داده

- `orders`: `id`, `order_number`, `user_id` nullable، guest phone، status، payment_status، fulfillment_status، subtotal، discount، shipping، tax، total، currency، placed_at، cancelled_at، timestamps، version.
- `order_items`: Product/Variant IDs به‌علاوه Snapshot نام، SKU، optionها، unit price، quantity، totals، net/shipping weight.
- `order_addresses`: Snapshot billing/shipping، نه Reference قابل تغییر به Customer address.
- `order_status_history`: from/to، reason، actor، metadata Sanitized، created_at.
- `order_notes`: customer-visible/internal با Permission.
- اتصال به Payment، Reservation، Shipment، Coupon redemption و Outbox.

### State machine سفارش

- `pending_payment`
- `paid`
- `processing`
- `ready_to_ship`
- `shipped`
- `delivered`
- `cancelled`
- `refunded` یا status ترکیبی مستند.

Transitionها در Domain تعریف شوند. Handler یا Admin حق Update مستقیم status ندارد.

### قواعد

- Order Number خوانا ولی غیرقابل حدس ساده باشد.
- Snapshot با تغییر Product، Price یا Address تغییر نکند.
- Cancel فقط در وضعیت‌های مجاز و براساس Payment/Shipment باشد.
- هر Transition یک History و Audit بسازد.
- Order paid با Callback تکراری دوباره Transition نشود.
- Internal note هرگز به مشتری نمایش داده نشود.
- Guest order با Token امن یا ترکیب Order Number + Phone challenge قابل رهگیری باشد؛ صرف Order Number کافی نیست.

### API

- Account: list/detail/cancel allowed.
- Guest track request و verify با Rate limit.
- Admin list/detail/transition/note.
- Timeline واحد برای Payment، Order، Inventory و Shipment.

### Frontend

- صفحه موفقیت سفارش با شماره و گام بعد.
- حساب مشتری: فهرست، Detail، totals، address snapshot، payment و shipment timeline.
- رهگیری مهمان با احراز امن.
- Empty/Error/Unauthorized state.

### Admin

- جدول High-density با شماره، مشتری، مبلغ، payment، shipping، status و تاریخ.
- Filter ترکیبی و Search.
- Detail با Timeline، items، address، payment، shipment، notes و Audit.
- Actionها فقط Transitionهای مجاز را نمایش دهند و reason لازم بگیرند.

### Testهای اجباری

- تمام Transitionهای مجاز و غیرمجاز.
- Snapshot پس از تغییر Product.
- Duplicate creation با Idempotency.
- Guest tracking enumeration/rate limit.
- Cancel paid/unpaid/shipped.
- Timeline ordering.
- E2E Admin processing → shipped → customer tracking.

### DoD

- سفارش End-to-end از Checkout ساخته شود.
- Direct status mutation وجود نداشته باشد.
- Snapshot و Timeline کامل باشند.
- دسترسی مشتری/مهمان/Admin با تست IDOR اثبات شود.

## END PROMPT M10

---

# M11 — پرامپت پیامک و اعلان

## BEGIN PROMPT M11

قرارداد مشترک را رعایت و M11 را پیاده‌سازی کن.

### مأموریت

سیستم اعلان مبتنی بر Transactional Outbox بساز که OTP و رخدادهای سفارش، پرداخت، ارسال و موجودشدن کالا را از طریق SMS و Email توسعه ارسال کند و جایگزین افزونه پیامک WooCommerce شود.

### مدل داده

- `outbox_events`: type، aggregate، payload versioned، occurred_at، available_at، processed_at، attempt_count و last_error_code.
- `notification_templates`: code، channel، locale، subject، body، variables schema، status، version.
- `notification_deliveries`: event، recipient hash/masked، channel، provider، status، provider_message_id، attempt، timestamps.
- `notification_preferences`: user، channel و event category.
- `stock_alert_subscriptions`: user/phone، variant، status، verified_at، notified_at.

### رخدادهای حداقلی

- OTP requested.
- Order placed.
- Payment paid/failed.
- Order processing/cancelled.
- Shipment created/shipped/delivered.
- Refund completed.
- Product back in stock.

### Provider Port

- `SendSMS`
- `SendEmail`
- نتیجه مشترک با provider ID، status و retryability.

FakeSMS و Mailpit adapter اجباری‌اند. Provider واقعی فقط با Secret امن و مستند رسمی.

### قواعد

- Event در همان Transaction تغییر Domain داخل Outbox نوشته شود.
- Worker حداقل once اجرا می‌شود؛ Delivery باید Idempotent باشد.
- Retry با Backoff، سقف تلاش و Dead-letter وضعیت قابل مشاهده.
- Template variable ناشناخته یا Missing باعث ارسال متن ناقص نشود.
- پیام Transactional از Marketing جدا و Opt-out مناسب رعایت شود.
- OTP متن و Retention جداگانه دارد و در Delivery body ذخیره نشود.

### Admin

- Template editor با Preview و Test فقط به شماره/ایمیل تأییدشده مدیر.
- Delivery log Mask‌شده با status و error code.
- Retry دستی با Permission و Audit.
- Provider health و Queue backlog بدون نمایش Secret.

### Testها

- Transaction rollback بدون Outbox orphan.
- Worker crash و پردازش مجدد بدون ارسال تکراری غیرقابل قبول.
- Template validation.
- Retryable/non-retryable error.
- Preference و Transactional override.
- E2E Order paid → FakeSMS delivery.

### DoD

- رخدادهای اصلی Template فارسی Seed داشته باشند.
- OTP، Order و Shipment با Fake provider کار کنند.
- Queue قابل مشاهده و Retry امن باشد.
- Secret/متن OTP/PII در Log نباشد.

## END PROMPT M11

---

# M12 — پرامپت فاکتور، چاپ و خروجی سفارش

## BEGIN PROMPT M12

قرارداد مشترک را رعایت و M12 را پیاده‌سازی کن.

### مأموریت

فاکتور حرفه‌ای، نسخه چاپی، PDF و Export سفارش بساز که جایگزین افزونه فاکتور و خروجی WooCommerce شود. خروجی باید فارسی، RTL، حسابرسی‌پذیر و براساس Snapshot سفارش باشد.

### مدل داده

- `invoice_sequences`: scope/year، next value و lock امن.
- `invoices`: `id`, `order_id`, `invoice_number`, `status`, `issued_at`, `voided_at`, totals و snapshot hash.
- `invoice_snapshots`: Seller، customer، address، items، discounts، shipping، tax و totals Immutable.
- `export_jobs`: type، filters JSON validated، status، requested_by، file_media_id یا object key، expires_at، error_code.

### قواعد فاکتور

- شماره فاکتور Unique و اتمیک باشد.
- فاکتور صادرشده Immutable؛ اصلاح با Void/Credit note طبق Scope مستند، نه Edit خام.
- مبالغ IRR integer و نمایش تومان واضح.
- وزن، Quantity، Discount، Shipping و Grand total قابل تطبیق با Order باشند.
- فونت فارسی Embed و Layout RTL در PDF/Print تست شود.
- اطلاعات فروشنده از Settings مرکزی، نه Hard-code.

### Export

- CSV UTF-8 BOM و XLSX حداقل پشتیبانی شوند.
- Filter تاریخ، status، payment، shipping و product.
- Export بزرگ Async و Streaming/Job-based باشد.
- فایل با URL امضاشده کوتاه‌مدت و Permission مالک Job دانلود شود.
- Formula injection در CSV خنثی شود.

### API و Admin

- Issue/view/download/void invoice با Permission.
- چاپ تکی و Batch.
- ساخت Export، مشاهده Progress و Download.
- Audit تمام عملیات.

### Testها

- Sequence هم‌زمان.
- Snapshot immutable.
- تطبیق totals.
- رندر حروف فارسی و اعداد.
- CSV formula injection.
- Export بزرگ و Expired URL.
- E2E Admin invoice print و export.

### DoD

- فاکتور HTML و PDF از یک Snapshot تولید شوند.
- فایل نمونه فارسی در Test artifact بررسی شود.
- Export حداقل CSV/XLSX کار کند.
- هیچ PII بدون Permission در خروجی نباشد.

## END PROMPT M12

---

# M13 — پرامپت تخفیف، کوپن و قیمت‌گذاری پویا

## BEGIN PROMPT M13

قرارداد مشترک را رعایت و M13 را پیاده‌سازی کن.

### مأموریت

موتور Promotion قابل پیش‌بینی بساز که Coupon، تخفیف محصول/دسته/سبد، حداقل خرید، سقف تخفیف و محدودیت مصرف را پوشش دهد و جایگزین Coupon ووکامرس و Dynamic Pricing غیرفعال شود.

### مدل داده

- `promotions`: `id`, `name`, `type`, `status`, `priority`, `stacking_policy`, `starts_at`, `ends_at`, `rules_json` با Schema version، `actions_json`, timestamps.
- در صورت ترجیح Type-safe، Rule/Actionهای اصلی را در جداول جدا مدل کن و JSON را فقط برای Extension نگه دار.
- `coupons`: `code_normalized`, promotion_id، active، starts/ends، usage_limit_total، usage_limit_per_user، minimum_order_irr، maximum_discount_irr.
- `coupon_redemptions`: coupon، user/guest identity hash، order، amount، status، reserved_at، consumed_at، released_at.
- `promotion_evaluations` فقط برای Debug محدود و بدون PII، در صورت نیاز.

### قابلیت‌های نسخه اول

- درصدی با سقف تخفیف.
- مبلغ ثابت سبد.
- تخفیف Product/Category مشخص.
- حداقل مبلغ خرید.
- اولین سفارش.
- بازه زمانی.
- سقف کل و سقف هر مشتری.
- عدم شمول Shipping مگر Rule صریح.
- Stackability: `exclusive`, `stackable`, `best_price`.

### قواعد

- Code با اعداد/حروف فارسی Normalize و Case-insensitive شود.
- تخفیف هرگز Total را منفی نکند.
- Evaluation deterministic و دارای Breakdown باشد.
- Client فقط Code را ارسال می‌کند؛ مبلغ تخفیف را تعیین نمی‌کند.
- Redemption هنگام Checkout Reserve و پس از Order/Payment طبق ADR Consume شود.
- Cancel/expire Reservation را آزاد کند.
- دو Checkout هم‌زمان سقف مصرف را نقض نکنند.

### API و UI

- Apply/remove coupon در Cart/Checkout.
- Response شامل line-by-line discount و reason رد باشد.
- Admin Promotion wizard با Scope، Condition، Action، schedule و Preview simulator.
- جدول Usage و Redemption با Export محدود.

### Testها

- مرز زمان، timezone و expiration.
- سقف مصرف هم‌زمان.
- first-order race.
- چند Promotion و stacking.
- rounding با IRR integer.
- category/product exclusion.
- E2E ساخت Coupon در Admin و استفاده در Checkout.

### DoD

- Breakdown Cart، Checkout و Order یکسان باشد.
- Coupon تکراری یا بیش از سقف مصرف نشود.
- Simulator Admin دقیقاً Engine Production را فراخوانی کند.

## END PROMPT M13

---

# M14 — پرامپت دیدگاه، امتیاز و پرسش‌وپاسخ

## BEGIN PROMPT M14

قرارداد مشترک را رعایت و M14 را پیاده‌سازی کن.

### مأموریت

سیستم Review و Q&A یکدست بساز که جایگزین دیدگاه WooCommerce، Product Reviews Pro و wpDiscuz شود. Review واقعی، امتیاز، پاسخ مدیر و Moderation باید از Comment مقاله جدا باشند.

### مدل داده

- `product_reviews`: user، product، order_item nullable، rating، title، body، status، verified_purchase، helpful_count، timestamps.
- `review_media`: review، media، position.
- `review_votes`: review، user/anonymous key، vote، Unique مناسب.
- `product_questions`: user/guest identity، product، question، status، timestamps.
- `product_answers`: question، actor، answer، is_official، status، timestamps.
- `article_comments` در صورت نیاز، جدا از Product review.
- `moderation_events`: target، action، reason، moderator، timestamp.

### قواعد

- Rating از ۱ تا ۵.
- Verified purchase فقط با Order delivered/eligible و همان Product تعیین شود؛ Client حق تعیین ندارد.
- یک Review اصلی برای هر user/product یا order item طبق ADR.
- پاسخ مدیر با Badge رسمی.
- محتوای ردشده در Structured Data وارد نشود.
- Aggregate rating فقط از Reviewهای Approved محاسبه شود و قابل Rebuild باشد.
- Media اختیاری و تابع M19.

### ضد سوءاستفاده

- Rate limit، Spam heuristic سبک و Sanitization.
- XSS و لینک مخرب.
- Vote تکراری.
- Admin نمی‌تواند Review جعلی با عنوان مشتری بسازد؛ پاسخ رسمی مجاز است.
- حذف/ویرایش با Audit و سیاست Retention.

### API و UI

- Public list با sort `newest`, `highest`, `lowest`, `helpful` و filter verified.
- Submit review فقط کاربر احرازشده؛ Q&A می‌تواند Guest verified workflow داشته باشد.
- Product page: summary rating، distribution، review list، official answer و form.
- Admin moderation queue با filters، preview، approve/reject، reason و bulk محدود.

### Testها

- forged verified purchase.
- Aggregate consistency.
- XSS sanitization.
- duplicate review/vote.
- moderation permission.
- Structured Data فقط Approved واقعی.
- E2E review مشتری و approval مدیر.

### DoD

- شمارش، rating و Comment از هم تفکیک روشن داشته باشند.
- Review جعلی یا Unapproved در SEO نمایش داده نشود.
- UI Product و Admin کامل و Accessible باشند.

## END PROMPT M14

---

# M15 — پرامپت محتوا، مقاله، FAQ و ادعاهای سلامت

## BEGIN PROMPT M15

قرارداد مشترک را رعایت و M15 را با حساسیت ویژه به ادعاهای سلامت پیاده‌سازی کن.

### مأموریت

CMS داخلی برای مقاله، صفحه، FAQ و محتوای محصول بساز که جایگزین Posts/Pages/Flatsome blocks شود. ادعاهای سلامت باید منبع، Reviewer و Workflow تأیید داشته باشند و انتشار مستقیم ادعای درمانی بدون کنترل ممکن نباشد.

### مدل داده

- `articles`: slug، title، excerpt، body، status، author، reviewer، published_at، scheduled_at، SEO fields، timestamps، version.
- `article_revisions`: snapshot محتوای هر Revision و actor.
- `content_categories`, `content_tags` و mapping.
- `faqs`: question، answer، context type/id، position، status.
- `content_sources`: title، authors، publisher/journal، year، url/doi، accessed_at.
- `health_claims`: content reference، exact claim text، claim_type، evidence_level، source_id، reviewer_id، status، reviewed_at، expires_review_at، disclaimer.
- `editorial_reviews`: decision، notes، reviewer، timestamps.

### Workflow

- `draft`
- `in_review`
- `changes_requested`
- `approved`
- `scheduled`
- `published`
- `archived`

Author و Reviewer Permission جدا باشند. نویسنده ادعای سلامت نتواند Review نهایی خودش را انجام دهد مگر Rule صریح و Audit‌شده.

### قواعد سلامت

- عبارت‌های «درمان قطعی»، «پیشگیری قطعی» و مشابه Flag شوند.
- Claim بدون Source و Reviewer Published نشود.
- Disclaimer «جایگزین توصیه پزشکی نیست» به‌صورت Contextual باشد، نه پوشاندن ادعای گمراه‌کننده.
- تاریخ بازبینی و Source در صفحه قابل نمایش باشند.
- مصرف در بارداری، داروهای فشار/قند/رقیق‌کننده و حساسیت با Warning ساختاریافته مدیریت شود.
- Rich text Sanitized و Linkهای External دارای Policy باشند.

### API و Frontend

- Public article list/detail، category/tag و search.
- Product FAQ و Article FAQ.
- نمایش نویسنده، Reviewer، تاریخ انتشار/بازبینی، منابع و Disclaimer.
- Related article/product relation.
- Draft preview با Token کوتاه‌مدت.

### Admin

- Editor با autosave کنترل‌شده و Revision history.
- Source manager.
- Claim review queue.
- Diff بین Revisionها.
- Schedule publish و unpublish.
- SEO preview با M16.

### Testها

- Workflow permission و transition.
- publish claim بدون source/reviewer.
- XSS در editor/FAQ.
- revision restore بدون از دست‌دادن تاریخچه.
- scheduled publish timezone.
- E2E مقاله از Draft تا Published.

### DoD

- مقاله و FAQ End-to-end کار کنند.
- محتوای سلامت بدون Gate منتشر نشود.
- Source و Reviewer در Public قابل ردیابی باشند.
- Migration محتوای قدیمی بتواند Draft/Review status مناسب تعیین کند.

## END PROMPT M15

---

# M16 — پرامپت SEO، Redirect و دامنه Canonical

## BEGIN PROMPT M16

قرارداد مشترک را رعایت و M16 را با هدف رفع مشکل دو دامنه فعلی پیاده‌سازی کن.

### مأموریت

SEO فنی داخلی بساز که جایگزین Yoast و Redirection شود: Metadata، Canonical، Sitemap، Robots، OpenGraph، Structured Data، Redirect 301 و گزارش 404. فقط یک دامنه Canonical از Environment معتبر باشد.

### مدل داده

- SEO fields می‌توانند در Entityهای Product/Article/Category باشند یا `seo_metadata` با relation Type-safe؛ تصمیم در ADR.
- `redirect_rules`: source path normalized، target URL/path، status code، active، hit_count، last_hit_at، created_by، timestamps.
- `not_found_events`: path hash/normalized، referrer domain Sanitized، count، first/last seen.
- `legacy_url_mappings`: source domain/path، target entity/path، migration status.

### قواعد دامنه

- `APP_CANONICAL_URL` تنها منبع دامنه اصلی باشد.
- تمام URLهای داخلی Absolute از همان Base تولید شوند.
- دامنه قدیمی با 301 یک‌مرحله‌ای به Canonical منتقل شود؛ Redirect chain و loop ممنوع.
- Queryهای Tracking مجاز حفظ یا حذف طبق Allowlist.
- Admin preview/localhost index نشوند.

### Metadata و Structured Data

- Title/description، canonical، robots، OG/Twitter.
- Product schema با Offer، availability، priceCurrency و rating فقط از داده واقعی Approved.
- Article schema با author/reviewer/dateModified.
- Breadcrumb schema.
- FAQ schema فقط وقتی FAQ واقعاً در همان صفحه Visible است.
- Organization/WebSite schema بدون تکرار و ادعای جعلی.

### Sitemap

- Product، Category، Brand، Article و Page فعال.
- Pagination/Chunk برای مقیاس.
- Draft، archived، private و redirect source حذف شوند.
- `lastmod` واقعی از محتوای مهم، نه هر request.

### Admin

- SEO fields و preview در فرم Entity.
- Redirect table با Search، hit count، import/export و loop validation.
- 404 report با پیشنهاد target، بدون Auto-create خطرناک.
- Bulk import Legacy URLs با Dry-run.

### Migration دو دامنه

- Crawl/Export URLهای شناخته‌شده `moringa-iran.ir` و `iran-moringa.ir` به‌عنوان ورودی Migration.
- Mapping برای Blog، Product، Category، Track، Contact و English.
- هیچ Redirect واقعی DNS/Production بدون تأیید کاربر اعمال نشود؛ config و فایل mapping آماده شود.

### Testها

- canonical در همه routeها.
- redirect exact، wildcard محدود، loop و chain.
- sitemap exclusion.
- schema validation snapshot.
- review جعلی/غیرفعال وارد schema نشود.
- E2E old URL → one-hop canonical.

### DoD

- هیچ لینک داخلی به دامنه قدیمی در Build/Seed باقی نماند.
- Sitemap/robots/canonical صحیح باشند.
- Redirect و 404 Admin عملی و Audit‌شده باشند.

## END PROMPT M16

---

# M17 — پرامپت پشتیبانی و شبکه‌های اجتماعی

## BEGIN PROMPT M17

قرارداد مشترک را رعایت و M17 را پیاده‌سازی کن.

### مأموریت

مرکز تماس سبک و Privacy-friendly بساز که جایگزین افزونه لینک واتساپ/تلگرام/اینستاگرام شود. کاربر باید قبل از ارائه ارزش مجبور به واردکردن ایمیل یا موبایل نباشد.

### مدل داده

- `support_channels`: type، label، public handle/url، availability، position، active.
- `business_hours`: weekday، open/close، timezone، closed reason.
- `support_inquiries`: user/guest، channel، subject، body، status، priority، assigned_to، timestamps.
- `support_events`: status/assignment/reply metadata؛ اگر Reply واقعی در Scope است.
- `contact_consents` برای تماس بازاریابی جدا از پشتیبانی.

### قابلیت‌ها

- دکمه واتساپ با متن Pre-fill بدون ارسال خودکار.
- لینک تلگرام/اینستاگرام.
- نمایش ساعات پاسخگویی و وضعیت باز/بسته.
- فرم تماس داخلی با حداقل داده و Ticket number.
- اتصال Ticket به Order فقط پس از احراز مالکیت.
- Admin inbox با status، assign، note و filters.

### Privacy و امنیت

- بازکردن لینک شبکه اجتماعی باید شفاف باشد.
- شماره/ایمیل قبل از نیاز واقعی اجباری نشود.
- Spam rate limit و Honeypot قابل دسترس.
- PII retention و حذف طبق Policy.
- هیچ پیام خودکار به سرویس خارجی بدون Action صریح کاربر ارسال نشود.

### Test و DoD

- business hours با timezone.
- Order ownership در inquiry.
- spam/rate limit و XSS.
- E2E ساخت Ticket مهمان و پاسخ Admin.
- Mobile floating CTA مزاحم Checkout نباشد.

## END PROMPT M17

---

# M18 — پرامپت چت‌بات دانش‌محور

## BEGIN PROMPT M18

قرارداد مشترک را رعایت و M18 را به‌عنوان ماژول اختیاری پس از تکمیل فروشگاه پیاده‌سازی کن.

### مأموریت

چت‌باتی بساز که از Product و Articleهای تأییدشده پاسخ Grounded بدهد، منبع نشان دهد، درباره سلامت توصیه قطعی نکند و در صورت نیاز کاربر را به پشتیبانی انسانی هدایت کند. جایگزین Muchat باشد ولی وابستگی به یک Provider خاص نداشته باشد.

### فازبندی

فاز A اجباری: Search/Retrieval بدون LLM با پاسخ‌های Template و لینک منبع.

فاز B اختیاری: LLM Adapter پس از انتخاب Provider، Secret امن و ارزیابی Privacy/هزینه.

### مدل داده

- `knowledge_documents`: source type/id، version، title، approved content، checksum، indexed_at.
- `knowledge_chunks`: document، content، metadata و embedding فقط اگر Provider/Vector strategy تأیید شد.
- `chat_conversations`: anonymous/user، status، consent flags، started_at، closed_at.
- `chat_messages`: role، content sanitized/redacted، citations، safety flags، latency، timestamps.
- `chat_feedback`: rating، reason.
- `chat_handoffs`: conversation، support inquiry، reason، status.

### LLM Port

- `GenerateAnswer(question, retrievedContext, policy)`
- Provider timeout، token/cost metadata و safety result.
- Fake provider برای Test.

### قواعد پاسخ

- فقط از Product/Article Published و Health claim Approved استفاده شود.
- Citation به صفحه منبع اجباری.
- در عدم اطمینان «نمی‌دانم» و مسیر پشتیبانی.
- تشخیص پزشکی، دوز شخصی، جایگزینی دارو و ادعای درمان ممنوع.
- داده تماس فقط هنگام Handoff و با رضایت درخواست شود.
- Prompt injection داخل Article/Product به‌عنوان داده تلقی شود، نه دستور.
- Conversation log PII redaction و Retention محدود داشته باشد.

### UI و Admin

- Widget غیرمزاحم، بدون فرم اجباری اولیه.
- پاسخ Streaming فقط اگر UX/Infrastructure آماده است.
- Citation clickable، feedback و «ارتباط با انسان».
- Admin: knowledge sync status، unanswered topics، safety flags، redacted transcript و cost/latency aggregate.

### ارزیابی و Test

- Dataset حداقل ۵۰ سؤال درباره محصول، ارسال، سفارش، مصرف عمومی و سؤال نامجاز پزشکی.
- Groundedness، citation accuracy، refusal correctness و handoff rate.
- Prompt injection، PII leak، toxic input و provider timeout.
- Browser E2E بدون ورود و با Handoff.

### DoD

- فاز A بدون Provider خارجی مفید و قابل استفاده باشد.
- فاز B در صورت نبود Secret Disabled بماند و App سالم کار کند.
- هیچ پاسخ سلامت بدون Source Approved تولید نشود.

## END PROMPT M18

---

# M19 — پرامپت کتابخانه رسانه و پردازش تصویر

## BEGIN PROMPT M19

قرارداد مشترک را رعایت و M19 را به‌صورت یک ماژول مستقل و قابل استفاده توسط کاتالوگ، محتوا و تنظیمات سایت پیاده‌سازی کن.

### مأموریت

یک Media Library امن بساز که آپلود مستقیم یا Server-side، اعتبارسنجی واقعی فایل، تولید نسخه‌های بهینه، متن جایگزین فارسی، مدیریت محل مصرف و حذف ایمن را پوشش دهد. فایل باینری را داخل PostgreSQL ذخیره نکن؛ فقط Metadata و Relationها در پایگاه داده باشند. در توسعه از MinIO و در Production از یک S3-compatible Object Storage استفاده کن.

### تصمیم‌های معماری

- یک `ObjectStorage` Port در Go تعریف کن: `CreateUpload`, `CompleteUpload`, `GetSignedURL`, `DeleteObject`, `HeadObject`.
- Adapterهای `MinIO/S3` و `FakeStorage` برای Test بساز.
- Bucketها Private باشند؛ دسترسی عمومی فقط از CDN/Proxy یا Signed URL کوتاه‌عمر انجام شود.
- کلید Object تصادفی و غیرقابل حدس باشد و هرگز از نام خام فایل کاربر به‌عنوان Path استفاده نشود.
- پردازش تصویر Async و از طریق Job/Worker انجام شود؛ API منتظر Resize نماند.
- در نبود Storage/Worker، خطای واضح بده و فایل نیمه‌کاره را به‌عنوان Ready نمایش نده.

### مدل داده و Migration

- `media_assets`: id UUID، owner/admin uploader، original_name، object_key unique، bucket، detected_mime، size_bytes، width، height، checksum SHA-256، status (`uploading|processing|ready|failed|quarantined|deleted`)، title، alt_text، caption، dominant_color nullable، metadata JSONB محدود، created/updated/deleted_at.
- `media_renditions`: asset_id، kind (`thumbnail|card|gallery|zoom|og`)، format (`webp|avif|jpeg|png`)، object_key، width، height، size_bytes، checksum، status؛ unique روی asset+kind+format.
- `media_usages`: asset_id، entity_type، entity_id، field_name، sort_order؛ unique مناسب برای جلوگیری از Relation تکراری.
- `media_upload_sessions`: id، intended_mime، max_size، expires_at، status، object_key، uploader، completed_at.
- Indexهای status، checksum، usage entity و created_at را اضافه کن.

### Upload و Validation

- Endpoint ایجاد Upload Session فقط برای Admin مجاز؛ Content-Type، حداکثر اندازه و Extensionهای مجاز از Config.
- پس از Upload، با `HeadObject` اندازه را تطبیق بده و نوع فایل را از Magic Bytes تشخیص بده؛ به Header/Extension اعتماد نکن.
- تصاویر JPEG/PNG/WebP/AVIF مجاز؛ SVG پیش‌فرض ممنوع، مگر Sanitizer اختصاصی و Policy صریح اضافه شود.
- Pixel-bomb، ابعاد غیرمنطقی، فایل چندریختی، checksum تکراری، session منقضی و mismatch را رد کن.
- EXIF و Location metadata حذف شود؛ Orientation قبل از Resize اعمال شود.
- Hook اختیاری Malware Scanner داشته باش؛ تا نتیجه، وضعیت `quarantined/processing` باشد.
- Upload ناقص و Objectهای بدون رکورد با Cleanup Job زمان‌بندی‌شده پاک شوند.

### پردازش و Delivery

- Renditionها با `fit=cover/contain` و اندازه‌های Configurable تولید شوند؛ Original بدون تغییر برای آرشیو Private بماند.
- Quality و Format Negotiation روشن باشد؛ AVIF/WebP با fallback مناسب.
- برای تصویر محصول، نسبت تصویر سازگار، Blur placeholder یا dominant color و جلوگیری از Layout Shift.
- URL پایدار از Backend/CDN resolver تولید شود؛ Object key داخلی به Client نشت نکند.
- Cache-Control و immutable fingerprint برای Renditionها؛ با تغییر فایل، key/version جدید بساز.

### API و Admin UI

- OpenAPI برای create/complete upload، list/search/filter، update metadata، attach/detach، reorder، archive/delete و regenerate rendition.
- فهرست Admin با Grid/List، جست‌وجوی filename/title/alt، filter نوع/status/unused، preview و progress.
- Alt text برای تصاویر محتوایی اجباری؛ برای decorative امکان علامت‌گذاری صریح و alt خالی.
- انتخابگر رسانه Reusable برای Product، Category، Article و Site Settings.
- حذف Asset مصرف‌شده با `409` و لیست Usageها؛ ابتدا detach/replace لازم باشد.
- Soft delete و Trash؛ حذف قطعی فقط Permission ویژه و بعد از Grace Period.

### امنیت و دسترس‌پذیری

- RBAC سروری برای upload/edit/delete/permanent-delete.
- Signed URL با TTL کوتاه و Scope؛ جلوگیری از path traversal و IDOR.
- Filename و caption در UI escape شوند؛ هیچ فایل آپلودی executable سرو نشود.
- Drag & Drop با Keyboard alternative، progress قابل خواندن و پیام خطای فارسی.

### Test و DoD

- Unit: magic-byte detection، dimension limits، object-key generation، delete guard و rendition plan.
- Integration با MinIO: upload/complete/process/read/delete، session expiry و cleanup.
- Security: fake MIME، SVG script، path traversal، oversized image، IDOR و unauthorized delete.
- E2E: Admin یک تصویر را آپلود، alt وارد، به محصول متصل، مرتب و جایگزین کند.
- Migration rollback در محیط Test و Worker retry/idempotency بررسی شود.
- DoD: هیچ Object یتیم ماندگار، هیچ تصویر Ready بدون Rendition ضروری و هیچ حذف مخرب بدون Audit وجود نداشته باشد.

## END PROMPT M19

---

# M20 — پرامپت گزارش‌ها، داشبورد و خروجی داده

## BEGIN PROMPT M20

قرارداد مشترک را رعایت و M20 را پس از پایدار شدن Order، Payment، Inventory و Customer پیاده‌سازی کن.

### مأموریت

داشبورد مدیریتی و گزارش‌های قابل اتکا بساز که تعریف Metricها ثابت و مستند باشد، Queryهای سنگین Checkout را کند نکنند، مبالغ را بدون خطای ریال/تومان نمایش دهند و خروجی CSV/XLSX امن و قابل رهگیری ارائه کنند.

### ابتدا قرارداد Metric بنویس

قبل از کدنویسی فایل `docs/analytics-metrics.md` را ایجاد و برای هر Metric این موارد را مشخص کن: نام، تعریف، Formula، Time field، Timezone، Statusهای شامل/حذف‌شده، Refund handling، Currency unit و مثال عددی.

حداقل Metricها:

- Gross sales، discount، shipping revenue، refunded amount و net revenue.
- orders created، paid orders، cancelled orders، payment success rate و average order value.
- units sold و top products/categories بر مبنای paid quantity منهای refund.
- stock on hand، reserved، available، low stock و out of stock.
- new/returning customers با تعریف شفاف و بدون تخمین مبهم.
- coupon usage/discount، payment provider success/failure و shipping method distribution.
- funnel پایه: cart، checkout started، payment initiated، paid؛ فقط اگر Event source قابل اعتماد وجود دارد.

### معماری و مدل داده

- PostgreSQL منبع تراکنشی بماند؛ گزارش‌ها از Read Model/View/Materialized View یا جدول Aggregate نسخه‌دار خوانده شوند.
- Query گزارش مستقیم و بدون limit روی جدول‌های داغ Order/Payment ممنوع.
- `report_exports`: id، report_type، requested_by، filters JSONB، format، status، object_key، row_count، expires_at، error_code، timestamps.
- `analytics_refresh_runs`: aggregate name، watermark، started/finished، status، row_count، error.
- در صورت نیاز `daily_sales_aggregates` با `business_date` بر اساس timezone فروشگاه، currency و breakdownهای محدود؛ Raw PII داخل Aggregate ذخیره نکن.
- Refresh idempotent، incremental و قابل backfill باشد؛ هم‌پوشانی اجرا باعث double count نشود.

### API و فیلترها

- endpointهای summary dashboard، time-series sales، product performance، inventory، customers، promotions، payment و shipping.
- همه endpointها: date range معتبر، preset، pagination/cursor، sort whitelist، timezone ثابت، حداکثر range و timeout.
- پاسخ شامل `metric_definition_version`, `currency_unit`, `generated_at`, `data_freshness` باشد.
- Export به Job برود؛ کاربر status را ببیند و فایل Private با URL کوتاه‌عمر دریافت کند.
- CSV Injection را با neutralize کردن سلول‌های شروع‌شونده با `= + - @` مهار کن؛ UTF-8 BOM فقط اگر برای Excel فارسی لازم است و مستند شود.

### داشبورد Admin

- کارت‌های فروش خالص، سفارش پرداخت‌شده، AOV، سفارش‌های نیازمند اقدام و کمبود موجودی.
- نمودارها فقط برای رابطه زمانی مفید؛ جدول و اعداد دقیق جایگزین تزئینات شوند.
- date range شمسی برای نمایش و Gregorian/UTC در API؛ timezone فروشگاه مشخص.
- وضعیت freshness و آخرین Refresh آشکار؛ در خطا عدد قدیمی بدون برچسب نشان داده نشود.
- Drill-down از هر KPI به فهرست Filterشده؛ لینک‌ها Permission را دور نزنند.
- جدول‌ها responsive، column chooser، saved filters اختیاری و empty/loading/error states فارسی.

### مجوز، حریم خصوصی و Audit

- Permission جدا برای dashboard، مالی، مشتری، موجودی و export.
- کاربران فاقد مجوز مالی مبلغ Revenue را نبینند؛ Mask در API انجام شود نه فقط UI.
- شماره تلفن/آدرس در گزارش پیش‌فرض Mask؛ Export PII نیازمند Permission ویژه و Audit.
- هر Export شامل user، filters، row count و expiry در Audit باشد.
- Retention فایل‌های Export محدود و Cleanup خودکار.

### Performance و صحت

- Explain plan و Indexهای لازم برای بازه‌های واقعی ثبت شود.
- Budget پیشنهادی: summary cached زیر 500ms و گزارش paginated زیر 2s در دیتاست تست؛ عدد نهایی را با Benchmark Repo تنظیم کن.
- Monetary sums فقط Integer IRR و تبدیل نمایشی تومان؛ Float ممنوع.
- Refund جزئی، سفارش لغو، پرداخت چندباره، retry و timezone midnight تست شوند.
- Reconciliation test: مجموع گزارش برای یک fixture با Ledger سفارش/پرداخت دقیقاً برابر باشد.

### Test و DoD

- Fixture حداقل ۱۲ ماه، چند provider، تخفیف، refund کامل/جزئی و مرز روز/سال شمسی.
- Unit برای metric formulas و CSV injection.
- Integration برای incremental refresh، backfill و concurrent refresh.
- E2E برای filter، drill-down، export، expiry و Permission denial.
- Load test روی حجم توافق‌شده و ثبت نتیجه در `docs/performance/reporting.md`.
- DoD: عدد Dashboard قابل ردیابی تا رکوردهای منبع، تعریف Metric نسخه‌دار و Export امن/منقضی‌شونده باشد.

## END PROMPT M20

---

# M21 — پرامپت پنل مدیریت، RBAC و Audit Trail

## BEGIN PROMPT M21

قرارداد مشترک را رعایت و M21 را به‌عنوان زیربنای همه عملیات مدیریتی پیاده‌سازی کن. این ماژول باید پیش از باز کردن endpointهای مدیریت سایر ماژول‌ها تکمیل شود.

### مأموریت

یک Admin Panel سریع، RTL، قابل جست‌وجو و امن با مجوزهای ریزدانه و Audit Trail غیرقابل دستکاری در سطح اپلیکیشن بساز. پنهان‌کردن دکمه در Frontend مجوز محسوب نمی‌شود؛ همه مجوزها باید در Go enforce شوند.

### هویت Admin

- حساب مشتری و Admin را از نظر Permission و Session جدا نگه دار، حتی اگر جدول پایه User مشترک است.
- ورود Admin با رمز عبور قوی و Hash استاندارد Argon2id یا bcrypt با پارامتر مستند؛ MFA/TOTP یا OTP دومرحله‌ای به‌صورت Configurable.
- Bootstrap اولین Super Admin فقط از CLI امن/one-time command و بدون route عمومی.
- Session cookie `HttpOnly`, `Secure`, `SameSite` مناسب، rotation بعد از login/privilege change و revoke همه sessionها.
- login rate limit، generic error، lockout کنترل‌شده، last login و security event.
- Admin impersonation در نسخه اول ممنوع؛ اگر بعداً نیاز شد، approval دو مرحله‌ای و banner/Audit اجباری.

### مدل داده

- `admin_users`: user reference یا identity مستقل، status، display_name، password_hash، mfa state، last_login_at، created/disabled_at.
- `roles`: id، code unique immutable، name، description، system flag.
- `permissions`: code unique مانند `products.read`, `products.write`, `orders.refund`, `reports.export_pii`.
- `role_permissions`: role_id، permission_id، created_by، timestamps.
- `admin_user_roles`: admin_id، role_id، assigned_by، expires_at nullable؛ unique مناسب.
- `admin_sessions`: token hash، device metadata محدود، IP hash/redacted، expires/revoked timestamps.
- `audit_logs`: actor، action، entity_type/id، request_id، before/after یا diff redacted JSONB، reason، outcome، IP metadata محدود، created_at.
- Audit append-only باشد؛ endpoint عمومی update/delete نداشته باشد و DB role اپلیکیشن اجازه حذف نگیرد.

### RBAC

- Permission catalog در Code تعریف و با Seed/Migration همگام شود؛ string پراکنده ممنوع.
- Middleware/Policy مرکزی برای API و check جدا برای ownership/sensitive transitions.
- نقش‌های اولیه حداقلی: Super Admin، Catalog Manager، Order Operator، Support Agent، Content Editor، Finance/Reporter؛ Permission دقیق را مستند کن.
- Super Admin قدرت مطلق را فقط برای تعداد محدود داشته باشد؛ assignment آن Audit و confirmation مجدد بخواهد.
- تغییر Role/Permission روی sessionهای فعال فوراً یا حداکثر در TTL کوتاه اثر کند.

### پوسته Admin در Next.js

- مسیر جدا مانند `/admin`، layout RTL، sidebar مبتنی بر Permission، breadcrumb، command/search اختیاری و mobile navigation.
- componentهای reusable: DataTable server-side، pagination، filters، column visibility، bulk selection، status badge، confirmation dialog، form errors، toast و timeline.
- URL source of truth برای filter/sort/page تا لینک قابل اشتراک باشد.
- Bulk action با preview تعداد، confirmation، partial failure report و idempotency.
- Dirty form guard، optimistic UI فقط برای عملیات کم‌خطر، empty/loading/error/skeleton استاندارد.
- صفحه Dashboard نقش‌محور؛ عملیات نیازمند اقدام را نشان دهد، نه نمودارهای بی‌مصرف.

### Audit و عملیات حساس

- Create/update/delete/archive، تغییر قیمت/موجودی، تغییر وضعیت سفارش، refund، Role، تنظیمات و Export در Audit ثبت شوند.
- Password، token، OTP، secret، card data، full address و متن حساس در before/after ذخیره نشود.
- برای عملیات حساس `reason` اجباری و re-authentication قابل تنظیم باشد.
- Audit viewer با filter actor/action/entity/date/request ID و نمایش diff خوانا؛ Export فقط Permission ویژه.
- Correlation از UI تا API/Job با request_id/trace_id.

### API و قرارداد خطا

- endpointهای login/logout/session/me، users، roles، permissions، assignments و audit read.
- خطاهای استاندارد `401`, `403`, `409`, `422`, `429` با code پایدار و پیام فارسی UI.
- CSRF protection برای auth مبتنی بر Cookie؛ CORS allowlist و security headers.
- OpenAPI client generated؛ Frontend permission را از `/admin/me` بگیرد ولی Backend دوباره enforce کند.

### Test و DoD

- Unit: permission evaluation، role expiry، audit redaction و password policy.
- Integration: login/session rotation/revoke، concurrent role change، forbidden endpoint و append-only audit.
- Security: privilege escalation، IDOR، CSRF، session fixation، brute force، mass assignment و hidden-field attacks.
- E2E: هر نقش فقط منو و عملیات مجاز را ببیند؛ URL مستقیم نیز `403` شود.
- Accessibility: keyboard navigation، focus trap، label/error و RTL table.
- DoD: هیچ endpoint مدیریتی بدون Policy، هیچ عملیات حساس بدون Audit و هیچ Secret/PII خطرناک در log باقی نماند.

## END PROMPT M21

---

# M22 — پرامپت بومی‌سازی کامل ایران، فارسی و RTL

## BEGIN PROMPT M22

قرارداد مشترک را رعایت و M22 را در ابتدای پروژه پیاده‌سازی کن تا تمام ماژول‌های بعدی روی یک قرارداد بومی‌سازی واحد ساخته شوند.

### مأموریت

یک لایه Localization مشترک برای فارسی ایران بساز که RTL، اعداد فارسی/لاتین، موبایل، کدپستی، استان/شهر، پول، تاریخ شمسی و جست‌وجوی فارسی را بدون دوگانگی در Backend و Frontend مدیریت کند.

### قواعد قطعی داده

- Locale پیش‌فرض `fa-IR` و Direction برابر RTL؛ زبان فنی Log و API code می‌تواند انگلیسی باشد.
- مبلغ در DB و API همواره Integer `IRR` باشد؛ در UI با برچسب واضح به تومان نمایش داده شود و تبدیل فقط تقسیم صحیح بر ۱۰ باشد. ورودی اعشاری/Float ممنوع.
- timestamp در DB `timestamptz` و ذخیره UTC؛ timezone کسب‌وکار Configurable با پیش‌فرض `Asia/Tehran`.
- تاریخ API به ISO-8601/Gregorian؛ جلالی فقط presentation/input adapter. هیچ تاریخ جلالی به‌عنوان string مبهم در DB ذخیره نشود.
- identifier، phone، postal code و OTP در DB با رقم لاتین canonical؛ UI رقم فارسی و عربی را بپذیرد و normalize کند.

### Packageهای مشترک

- Go package برای `NormalizePersianText`, `NormalizeDigits`, `NormalizeIranMobile`, `ValidatePostalCode`, `IRR` value object، timezone و date-range conversion.
- TypeScript package متناظر برای display/input؛ منطق validation حساس دوباره در Backend enforce شود.
- `NormalizePersianText` حداقل تفاوت `ي/ی`, `ك/ک`، نیم‌فاصله، whitespace و اعداد را مدیریت کند؛ نسخه raw برای نمایش در صورت نیاز حفظ شود.
- برای Slug transliteration سیاست ثابت تعریف کن؛ تغییر عنوان Slug موجود را خودکار نشکند.

### تلفن و آدرس

- موبایل‌های `09xxxxxxxxx`, `989xxxxxxxxx`, `+989xxxxxxxxx` را به E.164 یعنی `+989xxxxxxxxx` تبدیل کن.
- ورودی نامعتبر با code مشخص رد شود؛ شماره را به Number تبدیل نکن.
- کدپستی ایران رشته ۱۰ رقمی باشد؛ صفر ابتدایی حفظ شود و rule validation در یک محل مرکزی باشد.
- dataset نسخه‌دار `provinces` و `cities` با code پایدار، نام فارسی، status و parent relation؛ Seed قابل تکرار.
- Address شامل province/city reference، address line، postal code، recipient و phone canonical؛ dropdown قابل جست‌وجو و keyboard accessible.

### پول، قیمت و تعداد

- formatter واحد برای `IRR -> تومان` با جداکننده هزارگان و label؛ مثال: `12,750,000 IRR` به `۱٬۲۷۵٬۰۰۰ تومان`.
- در Admin امکان نمایش هر دو واحد برای کاهش خطای انسانی.
- ورودی قیمت حروف، separator و ارقام فارسی را normalize کند اما نتیجه نهایی Integer IRR باشد.
- rounding، discount، tax، shipping و refund همیشه در IRR محاسبه و در boundary تست شوند.
- وزن در gram integer و ابعاد در millimeter integer؛ labelهای نمایشی استاندارد.

### تاریخ و تقویم

- Date picker جلالی می‌تواند استفاده شود ولی مقدار submit شده ISO و timezone-aware باشد.
- روز کسب‌وکار و بازه گزارش با `Asia/Tehran` محاسبه و سپس به UTC query range تبدیل شود.
- DST/قوانین timezone را hard-code نکن؛ از IANA timezone database استفاده کن.
- تاریخ ایجاد/پرداخت/ارسال همزمان نسبی و دقیق قابل مشاهده باشد.

### جست‌وجو و SEO

- فیلد normalized/search vector جدا یا generated strategy برای Product/Article؛ متن اصلی دست‌نخورده بماند.
- جست‌وجوی `ی/ي`, `ک/ك` و اعداد فارسی/لاتین نتیجه برابر بدهد.
- sort/collation فارسی را آگاهانه انتخاب و با دیتاست واقعی تست کن؛ تغییر collation Migration plan داشته باشد.
- URL، canonical و structured data از اعداد/تاریخ locale ناسازگار استفاده نکنند.

### UI/Accessibility

- `dir="rtl" lang="fa-IR"` در root؛ icon direction، breadcrumb، carousel، table و form در RTL تست شوند.
- محتوای LTR مانند email، URL، code و شماره پیگیری با `dir="ltr"` یا bidi isolation نمایش داده شود.
- font loading local/preload با fallback مناسب و جلوگیری از layout shift.
- پیام خطا فارسی ساده و field-specific؛ focus order و keyboard navigation طبیعی.

### Test و DoD

- جدول تست جامع برای همه شکل‌های ارقام و حروف عربی/فارسی.
- موبایل معتبر/نامعتبر، کدپستی با صفر، قیمت بسیار بزرگ، refund جزئی و تبدیل تومان/ریال.
- مرز روز تهران، leap year جلالی، date range و ISO round-trip.
- E2E روی موبایل: ثبت‌نام، آدرس، قیمت، تقویم، جست‌وجو و checkout RTL.
- Visual regression برای صفحات کلیدی RTL و mixed-direction.
- DoD: هیچ Float پولی، تاریخ جلالی مبهم، شماره غیرcanonical یا formatter موازی در ماژول‌ها وجود نداشته باشد.

## END PROMPT M22

---

# M23 — پرامپت زیرساخت، کارایی، امنیت و عملیات

## BEGIN PROMPT M23

قرارداد مشترک را رعایت و M23 را به‌عنوان Platform Foundation پیاده‌سازی کن. هدف، محیط توسعه تکرارپذیر و مسیر Production امن است؛ هیچ Deploy یا تغییر سرویس واقعی بدون تأیید صریح انجام نده.

### مأموریت

زیرساختی بساز که Next.js، Go API، Worker و PostgreSQL با یک فرمان محلی بالا بیایند، Configuration و Secretها امن باشند، Health/Logging/Monitoring قابل استفاده باشد، Migration و Backup قابل اعتماد و CI جلوی Regression را بگیرد.

### ساختار Runtime

- سرویس‌های `web`, `api`, `worker`, `postgres`, `minio` و ابزار ایمیل محلی مثل Mailpit در Docker Compose توسعه.
- Redis فقط اگر نیاز واقعی Cache/Queue/Rate-limit توزیع‌شده وجود دارد؛ PostgreSQL می‌تواند برای Outbox/Jobهای اولیه کافی باشد.
- Dockerfileهای multi-stage، non-root، image کوچک، healthcheck و graceful shutdown.
- Dev/CI/Production config جدا ولی schema واحد؛ 12-factor config و fail-fast validation.
- `.env.example` بدون Secret واقعی و جدول مستند متغیرها: required، default، sensitivity و scope.

### فرمان‌های استاندارد

- `make dev`, `make test`, `make lint`, `make generate`, `make migrate-up`, `make migrate-down-test`, `make seed`, `make e2e`, `make backup`, `make restore-check` یا معادل Task runner موجود.
- فرمان‌ها idempotent و در README دقیق؛ از script مبهم وابسته به ماشین شخصی اجتناب کن.
- Code generation شامل OpenAPI client و sqlc؛ CI بررسی کند generated code قدیمی نیست.

### Health، Log و Observability

- `/health/live` فقط process، `/health/ready` وابستگی ضروری با timeout، و endpoint metrics محافظت‌شده.
- structured JSON logs با timestamp UTC، level، service، environment، request_id/trace_id، route، status، latency و error_code.
- هیچ password، OTP، token، cookie، authorization header، متن کامل آدرس یا payload پرداخت در Log نباشد؛ redaction test بنویس.
- Propagation شناسه درخواست از reverse proxy/Next به Go و Worker/Outbox.
- Metrics حداقل: request rate/error/latency، DB pool، job lag/failure، payment callback، OTP rate، inventory conflict و outbox backlog.
- Alert/runbook پیشنهادی برای availability، error spike، disk/DB، job backlog و payment reconciliation؛ Provider خاص را پشت Adapter نگه دار.

### Database و Migration

- connection pool محدود و Configurable؛ statement timeout، context cancellation و transaction boundaries روشن.
- Migrationها append-only، شماره‌دار و در startup production خودکار اجرا نشوند مگر strategy تأییدشده.
- expand/migrate/contract برای تغییر schema بدون downtime.
- Seed فقط داده مرجع/توسعه و قابل تکرار؛ هیچ Admin production با رمز ثابت.
- backup رمزنگاری‌شده، retention و restore drill مستند. Command توسعه backup/restore داشته باشد اما مقصد production را لمس نکند.
- `docs/runbooks/database-restore.md` با RPO/RTO پیشنهادی و مراحل Verification.

### Queue، Job و Outbox

- Job state شامل queued/running/succeeded/failed/dead، attempts، run_at، locked_at/by و last_error code redacted.
- locking اتمیک، visibility timeout، heartbeat در job طولانی، retry با exponential backoff+jitter و dead-letter review.
- idempotency key در handlerهای Payment/SMS/Media/Export.
- Outbox در همان transaction رویداد دامنه ثبت و Worker ارسال کند؛ dual-write ممنوع.
- Admin برای مشاهده backlog/retry مجاز با Audit؛ امکان نمایش Secret/Payload حساس ممنوع.

### امنیت لبه و API

- TLS در Production، trusted proxy list، محدودیت body/upload، request timeout و graceful cancellation.
- CORS allowlist، CSRF برای Cookie auth، CSP، HSTS در HTTPS، `X-Content-Type-Options`, frame policy و Referrer-Policy.
- Rate limit چندلایه برای OTP/login/search/cart/payment callback با key مناسب؛ خطای `429` و Retry-After.
- Dependency pinning، lockfile، Go module verification، image/package scan در CI و process برای patch امنیتی.
- Secret فقط از environment/secret manager؛ rotation plan و startup validation، هرگز داخل Repo/Client bundle.

### Performance و Cache

- Budget اولیه و قابل سنجش برای Core Web Vitals، API p95 و DB query؛ اعداد واقعی پس از baseline ثبت شوند.
- index و N+1 review، pagination اجباری و query timeout.
- cache فقط داده خواندنی و قابل invalidation؛ قیمت/موجودی/مجوز در checkout از source of truth بررسی شوند.
- Next image/font/script optimization، server components در جای مناسب و کاهش JS client.
- load test سناریوهای browse، cart و checkout بدون تماس واقعی با Provider.

### CI/CD و محیط‌ها

- Pipeline: formatting/lint، unit، integration با PostgreSQL، migration up/down-test، OpenAPI compatibility، build، security scan و E2E smoke.
- branch/PR gate و artifact نسخه‌دار با commit SHA؛ Production deploy نیازمند approval و rollback plan.
- محیط staging با Providerهای sandbox/fake و داده بدون PII واقعی.
- Preview environment در صورت پشتیبانی، ولی callback URL و secret جدا.
- `docs/deployment.md`, `docs/runbooks/incident.md`, `docs/runbooks/rollback.md` را تولید کن.

### Test و DoD

- یک clone تمیز باید با دستورهای مستند بالا بیاید و testها عبور کنند.
- shutdown هنگام request/job، DB unavailable، storage timeout، duplicate job و retry storm تست شود.
- restore یک Backup نمونه در CI یا job دوره‌ای Verify شود.
- تست عدم نشت Secret در log و Client bundle.
- benchmark/load-test نتیجه و محدودیت‌ها مستند شود.
- DoD: build تکرارپذیر، migration امن، health معنی‌دار، log قابل هم‌بستگی و rollback/restore مستند باشد.

## END PROMPT M23

---

# M24 — پرامپت اتصال Vira یا هر سرویس خارجی سازمانی

## BEGIN PROMPT M24

قرارداد مشترک را رعایت و M24 را فقط پس از دریافت مستندات رسمی API، محیط Sandbox و تعیین دقیق مالک هر داده اجرا کن. نام «Vira» در این پرامپت یک Integration Boundary است؛ endpoint، field یا قابلیت تأییدنشده اختراع نکن.

### مأموریت

یک لایه Integration مقاوم و قابل خاموش‌کردن برای همگام‌سازی داده‌های تأییدشده با Vira بساز؛ ابتدا Contract و Fake Adapter، سپس Sandbox Adapter و در پایان با تأیید صریح Production. خرابی Vira نباید Browse/Cart/Checkout داخلی را از کار بیندازد.

### مرحله صفر: Discovery اجباری

قبل از کدنویسی فایل `docs/integrations/vira-discovery.md` بساز و این موارد را با برچسب `confirmed|unknown|not-supported` ثبت کن:

- هدف کسب‌وکار: محصول، موجودی، سفارش، مشتری، حسابداری، CRM یا مورد دیگر.
- Base URLهای sandbox/production، auth method، token lifetime/rotation و IP allowlist.
- endpointها، schema، pagination، filtering، rate limit، timeout، idempotency و error catalog.
- webhook signature، replay window، ordering و retry policy.
- مالک منبع حقیقت برای هر field و جهت sync: outbound/inbound/bidirectional.
- mapping واحد پول IRR/تومان، timezone، status، SKU، customer ID، address و tax.
- محدودیت PII، retention، data residency، SLA و support contact.

اگر هر مورد لازم Unknown است، همان بخش را با Interface/Fake/TODO قابل رهگیری پیاده‌سازی کن و به API واقعی متصل نشو.

### معماری Port/Adapter

- domain portهای کوچک و use-case محور تعریف کن؛ یک `ViraClient` عظیم و وابسته به schema خارجی نساز.
- Adapterهای `FakeVira`, `SandboxVira` و feature flag خاموش پیش‌فرض.
- HTTP client با timeout، connection reuse، bounded retry فقط برای خطای retryable، exponential backoff+jitter و circuit breaker.
- auth token در secret manager/env، redacted logging و rotation بدون restart در صورت امکان.
- DTO خارجی در package integration بماند و به Domain entity نشت نکند؛ mapper با test fixture رسمی.

### مدل داده

- `integrations`: provider، environment، enabled، config metadata غیرحساس، status، last_health_at؛ secret ذخیره نشود.
- `integration_sync_jobs`: provider، entity_type، direction، cursor/watermark، status، attempts، started/finished، error_code.
- `integration_sync_records`: local_type/id، remote_type/id، local_version، remote_version، last_synced_hash، status، synced_at؛ unique mapping.
- `integration_conflicts`: record، field/diff redacted، local/remote versions، resolution (`pending|keep_local|accept_remote|manual`)، resolved_by/at.
- `integration_webhook_receipts`: provider_event_id unique، signature_valid، payload_hash، received/processed_at، status، error_code؛ Raw sensitive payload retention محدود.
- `integration_outbox`: event reference/idempotency key، provider، status و attempt metadata، یا از Outbox مشترک M23 استفاده کن.

### جریان Sync

- Outbound از Domain Event/Outbox پس از commit؛ API کاربر منتظر Vira نماند مگر requirement قطعی خلاف آن باشد.
- Inbound با webhook امضاشده یا polling cursor-based؛ full sync pagination-safe و resumable.
- هر عملیات idempotent؛ duplicate webhook/order/product نباید رکورد تکراری بسازد.
- delete خارجی به‌صورت archive/tombstone و با Policy؛ حذف سخت محلی خودکار ممنوع.
- source-of-truth matrix enforce شود. در bidirectional conflict، حدس یا last-write-wins کور ممنوع.
- reconciliation دوره‌ای hash/count/sample و گزارش mismatch؛ امکان resync یک entity و بازه محدود.
- poison record به dead-letter/conflict برود و بقیه batch را متوقف نکند.

### Mappingهای حساس

- Money با واحد صریح؛ اگر Vira تومان می‌خواهد conversion در mapper و test عددی دوطرفه.
- SKU کلید کسب‌وکاری است ولی local UUID حفظ شود؛ collision و missing SKU به conflict.
- Status سفارش با جدول mapping نسخه‌دار؛ status ناشناخته fail-safe و review شود.
- Inventory update به Ledger M05 وارد شود، نه overwrite مستقیم quantity؛ external reference unique.
- Customer PII فقط fields ضروری و با مبنای رضایت/قرارداد؛ log و conflict view Mask شود.

### Admin UI

- صفحه Integration: وضعیت enabled/environment، آخرین sync، backlog، failure rate و freshness؛ secret هرگز نمایش داده نشود.
- فهرست jobها و records با filter، error code و request correlation.
- conflict resolution با نمایش diff redacted، انتخاب صریح، reason و Audit.
- اقدامات test connection، pause/resume، retry یک job، resync entity؛ همه Permission و confirmation داشته باشند.
- Production enable و full resync نیازمند Permission ویژه و two-step confirmation؛ در پاسخ این Task فقط UI/Code آماده کن، اقدام واقعی نکن.

### Webhook Security

- signature روی raw body طبق مستند رسمی، timestamp/replay protection و constant-time compare.
- IP allowlist فقط لایه مکمل، نه جایگزین signature.
- ابتدا receipt/idempotency ثبت، سپس پردازش Async؛ پاسخ سریع و status مطابق قرارداد Provider.
- payload schema validation، body limit و redacted error handling.

### Test و Rollout

- Contract tests با نمونه request/response رسمی و schema snapshot.
- Fake/Sandbox tests: timeout، 429، 401 refresh، 5xx، malformed JSON، pagination، duplicate/reordered webhook و partial batch failure.
- reconciliation و conflict resolution، money/status/SKU mapping و inventory ledger.
- load/backpressure test و circuit-open behavior؛ checkout داخلی باید سالم بماند.
- rollout: feature flag off → internal dry run → sandbox → canary entity set → monitored production، هر مرحله با acceptance و rollback.
- Runbookهای credential rotation، outage، replay، reconciliation و disable emergency.

### DoD

- هیچ endpoint یا field خیالی در کد Production وجود نداشته باشد.
- Integration با flag خاموش هیچ اثر جانبی نداشته باشد.
- تمام ارسال‌ها idempotent، قابل Retry و قابل Audit باشند.
- خرابی/کندی Vira مسیر اصلی فروشگاه را متوقف نکند.
- Production call، credential insertion یا data sync واقعی فقط با تأیید صریح مالک پروژه انجام شود.

## END PROMPT M24

---

# پرامپت راهبر اجرای کل پروژه در Antigravity

این بخش را یک بار به Antigravity بده تا فایل را به‌عنوان Specification اصلی پروژه بشناسد. سپس در هر مرحله فقط یک ماژول را اجرا کن.

## BEGIN MASTER ORCHESTRATOR PROMPT

این Repository یک فروشگاه فارسی با Next.js، Go و PostgreSQL است. فایل `moringa-antigravity-24-module-implementation-prompts-fa.md` Specification مرجع پروژه است.

وظیفه تو در این نوبت اجرای همه فایل نیست. ابتدا این کارها را انجام بده:

1. کل Repository و فایل‌های `AGENTS.md`, `README`, `docs`, migrationها، OpenAPI و testها را بدون تغییر بررسی کن.
2. Specification را کامل بخوان و Dependency بین M01 تا M24 را استخراج کن.
3. وضعیت هر ماژول را فقط بر اساس شواهد کد با یکی از `not-started|partial|implemented|verified|blocked` در `docs/implementation-status.md` ثبت کن؛ وجود UI mock را معادل Backend کامل ندان.
4. Architecture فعلی، gapها، ریسک migration و تداخل با کد موجود را در یک Implementation Plan کوتاه گزارش کن.
5. اگر تصمیمی مانع اجرای امن اولین ماژول است، حداکثر ۵ سؤال دقیق و گزینه‌دار بپرس. در غیر این صورت با Defaultهای Specification ادامه بده.
6. در این نوبت فقط ماژول تعیین‌شده در پیام من را end-to-end اجرا کن. کد ماژول دیگر را جز refactor ضروری و کم‌دامنه تغییر نده.

برای ماژول انتخاب‌شده:

- ابتدا Requirementهای همان Mxx و «قرارداد مشترک همه پرامپت‌ها» را به Acceptance Checklist تبدیل کن.
- migration، query/repository، domain/service، API/OpenAPI، generated client، Next.js UI/Admin، Permission/Audit، localization، test و docs مرتبط را کامل کن.
- اگر وابستگی لازم هنوز وجود ندارد، Stub نمایشی نساز؛ یا حداقل foundation واقعی را در Scope ثبت کن یا وضعیت را `blocked` اعلام و دقیق بگو چه چیزی لازم است.
- هیچ API، Provider، قابلیت یا Credential تأییدنشده اختراع نکن. سرویس خارجی را با Port و Fake Adapter و feature flag خاموش بساز.
- هیچ Secret واقعی، Deploy production، پیامک/پرداخت واقعی یا عملیات مخرب اجرا نکن.
- قبل از پایان، format/lint/typecheck/unit/integration/build و E2E مرتبط را اجرا کن. خطای قبلی و خطای ایجادشده را تفکیک کن، ولی خطای مرتبط با تغییر خودت را باقی نگذار.
- در پایان فقط این خروجی را بده: خلاصه Outcome، فایل‌های کلیدی، migration/API changes، test commands و نتایج، Acceptance Checklist، ریسک/تصمیم باز و پیشنهاد ماژول بعدی. سپس متوقف شو و منتظر تأیید من بمان.

ماژول این نوبت: `M22 — بومی‌سازی کامل ایران، فارسی و RTL`.

## END MASTER ORCHESTRATOR PROMPT

---

# الگوی کوتاه برای اجرای هر ماژول بعدی

پس از اجرای نخست، برای ادامه فقط متن زیر را ارسال و `Mxx` را عوض کن:

```text
Specification مرجع و قرارداد مشترک را دوباره بررسی کن. اکنون فقط Mxx را end-to-end اجرا کن.
ابتدا وضعیت وابستگی‌هایش و Acceptance Checklist را نشان بده؛ سپس بدون Mock ناقص، migration تا UI/Admin و test را کامل کن.
تمام محدودیت‌های امنیت، پول IRR، UTC، RTL، RBAC، Audit، idempotency و عدم تماس واقعی با Provider را رعایت کن.
همه checkهای مرتبط را اجرا، docs/implementation-status.md را با شواهد به‌روزرسانی و بعد متوقف شو.
```

# چک‌لیست پذیرش مشترک هر ماژول

قبل از تأیید هر مرحله، وجود همه موارد زیر را بررسی کن:

- Requirementهای ماژول به Acceptance Criteria قابل تست تبدیل شده‌اند.
- Migration امن، constraint، index و rollback-test یا rollback strategy وجود دارد.
- منطق کسب‌وکار در Go است و UI آن را تکرار یا دور نمی‌زند.
- OpenAPI به‌روز و Client تولیدشده بدون drift است.
- Admin endpointها RBAC سروری و عملیات حساس Audit دارند.
- پول Integer IRR، زمان UTC و نمایش fa-IR/RTL مطابق M22 است.
- خطاها code پایدار، پیام مناسب و وضعیت HTTP صحیح دارند.
- عملیات retryable دارای idempotency و side-effect خارجی پشت Adapter است.
- Unit، integration، security و E2E مسیر بحرانی عبور کرده‌اند.
- loading/empty/error/success و mobile/keyboard accessibility پوشش داده شده‌اند.
- Secret/OTP/token/PII در log، response یا fixture نشت نکرده است.
- README/ADR/runbook و `docs/implementation-status.md` با واقعیت کد همگام‌اند.
- خروجی فقط ادعای انجام کار ندارد؛ command و نتیجه Test به‌عنوان Evidence ثبت شده است.

# ترتیب پیشنهادی اجرای عملی

این ترتیب برای کاهش دوباره‌کاری است؛ اگر Repository فعلی Dependency دیگری دارد، Antigravity باید دلیل تغییر را در Plan ثبت کند:

1. `M22` بومی‌سازی، سپس `M23` زیرساخت و `M21` Admin/RBAC.
2. `M19` رسانه، `M04` طبقه‌بندی و `M03` کاتالوگ.
3. `M05` موجودی، سپس `M01` ورود OTP و `M02` حساب مشتری.
4. `M06` سبد، `M13` تخفیف، `M09` ارسال، `M10` سفارش، `M07` Checkout و `M08` پرداخت.
5. `M11` اعلان، `M12` فاکتور، `M14` دیدگاه، `M15` محتوا، `M16` SEO و `M20` گزارش.
6. `M17` پشتیبانی و سپس `M18` چت‌بات.
7. `M24` Vira فقط بعد از مستندات رسمی، Sandbox و تأیید Source-of-truth.

# Definition of Project Done

پروژه زمانی «کامل» محسوب می‌شود که همه ماژول‌های لازم نه فقط صفحه ظاهری، بلکه migration، Backend، API، UI، Admin، RBAC/Audit، test و مستندات قابل اجرا داشته باشند؛ مسیر خرید با Providerهای Fake در CI از مشاهده محصول تا سفارش پرداخت‌شده عبور کند؛ Callback تکراری، رقابت موجودی، خطای ارسال، refund، دسترسی غیرمجاز و RTL موبایل تست شده باشند؛ و هیچ Plugin/Provider خارجی برای کارکرد پایه فروشگاه Single Point of Failure نباشد.
