import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  total_toman: number;
  message: string;
  created_at: string;
  read: boolean;
}

const STORAGE_KEY_NOTIFS = '@moringalab_notifications';
const STORAGE_KEY_SETTINGS = '@moringalab_notif_settings';

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  pollingIntervalSeconds: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  pollingIntervalSeconds: 6,
};

class NotificationService {
  private settings: NotificationSettings = { ...DEFAULT_SETTINGS };
  private listeners: Array<(notif: AppNotification) => void> = [];
  private audioContext: any = null;

  async init(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save notification settings:', e);
    }
  }

  subscribe(listener: (notif: AppNotification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Play a pleasant 2-tone order chime using Web Audio or System sound
  playOrderChime(): void {
    if (!this.settings.soundEnabled) return;

    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        const ctx = this.audioContext;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;

        // Tone 1: 587.33 Hz (D5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Tone 2: 880 Hz (A5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.15);
        gain2.gain.setValueAtTime(0.4, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  triggerVibration(): void {
    if (!this.settings.vibrateEnabled) return;
    try {
      Vibration.vibrate([0, 250, 100, 250]);
    } catch {
      // ignore
    }
  }

  async notifyNewOrder(order: {
    id: string;
    order_number: string;
    recipient_name: string;
    total_irr: number;
  }): Promise<AppNotification> {
    const totalToman = Math.floor(order.total_irr / 10);
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.recipient_name,
      total_toman: totalToman,
      message: `سفارش جدید #${order.order_number} از طرف ${order.recipient_name} به مبلغ ${totalToman.toLocaleString('fa-IR')} تومان ثبت شد.`,
      created_at: new Date().toISOString(),
      read: false,
    };

    // 1. Play sound
    this.playOrderChime();

    // 2. Trigger vibration
    this.triggerVibration();

    // 3. Save to history
    await this.saveNotification(notif);

    // 4. Notify app listeners
    for (const listener of this.listeners) {
      try {
        listener(notif);
      } catch (err) {
        console.warn('Listener notification error:', err);
      }
    }

    return notif;
  }

  private async saveNotification(notif: AppNotification): Promise<void> {
    try {
      const existing = await this.getNotifications();
      const updated = [notif, ...existing].slice(0, 50); // keep last 50
      await AsyncStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save notification:', e);
    }
  }

  async getNotifications(): Promise<AppNotification[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_NOTIFS);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return [];
  }

  async markAllAsRead(): Promise<void> {
    try {
      const notifs = await this.getNotifications();
      const updated = notifs.map((n) => ({ ...n, read: true }));
      await AsyncStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to mark all notifications read:', e);
    }
  }

  async testNotification(): Promise<AppNotification> {
    return this.notifyNewOrder({
      id: `test-ord-${Date.now()}`,
      order_number: `MOR-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      recipient_name: 'آزمایش سیستم اعلان (نمونه)',
      total_irr: 3500000,
    });
  }
}

export const notificationService = new NotificationService();
