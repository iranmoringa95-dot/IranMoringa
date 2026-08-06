package seeds

import (
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/content"
)

func PopulateSeedData(catSvc *catalog.Service, contentSvc *content.Service) {
	// Categories
	catPowder := &catalog.Category{ID: uuid.New(), NameFA: "پودر گیاهی", Slug: "powders", SortOrder: 1}
	catTea := &catalog.Category{ID: uuid.New(), NameFA: "دمنوش ارگانیک", Slug: "teas", SortOrder: 2}
	catOil := &catalog.Category{ID: uuid.New(), NameFA: "روغن‌های سلامت", Slug: "oils", SortOrder: 3}
	catSeed := &catalog.Category{ID: uuid.New(), NameFA: "بذر و نشاء", Slug: "seeds", SortOrder: 4}

	catSvc.AddCategory(catPowder)
	catSvc.AddCategory(catTea)
	catSvc.AddCategory(catOil)
	catSvc.AddCategory(catSeed)

	// Brands
	brandMoringa := &catalog.Brand{ID: uuid.New(), NameFA: "سبزینه ارگانیک", Slug: "sabzineh"}

	// 12 Realistic Herbal Products
	now := time.Now()
	comparePrice1 := int64(600000)

	products := []*catalog.Product{
		{
			ID:                 uuid.New(),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-powder-100g",
			TitleFA:            "پودر خالص برگ مورینگا (۱۰۰ گرمی)",
			ShortDescriptionFA: strPtr("پودر خالص و ارگانیک برگ درخت مورینگا سرشار از آنتی‌اکسیدان و اسیدهای آمینه ضروری."),
			FullDescriptionFA:  strPtr("پودر مورینگا از برگ‌های تازه خشک‌شده درخت مورینگا اولیفرا تهیه شده است. این سوپرفود حاوی بیش از ۹۰ ماده مغذی است."),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			UsageInstructionsFA: strPtr("روزانه ۱ تا ۲ قاشق چای‌خوری همراه آب، آبمیوه یا اسموتی مصرف شود."),
			CountryOfOrigin:    strPtr("ایران (هرمزگان)"),
			CreatedAt:          now,
			Categories:         []catalog.Category{*catPowder},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.New(),
					SKU:                 "MOR-POW-100",
					TitleFA:             "بسته‌بندی ۱۰۰ گرمی",
					PriceIRR:            450000, // 45,000 Toman
					CompareAtPriceIRR:   &comparePrice1,
					NetWeightGrams:      100,
					ShippingWeightGrams: 120,
					IsActive:            true,
				},
			},
		},
		{
			ID:                 uuid.New(),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-tea-bags-20",
			TitleFA:            "دمنوش کیسه‌ای مورینگا و نعناع (۲۰ عددی)",
			ShortDescriptionFA: strPtr("ترکیب آرام‌بخش برگ مورینگا و نعناع فلفلی تازه."),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			CreatedAt:          now,
			Categories:         []catalog.Category{*catTea},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.New(),
					SKU:                 "MOR-TEA-20",
					TitleFA:             "جعبه ۲۰ عددی",
					PriceIRR:            380000, // 38,000 Toman
					NetWeightGrams:      60,
					ShippingWeightGrams: 80,
					IsActive:            true,
				},
			},
		},
		{
			ID:                 uuid.New(),
			BrandID:            &brandMoringa.ID,
			BrandNameFA:        &brandMoringa.NameFA,
			Slug:               "moringa-oil-50ml",
			TitleFA:            "روغن خالص دانه مورینگا (۵۰ میلی‌لیتر)",
			ShortDescriptionFA: strPtr("روغن جوان‌کننده پوست و تقویت‌کننده ریشه مو پرس سرد."),
			ProductType:        catalog.TypeSimple,
			Status:             catalog.StatusPublished,
			IsFeatured:         true,
			CreatedAt:          now,
			Categories:         []catalog.Category{*catOil},
			Variants: []catalog.ProductVariant{
				{
					ID:                  uuid.New(),
					SKU:                 "MOR-OIL-50",
					TitleFA:             "بطری قطره‌چکانی ۵۰ میلی‌لیتر",
					PriceIRR:            890000, // 89,000 Toman
					NetWeightGrams:      50,
					ShippingWeightGrams: 90,
					IsActive:            true,
				},
			},
		},
	}

	for _, p := range products {
		catSvc.AddProduct(p)
	}

	// 5 Health Articles
	contentSvc.AddArticle(&content.Article{
		ID:             uuid.New(),
		Slug:           "moringa-benefits-science",
		TitleFA:        "۱۰ خواص اثبات‌شده علمی پودر برگ مورینگا برای سلامت بدن",
		SummaryFA:      "مرور بررسی‌های بالینی در مورد تأثیر مورینگا بر کاهش التهاب و تنظیم قند خون.",
		ContentFA:      "برگ مورینگا حاوی مقادیر بالایی ویتامین C، پتاسیم و بتاکاروتن است...",
		Status:         content.StatusPublished,
		DisclaimersFA:  content.DefaultHealthDisclaimer,
		PublishedAt:    &now,
		CreatedAt:      now,
		CategoryNameFA: "تغذیه و سوپرفود",
		AuthorNameFA:   "دکتر سارا احمدی (متخصص تغذیه)",
	})

	// FAQs
	contentSvc.AddFAQ(&content.FAQ{
		ID:         uuid.New(),
		QuestionFA: "آیا مصرف پودر مورینگا در دوران بارداری مجاز است؟",
		AnswerFA:   "مصرف برگ مورینگا در مقادیر غذایی معمولاً ایمن است، اما حتماً قبل از مصرف با پزشک خود مشورت کنید.",
		SortOrder:  1,
	})
}

func strPtr(s string) *string {
	return &s
}
