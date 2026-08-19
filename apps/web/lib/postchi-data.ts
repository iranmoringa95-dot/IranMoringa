export type CarrierType = 'irpost' | 'tipax' | 'chapar' | 'courier';

export interface PostchiEvent {
  step_number: number;
  title: string;
  location: string;
  description: string;
  timestamp: string;
  is_completed: boolean;
  is_current: boolean;
  officer_name?: string;
}

export interface PostchiShipment {
  id: string;
  order_number: string;
  tracking_code: string;
  carrier: CarrierType;
  carrier_title_fa: string;
  service_type_fa: string; // پیشتاز، اکسپرس، سفارشی
  sender_name: string;
  sender_province: string;
  sender_city: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_province: string;
  recipient_city: string;
  recipient_address: string;
  recipient_postal_code: string;
  weight_grams: number;
  postage_fee_irr: number;
  status: 'accepted' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';
  status_title_fa: string;
  postman_name?: string;
  postman_phone?: string;
  delivery_timestamp?: string;
  events: PostchiEvent[];
  created_at: string;
}

export interface PostchiSettings {
  sms_provider: 'kavenegar' | 'farazsms' | 'smsir' | 'melipayamak';
  sms_api_key: string;
  sms_pattern_code: string;
  sms_enabled: boolean;
  bale_bot_token: string;
  bale_chat_id: string;
  bale_enabled: boolean;
  rubika_bot_token: string;
  rubika_chat_id: string;
  rubika_enabled: boolean;
  auto_notify_on_shipped: boolean;
  sender_title: string;
  sender_address: string;
  sender_postal_code: string;
  sender_phone: string;
}

export let DEFAULT_POSTCHI_SETTINGS: PostchiSettings = {
  sms_provider: 'farazsms',
  sms_api_key: 'FARAZ-SECRET-KEY-998124',
  sms_pattern_code: 'moringa_track_p1',
  sms_enabled: true,
  bale_bot_token: 'bot149812498:AAE9q_moringa_sample',
  bale_chat_id: '@moringa_iran_orders',
  bale_enabled: true,
  rubika_bot_token: 'rubika_token_991823',
  rubika_chat_id: '@moringa_iran_channel',
  rubika_enabled: true,
  auto_notify_on_shipped: true,
  sender_title: 'فروشگاه تخصصی ایران مورینگا',
  sender_address: 'استان هرمزگان، بندرعباس، مجتمع کشاورزی و فرآوری مورینگا، پلاک ۱۲',
  sender_postal_code: '7918812345',
  sender_phone: '09175929345',
};

