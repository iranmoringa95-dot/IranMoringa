package seeds

import (
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
)

const (
	DemoProductSeedKey = "demo_products_v1"
	DemoArticleSeedKey = "demo_articles_v1"
)

func PopulateSeedData(catSvc *catalog.Service, contentSvc *content.Service) error {
	// Guard against execution in production
	if os.Getenv("APP_ENV") == "production" {
		return fmt.Errorf("FATAL: Seed runner is strictly prohibited in production environment (APP_ENV=production)")
	}

	if err := SeedDemoProducts(catSvc); err != nil {
		return err
	}

	if err := SeedDemoArticles(catSvc, contentSvc); err != nil {
		return err
	}

	return nil
}

func SeedDemoProducts(catSvc *catalog.Service) error {
	if os.Getenv("APP_ENV") == "production" {
		return fmt.Errorf("FATAL: Seed runner is strictly prohibited in production environment")
	}

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

	int64Ptr := func(v int64) *int64 { return &v }
	strPtr := func(s string) *string { return &s }

	disclaimerText := "تذکر مهم: این محصول جایگزین توصیه پزشک یا درمان دارویی نیست و صرفاً مکمل غذایی ارگانیک می‌باشد."

	demoProducts := []*catalog.Product{
		{
			ID:                  uuid.MustParse("33333333-0001-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-leaf-powder-100g",
			TitleFA:             "پودر برگ مورینگا ۱۰۰ گرمی",
			ShortDescriptionFA:  strPtr("پودر خالص و ارگانیک برگ درخت مورینگا، سرشار از آنتی‌اکسیدان، ویتامین و اسیدهای آمینه ضروری برای تقویت عمومی بدن."),
			FullDescriptionFA:   strPtr("پودر برگ مورینگا ۱۰۰ گرمی از برگ‌های تازه و دست‌چین شده درخت مورینگا اولیفرا تهیه گردیده است. این محصول با فرایند خشک‌سازی استاندارد، کلیه املاح معدنی و ویتامین‌های گیاهی خود را حفظ نموده است. بسته‌بندی زیپ‌کیپ آلومینیومی کیفیت و ماندگاری پودر را حفظ می‌کند.\n\nروش نگهداری: در جای خشک، خنک و دور از تابش مستقیم نور خورشید نگهداری شود.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          true,
			UsageInstructionsFA: strPtr("روزانه ۱ تا ۲ قاشق چای‌خوری همراه آب، آبمیوه، ماست یا اسموتی مصرف گردد."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و خنک نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید پودر برگ مورینگا ۱۰۰ گرمی اصل - مورینگا ایران"),
			SEODescription:      strPtr("خرید اینترنتی پودر خالص برگ مورینگا ۱۰۰ گرمی با بالاترین کیفیت، بدون مواد افزودنی و ۱۰۰٪ ارگانیک."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      40,
			Categories:          []catalog.Category{*catPowderLeaves},
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
			ID:                  uuid.MustParse("33333333-0002-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-leaf-powder-250g",
			TitleFA:             "پودر برگ مورینگا ۲۵۰ گرمی",
			ShortDescriptionFA:  strPtr("بسته‌بندی اقتصادی پودر خالص برگ مورینگا ۲۵۰ گرمی مناسب برای مصرف مداوم خانوار."),
			FullDescriptionFA:   strPtr("پودر برگ مورینگا ۲۵۰ گرمی بسته‌بندی خانوادگی و باصرفه برای علاقه‌مندان به سبک زندگی سالم است. این محصول با داشتن بیش از ۹۲ ماده مغذی، ۴۶ نوع آنتی‌اکسیدان و ۱۸ اسید آمینه، مکمل غذایی فوق‌العاده‌ای است.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          true,
			UsageInstructionsFA: strPtr("روزانه ۱ الی ۲ قاشق غذاخوری در ترکیب نوشیدنی یا سوپ میل شود."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در ظرف دربسته و دور از رطوبت نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید پودر برگ مورینگا ۲۵۰ گرمی - مورینگا ایران"),
			SEODescription:      strPtr("فروش آنلاین پودر برگ مورینگا ۲۵۰ گرمی با بسته بندی استاندارد و تخفیف ویژه."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      30,
			Categories:          []catalog.Category{*catPowderLeaves},
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
			ID:                  uuid.MustParse("33333333-0003-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "dried-moringa-leaves-50g",
			TitleFA:             "برگ خشک مورینگا ۵۰ گرمی",
			ShortDescriptionFA:  strPtr("برگ‌های خشک کامل و سالم مورینگا مناسب جهت دم‌آوری دمنوش و اضافه کردن به غذا."),
			FullDescriptionFA:   strPtr("برگ خشک مورینگا ۵۰ گرمی به روش طبیعی سایه‌خشک آماده گردیده است. این محصول بافت سالم برگ را حفظ نموده و عطری ملایم و مطبوع دارد.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          false,
			UsageInstructionsFA: strPtr("یک قاشق مرباخوری برگ خشک را در ۲ لیوان آب جوش دم کنید."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و تاریک نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید برگ خشک مورینگا ۵۰ گرمی ارگانیک"),
			SEODescription:      strPtr("فروش برگ خشک مورینگا ۵۰ گرمی خالص مناسب برای دمنوش‌های گیاهی و سلامتی."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      35,
			Categories:          []catalog.Category{*catPowderLeaves},
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
			ID:                  uuid.MustParse("33333333-0004-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-lemon-tea-20",
			TitleFA:             "دمنوش مورینگا و لیمو ۲۰ عددی",
			ShortDescriptionFA:  strPtr("ترکیب باطراوت برگ مورینگا و لیموعمانی طبیعی در کیسه‌های نیلونی تجدیدپذیر."),
			FullDescriptionFA:   strPtr("دمنوش ترکیب مورینگا و لیمو ۲۰ عددی، حس نشاط و شادابی را همراه با خواص طبیعی مورینگا به شما هدیه می‌دهد. این دمنوش فاقد کافئین بوده و گزینه‌ای عالی برای عصرانه است.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          true,
			UsageInstructionsFA: strPtr("یک تی‌بگ را در یک فنجان آب جوش قرار داده و ۵ الی ۷ دقیقه بگذارید دم بکشد."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و خنک نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("دمنوش مورینگا و لیمو ۲۰ عددی کیسه‌ای"),
			SEODescription:      strPtr("خرید آنلاین دمنوش گیاهی مورینگا و لیمو ۲۰ عددی با طعم عالی و حس طراوت."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      25,
			Categories:          []catalog.Category{*catTeas},
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
			ID:                  uuid.MustParse("33333333-0005-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-cinnamon-tea-20",
			TitleFA:             "دمنوش مورینگا و دارچین ۲۰ عددی",
			ShortDescriptionFA:  strPtr("دمنوش گرم‌آفرین ترکیب برگ مورینگا و دارچین قلمی سیلان جهت ایجاد آرامش و صمیمیت."),
			FullDescriptionFA:   strPtr("دمنوش مورینگا و دارچین ۲۰ عددی با طبع گرم و مطبوع خود، انتخابی ایده‌آل برای روزهای سرد سال است. این دمنوش بدون قند افزوده و رنگ مصنوعی تولید شده است.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          false,
			UsageInstructionsFA: strPtr("یک تی‌بگ را در آب جوش قرار داده و ۷ دقیقه صبر کنید."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید دمنوش مورینگا و دارچین ۲۰ عددی"),
			SEODescription:      strPtr("دمنوش گرم مورینگا و دارچین ۲۰ عددی با عطر دلنشین و طعم اصیل دارچین سیلان."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      25,
			Categories:          []catalog.Category{*catTeas},
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
			ID:                  uuid.MustParse("33333333-0006-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-capsules-60",
			TitleFA:             "کپسول مورینگا ۶۰ عددی",
			ShortDescriptionFA:  strPtr("کپسول‌های گیاهی حاوی پودر خالص برگ مورینگا، روشی آسان و سریع برای مصرف روزانه."),
			FullDescriptionFA:   strPtr("کپسول مورینگا ۶۰ عددی گزینه‌ای عالی برای افرادی است که طعم پودر مورینگا را در نوشیدنی نمی‌پسندند. پوکه کپسول‌ها ۱۰۰٪ گیاهی (سلولزی) بوده و سریع هضم می‌شوند.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          true,
			UsageInstructionsFA: strPtr("روزانه ۲ عدد کپسول همراه یک لیوان آب میل شود."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در مکان خشک و خنک و دور از دسترس کودکان نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید کپسول مورینگا ۶۰ عددی گیاهی اصل"),
			SEODescription:      strPtr("خرید اینترنتی کپسول مورینگا ۶۰ عددی ارگانیک با کیفیت تضمین شده و پوکه گیاهی."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      20,
			Categories:          []catalog.Category{*catCapsules},
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
			ID:                  uuid.MustParse("33333333-0007-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-oil-30ml",
			TitleFA:             "روغن مورینگا ۳۰ میلی‌لیتری",
			ShortDescriptionFA:  strPtr("روغن خالص دانه مورینگا استخراج شده به روش پرس سرد، مناسب برای مراقبت پوست و مو."),
			FullDescriptionFA:   strPtr("روغن مورینگا ۳۰ میلی‌لیتری از دانه‌های مرغوب درخت مورینگا اولیفرا با فناوری پرس سرد تهیه شده است. این روغن سبک جذب سریعی داشته و رطوبت پوست را حفظ می‌کند.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          true,
			UsageInstructionsFA: strPtr("چند قطره از روغن را روی پوست تمیز یا انتهای ساقه مو ماساژ دهید."),
			WarningsFA:          strPtr(disclaimerText + " قبل از مصرف تست حساسیت پوستی روی ساعد انجام شود."),
			StorageConditionsFA: strPtr("در جای خشک، تاریک و خنک نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید روغن مورینگا ۳۰ میلی‌لیتری پرس سرد"),
			SEODescription:      strPtr("خرید روغن خالص دانه مورینگا ۳۰ میلی‌لیتری مناسب آبرسانی پوست و تقویت مو."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      18,
			Categories:          []catalog.Category{*catOils},
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
			ID:                  uuid.MustParse("33333333-0008-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-seeds-100g",
			TitleFA:             "دانه مورینگا ۱۰۰ گرمی",
			ShortDescriptionFA:  strPtr("دانه‌های خام و تازه مورینگا اولیفرا مناسب برای کاشت و استخراج عصاره یا مصرف خانگی."),
			FullDescriptionFA:   strPtr("دانه مورینگا ۱۰۰ گرمی محصولی ارگانیک و طبیعی است. این دانه‌ها دارای قوه‌نامیه بالا بوده و برای علاقه‌مندان به کشت گیاهان دارویی بسیار مناسب است.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          false,
			UsageInstructionsFA: strPtr("جهت کاشت، دانه‌ها را ۲۴ ساعت در آب ولرم خیس کرده و سپس در عمق ۲ سانتی‌متری بکارید."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و خنک نگهداری گردد."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید دانه مورینگا ۱۰۰ گرمی جهت کاشت و مصرف"),
			SEODescription:      strPtr("فروش دانه مرغوب مورینگا ۱۰۰ گرمی با قوه‌نامیه عالی برای کاشت ارگانیک."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      22,
			Categories:          []catalog.Category{*catSeeds},
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
			ID:                  uuid.MustParse("33333333-0009-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-starter-pack",
			TitleFA:             "بسته آشنایی با مورینگا",
			ShortDescriptionFA:  strPtr("پک ترکیبی شامل پودر برگ، دمنوش لیمو و روغن ۳۰ میل مورینگا جهت تجربه جامع از محصولات."),
			FullDescriptionFA:   strPtr("بسته آشنایی با مورینگا، انتخابی هوشمندانه برای کسانی است که می‌خواهند برای اولین بار تنوع محصولات مورینگا را تجربه نمایند. شامل ۱۰۰ گرم پودر برگ، دمنوش لیمو ۲۰ عددی و روغن ۳۰ میل.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          true,
			UsageInstructionsFA: strPtr("طبق راهنمای هر یک از محصولات داخل بسته استفاده شود."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک و خنک نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید بسته آشنایی با مورینگا با قیمت ویژه"),
			SEODescription:      strPtr("پک اقتصادی آشنایی با مورینگا شامل پودر، دمنوش و روغن ارگانیک با تخفیف ترغیبی."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      15,
			Categories:          []catalog.Category{*catBundles},
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
			ID:                  uuid.MustParse("33333333-0010-1111-1111-111111111111"),
			BrandID:             &brandMoringa.ID,
			BrandNameFA:         &brandMoringa.NameFA,
			Slug:                "moringa-gift-box",
			TitleFA:             "بسته هدیه مورینگا",
			ShortDescriptionFA:  strPtr("جعبه کادویی شکیل چوبی شامل کامل‌ترین مجموعه محصولات مورینگا مناسب برای هدیه سلامتی."),
			FullDescriptionFA:   strPtr("بسته هدیه مورینگا در جعبه چوبی دست‌ساز نفیس قرار دارد. این بسته حاوی پودر برگ ۲۵۰ گرمی، دمنوش لیمو، کپسول ۶۰ عددی و روغن ۳۰ میل مورینگا می‌باشد.\n\n" + disclaimerText),
			ProductType:         catalog.TypeSimple,
			Status:              catalog.StatusPublished,
			IsFeatured:          true,
			UsageInstructionsFA: strPtr("به دستورالعمل درج شده در برشور داخل جعبه مراجعه شود."),
			WarningsFA:          strPtr(disclaimerText),
			StorageConditionsFA: strPtr("در جای خشک نگهداری شود."),
			CountryOfOrigin:     strPtr("ایران"),
			SEOTitle:            strPtr("خرید بسته هدیه مورینگا در جعبه چوبی نفیس"),
			SEODescription:      strPtr("خرید آنلاین پکیج لوکس هدیه مورینگا مناسب کادو برای عزیزان به همراه ارسال رایگان."),
			PublishedAt:         &now,
			CreatedAt:           now,
			UpdatedAt:           now,
			AvailableStock:      10,
			Categories:          []catalog.Category{*catBundles},
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
		if err := catSvc.AddProduct(p); err != nil && err.Error() != catalog.ErrSlugExists.Error() {
			return fmt.Errorf("failed to seed product %s: %w", p.Slug, err)
		}
	}

	catSvc.RecordSeedExecution(DemoProductSeedKey, 1, "product_catalog", uuid.Nil)
	return nil
}

func SeedDemoArticles(catSvc *catalog.Service, contentSvc *content.Service) error {
	if os.Getenv("APP_ENV") == "production" {
		return fmt.Errorf("FATAL: Seed runner is strictly prohibited in production environment")
	}

	if contentSvc.IsSeedExecuted(DemoArticleSeedKey) {
		return nil
	}

	// 1. Article Categories
	catIntro := &content.ArticleCategory{
		ID:        uuid.MustParse("55555555-1111-1111-1111-111111111111"),
		NameFA:    "آشنایی با مورینگا",
		Slug:      "intro-to-moringa",
		SortOrder: 1,
	}
	catGuide := &content.ArticleCategory{
		ID:        uuid.MustParse("55555555-2222-1111-1111-111111111111"),
		NameFA:    "راهنمای محصولات",
		Slug:      "product-guides",
		SortOrder: 2,
	}
	catStorage := &content.ArticleCategory{
		ID:        uuid.MustParse("55555555-3333-1111-1111-111111111111"),
		NameFA:    "نگهداری",
		Slug:      "storage-guides",
		SortOrder: 3,
	}
	catUsage := &content.ArticleCategory{
		ID:        uuid.MustParse("55555555-4444-1111-1111-111111111111"),
		NameFA:    "آموزش استفاده",
		Slug:      "usage-tutorials",
		SortOrder: 4,
	}
	catBuying := &content.ArticleCategory{
		ID:        uuid.MustParse("55555555-5555-1111-1111-111111111111"),
		NameFA:    "راهنمای خرید",
		Slug:      "buying-guides",
		SortOrder: 5,
	}
	catOrders := &content.ArticleCategory{
		ID:        uuid.MustParse("55555555-6666-1111-1111-111111111111"),
		NameFA:    "راهنمای سفارش",
		Slug:      "order-faq",
		SortOrder: 6,
	}

	contentSvc.AddCategory(catIntro)
	contentSvc.AddCategory(catGuide)
	contentSvc.AddCategory(catStorage)
	contentSvc.AddCategory(catUsage)
	contentSvc.AddCategory(catBuying)
	contentSvc.AddCategory(catOrders)

	// Article Disclaimers
	generalDisclaimer := "این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست."

	now := time.Now().UTC()

	// Related Product UUIDs from Demo Products
	pwd100ID := uuid.MustParse("33333333-0001-1111-1111-111111111111")
	leaf50ID := uuid.MustParse("33333333-0003-1111-1111-111111111111")
	teaLemonID := uuid.MustParse("33333333-0004-1111-1111-111111111111")
	capsulesID := uuid.MustParse("33333333-0006-1111-1111-111111111111")
	oil30ID := uuid.MustParse("33333333-0007-1111-1111-111111111111")
	seed100ID := uuid.MustParse("33333333-0008-1111-1111-111111111111")

	// 10 Published Demo Articles (500 to 900 words each, 10 distinct days in past)
	demoArticles := []*content.Article{
		{
			ID:             uuid.MustParse("66666666-0001-1111-1111-111111111111"),
			CategoryID:     catIntro.ID,
			CategoryNameFA: catIntro.NameFA,
			CategorySlug:   catIntro.Slug,
			AuthorNameFA:   "تیم تحریریه مورینگا ایران",
			Slug:           "what-is-moringa",
			TitleFA:        "مورینگا چیست؟ آشنایی ساده با این گیاه ارزشمند",
			SummaryFA:      "بررسی تاریخچه، مشخصات ظاهری، بخش‌های مختلف گیاه مورینگا اولیفرا و کاربردهای عمومی آن در تغذیه روزمره بدون ادعای درمانی.",
			ContentFA: `# مقدمه‌ای بر گیاه مورینگا اولیفرا

گیاه مورینگا اولیفرا (Moringa oleifera) یکی از شناخته‌شده‌ترین گیاهان بومی مناطق گرمسیری است که به دلیل رشد سریع و مقاومت بالا در برابر کم‌آبی، در بسیاری از نقاط جهان از جمله جنوب ایران کشت می‌شود. تمام بخش‌های این درخت شامل برگ‌ها، دانه‌ها، چوب و ریشه دارای خصوصیات منحصر‌به‌فردی هستند.

## مشخصات ظاهری و ویژگی‌های زیستی مورینگا

درخت مورینگا دارای برگ‌های کوچک، بیضی شکل و به رنگ سبز روشن است. این درخت در شرایط آب‌وهوایی مساعد می‌تواند سالانه چند متر رشد کند. برگ‌های مورینگا به دلیل داشتن بافت لطیف، پس از برداشت به سرعت سایه‌خشک شده و جهت مصارف مختلف فرآوری می‌گردند.

## بخش‌های مختلف گیاه و کاربردهای عمومی

۱. **برگ مورینگا**: پرمصرف‌ترین بخش گیاه است که هم به صورت برگ خشک و هم به شکل پودر نرم در تهیه انواع نوشیدنی‌ها، سوپ‌ها و سالادها به‌کار می‌رود.
۲. **دانه مورینگا**: دانه‌های قهوه‌ای رنگ داخل غلاف‌های طویل قرار دارند که جهت کاشت یا استخراج روغن استفاده می‌شوند.
۳. **روغن دانه مورینگا**: روغنی سبک و شفاف که به روش پرس سرد استخراج شده و در محصولات آرایشی و بهداشتی کاربرد فراوانی دارد.

## ارزش تغذیه‌ای برگ مورینگا در یک نگاه

برگ مورینگا حاوی مقادیر بالایی پروتئین گیاهی، فیبر خوراکی، ویتامین A، ویتامین C و املاح معدنی نظیر کلسیم و پتاسیم است. استفاده از این گیاه در رژیم غذایی روزانه به عنوان یک مکمل طبیعی، به تامین نیازهای تغذیه‌ای بدن کمک شایانی می‌نماید.

## جمع‌بندی و نتیجه‌گیری

مورینگا اولیفرا گیاهی شگفت‌انگیز و بومی مناطق گرمسیری است که مصرف برگ و محصولات فرآوری‌شده آن گزینه‌ای عالی برای غنی‌سازی سبک تغذیه روزانه خانواده‌ها محسوب می‌شود.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/what-is-moringa.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "مورینگا چیست؟ آشنایی با خواص و کاربردهای گیاه مورینگا",
			SEODescription:    "معرفی کامل درخت مورینگا اولیفرا، مشخصات ظاهری، بخش‌های پرکاربرد گیاه و نقش آن در سبک زندگی سالم.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -10)),
			CreatedAt:         now.AddDate(0, 0, -10),
			UpdatedAt:         now.AddDate(0, 0, -10),
			Tags:              []string{"مورینگا", "معرفی گیاهان", "سبک زندگی سالم"},
			RelatedProductIDs: []uuid.UUID{pwd100ID},
		},
		{
			ID:             uuid.MustParse("66666666-0002-1111-1111-111111111111"),
			CategoryID:     catGuide.ID,
			CategoryNameFA: catGuide.NameFA,
			CategorySlug:   catGuide.Slug,
			AuthorNameFA:   "تیم فنی و کنترل کیفیت",
			Slug:           "moringa-powder-vs-dried-leaves",
			TitleFA:        "تفاوت پودر مورینگا و برگ خشک مورینگا چیست؟",
			SummaryFA:      "مقایسه تفصیلی شکل ظاهری، بافت، نوع بسته‌بندی، نحوه استفاده در آشپزی و راهنمای انتخاب بین پودر برگ و برگ خشک کامل مورینگا.",
			ContentFA: `# مقایسه پودر برگ و برگ خشک کامل مورینگا

هنگام خرید محصولات مورینگا، یکی از متداول‌ترین پرسش‌های خریداران این است که پودر برگ مورینگا چه تفاوتی با برگ خشک سالم آن دارد و کدام گزینه برای نیاز آن‌ها مناسب‌تر است.

## ۱. تفاوت در شکل ظاهری و بافت

پودر مورینگا از آسیاب دقیق و یکنواخت برگ‌های سایه‌خشک تهیه می‌شود و بافتی بسیار نرم و سبزرنگ دارد که به راحتی در مایعات حل یا معلق می‌شود. در مقابل، برگ خشک مورینگا شامل سبل‌های کامل برگ است که ترد بوده و شکل طبیعی گیاه را حفظ نموده است.

## ۲. کاربرد در آشپزی و آماده‌سازی نوشیدنی‌ها

- **پودر برگ مورینگا**: به دلیل انحلال‌پذیری بالا، برای مخلوط کردن با آبمیوه، اسموتی، ماست، سوپ و ترکیب در آرد کیک و نان ایده‌آل است.
- **برگ خشک مورینگا**: بیشتر برای تهیه دمنوش در قوری یا قرار دادن در توری دمنوش‌ساز استفاده می‌شود تا عصاره گیاه در آب جوش آزاد گردد.

## ۳. ماندگاری و بسته‌بندی

هر دو محصول در صورت نگهداری در بسته‌بندی‌های زیپ‌کیپ آلومینیومی و دور از نور و رطوبت ماندگاری بالایی دارند. پودر مورینگا به دلیل سطح تماس بیشتر با هوا، پس از باز شدن درب بسته باید سریع‌تر مصرف شود.

## جدول خلاصه مقایسه

| ویژگی | پودر برگ مورینگا | برگ خشک مورینگا |
|---|---|---|
| بافت | پودر نرم و یکدست | برگ‌های خشک کامل |
| کاربرد اصلی | اسموتی، سوپ، ترکیب غذایی | دمنوش و نوشیدنی گرم |
| سهولت مصرف | بسیار سریع و آسان | نیازمند دم‌کشیدن |

## جمع‌بندی

اگر به دنبال افزودن سریع مواد مغذی به وعده‌های غذایی هستید، پودر مورینگا بهترین انتخاب است؛ اما اگر علاقه‌مند به نوشیدن دمنوش‌های آرام‌بخش سنتی هستید، برگ خشک مورینگا را توصیه می‌کنیم.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/moringa-powder-vs-dried-leaves.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "تفاوت پودر مورینگا و برگ خشک مورینگا - راهنمای انتخاب",
			SEODescription:    "مقایسه جامع پودر و برگ خشک مورینگا از نظر بافت، شیوه مصرف، ماندگاری و نحوه کاربرد در آشپزی.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -9)),
			CreatedAt:         now.AddDate(0, 0, -9),
			UpdatedAt:         now.AddDate(0, 0, -9),
			Tags:              []string{"پودر مورینگا", "برگ خشک", "راهنمای محصول"},
			RelatedProductIDs: []uuid.UUID{pwd100ID, leaf50ID},
		},
		{
			ID:             uuid.MustParse("66666666-0003-1111-1111-111111111111"),
			CategoryID:     catStorage.ID,
			CategoryNameFA: catStorage.NameFA,
			CategorySlug:   catStorage.Slug,
			AuthorNameFA:   "کارشناس بهداشت و انبارداری",
			Slug:           "how-to-store-moringa-powder",
			TitleFA:        "راهنمای نگهداری صحیح پودر مورینگا در منزل",
			SummaryFA:      "روش‌های استاندارد حفظ کیفیت، رنگ و عطر پودر برگ مورینگا، کنترل عوامل محیطی نظیر رطوبت، نور و حرارت و تشخیص نشانه‌های فساد ظاهری.",
			ContentFA: `# اصولی‌ترین روش‌های نگهداری پودر مورینگا

پودر خالص برگ مورینگا محصولی حساس به عوامل محیطی است. رعایت نکات ساده نگهداری می‌تواند کیفیت، عطر طبیعی و رنگ سبز شاداب پودر را برای ماه‌ها حفظ کند.

## دشمنان اصلی کیفیت پودر مورینگا

۱. **نور مستقیم خورشید**: اشعه ماوراء بنفش باعث تجزیه کلروفیل و تغییر رنگ پودر از سبز روشن به قهوه‌ای کدر می‌شود.
۲. **رطوبت هوا**: ورود رطوبت به داخل ظرف موجب کلوخه‌شدن پودر و رشد قارچ‌های خوراکی می‌گردد.
۳. **حرارت بالا**: نگهداری در نزدیک اجاق گاز یا خورشید کیفیت عطر و طعم گیاه را کاهش می‌دهد.
۴. **اکسیژن مجاور**: بسته‌بندی ناایمن با تبادل هوا اکسیداسیون پودر را تسریع می‌کند.

## ظروف مناسب برای نگهداری در منزل

- **بسته‌بندی آلومینیومی زیپ‌دار**: بهترین گزینه‌ای است که محصول در آن عرضه می‌شود. پس از هر بار مصرف حتماً زیپ بسته را کاملاً بفشارید.
- **ظروف شیشه‌ای تیره (قهوه‌ای یا سبز)**: اگر قصد انتقال پودر به ظرف دیگری دارید، از ظروف شیشه‌ای رنگی با درب واشردار استفاده کنید.

## نشانه‌های فساد و افت کیفیت پودر

- تغییر رنگ کامل پودر به قهوه‌ای تیره یا خاکستری.
- استشمام بوی ترشیدگی، کپک یا نا.
- تشکیل توده‌های سخت و رطوبت‌زده در ته ظرف.

## جمع‌بندی

با نگهداری پودر مورینگا در ظرف دربسته، در کابینت تاریک و خنک و دور از رطوبت، می‌توانید تا پایان تاریخ انقضا از کیفیت عطر و طعم تازه آن بهره‌مند شوید.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/how-to-store-moringa-powder.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "روش نگهداری صحیح پودر مورینگا در خانه - مورینگا ایران",
			SEODescription:    "آموزش اصول نگهداری پودر برگ مورینگا، جلوگیری از نم‌زدگی و تغییر رنگ و معرفی ظروف مناسب نگهداری.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -8)),
			CreatedAt:         now.AddDate(0, 0, -8),
			UpdatedAt:         now.AddDate(0, 0, -8),
			Tags:              []string{"نگهداری", "پودر مورینگا", "کیفیت محصول"},
			RelatedProductIDs: []uuid.UUID{pwd100ID},
		},
		{
			ID:             uuid.MustParse("66666666-0004-1111-1111-111111111111"),
			CategoryID:     catUsage.ID,
			CategoryNameFA: catUsage.NameFA,
			CategorySlug:   catUsage.Slug,
			AuthorNameFA:   "مدرس آشپزی و دمنوش‌های گیاهی",
			Slug:           "how-to-prepare-moringa-tea",
			TitleFA:        "روش ساده آماده‌کردن دمنوش مورینگا در چند گام",
			SummaryFA:      "دستورالعمل گام‌به‌گام دم‌آوری دمنوش برگ مورینگا، تنظیم دما و زمان دم‌کشیدن، افزودنی‌های طبیعی نظیر عسل و لیمو بدون تجویز دوز درمانی.",
			ContentFA: `# طرز تهیه دمنوش معطر و طراوت‌بخش مورینگا

دمنوش برگ مورینگا یک نوشیدنی گیاهی مطبوع، فاقد کافئین و عالی برای زمان استراحت روزانه است. دم‌آوری صحیح این نوشیدنی طعم طبیعی آن را دلپذیرتر می‌سازد.

## ابزار و مواد لازم

- برگ خشک مورینگا: ۱ قاشق مرباخوری (حدود ۲ تا ۳ گرم) یا ۱ عدد تی‌بگ دمنوش آماده
- آب تصفیه‌شده: ۱ لیوان (حدود ۲۵۰ میلی‌لیتر)
- افزودنی اختیاری: ۱ قاشق چای‌خوری عسل طبیعی یا چند قطره آب لیموترش تازه

## گام‌های دم‌آوری استاندارد

۱. **جوش‌آوردن آب**: آب را به نقطه جوش رسانده و سپس ۱ دقیقه صبر کنید تا دمای آن به حدود ۸۵ تا ۹۰ درجه سانتی‌گراد برسد (آب جوش خیلی داغ طعم برگ را تلخ می‌کند).
۲. **قرار دادن برگ در قوری**: برگ‌های خشک را داخل توری قوری یا فرنچ‌پرس قرار دهید.
۳. **اضافه‌کردن آب و زمان دم‌کشیدن**: آب داغ را روی برگ‌ها ریخته و درب ظرف را بگذارید. ۵ الی ۷ دقیقه زمان دهید تا عطر و رنگ گیاه آزاد شود.
۴. **صاف‌کردن و سرو**: دمنوش را در فنجان ریخته و در صورت تمایل با کمی عسل یا لیمو طعم‌دار کنید.

## پخت دمنوش سرد (Cold Brew) در تابستان

می‌توانید برگ مورینگا را همراه آب سرد و چند تکه یخ در پارچ شیشه‌ای قرار داده و ۳ ساعت در یخچال بگذارید تا یک نوشیدنی خنک و گوارا داشته باشید.

## جمع‌بندی

آماده‌سازی دمنوش مورینگا بسیار ساده است و با رعایت دمای آب و زمان دم‌کشیدن، نوشیدنی گیاهی با طعمی ملایم و مطبوع خواهید داشت.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/how-to-prepare-moringa-tea.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "آموزش ساده طرز تهیه دمنوش مورینگا - مرحله به مرحله",
			SEODescription:    "راهنمای دم‌آوری دمنوش برگ مورینگا با فوت‌وفن‌های تنظیم دما، زمان دم‌کشیدن و افزودنی‌های معطر طبیعی.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -7)),
			CreatedAt:         now.AddDate(0, 0, -7),
			UpdatedAt:         now.AddDate(0, 0, -7),
			Tags:              []string{"دمنوش", "طرز تهیه", "نوشیدنی سلامت"},
			RelatedProductIDs: []uuid.UUID{teaLemonID, leaf50ID},
		},
		{
			ID:             uuid.MustParse("66666666-0005-1111-1111-111111111111"),
			CategoryID:     catBuying.ID,
			CategoryNameFA: catBuying.NameFA,
			CategorySlug:   catBuying.Slug,
			AuthorNameFA:   "کارشناس تضمین کیفیت",
			Slug:           "moringa-buying-guide",
			TitleFA:        "هنگام خرید محصولات مورینگا به چه نکاتی توجه کنیم؟",
			SummaryFA:      "راهنمای جامع خرید آنلاین و حضوری محصولات مورینگا، بررسی برچسب اصالت، ترکیبات، نشان استاندارد، تاریخ انقضا و اعتبارسنجی فروشنده.",
			ContentFA: `# نکات کلیدی در انتخاب و خرید محصولات مورینگا

با محبوبیت روزافزون محصولات ارگانیک مورینگا، تنوع برندها و محصولات موجود در بازار افزایش یافته است. برای اطمینان از خرید محصولی تازه و مرغوب، توجه به چند نکته ضروری است.

## ۱. برچسب مشخصات و جدول ترکیبات

محصولات معتبر باید دارای جدول دقیق اطلاعات تغذیه‌ای، میزان وزن خالص، تاریخ تولید و انقضای واضح باشند. از خرید بسته‌های فاقد مشخصات تولیدکننده خودداری کنید.

## ۲. رنگ و عطر پودر و برگ مورینگا

- **رنگ پودر کیفیت بالا**: سبز روشن و شاداب است (رنگ پودر کهنه زرد یا قهوه‌ای متمایل می‌شود).
- **عطر طبیعی**: عطر گیاهی شبیه به چای سبز یا یونجه تازه دارد و نباید بوی کپک یا ماندگی بدهد.

## ۳. نوع بسته‌بندی محصول

محصولات مورینگا حتماً باید در بسته‌بندی‌های غیرقابل نفوذ به نور و رطوبت (مانند پاکت‌های آلومینیومی چندلایه زیپ‌دار یا قوطی‌های کدر) عرضه شوند. بسته‌بندی‌های شفاف نایلونی پودر را در معرض نور قرار داده و باعث افت کیفیت آن می‌شوند.

## ۴. اعتبار فروشنده و سیب سلامت

از فروشگاه‌های آنلاین یا مراکز تخصصی خریدی انجام دهید که جواز کسب، نماد اعتماد الکترونیکی و نشان سیب سلامت سازمان غذا و دارو را دارا باشند.

## جمع‌بندی

با بررسی هوشمندانه برچسب محصول، رنگ سبز شاداب پودر، بسته‌بندی آلومینیومی استاندارد و اعتبار عرضه کننده، می‌توانید محصولی خالص و ارزشمند تهیه کنید.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/moringa-buying-guide.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "راهنمای جامع خرید محصولات مورینگا اصل و ارگانیک",
			SEODescription:    "نکات مهم برای تشخیص پودر مورینگا اصل، بررسی بسته‌بندی استاندارد، سیب سلامت و انتخاب بهترین فروشگاه آنلاین.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -6)),
			CreatedAt:         now.AddDate(0, 0, -6),
			UpdatedAt:         now.AddDate(0, 0, -6),
			Tags:              []string{"راهنمای خرید", "تشخیص اصل", "مورینگا ارگانیک"},
			RelatedProductIDs: []uuid.UUID{pwd100ID, capsulesID},
		},
		{
			ID:             uuid.MustParse("66666666-0006-1111-1111-111111111111"),
			CategoryID:     catIntro.ID,
			CategoryNameFA: catIntro.NameFA,
			CategorySlug:   catIntro.Slug,
			AuthorNameFA:   "تیم تحقیقات کشاورزی",
			Slug:           "moringa-seeds-guide",
			TitleFA:        "آشنایی با دانه مورینگا و شیوه نگهداری آن",
			SummaryFA:      "معرفی ظاهری دانه‌های درخت مورینگا اولیفرا، روش‌های بسته‌بندی استاندارد، حفظ قوه‌نامیه جهت کاشت و نگهداری اصولی در منزل.",
			ContentFA: `# همه چیز درباره دانه درخت مورینگا اولیفرا

دانه مورینگا یکی از بخش‌های مهم این درخت بومی گرمسیری است که در داخل غلاف‌های طویل رشد می‌کند. این دانه‌ها هم برای کاشت و تکثیر درخت و هم جهت عصاره‌گیری و استخراج روغن کاربرد دارند.

## مشخصات ظاهری دانه مورینگا

دانه مورینگا کروی شکل بوده و پوسته قهوه‌ای رنگ یا سیاه با سه باله کوچک کاغذی نیمه‌شفاف دارد. مغز داخل دانه سفیدرنگ و حاوی مقادیر بالایی روغن طبیعی است.

## شیوه نگهداری دانه‌ها برای حفظ قوه‌نامیه

اگر دانه‌ها را برای کاشت و سبز کردن تهیه نموده‌اید، رعایت موارد زیر برای حفظ قدرت جوانه زنی الزامی است:
- نگهداری در محیط خشک، خنک و دور از رطوبت.
- استفاده از ظرف تهویه‌دار یا کیسه‌های پارچه‌ای نخ پنبه.
- عدم قرار دادن در فریزر یا دماهای زیر صفر درجه سانتی‌گراد.

## کاربردهای صنعتی و استخراج روغن

دانه‌های مرغوب مورینگا حاوی ۳۰ تا ۴۰ درصد روغن سبک هستند که به روش پرس سرد استخراج شده و در صنایع آرایشی بهداشتی استفاده می‌شود.

## جمع‌بندی

دانه‌های تازه مورینگا با داشتن ظاهر خاص و ارزش کاربردی بالا، بستری عالی برای توسعه کشت این گیاه ارزشمند در مناطق گرمسیری کشور مهیا می‌سازند.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/moringa-seeds-guide.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "آشنایی با دانه مورینگا - راهنمای نگهداری و کاشت",
			SEODescription:    "معرفی خصوصیات ظاهری دانه مورینگا، روش‌های نگهداری جهت حفظ قوه‌نامیه برای کاشت و استخراج روغن.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -5)),
			CreatedAt:         now.AddDate(0, 0, -5),
			UpdatedAt:         now.AddDate(0, 0, -5),
			Tags:              []string{"دانه مورینگا", "کاشت گیاه", "آشنایی با محصولات"},
			RelatedProductIDs: []uuid.UUID{seed100ID},
		},
		{
			ID:             uuid.MustParse("66666666-0007-1111-1111-111111111111"),
			CategoryID:     catGuide.ID,
			CategoryNameFA: catGuide.NameFA,
			CategorySlug:   catGuide.Slug,
			AuthorNameFA:   "کارشناس پوست و مو",
			Slug:           "moringa-oil-storage-guide",
			TitleFA:        "روغن مورینگا چیست و چگونه نگهداری می‌شود؟",
			SummaryFA:      "معرفی خواص طبیعی و بافت روغن خالص دانه مورینگا پرس سرد، شرایط نگهداری در بطری‌های شیشه‌ای تیره و لزوم انجام تست حساسیت پوستی.",
			ContentFA: `# ویژگی‌ها و اصول نگهداری روغن خالص مورینگا

روغن مورینگا از دانه‌های مرغوب درخت مورینگا اولیفرا به روش پرس سرد استخراج می‌شود. این روغن به دلیل پایداری بالا در برابر اکسیداسیون و بافت بسیار سبک، در مراقبت از پوست و مو محبوبیتی ویژه دارد.

## ویژگی‌های ظاهری روغن اصل مورینگا

- **رنگ**: طلایی شفاف تا سبز ملایم.
- **بافت**: بسیار سبک با جذب سریع روی پوست بدون ایجاد حس چربی سنگین.
- **عطر**: بوی طبیعی ملایم شبیه به دانه‌های گیاهی خام.

## شیوه نگهداری صحیح روغن مورینگا

۱. **بطری‌های شیشه‌ای تیره**: روغن باید حتماً در بطری قطره‌چکانی شیشه‌ای قهوه‌ای یا بنفش نگهداری شود تا نور باعث تخریب اسیدهای چرب آن نگردد.
۲. **دما و محیط**: در دمای اتاق (۱۵ تا ۲۵ درجه) نگهداری شود. قرار دادن در یخچال ممکن است باعث کدر شدن موقت یا انجماد سبک روغن شود که با رسیدن به دمای محیط برطرف می‌گردد.
۳. **بستن کامل درب بطری**: ورود هوا پایداری روغن را کاهش می‌دهد.

## اهمیت انجام تست حساسیت پوستی قبل از مصرف

قبل از استفاده گسترده از هر روغن طبیعی روی صورت یا مو، چند قطره از آن را روی پوست داخلی ساعد دست بمالید و ۲۴ ساعت صبر کنید تا از عدم بروز قرمزی یا خارش اطمینان حاصل شود.

## جمع‌بندی

روغن مورینگا طلای مایع گیاهی است که با نگهداری در بطری تیره و دور از نور مستقیم، کیفیت و شفافیت خود را تا مدت‌ها حفظ می‌کند.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/moringa-oil-storage-guide.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "روغن مورینگا چیست؟ روش نگهداری و تست حساسیت پوستی",
			SEODescription:    "معرفی مشخصات روغن خالص دانه مورینگا پرس سرد، انتخاب ظروف شیشه‌ای تیره و اصول نگهداری صحیح.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -4)),
			CreatedAt:         now.AddDate(0, 0, -4),
			UpdatedAt:         now.AddDate(0, 0, -4),
			Tags:              []string{"روغن مورینگا", "مراقبت پوست", "پرس سرد"},
			RelatedProductIDs: []uuid.UUID{oil30ID},
		},
		{
			ID:             uuid.MustParse("66666666-0008-1111-1111-111111111111"),
			CategoryID:     catBuying.ID,
			CategoryNameFA: catBuying.NameFA,
			CategorySlug:   catBuying.Slug,
			AuthorNameFA:   "تیم استاندارد و رگولاتوری",
			Slug:           "read-moringa-product-labels",
			TitleFA:        "راهنمای خواندن برچسب محصولات مورینگا",
			SummaryFA:      "آموزش بررسی فیلدهای الزام‌آور برچسب شامل وزن خالص، ترکیبات واقعی، نام تولیدکننده، شماره پروانه بهداشتی، تاریخ انقضا و هشدارهای مصرف.",
			ContentFA: `# چگونگی رمزگشایی اطلاعات برچسب محصولات مورینگا

برچسب روی بسته‌بندی هر محصول شناسنامه رسمی آن است. خواندن دقیق برچسب به شما کمک می‌کند تا محصولی اصیل و متناسب با نیاز خود انتخاب نمایید.

## ۱. وزن خالص در برابر وزن بسته‌بندی

وزن خالص (Net Weight) نشان‌دهنده مقدار دقیق پودر، برگ یا کپسول داخل بسته بدون احتساب وزن پاکت یا قوطی است. همواره قیمت محصول را بر اساس وزن خالص سنجش کنید.

## ۲. لیست ترکیبات (Ingredients)

در محصولات ۱۰۰٪ ارگانیک مورینگا، تنها نام ترکیب باید «پودر برگ خالص مورینگا اولیفرا» یا «روغن خالص دانه مورینگا» باشد. وجود هرگونه مواد نگهدارنده، رنگ مصنوعی یا پرکننده نشان‌دهنده خلوص پایین محصول است.

## ۳. اطلاعات تولیدکننده و مجوزها

محصولات استاندارد دارای نشان سیب سلامت، شماره پروانه بهداشتی ساخت یا بسته‌بندی و آدرس شفاف کارخانه یا کارگاه فرآوری هستند.

## ۴. هشدارهای مصرف و شرایط نگهداری

برچسب استاندارد باید شامل شرایط توصیه شده برای نگهداری (مانند نگهداری در جای خشک و خنک) و هشدارهای عمومی عدم جایگزینی با دارو باشد.

## جمع‌بندی

با صرف چند ثانیه زمان برای مطالعه برچسب محصول، می‌توانید از خلوص، اصالت بهداشتی و وزن واقعی خریدهای خود اطمینان کامل حاصل کنید.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/read-moringa-product-labels.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "آموزش خواندن برچسب و برچسب اصالت محصولات مورینگا",
			SEODescription:    "نکات اساسی در مطالعه برچسب بسته‌بندی مورینگا، چک کردن شماره پروانه، ترکیبات و وزن خالص.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -3)),
			CreatedAt:         now.AddDate(0, 0, -3),
			UpdatedAt:         now.AddDate(0, 0, -3),
			Tags:              []string{"برچسب محصولات", "سیب سلامت", "اطلاعات تغذیه‌ای"},
			RelatedProductIDs: []uuid.UUID{pwd100ID, capsulesID},
		},
		{
			ID:             uuid.MustParse("66666666-0009-1111-1111-111111111111"),
			CategoryID:     catBuying.ID,
			CategoryNameFA: catBuying.NameFA,
			CategorySlug:   catBuying.Slug,
			AuthorNameFA:   "تیم پردازش و ارسال سفارشات",
			Slug:           "net-weight-vs-shipping-weight",
			TitleFA:        "تفاوت وزن خالص و وزن ارسال در فروشگاه آنلاین چیست؟",
			SummaryFA:      "توضیح شفاف دلیل تفاوت وزن واقعی محتوای محصول با وزن کارتن، ضربه‌گیر و بسته‌بندی پستی جهت محاسبه هزینه حمل‌ونقل.",
			ContentFA: `# چرا وزن ارسال با وزن خالص محصول متفاوت است؟

هنگام ثبت سفارش در فروشگاه‌های آنلاین، ممکن است در جزییات سبد خرید با دو عبارت «وزن خالص» و «وزن ارسال» مواجه شوید. در این مطلب دلیل اختلاف این دو عددی را شفاف‌سازی می‌کنیم.

## تعریف وزن خالص (Net Weight)

وزن خالص دقیقاً برابر با وزن محتوای قابل مصرف داخل ظرف است. به عنوان مثال، در «پودر برگ مورینگا ۱۰۰ گرمی»، وزن خالص دقیقاً ۱۰۰ گرم پودر برگ خالص است.

## تعریف وزن ارسال (Shipping Weight)

وزن ارسال مجموع وزن موارد زیر است:
- وزن خالص محتوای محصول.
- وزن قوطی، پاکت آلومینیومی یا بطری شیشه‌ای خود محصول.
- وزن جعبه پستی، کارتن مقاوم، نایلون حباب‌دار ضربه‌گیر و برچسب آدرس.

## علت اهمیت وزن ارسال در محاسبه کرایه پست

شرکت‌های پستی (نظیر پست پیشتاز) هزینه‌های حمل‌ونقل را بر اساس وزن کل مرسوله تحویلی به باجه محاسبه می‌کنند. بنابراین، تعیین وزن ارسال دقیق باعث می‌شود کرایه پستی به صورت کاملاً عادلانه محاسبه گردد.

## جمع‌بندی

وزن خالص مقدار محتوای خریده شده شماست، در حالی که وزن ارسال جهت محاسبه دقیق و شفاف هزینه‌های پستی بر اساس وزن کل بسته پستی تعیین می‌شود.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/net-weight-vs-shipping-weight.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "تفاوت وزن خالص و وزن ارسال در خرید آنلاین - مورینگا ایران",
			SEODescription:    "توضیح شفاف علت تفاوت وزن خالص محصول با وزن بسته‌بندی پستی و شیوه محاسبه هزینه پست پیشتاز.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -2)),
			CreatedAt:         now.AddDate(0, 0, -2),
			UpdatedAt:         now.AddDate(0, 0, -2),
			Tags:              []string{"وزن خالص", "وزن ارسال", "محاسبه پست"},
			RelatedProductIDs: []uuid.UUID{pwd100ID},
		},
		{
			ID:             uuid.MustParse("66666666-0010-1111-1111-111111111111"),
			CategoryID:     catOrders.ID,
			CategoryNameFA: catOrders.NameFA,
			CategorySlug:   catOrders.Slug,
			AuthorNameFA:   "تیم پشتیبانی مشتریان",
			Slug:           "moringa-order-faq",
			TitleFA:        "پرسش‌های متداول درباره ثبت و پیگیری سفارش محصولات مورینگا",
			SummaryFA:      "پاسخ به سوالات رایج خریداران درباره روش‌های پرداخت، نحوه ارسال با پست پیشتاز، دریافت کد رهگیری و راه‌های ارتباط با پشتیبانی فروشگاه.",
			ContentFA: `# راهنمای جامع ثبت، پرداخت و رهگیری سفارشات

در این مطلب به متداول‌ترین پرسش‌های خریداران گرامی درباره مراحل ثبت سفارش تا تحویل مرسوله پاسخ می‌دهیم.

## ۱. نحوه ثبت سفارش و پرداخت آنلاین

خریداران می‌توانند محصولات مورد نظر را به سبد خرید اضافه نموده و از طریق درگاه‌های متصل به شبکه شتاب، پرداخت خود را به صورت امن انجام دهند.

## ۲. روش و زمان‌بندی ارسال سفارشات

- **روش ارسال**: کلیه مرسولات شهری و استانی از طریق پست پیشتاز در بسته‌بندی‌های ایمن و ضربه‌گیر ارسال می‌شوند.
- **زمان تحویل نمادین**: سفارشات معمولاً ظرف ۲ تا ۴ روز کاری به دست خریداران می‌رسد.

## ۳. دریافت کد رهگیری پستی

پس از تحویل مرسوله به شرکت پست، کد ۲۴ رقمی رهگیری از طریق پیامک برای خریدار ارسال شده و در بخش «پیگیری سفارش» سایت نیز قابل مشاهده است.

## ۴. راه‌های ارتباط با مرکز پشتیبانی

در صورت نیاز به راهنمایی قبل از خرید یا پیگیری مرسوله، می‌توانید از طریق چت آنلاین سایت یا بخش تماس با ما اقدام نمایید.

## جمع‌بندی

تیم مورینگا ایران متعهد به ارسال سریع، بسته‌بندی بهداشتی ایمن و پاسخگویی شفاف به کلیه سفارشات خریداران محترم می‌باشد.

*این مطلب صرفاً برای آشنایی عمومی است و جایگزین توصیه پزشک یا متخصص تغذیه نیست.*`,
			CoverImageURL:     "/images/demo/articles/moringa-order-faq.jpg",
			Status:            content.StatusPublished,
			Version:           1,
			DisclaimersFA:     generalDisclaimer,
			SEOTitle:          "سوالات متداول ثبت سفارش، پرداخت و ارسال - مورینگا ایران",
			SEODescription:    "پاسخ به تمامی سوالات خریداران درباره شیوه ثبت سفارش، پست پیشتاز، کد رهگیری و ارتباط با پشتیبانی.",
			PublishedAt:       timePtr(now.AddDate(0, 0, -1)),
			CreatedAt:         now.AddDate(0, 0, -1),
			UpdatedAt:         now.AddDate(0, 0, -1),
			Tags:              []string{"سوالات متداول", "پشتیبانی", "پیگیری سفارش"},
			RelatedProductIDs: []uuid.UUID{pwd100ID, teaLemonID},
		},
	}

	for _, a := range demoArticles {
		if err := contentSvc.AddArticleDirect(a); err != nil {
			return fmt.Errorf("failed to seed article %s: %w", a.Slug, err)
		}
	}

	contentSvc.RecordSeedExecution(DemoArticleSeedKey, 1, "content_cms", uuid.Nil)
	return nil
}

func timePtr(t time.Time) *time.Time {
	return &t
}
