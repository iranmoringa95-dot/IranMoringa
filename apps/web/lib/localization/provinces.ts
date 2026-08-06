export interface City {
  id: string;
  province_id: string;
  name_fa: string;
}

export interface Province {
  id: string;
  name_fa: string;
  cities: City[];
}

export const PROVINCES_DATASET: Province[] = [
  {
    id: 'TEH',
    name_fa: 'تهران',
    cities: [
      { id: 'TEH-01', province_id: 'TEH', name_fa: 'تهران' },
      { id: 'TEH-02', province_id: 'TEH', name_fa: 'شهریار' },
      { id: 'TEH-03', province_id: 'TEH', name_fa: 'ری' },
      { id: 'TEH-04', province_id: 'TEH', name_fa: 'اسلامشهر' },
      { id: 'TEH-05', province_id: 'TEH', name_fa: 'پردیس' },
    ],
  },
  {
    id: 'ISF',
    name_fa: 'اصفهان',
    cities: [
      { id: 'ISF-01', province_id: 'ISF', name_fa: 'اصفهان' },
      { id: 'ISF-02', province_id: 'ISF', name_fa: 'کاشان' },
      { id: 'ISF-03', province_id: 'ISF', name_fa: 'نجف‌آباد' },
      { id: 'ISF-04', province_id: 'ISF', name_fa: 'شاهین‌شهر' },
    ],
  },
  {
    id: 'FAR',
    name_fa: 'فارس',
    cities: [
      { id: 'FAR-01', province_id: 'FAR', name_fa: 'شیراز' },
      { id: 'FAR-02', province_id: 'FAR', name_fa: 'مرودشت' },
      { id: 'FAR-03', province_id: 'FAR', name_fa: 'جهرم' },
    ],
  },
  {
    id: 'KHD',
    name_fa: 'خراسان رضوی',
    cities: [
      { id: 'KHD-01', province_id: 'KHD', name_fa: 'مشهد' },
      { id: 'KHD-02', province_id: 'KHD', name_fa: 'نیشابور' },
      { id: 'KHD-03', province_id: 'KHD', name_fa: 'سبزوار' },
    ],
  },
  {
    id: 'EAZ',
    name_fa: 'آذربایجان شرقی',
    cities: [
      { id: 'EAZ-01', province_id: 'EAZ', name_fa: 'تبریز' },
      { id: 'EAZ-02', province_id: 'EAZ', name_fa: 'مراغه' },
      { id: 'EAZ-03', province_id: 'EAZ', name_fa: 'مرند' },
    ],
  },
  {
    id: 'GIL',
    name_fa: 'گیلان',
    cities: [
      { id: 'GIL-01', province_id: 'GIL', name_fa: 'رشت' },
      { id: 'GIL-02', province_id: 'GIL', name_fa: 'بندر انزلی' },
      { id: 'GIL-03', province_id: 'GIL', name_fa: 'لاهیجان' },
    ],
  },
  {
    id: 'KHZ',
    name_fa: 'خوزستان',
    cities: [
      { id: 'KHZ-01', province_id: 'KHZ', name_fa: 'اهواز' },
      { id: 'KHZ-02', province_id: 'KHZ', name_fa: 'دزفول' },
      { id: 'KHZ-03', province_id: 'KHZ', name_fa: 'آبادان' },
    ],
  },
  {
    id: 'MAZ',
    name_fa: 'مازندران',
    cities: [
      { id: 'MAZ-01', province_id: 'MAZ', name_fa: 'ساری' },
      { id: 'MAZ-02', province_id: 'MAZ', name_fa: 'بابل' },
      { id: 'MAZ-03', province_id: 'MAZ', name_fa: 'آمل' },
    ],
  },
  {
    id: 'ALZ',
    name_fa: 'البرز',
    cities: [
      { id: 'ALZ-01', province_id: 'ALZ', name_fa: 'کرج' },
      { id: 'ALZ-02', province_id: 'ALZ', name_fa: 'فردیس' },
      { id: 'ALZ-03', province_id: 'ALZ', name_fa: 'هشتگرد' },
    ],
  },
  {
    id: 'QOM',
    name_fa: 'قم',
    cities: [
      { id: 'QOM-01', province_id: 'QOM', name_fa: 'قم' },
    ],
  },
];