export let POSTCHI_SHIPMENTS: PostchiShipment[] = [
  {
    id: 'postchi-001',
    order_number: 'ML-1405-000123',
    tracking_code: '140508170098234567123456',
    carrier: 'irpost',
    carrier_title_fa: 'شرکت ملی پست جمهوری اسلامی ایران',
    service_type_fa: 'پست پیشتاز',
    sender_name: 'مورینگا ایران (فاتحان فراز سبز)',
    sender_province: 'هرمزگان',
    sender_city: 'بندرعباس',
    recipient_name: 'دکتر مریم رادمنش',
    recipient_phone: '09121234567',
    recipient_province: 'تهران',
    recipient_city: 'تهران',
    recipient_address: 'خیابان ولیعصر، بالاتر از میدان ونک، خیابان نگار، پلاک ۲۴، واحد ۶',
    recipient_postal_code: '1969712345',
    weight_grams: 450,
    postage_fee_irr: 450000,
    status: 'out_for_delivery',
    status_title_fa: 'در دست مأمور توزیع (پستچی)',
    postman_name: 'آقای علی رضایی (منطقه پستی ۱۵)',
    postman_phone: '۰۹۳۵۱۲۳۴۵۶۷',
    created_at: '2026-08-16T09:15:00Z',
    events: [
      {
        step_number: 1,
        title: 'قبول مرسوله در باجه مبدا',
        location: 'دفتر پستی مرکزی بندرعباس (کد ۷۹۰۰۰)',
        description: 'مرسوله توسط فرستنده تحویل داده شد و بارکد ۲۴ رقمی صادر گردید.',
        timestamp: '۱۴۰۵/۰۵/۲۶ - ساعت ۱۰:۳۰',
        is_completed: true,
        is_current: false,
      },
      {
        step_number: 2,
        title: 'خروج از مرکز تجزیه و مبادلات مبدا',
        location: 'مرکز تجزیه پستی استان هرمزگان',
        description: 'ارسال با خط هوایی پستی به مرکز مکانیزه تهران.',
        timestamp: '۱۴۰۵/۰۵/۲۶ - ساعت ۱۶:۴۵',
        is_completed: true,
        is_current: false,
      },
      {
        step_number: 3,
        title: 'ورود به مرکز مبادلات مکانیزه مقصد',
        location: 'مرکز پستی چهارراه لشکر تهران',
        description: 'بسته‌بندی پردازش و به منطقه پستی ۱۵ اختصاص داده شد.',
        timestamp: '۱۴۰۵/۰۵/۲۷ - ساعت ۰۵:۱۵',
        is_completed: true,
        is_current: false,
      },
      {
        step_number: 4,
        title: 'تخصیص به نامه‌رسان و خروج جهت توزیع',
        location: 'منطقه ۱۵ پستی تهران',
        description: 'مرسوله جهت تحویل نهایی به مامور توزیع (آقای علی رضایی) سپرده شد.',
        timestamp: '۱۴۰۵/۰۵/۲۷ - ساعت ۰۸:۴۵',
        is_completed: true,
        is_current: true,
        officer_name: 'آقای علی رضایی',
      },
      {
        step_number: 5,
        title: 'تحویل به گیرنده',
        location: 'نشانی گیرنده',
        description: 'تحویل مرسوله و اخذ امضای الکترونیک گیرنده.',
        timestamp: 'در انتظار مراجعه مامور',
        is_completed: false,
        is_current: false,
      },
    ],
  },
  {
    id: 'postchi-002',
    order_number: 'ML-1405-000124',
    tracking_code: 'TPX-9981245012',
    carrier: 'tipax',
    carrier_title_fa: 'شرکت خدمات پستی تیپاکس',
    service_type_fa: 'سریع تیپاکس (اکسپرس)',
    sender_name: 'مورینگا ایران',
    sender_province: 'هرمزگان',
    sender_city: 'بندرعباس',
    recipient_name: 'سارا کاظمی',
    recipient_phone: '09139876543',
    recipient_province: 'اصفهان',
    recipient_city: 'اصفهان',
    recipient_address: 'خیابان نظر شرقی، مجتمع مریم، طبقه ۳',
    recipient_postal_code: '8164811223',
    weight_grams: 820,
    postage_fee_irr: 680000,
    status: 'delivered',
    status_title_fa: 'تحویل داده شده',
    postman_name: 'نمایندگی تیپاکس اصفهان مرکز',
    delivery_timestamp: '۱۴۰۵/۰۵/۲۵ - ساعت ۱۱:۲۰',
    created_at: '2026-08-14T08:00:00Z',
    events: [
      {
        step_number: 1,
        title: 'ثبت و تحویل به تیپاکس‌یار',
        location: 'نمایندگی تیپاکس بندرعباس',
        description: 'بارنامه الکترونیک صادر شد.',
        timestamp: '۱۴۰۵/۰۵/۲۴ - ساعت ۱۱:۰۰',
        is_completed: true,
        is_current: false,
      },
      {
        step_number: 2,
        title: 'حمل در هاب ترانزیت',
        location: 'هاب مرکزی ترابری تیپاکس',
        description: 'خروج به سمت هاب اصفهان.',
        timestamp: '۱۴۰۵/۰۵/۲۴ - ساعت ۲۱:۳۰',
        is_completed: true,
        is_current: false,
      },
      {
        step_number: 3,
        title: 'تحویل به گیرنده',
        location: 'اصفهان، خیابان نظر شرقی',
        description: 'مرسوله با موفقیت تحویل خانم سارا کاظمی شد.',
        timestamp: '۱۴۰۵/۰۵/۲۵ - ساعت ۱۱:۲۰',
        is_completed: true,
        is_current: false,
      },
    ],
  },
  {
    id: 'postchi-003',
    order_number: 'ML-1405-000125',
    tracking_code: '140508170098234567998877',
    carrier: 'irpost',
    carrier_title_fa: 'شرکت ملی پست جمهوری اسلامی ایران',
    service_type_fa: 'پست پیشتاز',
    sender_name: 'مورینگا ایران',
    sender_province: 'هرمزگان',
    sender_city: 'بندرعباس',
    recipient_name: 'مهدی خسروی',
    recipient_phone: '09171112233',
    recipient_province: 'فارس',
    recipient_city: 'شیراز',
    recipient_address: 'بلوار زند، جنب هتل پارس، کوچه ۴، پلاک ۱۸',
    recipient_postal_code: '7134812345',
    weight_grams: 1200,
    postage_fee_irr: 520000,
    status: 'in_transit',
    status_title_fa: 'در حال ارسال بین مراکز پستی',
    created_at: '2026-08-16T14:30:00Z',
    events: [
      {
        step_number: 1,
        title: 'قبول مرسوله در باجه پستی',
        location: 'دفتر پستی مبدا بندرعباس',
        description: 'مرسوله دریافت و ثبت سیستم شد.',
        timestamp: '۱۴۰۵/۰۵/۲۶ - ساعت ۱۵:۱۰',
        is_completed: true,
        is_current: false,
      },
      {
        step_number: 2,
        title: 'ارسال به هاب شیراز',
        location: 'خط ترانزیت جاده‌ای پست جنوب',
        description: 'مرسوله در راه مرکز مبادلات استان فارس می‌باشد.',
        timestamp: '۱۴۰۵/۰۵/۲۶ - ساعت ۲۲:۰۰',
        is_completed: true,
        is_current: true,
      },
      {
        step_number: 3,
        title: 'توزیع در مقصد',
        location: 'منطقه پستی شیراز',
        description: 'در صف توزیع توسط پستچی.',
        timestamp: 'به زودی',
        is_completed: false,
        is_current: false,
      },
    ],
  },
];

