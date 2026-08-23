package seeds

import (
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"moringalab/api/internal/content"
)

func PopulateDemoArticlesSeed(contentSvc *content.Service) error {
	// Guard against execution in production
	if os.Getenv("APP_ENV") == "production" {
		return fmt.Errorf("FATAL: Article seed runner is strictly prohibited in production environment (APP_ENV=production)")
	}

	// Idempotency check using Seed Registry
	if contentSvc.IsSeedExecuted(DemoArticleSeedKey) {
		return nil
	}

	// 1. Seed Categories
	catIntro := &content.ArticleCategory{
		ID:          uuid.MustParse("55555555-1111-1111-1111-111111111111"),
		NameFA:      "آشنایی با مورینگا",
		Slug:        "moringa-introduction",
		Description: "مقالات پایه برای معرفی گیاه مورینگا و خواص عمومی آن",
		SortOrder:   1,
	}
	catProductGuides := &content.ArticleCategory{
		ID:          uuid.MustParse("55555555-2222-1111-1111-111111111111"),
		NameFA:      "راهنمای محصولات",
		Slug:        "product-guides",
		Description: "معرفی تفکیکی محصولات مورینگا و نحوه انتخاب بهترین گزینه",
		SortOrder:   2,
	}
	catStorage := &content.ArticleCategory{
		ID:          uuid.MustParse("55555555-3333-1111-1111-111111111111"),
		NameFA:      "نگهداری",
		Slug:        "storage-guides",
		Description: "راهنمای نگهداری صحیح فرآورده‌های گیاهی در خانه",
		SortOrder:   3,
	}
	catHowToUse := &content.ArticleCategory{
		ID:          uuid.MustParse("55555555-4444-1111-1111-111111111111"),
		NameFA:      "آموزش استفاده",
		Slug:        "how-to-use",
		Description: "دستورالعمل‌ها و شیوه‌های تهیه دمنوش و مصرف روزانه",
		SortOrder:   4,
	}
	catBuyingGuides := &content.ArticleCategory{
		ID:          uuid.MustParse("55555555-5555-1111-1111-111111111111"),
		NameFA:      "راهنمای خرید",
		Slug:        "buying-guides",
		Description: "اصول انتخاب محصول ارگانیک، خواندن برچسب و بررسی وزن",
		SortOrder:   5,
	}
	catOrderingFAQ := &content.ArticleCategory{
		ID:          uuid.MustParse("55555555-6666-1111-1111-111111111111"),
		NameFA:      "راهنمای سفارش",
		Slug:        "ordering-faq",
		Description: "پاسخ به سوالات متداول درباره ثبت سفارش و ارسال پستی",
		SortOrder:   6,
	}

	contentSvc.AddCategory(catIntro)
	contentSvc.AddCategory(catProductGuides)
	contentSvc.AddCategory(catStorage)
	contentSvc.AddCategory(catHowToUse)
	contentSvc.AddCategory(catBuyingGuides)
	contentSvc.AddCategory(catOrderingFAQ)

	// Author
	authorID := uuid.MustParse("66666666-1111-1111-1111-111111111111")
	authorName := "تیم تحریریه مورینگا ایران"

	baseTime := time.Now().UTC().Add(-10 * 24 * time.Hour)

	disclaimerText := "این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست."

	// Demo Products Product IDs for related items
	pPowder100 := uuid.MustParse("33333333-0001-1111-1111-111111111111")
	pPowder250 := uuid.MustParse("33333333-0002-1111-1111-111111111111")
	pLeaf50 := uuid.MustParse("33333333-0003-1111-1111-111111111111")
	pTeaLemon := uuid.MustParse("33333333-0004-1111-1111-111111111111")
	pTeaCin := uuid.MustParse("33333333-0005-1111-1111-111111111111")
	pOil30 := uuid.MustParse("33333333-0007-1111-1111-111111111111")
	pSeed100 := uuid.MustParse("33333333-0008-1111-1111-111111111111")
	pPackStart := uuid.MustParse("33333333-0009-1111-1111-111111111111")

	// 10 Published Demo Articles
	articles := []*content.Article{
		// 1
		{
			ID:             uuid.MustParse("77777777-0001-1111-1111-111111111111"),
			CategoryID:     catIntro.ID,
			CategoryNameFA: catIntro.NameFA,
			CategorySlug:   catIntro.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "what-is-moringa",
			TitleFA:        "مورینگا چیست؟ آشنایی ساده با این گیاه",
			SummaryFA:      "معرفی جامع گیاه مورینگا اولیفرا، بخش‌های قابل مصرف، تاریخچه کشت و کاربردهای عمومی تغذیه‌ای آن در زندگی روزمره.",
			ContentFA: `گیاه مورینگا اولیفرا (Moringa oleifera) یکی از شناخته‌شده‌ترین گیاهان بومی مناطق گرمسیری و نیمه‌گرمسیری است که به دلیل تنوع کاربرد بخش‌های مختلف آن، در سراسر جهان مورد توجه قرار گرفته است. درخت مورینگا رشد سریعی دارد و تقریباً تمامی اجزای آن شامل برگ‌ها، دانه‌ها، ریشه و غلاف‌ها قابل استفاده یا فرآوری هستند.

## مشخصات ظاهری و تاریخچه کشت
درخت مورینگا دارای برگ‌های کوچک پردار و گل‌های معطر سفید‌رنگ است. این گیاه در مناطقی با آب‌وهوای گرم و خشک به‌خوبی رشد می‌کند و نیاز آبی بسیار اندکی دارد. از سده‌های گذشته، جوامع محلی در آسیای جنوبی و آفریقا از برگ‌های تازه و خشک‌شده این گیاه به عنوان مکمل تغذیه‌ای طبیعی در وعده‌های غذایی استفاده می‌کرده‌اند.

## بخش‌های قابل استفاده گیاه مورینگا
- **برگ مورینگا:** پرمصرف‌ترین بخش گیاه که معمولاً به‌صورت پودر برگ یا برگ خشک دم‌کرده مصرف می‌شود.
- **دانه مورینگا:** دانه‌های روغنی که برای عصاره‌گیری و استخراج روغن خالص استفاده می‌شوند.
- **گل و غلاف:** در برخی فرهنگ‌ها به عنوان سبزی در پخت‌وپز غذاهای محلی به‌کار می‌رود.

## کاربردهای عمومی و ارزش تغذیه‌ای
برگ‌های مورینگا حاوی انواع ویتامین‌ها شامل ویتامین C، ویتامین A و املاح معدنی نظیر کلسیم و پتاسیم هستند. اضافه کردن مقدار کمی از پودر مورینگا به اسموتی‌ها، ماست یا دمنوش‌های روزانه، راهکاری ساده برای بهره‌مندی از تنوع غذایی سالم است.

## جمع‌بندی
شناخت گیاه مورینگا و آشنایی با فرم‌های مختلف فرآوری آن، به شما در انتخاب آگاهانه محصولات طبیعی کمک می‌کند. مورینگا به عنوان یک مکمل گیاهی باارزش جایگاه ویژه‌ای در سبک زندگی سالم پیدا کرده است.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/what-is-moringa.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 4,
			SEOTitle:           "مورینگا چیست؟ معرفی کامل گیاه مورینگا اولیفرا و خواص عمومی",
			SEODescription:     "معرفی جامع گیاه مورینگا اولیفرا، اجزای مختلف درخت مورینگا و نحوه استفاده عمومی از پودر و برگ خشک آن.",
			PublishedAt:        &[]time.Time{baseTime.Add(1 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(1 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(1 * 24 * time.Hour),
			Tags:               []string{"مورینگا", "معرفی گیاه", "تغذیه سالم"},
		},
		// 2
		{
			ID:             uuid.MustParse("77777777-0002-1111-1111-111111111111"),
			CategoryID:     catProductGuides.ID,
			CategoryNameFA: catProductGuides.NameFA,
			CategorySlug:   catProductGuides.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "moringa-powder-vs-dried-leaves",
			TitleFA:        "تفاوت پودر مورینگا و برگ خشک مورینگا",
			SummaryFA:      "بررسی تفاوت‌های ظاهری، نحوه مصرف، شیوه نگهداری و انتخاب بین پودر خالص برگ و برگ خشک کامل مورینگا.",
			ContentFA: `هنگام تصمیم‌گیری برای خرید فرآورده‌های برگ مورینگا، با دو فرم اصلی مواجه می‌شوید: **پودر برگ مورینگا** و **برگ خشک کامل مورینگا**. اگرچه هر دو از یک گیاه سرچشمه می‌گیرند، اما تفاوت‌هایی در بافت، نحوه آماده‌سازی و نوع مصرف آن‌ها وجود دارد.

## ویژگی‌ها و کاربرد پودر برگ مورینگا
پودر مورینگا از آسیاب دقیق برگ‌های خشک‌شده و جداسازی ساقه حاصل می‌شود. 
- **بافت:** پودر نرم و یکدست سبز رنگ.
- **انحلال‌پذیری:** به‌راحتی در ترکیب با ماست، اسموتی، سوپ و آبمیوه مخلوط می‌شود.
- **سرعت مصرف:** نیازی به زمان دم‌کشیدن ندارد و آماده مصرف مستقیم است.

## ویژگی‌ها و کاربرد برگ خشک مورینگا
برگ خشک به‌صورت سالم و آسیاب‌نشده بسته‌بندی می‌شود و بافت ظاهری برگ را حفظ نموده است.
- **کاربرد اصلی:** عالی برای تهیه دمنوش گرم با صافی یا تی‌بگ.
- **شفافیت عصاره:** در زمان دم‌کشیدن، عصاره‌ای شفاف با رنگ سبز زیتونی روشن ایجاد می‌کند.
- **ماندگاری عطر:** عطر طبیعی برگ گیاه در این حالت پایداری بیشتری دارد.

## کدام‌یک برای شما مناسب‌تر است؟
اگر زمان کافی برای دم‌کردن دمنوش دارید و عطر ملایم گیاهی را می‌پسندید، برگ خشک انتخابی ایده‌آل است. اما اگر قصد دارید مکمل گیاهی را به وعده‌های صبحانه یا میان‌وعده سریع خود بیفزایید، پودر برگ مورینگا کاربری راحت‌تری برای شما خواهد داشت.

## جمع‌بندی
انتخاب بین پودر و برگ خشک کاملاً بستگی به سلیقه و عادت‌های تغذیه‌ای شما دارد. هر دو محصول در صورت نگهداری استاندارد، ارزش طبیعی خود را به بهترین شکل حفظ می‌کنند.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/moringa-powder-vs-dried-leaves.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 5,
			SEOTitle:           "مقایسه پودر مورینگا با برگ خشک - تفاوت‌ها و راهنمای انتخاب",
			SEODescription:     "بررسی تفاوت‌های پودر برگ مورینگا و برگ خشک کامل، شیوه استفاده در دمنوش یا غذا و انتخاب بهترین نوع.",
			PublishedAt:        &[]time.Time{baseTime.Add(2 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(2 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(2 * 24 * time.Hour),
			Tags:               []string{"پودر مورینگا", "برگ خشک", "راهنمای انتخاب"},
			RelatedProductIDs:  []uuid.UUID{pPowder100, pLeaf50},
		},
		// 3
		{
			ID:             uuid.MustParse("77777777-0003-1111-1111-111111111111"),
			CategoryID:     catStorage.ID,
			CategoryNameFA: catStorage.NameFA,
			CategorySlug:   catStorage.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "how-to-store-moringa-powder",
			TitleFA:        "راهنمای نگهداری صحیح پودر مورینگا",
			SummaryFA:      "نکات مهم کلیدی برای حفظ کیفیت، رنگ سبز طبیعی، عطر و طعم پودر مورینگا در برابر نور، رطوبت و اکسیژن.",
			ContentFA: `پودر برگ مورینگا ماده‌ای حساس به عوامل محیطی مانند نور مستقیم، اکسیژن و رطوبت است. برای حفظ عطر، رنگ سبز روشن و طعم طبیعی پودر مورینگا، رعایت چند نکته ساده اما حیاتی در خانه ضروری است.

## دشمنان اصلی کیفیت پودر مورینگا
1. **نور مستقیم خورشید:** تابش آفتاب باعث تغییر رنگ پودر از سبز زنده به قهوه‌ای کدر می‌شود.
2. **رطوبت هوا:** نفوذ رطوبت موجب کلوخه شدن پودر و افت ماندگاری آن می‌گردد.
3. **هوا و اکسیژن:** اکسیداسیون تدریجی، تازگی و عطر گیاهی پودر را کاهش می‌دهد.

## بهترین شرایط نگهداری در منزل
- **ظرف مناسب:** استفاده از ظروف کدر، قوطی‌های فلزی یا بسته‌بندی‌های زیپ‌کیپ آلومینیومی لایه‌دار.
- **محل نگهداری:** کابینت‌های بسته و خنک آشپزخانه دور از اجاق گاز و سماور.
- **قاشق خشک:** هنگام برداشتن پودر، حتماً از قاشق کاملاً خشک و تمیز استفاده کنید.

## نشانه‌های تغییر کیفیت پودر
تغییر رنگ شدید به زرد یا قهوه‌ای، ایجاد بوی ناخوشایند ماندگی یا چسبندگی ناشی از رطوبت، نشان‌دهنده شرایط نامناسب نگهداری است.

## جمع‌بندی
با بستن کامل درب بسته‌بندی پس از هر بار استفاده و نگهداری در جای خنک و تاریک، می‌توانید کیفیت پودر مورینگا را تا آخرین ذره آن مانند روز اول تازه نگه دارید.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/how-to-store-moringa-powder.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 4,
			SEOTitle:           "راهنمای نگهداری پودر مورینگا - اصول حفظ کیفیت و رنگ",
			SEODescription:     "روش‌های صحیح نگهداری پودر برگ مورینگا در خانه، محافظت در برابر نور و رطوبت و جلوگیری از کلوخه شدن.",
			PublishedAt:        &[]time.Time{baseTime.Add(3 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(3 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(3 * 24 * time.Hour),
			Tags:               []string{"نگهداری", "پودر مورینگا", "کیفیت محتوا"},
			RelatedProductIDs:  []uuid.UUID{pPowder250},
		},
		// 4
		{
			ID:             uuid.MustParse("77777777-0004-1111-1111-111111111111"),
			CategoryID:     catHowToUse.ID,
			CategoryNameFA: catHowToUse.NameFA,
			CategorySlug:   catHowToUse.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "how-to-prepare-moringa-tea",
			TitleFA:        "روش ساده آماده‌کردن دمنوش مورینگا",
			SummaryFA:      "دستورالعمل گام به گام و ساده دم‌آوری دمنوش مورینگا با ترکیب لیمو و دارچین جهت طعم‌دهی دلپذیر.",
			ContentFA: `دمنوش مورینگا نوشیدنی گیاهی مطبوع و فاقد کافئین است که می‌توانید آن را به عنوان یک میان‌وعده آرامش‌بخش در طول روز میل کنید. طعم طبیعی دمنوش مورینگا شبیه به چای سبز ملایم است و به‌راحتی با طعم‌دهنده‌های طبیعی مانند لیمو، عسل یا دارچین ترکیب می‌شود.

## روش اول: آماده‌سازی با دمنوش کیسه‌ای (تی‌بگ)
1. یک عدد تی‌بگ دمنوش مورینگا را درون فنجان قرار دهید.
2. آب جوش (حدود ۸۵ تا ۹۰ درجه سانتی‌گراد) را روی کیسه بریزید.
3. اجازه دهید فنجان به مدت ۵ الی ۷ دقیقه دم بکشد.
4. کیسه را خارج کرده و در صورت تمایل چند قطره آبلیموی تازه اضافه کنید.

## روش دوم: دم‌آوری با برگ خشک کامل
- ۱ قاشق مرباخوری برگ خشک مورینگا را در قوری قفل‌دار یا قوری دمنوش بریزید.
- ۲ لیوان آب جوش اضافه کرده و ۷ الی ۱۰ دقیقه زمان دهید تا عصاره برگ‌ها آزاد شود.

## پیشنهادهای جذاب برای طعم‌دهی
- **ترکیب با دارچین:** اضافه کردن یک تکه چوب دارچین طبع دمنوش را گرم و عطر آن را دلپذیرتر می‌کند.
- **ترکیب با لیمو و عسل:** طعم ترش لیمو در کنار شیرینی عسل، طعم گیاهی مورینگا را متعادل می‌سازد.

## جمع‌بندی
آماده‌کردن دمنوش مورینگا فرآیندی سریع و دلچسب است که به شما امکان می‌دهد دقایقی از روز خود را به نوشیدن یک دمنوش طبیعی و تازه‌دم اختصاص دهید.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/how-to-prepare-moringa-tea.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 4,
			SEOTitle:           "آموزش تهیه دمنوش مورینگا - دستور ساده دم‌آوری خانگی",
			SEODescription:     "روش ساده و گام‌به‌گام آماده‌سازی دمنوش گیاهی مورینگا با تی‌بگ یا برگ خشک و طرز ترکیب با لیمو و دارچین.",
			PublishedAt:        &[]time.Time{baseTime.Add(4 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(4 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(4 * 24 * time.Hour),
			Tags:               []string{"دمنوش", "آموزش دم‌آوری", "نوشیدنی گیاهی"},
			RelatedProductIDs:  []uuid.UUID{pTeaLemon, pTeaCin},
		},
		// 5
		{
			ID:             uuid.MustParse("77777777-0005-1111-1111-111111111111"),
			CategoryID:     catBuyingGuides.ID,
			CategoryNameFA: catBuyingGuides.NameFA,
			CategorySlug:   catBuyingGuides.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "moringa-buying-guide",
			TitleFA:        "هنگام خرید محصولات مورینگا به چه نکاتی توجه کنیم؟",
			SummaryFA:      "چک‌لیست کارآمد برای تشخیص پودر و روغن اصل مورینگا، بررسی بسته‌بندی، نشان‌های سلامت و اطلاعات تولیدکننده.",
			ContentFA: `با افزایش محبوبیت محصولات گیاهی ارگانیک، تنوع برندها و عرضه فرآورده‌های مورینگا در بازار افزایش یافته است. توجه به کیفیت اولیه محصول، به شما کمک می‌کند تا بهترین گزینه را برای مصرف خود انتخاب کنید.

## ۱. رنگ و بافت ظاهری محصول
- **پودر برگ:** باید رنگ سبز روشن یکدست داشته باشد. رنگ‌های متمایل به قهوه‌ای نشانه کهنگی یا خشک‌شدن تحت دمای بالا است.
- **روغن مورینگا:** روغن پرس سرد اصل طلایی‌رنگ و شفاف است و بوی ملایم دانه‌ای دارد.

## ۲. کیفیت بسته‌بندی
بسته‌بندی باید کاملاً غیرقابل نفوذ به نور و رطوبت باشد. کیسه‌های آلومینیومی زیپ‌دار یا قوطی‌های استاندارد فودگرید بهترین نوع ظرف برای پودر مورینگا محسوب می‌شوند.

## ۳. درج اطلاعات شفاف رو برچسب
برچسب استاندارد محصول باید حاوی مشخصات زیر باشد:
- نام دقیق علمی گیاه (Moringa oleifera)
- وزن خالص دقیق به گرم یا میلی‌لیتر
- تاریخ کامل تولید، انقضا و شماره سری ساخت (Batch Number)
- اطلاعات تماس تولیدکننده یا واحد بسته‌بندی

## ۴. عدم وجود ناخالصی و مواد افزودنی
محصولات خالص باید فاقد هرگونه رنگ مصنوعی، ماده نگهدارنده یا طعم‌دهنده شیمیایی باشند.

## جمع‌بندی
خرید از فروشگاه‌های معتبر و بررسی مشخصات روی بسته‌بندی، تضمین‌کننده دریافت محصولی تازه، خالص و استاندارد خواهد بود.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/moringa-buying-guide.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 5,
			SEOTitle:           "راهنمای خرید پودر و روغن مورینگا - چک‌لیست تشخیص کیفیت",
			SEODescription:     "نکات مهم و حیاتی در خرید آنلاین محصولات مورینگا، بررسی رنگ، نوع بسته‌بندی و اطلاعات برچسب بهداشتی.",
			PublishedAt:        &[]time.Time{baseTime.Add(5 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(5 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(5 * 24 * time.Hour),
			Tags:               []string{"راهنمای خرید", "تشخیص اصل", "کیفیت محصول"},
		},
		// 6
		{
			ID:             uuid.MustParse("77777777-0006-1111-1111-111111111111"),
			CategoryID:     catIntro.ID,
			CategoryNameFA: catIntro.NameFA,
			CategorySlug:   catIntro.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "moringa-seeds-guide",
			TitleFA:        "آشنایی با دانه مورینگا و شیوه نگهداری آن",
			SummaryFA:      "معرفی ویژگی‌های دانه مورینگا اولیفرا، روش نگهداری در شرایط خشکی و خنکی، و کاربردهای سنتی آن.",
			ContentFA: `دانه‌های درخت مورینگا اولیفرا درون غلاف‌های بلند گیاه رشد می‌کنند. این دانه‌ها دارای پوسته قهوه‌ای یا سیاه با سه باله کاغذی کوچک هستند. دانه مورینگا هم برای استخراج روغن و هم جهت باغبانی و کشت گیاه مورد توجه قرار دارد.

## ویژگی دانه‌های سالم و باکیفیت
دانه‌های مرغوب مورینگا دارای گردی متناسب، پوسته سالم و بدون ترک‌خوردگی هستند. اگر قصد کاشت این دانه‌ها را دارید، دانه‌های تازه دارای قوه نامیه بهتری برای جوانه‌زنی در خاک خنک و سبک هستند.

## روش نگهداری دانه‌های مورینگا
- **دما:** در دمای اتاق (بین ۱۵ تا ۲۲ درجه سانتی‌گراد) نگهداری شود.
- **محیط:** محیط نگهداری باید کاملاً خشک باشد؛ رطوبت زیاد باعث تحریک جوانه‌زنی ناخواسته یا کپک‌زدگی پوسته می‌شود.
- **ظرف نگهداری:** ظرف شیشه‌ای یا پلاستیکی دربسته با هوادهی مناسب.

## نکات عمومی کاربردی
دانه‌های مورینگا در برخی فرهنگ‌های آسیایی به‌صورت خیسانده‌شده برای تصفیه طبیعی آب در مقیاس کوچک سنتی استفاده می‌شده‌اند.

## جمع‌بندی
با نگهداری دانه‌های مورینگا در ظرف خشک و خنک، پایداری و کیفیت آن‌ها برای مدت طولانی حفظ می‌گردد.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/moringa-seeds-guide.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 4,
			SEOTitle:           "معرفی دانه مورینگا - مشخصات دانه‌های ارگانیک و نحوه نگهداری",
			SEODescription:     "بررسی ویژگی‌های ظاهری دانه مورینگا اولیفرا، شرایط نگهداری خانگی و اطلاعات عمومی برای کاشت گیاه.",
			PublishedAt:        &[]time.Time{baseTime.Add(6 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(6 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(6 * 24 * time.Hour),
			Tags:               []string{"دانه مورینگا", "کاشت", "نگهداری دانه"},
			RelatedProductIDs:  []uuid.UUID{pSeed100},
		},
		// 7
		{
			ID:             uuid.MustParse("77777777-0007-1111-1111-111111111111"),
			CategoryID:     catProductGuides.ID,
			CategoryNameFA: catProductGuides.NameFA,
			CategorySlug:   catProductGuides.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "moringa-oil-storage-guide",
			TitleFA:        "روغن مورینگا چیست و چگونه نگهداری می‌شود؟",
			SummaryFA:      "آشنایی با فرآیند عصاره‌گیری پرس سرد دانه مورینگا و شرایط ایده‌آل نگهداری ظرف شیشه‌ای آن دور از تابش نور.",
			ContentFA: `روغن مورینگا (Moringa Oil) از فشردن دانه‌های مغذی درخت مورینگا به روش مکانیکی پرس سرد (Cold Press) استحصال می‌شود. این روغن به دلیل داشتن اسیدهای چرب پایدار (مانند اسید اولئیک) مقاومت بالایی در برابر اکسیداسیون دارد.

## ویژگی‌های ظاهری روغن پرس سرد اصل
- **رنگ:** طلایی شفاف روشن.
- **بافت:** سبک، غیرچسبنده و با قابلیت جذب مناسب روی پوست.
- **عطر:** دارای بوی طبیعی و ملایم شبیه به مغزهای گیاهی خام.

## نکات نگهداری برای حفظ ماندگاری
اگرچه روغن مورینگا ثبات پذیری خوبی دارد، رعایت موارد زیر ماندگاری آن را افزایش می‌دهد:
1. **بطری شیشه‌ای تیره:** نگهداری در بطری قطره‌چکانی تیره (قهوه‌ای یا آبی) جهت جلوگیری از نفوذ نور.
2. **دمای مناسب:** نگهداری در دمای محیط دور از وسایل گرمایشی. در دمای بسیار پایین ممکن است روغن به‌صورت طبیعی کمی کدر شود که با بازگشت به دمای اتاق برطرف می‌گردد.
3. **تست حساسیت:** توصیه می‌شود قبل از استفاده از هر روغن گیاهی جدید روی پوست، مقدار کمی از آن را روی قسمت داخلی ساعد تست کنید.

## جمع‌بندی
روغن مورینگا یک روغن گیاهی باارزش و ماندگار است که بسته‌بندی استاندارد آن نقش مهمی در حفظ طراوت اولیه آن ایفا می‌کند.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/moringa-oil-storage-guide.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 5,
			SEOTitle:           "روغن مورینگا پرس سرد - روش نگهداری و ویژگی‌های روغن اصل",
			SEODescription:     "آشنایی با روغن دانه مورینگا پرس سرد، ویژگی‌های بافتی و ظاهری، و اصول نگهداری در ظرف شیشه‌ای تیره.",
			PublishedAt:        &[]time.Time{baseTime.Add(7 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(7 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(7 * 24 * time.Hour),
			Tags:               []string{"روغن مورینگا", "پرس سرد", "مراقبت گیاهی"},
			RelatedProductIDs:  []uuid.UUID{pOil30},
		},
		// 8
		{
			ID:             uuid.MustParse("77777777-0008-1111-1111-111111111111"),
			CategoryID:     catBuyingGuides.ID,
			CategoryNameFA: catBuyingGuides.NameFA,
			CategorySlug:   catBuyingGuides.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "read-moringa-product-labels",
			TitleFA:        "راهنمای خواندن برچسب محصولات مورینگا",
			SummaryFA:      "آموزش نحوه‌ تحلیل جدول ارزش غذایی، وزن خالص، تاریخ تولید و انقضا، شماره پروانه بهداشتی و هشدارهای عمومی.",
			ContentFA: `برچسب یا لیبل روی بسته‌بندی هر محصول غذایی و گیاهی، شناسنامه رسمی آن محسوب می‌شود. خواندن دقیق اطلاعات درج‌شده روی برچسب محصولات مورینگا به شما کمک می‌کند تا خریدی آگاهانه و مطمئن داشته باشید.

## اجزای اصلی روی برچسب محصولات استاندارد
1. **عنوان دقیق محصول و وزن خالص:** وزن ماده داخل بسته (Net Weight) بدون احتساب ظرف.
2. **جدول اجزا و ترکیبات:** در محصولات خالص باید صرفاً نام ۱۰۰٪ گیاه مورینگا ذکر شده باشد.
3. **تاریخ تولید، انقضا و سری ساخت:** نشان‌دهنده تازگی و قابلیت پیگیری خط تولید.
4. **شرایط نگهداری توصیه شده:** مانند نگهداری در جای خشک و خنک.
5. **تذکرات و هشدارهای مصرف:** توصیه‌های عمومی مانند عدم جایگزینی با دارو یا مشورت با پزشک در دوران بارداری.

## اهمیت پروانه بهداشتی و سیب سلامت
وجود شماره مجوز سازمان غذا و دارو یا سازمان‌های نظارتی مربوطه، نشان‌دهنده رعایت حداقل استانداردهای بهداشتی در مراحل فرآوری و بسته‌بندی محصول است.

## جمع‌بندی
مطالعه برچسب محصولات یک عادت مفید در خرید محصولات سلامت‌محور است که شفافیت و اطمینان خاطر بیشتری را برای مصرف‌کننده ایجاد می‌کند.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/read-moringa-product-labels.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 4,
			SEOTitle:           "آموزش خواندن برچسب محصولات مورینگا - بررسی اطلاعات بهداشتی",
			SEODescription:     "راهنمای کامل بررسی برچسب بسته‌بندی محصولات مورینگا، وزن خالص، مجوز بهداشتی و هشدارهای درج‌شده.",
			PublishedAt:        &[]time.Time{baseTime.Add(8 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(8 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(8 * 24 * time.Hour),
			Tags:               []string{"برچسب محصول", "راهنمای خرید", "اطلاعات بهداشتی"},
		},
		// 9
		{
			ID:             uuid.MustParse("77777777-0009-1111-1111-111111111111"),
			CategoryID:     catBuyingGuides.ID,
			CategoryNameFA: catBuyingGuides.NameFA,
			CategorySlug:   catBuyingGuides.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "net-weight-vs-shipping-weight",
			TitleFA:        "تفاوت وزن خالص و وزن ارسال در فروشگاه آنلاین",
			SummaryFA:      "توضیح شفاف علت تفاوت وزن ماده داخل بسته (وزن خالص) و وزن نهایی مرسوله پستی شامل جعبه و ضربه‌گیر.",
			ContentFA: `یکی از پرسش‌های متداول خریداران در فروشگاه‌های اینترنتی، تفاوت عدد ثبت‌شده به عنوان **وزن خالص** و **وزن ارسال (پستی)** در جزئیات محصولات است. در این مطلب علت این اختلاف وزن را به‌صورت شفاف توضیح می‌دهیم.

## تعریف وزن خالص (Net Weight)
وزن خالص، دقیقا وزن ماده اصلی داخل محصول (مثلاً ۱۰۰ گرم پودر برگ مورینگا) است. این وزن معیاری است که قیمت پایه محصول بر اساس آن تعیین می‌شود.

## تعریف وزن ارسال (Shipping Weight)
وزن ارسال شامل مجموع وزن موارد زیر است:
1. ماده اصلی محصول (وزن خالص)
2. ظرف یا کیسه بسته‌بندی اولیه‌ (مانند شیشه ۳۰ میل یا پاکت زیپ‌دار)
3. جعبه کارتنی پستی محافظ
4. ملزومات ایمنی مانند نایلو‌ن‌های حباب‌دار ضربه‌گیر و برچسب پستی

## چرا وزن ارسال اهمیت دارد؟
شرکت‌های حمل‌ونقل و شرکت ملی پست، هزینه خدمات ارسال را بر اساس وزن ناخالص کل مرسوله پستی محاسه‌ می‌نمایند. ارائه دقیق وزن ارسال باعث محاسبه درست و شفاف هزینه پست هنگام ثبت سفارش آنلاین می‌شود.

## جمع‌بندی
آگاهی از تفاوت وزن خالص و وزن ارسال، شفافیت در سفارش‌دهی را افزایش داده و از هرگونه سردرگمی در محاسبه هزینه‌های پستی جلوگیری می‌کند.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/net-weight-vs-shipping-weight.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 4,
			SEOTitle:           "تفاوت وزن خالص و وزن ارسال پستی - راهنمای سفارش آنلاین",
			SEODescription:     "توضیح شفاف تفاوت وزن ماده داخل محصول با وزن کل مرسوله کارتنی و محاسبه هزینه ارسال پستی.",
			PublishedAt:        &[]time.Time{baseTime.Add(9 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(9 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(9 * 24 * time.Hour),
			Tags:               []string{"وزن خالص", "وزن ارسال", "شفافیت سفارش"},
			RelatedProductIDs:  []uuid.UUID{pPackStart},
		},
		// 10
		{
			ID:             uuid.MustParse("77777777-0010-1111-1111-111111111111"),
			CategoryID:     catOrderingFAQ.ID,
			CategoryNameFA: catOrderingFAQ.NameFA,
			CategorySlug:   catOrderingFAQ.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   authorName,
			Slug:           "moringa-order-faq",
			TitleFA:        "پرسش‌های متداول درباره سفارش محصولات مورینگا",
			SummaryFA:      "پاسخ جامع به سوالات رایج خریداران درباره روش‌های پرداخت آنلاین، زمان‌بندی ارسال پستی و نحوه پیگیری سفارش.",
			ContentFA: `در این راهنما به متداول‌ترین پرسش‌های خریداران محترم درباره نحوه ثبت سفارش، پرداخت امن، شیوه‌های تحویل و پیگیری مرسولات در فروشگاه مورینگا پاسخ داده شده است.

## ۱. نحوه ثبت سفارش و پرداخت آنلاین
ثبت سفارش در فروشگاه به‌صورت آنلاین از طریق درگاه‌های رسمی شتاب صورت می‌پذیرد. کلیه قیمت‌ها به ریال/تومان به‌صورت مشخص درج گردیده و بلافاصله پس از پرداخت، کد پیگیری اختصاصی سفارش صادر می‌شود.

## ۲. زمان‌بندی پردازش و ارسال پستی
- **پردازش و بسته‌بندی:** سفارشات در اولین روز کاری پس از ثبت نهایی، بسته‌بندی و تحویل پست می‌شوند.
- **شیوه ارسال:** کلیه مرسولات با **پست پیشتاز** به سراسر کشور ارسال می‌گردند.
- **زمان تحویل:** معمولاً بین ۲ تا ۴ روز کاری متناسب با مسافت مقصد طول می‌کشد.

## ۳. پیگیری وضعیت سفارش
پس از تحویل بسته به پست، کد رهگیری ۲۴ رقمی پستی از طریق پیامک برای کاربر ارسال شده و در بخش حساب کاربری نیز قابل مشاهده است.

## ۴. پشتیبانی و پاسخگویی
تیم پشتیبانی فروشگاه از طریق کانال‌های ارتباطی سایت در ساعات کاری آماده پاسخگویی و راهنمایی خریداران عزیز می‌باشد.

## جمع‌بندی
فرآیند ثبت و تحویل سفارش در مورینگا با هدف ایجاد تجربه‌ای آسان، سریع و امن برای شما طراحی شده است.

` + disclaimerText,
			CoverImageURL:      "/images/demo/articles/moringa-order-faq.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 5,
			SEOTitle:           "پرسش‌های متداول سفارش آنلاین مورینگا - ارسال پستی و پیگیری",
			SEODescription:     "پاسخ به سوالات متداول ثبت سفارش محصولات مورینگا، شیوه‌های پرداخت شتاب، زمان‌بندی ارسال با پست پیشتاز.",
			PublishedAt:        &[]time.Time{baseTime.Add(10 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(10 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(10 * 24 * time.Hour),
			Tags:               []string{"پرسش متداول", "ارسال پستی", "راهنمای سفارش"},
		},
		// 11
		{
			ID:             uuid.MustParse("77777777-0011-1111-1111-111111111111"),
			CategoryID:     catIntro.ID,
			CategoryNameFA: catIntro.NameFA,
			CategorySlug:   catIntro.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   "دکتر سارا احمدی (داروساز و متخصص فیتوتراپی)",
			ReviewerNameFA: &[]string{"دکتر محمد حسینی (متخصص تغذیه)"}[0],
			Slug:           "moringa-vs-spirulina-comparison",
			TitleFA:        "مقایسه جامع مورینگا و اسپیرولینا؛ تفاوت‌ها، ارزش غذایی، لاغری و عضله‌سازی | کدام بهتر است؟",
			SummaryFA:      "تحلیل بیوشیمیایی و تغذیه‌ای تطبیقی پودر مورینگا و جلبک اسپیرولینا؛ مقایسه درصد پروتئین، آهن، ویتامین C، آنتی‌اکسیدان‌ها، اثر بر چربی‌سوزی، بدنسازی، طبع طب سنتی و شیوه مصرف همزمان.",
			ContentFA: `در دنیای تغذیه مدرن و گرایش روزافزون به گیاهان دارویی ارگانیک و سوپرفودهای طبیعی، پودر برگ مورینگا و جلبک اسپیرولینا بیش از هر مکمل دیگری مورد توجه قرار گرفته‌اند.

## ۱. مقایسه ترکیبات مغذی
- **پروتئین:** اسپیرولینا با حدود ۶۰٪ پروتئین متراکم‌تر است، در حالی که مورینگا ۳۰٪ پروتئین به همراه آمینواسیدهای کامل دارد.
- **ویتامین C و کلسیم:** مورینگا با برتری چشمگیر، تا ۱۷ برابر شیر کلسیم و ویتامین C بسیار بالایی دارد.
- **آهن:** هر دو منبع غنی آهن طبیعی هستند؛ اما ویتامین C مورینگا جذب آهن آن را تسریع می‌کند.

## ۲. کدام برای لاغری بهتر است؟
مورینگا به دلیل حضور ایزوتیوسیانات‌ها و اسید کلروژنیک حساسیت به انسولین را ارتقا داده و سوخت‌وساز چربی را افزایش می‌دهد.

` + disclaimerText,
			CoverImageURL:      "/images/articles/moringa-antioxidants-orac.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 10,
			SEOTitle:           "مقایسه مورینگا و اسپیرولینا؛ ارزش غذایی، لاغری، پروتئین | کدام بهتر است؟",
			SEODescription:     "مقایسه علمی پودر مورینگا و جلبک اسپیرولینا؛ بررسی درصد پروتئین، ویتامین C، آهن، لاغری، بدنسازی و طبع در طب سنتی.",
			PublishedAt:        &[]time.Time{baseTime.Add(11 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(11 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(11 * 24 * time.Hour),
			Tags:               []string{"مقایسه_مورینگا_و_اسپیرولینا", "اسپیرولینا_یا_مورینگا", "سوپرفود", "پروتئین_گیاهی", "لاغری_و_چربی_سوزی", "گیاهان_دارویی"},
			RelatedProductIDs:  []uuid.UUID{pPowder100, pPowder250},
		},
		// 12
		{
			ID:             uuid.MustParse("77777777-0012-1111-1111-111111111111"),
			CategoryID:     catIntro.ID,
			CategoryNameFA: catIntro.NameFA,
			CategorySlug:   catIntro.Slug,
			AuthorID:       authorID,
			AuthorNameFA:   "مهندس محمدرضا فرهمند (کارشناس ارشد کشت گیاهان دارویی)",
			ReviewerNameFA: &[]string{"دکتر سارا احمدی (پژوهشگر طب سنتی و نوین)"}[0],
			Slug:           "top-medicinal-plants-superfoods-guide",
			TitleFA:        "راهنمای جامع برترین گیاهان دارویی و سوپرفودهای جهان در کنار مورینگا (آشواگاندا، ماچا، جینسینگ، ماکا و کلرلا)",
			SummaryFA:      "معرفی جامع قدرتمندترین گیاهان دارویی و سوپرفودهای ارگانیک جهان؛ خواص مورینگا در کنار آشواگاندا، جینسینگ، پودر ماچا، ماکا و کلرلا برای افزایش پایدار انرژی، تعادل هورمونی، کاهش استرس و جایگزینی مکمل‌های شیمیایی.",
			ContentFA: `با افزایش فشارهای روانی و آلاینده‌های محیطی، استفاده از گیاهان دارویی اصیل، سوپرفودها و آداپتوژن‌ها اهمیت ویژه‌ای یافته است.

## گیاهان شاخص در کنار مورینگا
1. **آشواگاندا:** مهار ترشح کورتیزول و کاهش اضطراب
2. **چای ماچا:** آنتی‌اکسیدان EGCG و افزایش تمرکز بدون افت قند
3. **جینسینگ کره‌ای:** تقویت قوای بدنی و سیستم ایمنی
4. **ریشه ماکا:** تعادل هورمونی و استقامت
5. **کلرلا:** سم‌زدایی و دفع فلزات سنگین

` + disclaimerText,
			CoverImageURL:      "/images/articles/moringa-daily-wellness-routine.jpg",
			Status:             content.StatusPublished,
			Version:            1,
			DisclaimersFA:      disclaimerText,
			ReadingTimeMinutes: 12,
			SEOTitle:           "برترین گیاهان دارویی و سوپرفودهای جهان در کنار مورینگا (آشواگاندا، ماچا، جینسینگ)",
			SEODescription:     "راهنمای جامع شناخت سوپرفودها و آداپتوژن‌های برتر دنیا؛ خواص درمانی مورینگا، آشواگاندا، ماچا، جینسینگ و ماکا.",
			PublishedAt:        &[]time.Time{baseTime.Add(12 * 24 * time.Hour)}[0],
			CreatedAt:          baseTime.Add(12 * 24 * time.Hour),
			UpdatedAt:          baseTime.Add(12 * 24 * time.Hour),
			Tags:               []string{"گیاهان_دارویی", "سوپرفودهای_جهان", "آشواگاندا", "مورینگا_و_جینسینگ", "چای_ماچا", "آداپتوژن"},
			RelatedProductIDs:  []uuid.UUID{pPowder100, pLeaf50, pTeaLemon},
		},
	}

	for _, a := range articles {
		if err := contentSvc.AddArticleDirect(a); err != nil {
			return fmt.Errorf("failed to seed article %s: %w", a.Slug, err)
		}
	}

	// Register completion in Demo Seed Registry
	contentSvc.RecordSeedExecution(DemoArticleSeedKey, 1, "content_article", uuid.Nil)
	return nil
}
