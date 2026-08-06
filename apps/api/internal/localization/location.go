package localization

type City struct {
	ID         string `json:"id"`
	ProvinceID string `json:"province_id"`
	NameFA     string `json:"name_fa"`
}

type Province struct {
	ID     string `json:"id"`
	NameFA string `json:"name_fa"`
	Cities []City `json:"cities"`
}

var provincesDataset = []Province{
	{
		ID:     "TEH",
		NameFA: "تهران",
		Cities: []City{
			{ID: "TEH-01", ProvinceID: "TEH", NameFA: "تهران"},
			{ID: "TEH-02", ProvinceID: "TEH", NameFA: "شهریار"},
			{ID: "TEH-03", ProvinceID: "TEH", NameFA: "ری"},
			{ID: "TEH-04", ProvinceID: "TEH", NameFA: "اسلامشهر"},
			{ID: "TEH-05", ProvinceID: "TEH", NameFA: "پردیس"},
		},
	},
	{
		ID:     "ISF",
		NameFA: "اصفهان",
		Cities: []City{
			{ID: "ISF-01", ProvinceID: "ISF", NameFA: "اصفهان"},
			{ID: "ISF-02", ProvinceID: "ISF", NameFA: "کاشان"},
			{ID: "ISF-03", ProvinceID: "ISF", NameFA: "نجف‌آباد"},
			{ID: "ISF-04", ProvinceID: "ISF", NameFA: "شاهین‌شهر"},
		},
	},
	{
		ID:     "FAR",
		NameFA: "فارس",
		Cities: []City{
			{ID: "FAR-01", ProvinceID: "FAR", NameFA: "شیراز"},
			{ID: "FAR-02", ProvinceID: "FAR", NameFA: "مرودشت"},
			{ID: "FAR-03", ProvinceID: "FAR", NameFA: "جهرم"},
		},
	},
	{
		ID:     "KHD",
		NameFA: "خراسان رضوی",
		Cities: []City{
			{ID: "KHD-01", ProvinceID: "KHD", NameFA: "مشهد"},
			{ID: "KHD-02", ProvinceID: "KHD", NameFA: "نیشابور"},
			{ID: "KHD-03", ProvinceID: "KHD", NameFA: "سبزوار"},
		},
	},
	{
		ID:     "EAZ",
		NameFA: "آذربایجان شرقی",
		Cities: []City{
			{ID: "EAZ-01", ProvinceID: "EAZ", NameFA: "تبریز"},
			{ID: "EAZ-02", ProvinceID: "EAZ", NameFA: "مراغه"},
			{ID: "EAZ-03", ProvinceID: "EAZ", NameFA: "مرند"},
		},
	},
	{
		ID:     "GIL",
		NameFA: "گیلان",
		Cities: []City{
			{ID: "GIL-01", ProvinceID: "GIL", NameFA: "رشت"},
			{ID: "GIL-02", ProvinceID: "GIL", NameFA: "بندر انزلی"},
			{ID: "GIL-03", ProvinceID: "GIL", NameFA: "لاهیجان"},
		},
	},
	{
		ID:     "KHZ",
		NameFA: "خوزستان",
		Cities: []City{
			{ID: "KHZ-01", ProvinceID: "KHZ", NameFA: "اهواز"},
			{ID: "KHZ-02", ProvinceID: "KHZ", NameFA: "دزفول"},
			{ID: "KHZ-03", ProvinceID: "KHZ", NameFA: "آبادان"},
		},
	},
	{
		ID:     "MAZ",
		NameFA: "مازندران",
		Cities: []City{
			{ID: "MAZ-01", ProvinceID: "MAZ", NameFA: "ساری"},
			{ID: "MAZ-02", ProvinceID: "MAZ", NameFA: "بابل"},
			{ID: "MAZ-03", ProvinceID: "MAZ", NameFA: "آمل"},
		},
	},
	{
		ID:     "ALZ",
		NameFA: "البرز",
		Cities: []City{
			{ID: "ALZ-01", ProvinceID: "ALZ", NameFA: "کرج"},
			{ID: "ALZ-02", ProvinceID: "ALZ", NameFA: "فردیس"},
			{ID: "ALZ-03", ProvinceID: "ALZ", NameFA: "هشتگرد"},
		},
	},
	{
		ID:     "QOM",
		NameFA: "قم",
		Cities: []City{
			{ID: "QOM-01", ProvinceID: "QOM", NameFA: "قم"},
		},
	},
}

// GetProvinces returns the dataset of Iranian provinces and cities.
func GetProvinces() []Province {
	return provincesDataset
}