export function lookupPostchiShipment(query: string): PostchiShipment | null {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return null;

  return (
    POSTCHI_SHIPMENTS.find(
      (s) =>
        s.tracking_code.toLowerCase() === cleanQ ||
        s.order_number.toLowerCase() === cleanQ ||
        s.recipient_phone.includes(cleanQ) ||
        cleanQ.includes(s.recipient_phone)
    ) || null
  );
}

export function createOrUpdatePostchiShipment(shipment: Partial<PostchiShipment> & { order_number: string; tracking_code: string }): PostchiShipment {
  const existingIdx = POSTCHI_SHIPMENTS.findIndex(
    (s) => s.order_number === shipment.order_number || s.tracking_code === shipment.tracking_code
  );

  const newShipment: PostchiShipment = {
    id: shipment.id || `postchi-${Date.now()}`,
    order_number: shipment.order_number,
    tracking_code: shipment.tracking_code,
    carrier: shipment.carrier || 'irpost',
    carrier_title_fa:
      shipment.carrier === 'tipax'
        ? 'شرکت خدمات پستی تیپاکس'
        : shipment.carrier === 'chapar'
        ? 'شرکت پست چاپار'
        : shipment.carrier === 'courier'
        ? 'پیک درون‌شهری اکسپرس'
        : 'شرکت ملی پست جمهوری اسلامی ایران',
    service_type_fa: shipment.service_type_fa || 'پست پیشتاز',
    sender_name: shipment.sender_name || DEFAULT_POSTCHI_SETTINGS.sender_title,
    sender_province: shipment.sender_province || 'هرمزگان',
    sender_city: shipment.sender_city || 'بندرعباس',
    recipient_name: shipment.recipient_name || 'مشتری گرامی',
    recipient_phone: shipment.recipient_phone || '',
    recipient_province: shipment.recipient_province || 'تهران',
    recipient_city: shipment.recipient_city || 'تهران',
    recipient_address: shipment.recipient_address || '',
    recipient_postal_code: shipment.recipient_postal_code || '',
    weight_grams: shipment.weight_grams || 500,
    postage_fee_irr: shipment.postage_fee_irr || 450000,
    status: shipment.status || 'in_transit',
    status_title_fa: shipment.status_title_fa || 'در حال ارسال پستی',
    postman_name: shipment.postman_name || 'نامه‌رسان منطقه',
    created_at: shipment.created_at || new Date().toISOString(),
    events: shipment.events || [
      {
        step_number: 1,
        title: 'قبول و بارکدگذاری مرسوله',
        location: 'دفتر پستی مبدا',
        description: 'مرسوله توسط انبار تحویل باجه پستی گردید.',
        timestamp: new Date().toLocaleString('fa-IR'),
        is_completed: true,
        is_current: false,
      },
      {
        step_number: 2,
        title: 'ارسال به مرکز مبادلات پستی مقصد',
        location: 'مرکز تجزیه و مبادلات',
        description: 'بسته در حال انتقال بین مراکز پستی است.',
        timestamp: new Date().toLocaleString('fa-IR'),
        is_completed: true,
        is_current: true,
      },
      {
        step_number: 3,
        title: 'تحویل به نامه‌رسان جهت توزیع',
        location: 'منطقه پستی مقصد',
        description: 'در نوبت تحویل به گیرنده.',
        timestamp: 'به زودی',
        is_completed: false,
        is_current: false,
      },
    ],
  };

  if (existingIdx >= 0) {
    POSTCHI_SHIPMENTS[existingIdx] = { ...POSTCHI_SHIPMENTS[existingIdx], ...newShipment };
    return POSTCHI_SHIPMENTS[existingIdx];
  } else {
    POSTCHI_SHIPMENTS.unshift(newShipment);
    return newShipment;
  }
}
