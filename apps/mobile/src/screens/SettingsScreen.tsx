import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { toPersianDigits } from '../utils/formatters';
import {
  Settings,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Info,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
} from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const {
    baseURL,
    setBaseURL,
    isOnline,
    checkServerConnection,
    refreshAll,
    orders,
    products,
    customers,
  } = useApp();

  const [inputURL, setInputURL] = useState<string>(baseURL);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (inputURL !== baseURL) {
        await setBaseURL(inputURL);
      }
      const ok = await checkServerConnection();
      setTestResult(ok ? 'success' : 'failed');
      if (ok) {
        Alert.alert('اتصال موفق', 'ارتباط با سرور بک‌اند با موفقیت برقرار شد.');
      } else {
        Alert.alert(
          'عدم برقراری ارتباط',
          'امکان اتصال به سرور در این آدرس وجود ندارد. در حالت آفلاین/دمو کار خواهید کرد.'
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleApplyPreset = (presetUrl: string) => {
    setInputURL(presetUrl);
  };

  const handleResetData = async () => {
    Alert.alert('تازه‌سازی داده‌ها', 'آیا مایلید تمام داده‌ها مجدداً از سرور دریافت شوند؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'تایید و تازه‌سازی',
        onPress: async () => {
          await refreshAll();
          Alert.alert('موفقیت', 'داده‌ها با موفقیت به‌روز شدند.');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="تنظیمات و وضعیت سیستم" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Server Connection Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.statusPill,
                isOnline ? styles.statusPillOnline : styles.statusPillOffline,
              ]}
            >
              {isOnline ? (
                <Wifi size={12} color="#059669" />
              ) : (
                <WifiOff size={12} color="#dc2626" />
              )}
              <Text
                style={[
                  styles.statusPillText,
                  isOnline ? styles.statusPillTextOnline : styles.statusPillTextOffline,
                ]}
              >
                {isOnline ? 'متصل به سرور' : 'حالت دمو / آفلاین'}
              </Text>
            </View>
            <View style={styles.cardHeaderTitleGroup}>
              <Text style={styles.sectionTitle}>پیکربندی سرور API بک‌اند</Text>
              <Server size={18} color={colors.primary[700]} />
            </View>
          </View>

          <View style={styles.divider} />

          <Input
            label="آدرس پایه سرور (Base URL)"
            placeholder="http://10.0.2.2:8080/api/v1"
            value={inputURL}
            onChangeText={setInputURL}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.presetsLabel}>آدرس‌های پیش‌فرض و سرورها:</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[styles.presetBtn, styles.presetBtnPrimary]}
              onPress={() => handleApplyPreset('https://iranmoringa.iranmoringa95.workers.dev/api/v1')}
            >
              <Text style={[styles.presetBtnText, styles.presetBtnTextPrimary]}>
                سرور ابری کلودفلر (Cloudflare Workers)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleApplyPreset('http://10.0.2.2:8080/api/v1')}
            >
              <Text style={styles.presetBtnText}>شبیه‌ساز اندروید (10.0.2.2)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleApplyPreset('http://localhost:8080/api/v1')}
            >
              <Text style={styles.presetBtnText}>لوکال هاست (Web)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <Button
              title="تست و ذخیره اتصال"
              onPress={handleTestConnection}
              loading={isTesting}
              variant="primary"
              icon={<CheckCircle2 size={16} color={colors.neutral.white} />}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Cache & Data Diagnostics */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>حافظه و داده‌های اپلیکیشن</Text>
            <RefreshCw size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticValue}>
              {toPersianDigits(orders.length)} رکورد
            </Text>
            <Text style={styles.diagnosticLabel}>تعداد سفارش‌های ذخیره‌شده:</Text>
          </View>

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticValue}>
              {toPersianDigits(products.length)} کالا
            </Text>
            <Text style={styles.diagnosticLabel}>تعداد کالاهای کاتالوگ:</Text>
          </View>

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticValue}>
              {toPersianDigits(customers.length)} پرونده
            </Text>
            <Text style={styles.diagnosticLabel}>تعداد مشتریان در حافظه:</Text>
          </View>

          <Button
            title="همگام‌سازی و تازه‌سازی کامل داده‌ها"
            onPress={handleResetData}
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} color={colors.neutral[800]} />}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        {/* Application Info Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>درباره اپلیکیشن</Text>
            <Smartphone size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticValue}>۱.۰.۰</Text>
            <Text style={styles.diagnosticLabel}>نسخه نرم‌افزار:</Text>
          </View>

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticValue}>فروشگاه سبزینه (MoringaLab)</Text>
            <Text style={styles.diagnosticLabel}>سیستم متصل:</Text>
          </View>

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticValue}>تومان (۱۰ ریال = ۱ تومان)</Text>
            <Text style={styles.diagnosticLabel}>واحد پولی سیستم:</Text>
          </View>

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticValue}>فارسی (تقویم هجری شمسی)</Text>
            <Text style={styles.diagnosticLabel}>زبان و تقویم:</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusPillOnline: {
    backgroundColor: '#d1fae5',
  },
  statusPillOffline: {
    backgroundColor: '#fee2e2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusPillTextOnline: {
    color: '#059669',
  },
  statusPillTextOffline: {
    color: '#dc2626',
  },
  presetsLabel: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  presetBtn: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  presetBtnPrimary: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  presetBtnText: {
    fontSize: 11,
    color: colors.neutral[700],
  },
  presetBtnTextPrimary: {
    color: colors.primary[800],
    fontWeight: 'bold',
  },
  actionRow: {
    marginTop: spacing.xs,
  },
  diagnosticRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  diagnosticLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  diagnosticValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
});
