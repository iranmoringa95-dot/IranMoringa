# مدیر سفارش مورینگانو — Android Native Java

اپلیکیشن native اندروید برای مدیریت سفارش‌های `moringano.ir`. این پروژه از ابتدا با Java ساخته شده و به اپ قدیمی Expo در `apps/mobile` وابسته نیست.

## امکانات

- ورود با OTP و نگهداری رمزگذاری‌شدهٔ نشست در Android Keystore
- داشبورد فروش و وضعیت سفارش‌ها
- فهرست، جست‌وجو و فیلتر سفارش‌ها
- جزئیات کامل، تماس/پیامک، تایم‌لاین، یادداشت و تغییر وضعیت
- ثبت سفارش دستی با سبد محصول و محاسبات صحیح `long` بر حسب IRR
- اعلان native سفارش جدید از SSE در foreground service، همراه reconnect و حذف اعلان تکراری
- تنظیم آدرس API و تست اتصال؛ HTTP فقط در build دیباگ مجاز است
- پشتیبانی کامل از RTL و رابط فارسی

## اجرای توسعه

پروژه را با Android Studio باز کنید، JDK 17 و Android SDK 35 را نصب کنید و ماژول `app` را اجرا کنید. آدرس پیش‌فرض API:

```text
https://moringano.ir/api/v1
```

برای emulator می‌توان در تنظیمات build دیباگ از `http://10.0.2.2:8080/api/v1` استفاده کرد.

## ساخت APK

با Gradle Wrapper همراه پروژه یا از داخل Android Studio:

```text
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug
.\gradlew.bat assembleRelease
```

خروجی‌ها در `app/build/outputs/apk/` قرار می‌گیرند. APK انتشار باید با keystore خصوصی مجموعه امضا شود؛ keystore نباید وارد Git شود.

## پیش‌نیاز تولید

Worker دامنه باید `API_ORIGIN` را به HTTPS origin بک‌اند Go متصل کند. اعلان SSE به endpoint زیر متصل می‌شود:

```text
GET /admin/orders/notifications/stream
```

نشست ادمین باید در سرور برای همهٔ endpointهای `/admin/*` احراز و مجوز `orders` بررسی شود. اطلاعات واقعی سفارش هیچ‌گاه به‌عنوان دادهٔ نمونه در اپ ذخیره نمی‌شود.

تا پیش از انجام این دو تنظیم production، APK فقط برای توسعه و اتصال به یک Go API مجاز قابل استفاده است؛ نبودن API_ORIGIN با پیام خطای واقعی نمایش داده می‌شود و اپ دادهٔ ساختگی نشان نمی‌دهد.
