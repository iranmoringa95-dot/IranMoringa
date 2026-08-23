import fs from 'fs';
import path from 'path';

export interface SupportWidgetConfig {
  consultantName: string;
  consultantTitle: string;
  consultantRoleDesc: string;
  avatarEmoji: string;
  avatarUrl: string;
  phone: string;
  phoneDisplay: string;
  telegramHandle: string;
  telegramUrl: string;
  baleUrl: string;
  whatsappUrl: string;
  whatsappNumber: string;
  workingHours: string;
  responseTime: string;
  enableWidget: boolean;
  enableGreetingBubble: boolean;
  greetingMessage: string;
  updatedAt?: string;
}

const CONFIG_DIR = path.join(process.cwd(), '.config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'support-config.json');

export const DEFAULT_SUPPORT_CONFIG: SupportWidgetConfig = {
  consultantName: 'آقای کامیاب',
  consultantTitle: 'مشاور تخصصی و پاسخگوی سفارشات',
  consultantRoleDesc: 'کارشناس گیاهان دارویی و سوپرفود مورینگا',
  avatarEmoji: '👨‍💼',
  avatarUrl: '',
  phone: '09175929345',
  phoneDisplay: '۰۹۱۷۵۹۲۹۳۴۵',
  telegramHandle: '@Iranmoringa95',
  telegramUrl: 'https://t.me/Iranmoringa95',
  baleUrl: 'https://ble.ir/iranmoringa',
  whatsappUrl: 'https://wa.me/989175929345',
  whatsappNumber: '09175929345',
  workingHours: 'همه‌روزه ۸:۰۰ الی ۲۲:۰۰',
  responseTime: 'کمتر از ۵ دقیقه',
  enableWidget: true,
  enableGreetingBubble: true,
  greetingMessage: 'سلام! سوالی درباره خواص یا مصرف مورینگا دارید؟ در پیام‌رسان بله، واتس‌اپ یا تلگرام پاسخگوی شما هستم.',
};

export function getSupportConfig(): SupportWidgetConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SUPPORT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error('[SupportConfig] Failed to read config from file:', err);
  }
  return { ...DEFAULT_SUPPORT_CONFIG };
}

export function saveSupportConfig(config: Partial<SupportWidgetConfig>): SupportWidgetConfig {
  const current = getSupportConfig();
  const updated: SupportWidgetConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SupportConfig] Failed to save config to file:', err);
  }

  return updated;
}
