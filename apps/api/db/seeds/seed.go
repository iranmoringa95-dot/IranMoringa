package seeds

import (
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
)

const DemoProductSeedKey = "demo_products_v1"

func PopulateSeedData(catSvc *catalog.Service, contentSvc *content.Service) error {
	// Guard against execution in production
	if os.Getenv("APP_ENV") == "production" {
		return fmt.Errorf("FATAL: Seed runner is strictly prohibited in production environment (APP_ENV=production)")
	}

	// Idempotency check using Seed Registry
	if catSvc.IsSeedExecuted(DemoProductSeedKey) {
		return nil
	}

	// 1. Seed Brand: مورینگا ایران
	brandMoringa := &catalog.Brand{
		ID:          uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		NameFA:      "مورینگا ایران",
		Slug:        "moringa-iran",
		Description: "برند رسمی تولید و فرآوری محصولات ارگانیک درخت مورینگا در ایران",
	}
	catSvc.AddBrand(brandMoringa)

	// 2. Seed Categories
	catPowderLeaves := &catalog.Category{
		ID:        uuid.MustParse("22222222-1111-1111-1111-111111111111"),
		NameFA:    "پودر و برگ",
		Slug:      "powders-and-leaves",
		SortOrder: 1,
	}
	catTeas := &catalog.Category{
		ID:        uuid.MustParse("22222222-2222-1111-1111-111111111111"),
		NameFA:    "دمنوش",
		Slug:      "herbal-teas",
		SortOrder: 2,
	}
	catCapsules := &catalog.Category{
		ID:        uuid.MustParse("22222222-3333-1111-1111-111111111111"),
		NameFA:    "کپسول",
		Slug:      "capsules",
		SortOrder: 3,
	}
	catOils := &catalog.Category{
		ID:        uuid.MustParse("22222222-4444-1111-1111-111111111111"),
		NameFA:    "روغن",
		Slug:      "oils",
		SortOrder: 4,
	}
	catSeeds := &catalog.Category{
		ID:        uuid.MustParse("22222222-5555-1111-1111-111111111111"),
		NameFA:    "دانه",
		Slug:      "seeds",
		SortOrder: 5,
	}
	catBundles := &catalog.Category{
		ID:        uuid.MustParse("22222222-6666-1111-1111-111111111111"),
		NameFA:    "بسته‌ها",
		Slug:      "bundles",
		SortOrder: 6,
	}

	catSvc.AddCategory(catPowderLeaves)
	catSvc.AddCategory(catTeas)
	catSvc.AddCategory(catCapsules)
	catSvc.AddCategory(catOils)
	catSvc.AddCategory(catSeeds)
	catSvc.AddCategory(catBundles)

	now := time.Now()

	// Helper function for compare at price
	int64Ptr := func(v int64) *int64 { return &v }
	strPtr := func(s string) *string { return &s }

	// Medical Disclaimer text
	disclaimerText := "تذکر مهم: این محصول جایگزین توصیه پزشک یا درمان دارویی نیست و صرفاً مکمل مکمل غذایی ارگانیک می‌باشد."

	// Exactly 10 Published Demo Products
	demoProducts := []*catalog.Product{
		{
			ID:                 uuid.MustParse("33333333-0001-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-leaf-powder-100g",
			TitleFA:            "پودر برگ مورینگا ۱۰۰ گرمی",
			ShortDescriptionFA: strPtr("پودر خالص و ارگانیک برگ درخت مورینگا، سرشار از آنتی‌اکسیدان، ویتامین و اسیدهای آمینه ضروری برای تقویت عمومی بدن."),
			FullDescriptionFA:  strPtr("پودر برگ مورینگا ۱۰۰ گرمی از برگ‌های تازه و دست‌چین شده درخت مورینگا اولیفرا تهیه گردیده است. این محصول با فرایند خشک‌سازی استاندارد، کلیه املاح معدنی و ویتامین‌های گیاهی خود را حفظ نموده است. بسته‌بندی زیپ‌کیپ آلومینیومی کیفیت و ماندگاری پودر را حفظ می‌کند.\n\nروش نگهداری: در جای خشک، خنک و دور از تابش مستقیم نور خورشید نگهداری شود.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			UsageInstructionsFA: strPtr("روزانه ۱ تا ۲ قاشق چای‌خوری همراه آب، آبمیوه، ماست یا اسموتی مصرف گردد."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و خنک نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید پودر برگ مورینگا ۱۰۰ گرمی اصل - مورینگا ایران"),
			SEODescription:      strPtr("خرید اینترنتی پودر خالص برگ مورینگا ۱۰۰ گرمی با بالاترین کیفیت، بدون مواد افزودنی و ۱۰۰٪ ارگانیک."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     40,
			Categories:         []catalog.Category{*catPowderLeaves},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-leaf-powder-100g.png",
					AltFA:     "تصویر پودر برگ مورینگا ۱۰۰ گرمی",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0001-1111-1111-111111111111"),
					SKU:                 "MIR-PWD-100",
					TitleFA:             "بسته‌بندی ۱۰۰ گرمی",
					PriceIRR:            2450000,
					CompareAtPriceIRR:   int64Ptr(2750000),
					NetWeightGrams:      100,
					ShippingWeightGrams: 130,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0002-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-leaf-powder-250g",
			TitleFA:            "پودر برگ مورینگا ۲۵۰ گرمی",
			ShortDescriptionFA: strPtr("بسته‌بندی اقتصادی پودر خالص برگ مورینگا ۲۵۰ گرمی مناسب برای مصرف مداوم خانوار."),
			FullDescriptionFA:  strPtr("پودر برگ مورینگا ۲۵۰ گرمی بسته‌بندی خانوادگی و باصرفه برای علاقه‌مندان به سبک زندگی سالم است. این محصول با داشتن بیش از ۹۲ ماده مغذی، ۴۶ نوع آنتی‌اکسیدان و ۱۸ اسید آمینه، مکمل غذایی فوق‌العاده‌ای است.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			UsageInstructionsFA: strPtr("روزانه ۱ الی ۲ قاشق غذاخوری در ترکیب نوشیدنی یا سوپ میل شود."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در ظرف دربسته و دور از رطوبت نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید پودر برگ مورینگا ۲۵۰ گرمی - مورینگا ایران"),
			SEODescription:      strPtr("فروش آنلاین پودر برگ مورینگا ۲۵۰ گرمی با بسته بندی استاندارد و تخفیف ویژه."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     30,
			Categories:         []catalog.Category{*catPowderLeaves},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-leaf-powder-250g.png",
					AltFA:     "تصویر پودر برگ مورینگا ۲۵۰ گرمی",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0002-1111-1111-111111111111"),
					SKU:                 "MIR-PWD-250",
					TitleFA:             "بسته‌بندی ۲۵۰ گرمی",
					PriceIRR:            5450000,
					CompareAtPriceIRR:   int64Ptr(5950000),
					NetWeightGrams:      250,
					ShippingWeightGrams: 290,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0003-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "dried-moringa-leaves-50g",
			TitleFA:            "برگ خشک مورینگا ۵۰ گرمی",
			ShortDescriptionFA: strPtr("برگ‌های خشک کامل و سالم مورینگا مناسب جهت دم‌آوری دمنوش و اضافه کردن به غذا."),
			FullDescriptionFA:  strPtr("برگ خشک مورینگا ۵۰ گرمی به روش طبیعی سایه‌خشک آماده گردیده است. این محصول بافت سالم برگ را حفظ نموده و عطری ملایم و مطبوع دارد.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         false,
			UsageInstructionsFA: strPtr("یک قاشق مرباخوری برگ خشک را در ۲ لیوان آب جوش دم کنید."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و تاریک نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید برگ خشک مورینگا ۵۰ گرمی ارگانیک"),
			SEODescription:      strPtr("فروش برگ خشک مورینگا ۵۰ گرمی خالص مناسب برای دمنوش‌های گیاهی و سلامتی."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     35,
			Categories:         []catalog.Category{*catPowderLeaves},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/dried-moringa-leaves-50g.png",
					AltFA:     "تصویر برگ خشک مورینگا ۵۰ گرمی",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0003-1111-1111-111111111111"),
					SKU:                 "MIR-LEAF-050",
					TitleFA:             "بسته ۵۰ گرمی",
					PriceIRR:            1650000,
					CompareAtPriceIRR:   nil,
					NetWeightGrams:      50,
					ShippingWeightGrams: 80,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0004-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-lemon-tea-20",
			TitleFA:            "دمنوش مورینگا و لیمو ۲۰ عددی",
			ShortDescriptionFA: strPtr("ترکیب باطراوت برگ مورینگا و لیموعمانی طبیعی در کیسه‌های نیلونی تجدیدپذیر."),
			FullDescriptionFA:  strPtr("دمنوش ترکیب مورینگا و لیمو ۲۰ عددی، حس نشاط و شادابی را همراه با خواص طبیعی مورینگا به شما هدیه می‌دهد. این دمنوش فاقد کافئین بوده و گزینه‌ای عالی برای عصرانه است.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			UsageInstructionsFA: strPtr("یک تی‌بگ را در یک فنجان آب جوش قرار داده و ۵ الی ۷ دقیقه بگذارید دم بکشد."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و خنک نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("دمنوش مورینگا و لیمو ۲۰ عددی کیسه‌ای"),
			SEODescription:      strPtr("خرید آنلاین دمنوش گیاهی مورینگا و لیمو ۲۰ عددی با طعم عالی و حس طراوت."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     25,
			Categories:         []catalog.Category{*catTeas},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-lemon-tea-20.png",
					AltFA:     "تصویر دمنوش مورینگا و لیمو ۲۰ عددی",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0004-1111-1111-111111111111"),
					SKU:                 "MIR-TEA-LEM-20",
					TitleFA:             "جعبه ۲۰ عددی",
					PriceIRR:            2850000,
					CompareAtPriceIRR:   int64Ptr(3100000),
					NetWeightGrams:      40,
					ShippingWeightGrams: 90,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0005-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-cinnamon-tea-20",
			TitleFA:            "دمنوش مورینگا و دارچین ۲۰ عددی",
			ShortDescriptionFA: strPtr("دمنوش گرم‌آفرین ترکیب برگ مورینگا و دارچین قلمی سیلان جهت ایجاد آرامش و صمیمیت."),
			FullDescriptionFA:  strPtr("دمنوش مورینگا و دارچین ۲۰ عددی با طبع گرم و مطبوع خود، انتخابی ایده‌آل برای روزهای سرد سال است. این دمنوش بدون قند افزوده و رنگ مصنوعی تولید شده است.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         false,
			UsageInstructionsFA: strPtr("یک تی‌بگ را در آب جوش قرار داده و ۷ دقیقه صبر کنید."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید دمنوش مورینگا و دارچین ۲۰ عددی"),
			SEODescription:      strPtr("دمنوش گرم مورینگا و دارچین ۲۰ عددی با عطر دلنشین و طعم اصیل دارچین سیلان."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     25,
			Categories:         []catalog.Category{*catTeas},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-cinnamon-tea-20.png",
					AltFA:     "تصویر دمنوش مورینگا و دارچین ۲۰ عددی",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0005-1111-1111-111111111111"),
					SKU:                 "MIR-TEA-CIN-20",
					TitleFA:             "جعبه ۲۰ عددی",
					PriceIRR:            2950000,
					CompareAtPriceIRR:   int64Ptr(3200000),
					NetWeightGrams:      40,
					ShippingWeightGrams: 90,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0006-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-capsules-60",
			TitleFA:            "کپسول مورینگا ۶۰ عددی",
			ShortDescriptionFA: strPtr("کپسول‌های گیاهی حاوی پودر خالص برگ مورینگا، روشی آسان و سریع برای مصرف روزانه."),
			FullDescriptionFA:  strPtr("کپسول مورینگا ۶۰ عددی گزینه‌ای عالی برای افرادی است که طعم پودر مورینگا را در نوشیدنی نمی‌پسندند. پوکه کپسول‌ها ۱۰۰٪ گیاهی (سلولزی) بوده و سریع هضم می‌شوند.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			UsageInstructionsFA: strPtr("روزانه ۲ عدد کپسول همراه یک لیوان آب میل شود."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در مکان خشک و خنک و دور از دسترس کودکان نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید کپسول مورینگا ۶۰ عددی گیاهی اصل"),
			SEODescription:      strPtr("خرید اینترنتی کپسول مورینگا ۶۰ عددی ارگانیک با کیفیت تضمین شده و پوکه گیاهی."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     20,
			Categories:         []catalog.Category{*catCapsules},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-capsules-60.png",
					AltFA:     "تصویر کپسول مورینگا ۶۰ عددی",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0006-1111-1111-111111111111"),
					SKU:                 "MIR-CAP-060",
					TitleFA:             "قوطی ۶۰ عددی",
					PriceIRR:            4950000,
					CompareAtPriceIRR:   int64Ptr(5400000),
					NetWeightGrams:      45,
					ShippingWeightGrams: 85,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0007-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-oil-30ml",
			TitleFA:            "روغن مورینگا ۳۰ میلی‌لیتری",
			ShortDescriptionFA: strPtr("روغن خالص دانه مورینگا استخراج شده به روش پرس سرد، مناسب برای مراقبت پوست و مو."),
			FullDescriptionFA:  strPtr("روغن مورینگا ۳۰ میلی‌لیتری از دانه‌های مرغوب درخت مورینگا اولیفرا با فناوری پرس سرد تهیه شده است. این روغن سبک جذب سریعی داشته و رطوبت پوست را حفظ می‌کند.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			UsageInstructionsFA: strPtr("چند قطره از روغن را روی پوست تمیز یا انتهای ساقه مو ماساژ دهید."),
			WarningsFA:          strPtr(disclaimerText + " قبل از مصرف تست حساسیت پوستی روی ساعد انجام شود."),
			StorageConditionsFA: strPtr("در جای خشک، تاریک و خنک نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید روغن مورینگا ۳۰ میلی‌لیتری پرس سرد"),
			SEODescription:      strPtr("خرید روغن خالص دانه مورینگا ۳۰ میلی‌لیتری مناسب آبرسانی پوست و تقویت مو."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     18,
			Categories:         []catalog.Category{*catOils},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-oil-30ml.png",
					AltFA:     "تصویر روغن مورینگا ۳۰ میلی‌لیتری",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0007-1111-1111-111111111111"),
					SKU:                 "MIR-OIL-030",
					TitleFA:             "بطری ۳۰ میلی‌لیتر",
					PriceIRR:            6750000,
					CompareAtPriceIRR:   int64Ptr(7250000),
					NetWeightGrams:      30,
					ShippingWeightGrams: 85,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0008-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-seeds-100g",
			TitleFA:            "دانه مورینگا ۱۰۰ گرمی",
			ShortDescriptionFA: strPtr("دانه‌های خام و تازه مورینگا اولیفرا مناسب برای کاشت و استخراج عصاره یا مصرف خانگی."),
			FullDescriptionFA:  strPtr("دانه مورینگا ۱۰۰ گرمی محصولی ارگانیک و طبیعی است. این دانه‌ها دارای قوه‌نامیه بالا بوده و برای علاقه‌مندان به کشت گیاهان دارویی بسیار مناسب است.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         false,
			UsageInstructionsFA: strPtr("جهت کاشت، دانه‌ها را ۲۴ ساعت در آب ولرم خیس کرده و سپس در عمق ۲ سانتی‌متری بکارید."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و خنک نگهداری گردد."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید دانه مورینگا ۱۰۰ گرمی جهت کاشت و مصرف"),
			SEODescription:      strPtr("فروش دانه مرغوب مورینگا ۱۰۰ گرمی با قوه‌نامیه عالی برای کاشت ارگانیک."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     22,
			Categories:         []catalog.Category{*catSeeds},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-seeds-100g.png",
					AltFA:     "تصویر دانه مورینگا ۱۰۰ گرمی",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0008-1111-1111-111111111111"),
					SKU:                 "MIR-SEED-100",
					TitleFA:             "بسته ۱۰۰ گرمی",
					PriceIRR:            3250000,
					CompareAtPriceIRR:   nil,
					NetWeightGrams:      100,
					ShippingWeightGrams: 140,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0009-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-starter-pack",
			TitleFA:            "بسته آشنایی با مورینگا",
			ShortDescriptionFA: strPtr("پک ترکیبی شامل پودر برگ، دمنوش لیمو و روغن ۳۰ میل مورینگا جهت تجربه جامع از محصولات."),
			FullDescriptionFA:  strPtr("بسته آشنایی با مورینگا، انتخابی هوشمندانه برای کسانی است که می‌خواهند برای اولین بار تنوع محصولات مورینگا را تجربه نمایند. شامل ۱۰۰ گرم پودر برگ، دمنوش لیمو ۲۰ عددی و روغن ۳۰ میل.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			UsageInstructionsFA: strPtr("طبق راهنمای هر یک از محصولات داخل بسته استفاده شود."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و خنک نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید بسته آشنایی با مورینگا با قیمت ویژه"),
			SEODescription:      strPtr("پک اقتصادی آشنایی با مورینگا شامل پودر، دمنوش و روغن ارگانیک با تخفیف ترغیبی."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     15,
			Categories:         []catalog.Category{*catBundles},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-starter-pack.png",
					AltFA:     "تصویر بسته آشنایی با مورینگا",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0009-1111-1111-111111111111"),
					SKU:                 "MIR-PACK-START",
					TitleFA:             "بسته ۳ عددی",
					PriceIRR:            7900000,
					CompareAtPriceIRR:   int64Ptr(8600000),
					NetWeightGrams:      290,
					ShippingWeightGrams: 380,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
		{
			ID:                 uuid.MustParse("33333333-0010-1111-1111-111111111111"),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-gift-box",
			TitleFA:            "بسته هدیه مورینگا",
			ShortDescriptionFA: strPtr("جعبه کادویی شکیل چوبی شامل کامل‌ترین مجموعه محصولات مورینگا مناسب برای هدیه سلامتی."),
			FullDescriptionFA:  strPtr("بسته هدیه مورینگا در جعبه چوبی دست‌ساز نفیس قرار دارد. این بسته حاوی پودر برگ ۲۵۰ گرمی، دمنوش لیمو، کپسول ۶۰ عددی و روغن ۳۰ میل مورینگا می‌باشد.\n\n" + disclaimerText),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			UsageInstructionsFA: strPtr("به دستورالعمل درج شده در برشور داخل جعبه مراجعه شود."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک نگهداری شود."),
			CountryOfOrigin:    strPtr("ایران"),
			SEOTitle:            strPtr("خرید بسته هدیه مورینگا در جعبه چوبی نفیس"),
			SEODescription:      strPtr("خرید آنلاین پکیج لوکس هدیه مورینگا مناسب کادو برای عزیزان به همراه ارسال رایگان."),
			PublishedAt:        &now,
			CreatedAt:          now,
			UpdatedAt:          now,
			AvailableStock:     10,
			Categories:         []catalog.Category{*catBundles},
			Media: []catalog.ProductMedia{
				{
					ID:        uuid.New(),
					URL:       "/images/demo/moringa-gift-box.png",
					AltFA:     "تصویر بسته هدیه مورینگا",
					IsPrimary: true,
					SortOrder: 1,
				},
			},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.MustParse("44444444-0010-1111-1111-111111111111"),
					SKU:                 "MIR-PACK-GIFT",
					TitleFA:             "بسته لوکس چوبی",
					PriceIRR:            12500000,
					CompareAtPriceIRR:   int64Ptr(13500000),
					NetWeightGrams:      520,
					ShippingWeightGrams: 700,
					IsActive:            true,
					Version:             1,
					CreatedAt:           now,
				},
			},
		},
	}

	for _, p := range demoProducts {
		if err := catSvc.AddProduct(p); err != nil && !errors.Is(err, catalog.ErrSlugExists) {
			return fmt.Errorf("failed to seed product %s: %w", p.Slug, err)
		}
	}

	// Register completion in Demo Seed Registry
	catSvc.RecordSeedExecution(DemoProductSeedKey, 1, "product_catalog", uuid.Nil)
	return nil
}
