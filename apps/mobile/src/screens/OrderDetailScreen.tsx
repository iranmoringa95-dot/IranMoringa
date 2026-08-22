import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { OrderBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { formatDirectToman, formatJalaliDate, toPersianDigits } from '../utils/formatters';
import { OrderStatus } from '../types';
import {
  Phone,
  MessageSquare,
  MapPin,
  Package,
  Truck,
  FileText,
  CheckCircle,
  XCircle,
  Share2,
  Clock,
  Send,
  User,
} from 'lucide-react-native';

interface OrderDetailScreenProps {
  orderId: string;
  onBack: () => void;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({
  orderId,
  onBack,
}) => {
  const { orders, updateOrderStatus } = useApp();
  const [statusModalVisible, setStatusModalVisible] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('shipped');
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const order = orders.find((o) => o.id === orderId || o.order_number === orderId);

  if (!order) {
    return (
      <View style={styles.container}>
        <Header title="جزئیات سفارش" onBack={onBack} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>سفارش مورد نظر یافت نشد</Text>
          <Button title="بازگشت" onPress={onBack} variant="outline" style={{ marginTop: spacing.md }} />
        </View>
      </View>
    );
  }

  const handleCallCustomer = () => {
    const phone = order.address.recipient_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleSMSCustomer = () => {
    const phone = order.address.recipient_phone;
    if (phone) {
      const msg = encodeURIComponent(
        `سلام ${order.address.recipient_name} عزیز، وضعیت سفارش شما (${order.order_number}) در فروشگاه سبزینه به‌روزرسانی شد.`
      );
      Linking.openURL(`sms:${phone}${Platform.OS === 'ios' ? '&' : '?'}body=${msg}`);
    }
  };

  const handleOpenStatusModal = () => {
    setNewStatus(order.status === 'processing' ? 'shipped' : order.status);
    setTrackingCode(order.tracking_code || '');
    setStatusModalVisible(true);
  };

  const handleSaveStatus = async () => {
    if (newStatus === 'shipped' && !trackingCode.trim()) {
      Alert.alert('خطا', 'ثبت کد رهگیری پستی برای وضعیت ارسال شده الزامی است');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateOrderStatus(order.id, newStatus, trackingCode, adminNote);
      if (success) {
        setStatusModalVisible(false);
        Alert.alert('موفقیت', 'وضعیت سفارش با موفقیت به‌روزرسانی شد');
      } else {
        Alert.alert('خطا', 'به‌روزرسانی وضعیت با خطا مواجه شد');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={`سفارش ${toPersianDigits(order.order_number)}`}
        subtitle={formatJalaliDate(order.created_at)}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <OrderBadge status={order.status} />
            <Text style={styles.statusSectionTitle}>وضعیت فعلی سفارش</Text>
          </View>

          {order.tracking_code ? (
            <View style={styles.trackingBox}>
              <Text style={styles.trackingCodeText}>
                {toPersianDigits(order.tracking_code)}
              </Text>
              <Text style={styles.trackingLabel}>کد رهگیری مرسوله:</Text>
            </View>
          ) : null}

          <View style={styles.statusActionsRow}>
            <Button
              title="تغییر وضعیت سفارش"
              onPress={handleOpenStatusModal}
              variant="primary"
              size="sm"
              icon={<Send size={14} color={colors.neutral.white} />}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Customer & Shipping Address Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionHeaderTitle}>اطلاعات تحویل‌گیرنده و آدرس</Text>
            <User size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{order.address.recipient_name}</Text>
            <Text style={styles.infoLabel}>نام و نام خانوادگی:</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {toPersianDigits(order.address.recipient_phone)}
            </Text>
            <Text style={styles.infoLabel}>شماره تماس:</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {order.address.province}، {order.address.city}
            </Text>
            <Text style={styles.infoLabel}>استان و شهر:</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{order.address.postal_address}</Text>
            <Text style={styles.infoLabel}>نشانی کامل:</Text>
          </View>

          {order.address.postal_code ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>
                {toPersianDigits(order.address.postal_code)}
              </Text>
              <Text style={styles.infoLabel}>کد پستی:</Text>
            </View>
          ) : null}

          {/* Quick Contact Bar */}
          <View style={styles.contactBar}>
            <TouchableOpacity
              style={[styles.contactButton, styles.callButton]}
              onPress={handleCallCustomer}
              activeOpacity={0.7}
            >
              <Phone size={16} color={colors.primary[700]} />
              <Text style={styles.callButtonText}>تماس مستقیم</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactButton, styles.smsButton]}
              onPress={handleSMSCustomer}
              activeOpacity={0.7}
            >
              <MessageSquare size={16} color={colors.accent.blue} />
              <Text style={styles.smsButtonText}>ارسال پیامک</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Ordered Items Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionHeaderTitle}>
              اقلام سفارش ({toPersianDigits(order.items.length)} ردیف)
            </Text>
            <Package size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          {order.items.map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <View style={styles.itemPriceCol}>
                <Text style={styles.itemSubtotal}>
                  {formatDirectToman(Math.floor(item.subtotal_irr / 10))}
                </Text>
                <Text style={styles.itemUnitPrice}>
                  واحد: {formatDirectToman(Math.floor(item.unit_price_irr / 10))}
                </Text>
              </View>

              <View style={styles.itemInfoCol}>
                <Text style={styles.itemTitle}>{item.product_title}</Text>
                <View style={styles.itemMetaRow}>
                  <Text style={styles.itemQuantity}>
                    تعداد: {toPersianDigits(item.quantity)} عدد
                  </Text>
                  {item.sku ? (
                    <Text style={styles.itemSku}>کد: {item.sku}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Financial Breakdown Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionHeaderTitle}>جزئیات مالی و صورتحساب</Text>
            <FileText size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.financialRow}>
            <Text style={styles.financialValue}>
              {formatDirectToman(Math.floor(order.subtotal_irr / 10))}
            </Text>
            <Text style={styles.financialLabel}>جمع اقلام کالا:</Text>
          </View>

          <View style={styles.financialRow}>
            <Text style={styles.financialValue}>
              {formatDirectToman(Math.floor(order.shipping_fee_irr / 10))}
            </Text>
            <Text style={styles.financialLabel}>
              هزینه ارسال ({order.shipping_method || 'پست'}):
            </Text>
          </View>

          {order.discount_irr > 0 && (
            <View style={styles.financialRow}>
              <Text style={[styles.financialValue, { color: colors.accent.red }]}>
                - {formatDirectToman(Math.floor(order.discount_irr / 10))}
              </Text>
              <Text style={styles.financialLabel}>تخفیف اعمال‌شده:</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.financialRowTotal}>
            <Text style={styles.totalValue}>
              {formatDirectToman(Math.floor(order.total_irr / 10))}
            </Text>
            <Text style={styles.totalLabel}>مبلغ نهایی پرداختی:</Text>
          </View>
        </Card>

        {/* Order Notes Card */}
        {order.notes ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.notesTitle}>یادداشت سفارش:</Text>
            <Text style={styles.notesContent}>{order.notes}</Text>
          </Card>
        ) : null}
      </ScrollView>

      {/* Status Change Modal */}
      <Modal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        title="تغییر وضعیت سفارش"
      >
        <Text style={styles.modalSubTitle}>انتخاب وضعیت جدید:</Text>
        <View style={styles.statusOptions}>
          {[
            { key: 'processing', label: 'در حال پردازش' },
            { key: 'packed', label: 'بسته‌بندی شده' },
            { key: 'shipped', label: 'ارسال شده (پست/تیپاکس)' },
            { key: 'delivered', label: 'تحویل داده شده' },
            { key: 'cancelled', label: 'لغو سفارش' },
          ].map((st) => (
            <TouchableOpacity
              key={st.key}
              style={[
                styles.statusOptionBtn,
                newStatus === st.key && styles.statusOptionBtnActive,
              ]}
              onPress={() => setNewStatus(st.key as OrderStatus)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statusOptionText,
                  newStatus === st.key && styles.statusOptionTextActive,
                ]}
              >
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {newStatus === 'shipped' && (
          <Input
            label="کد رهگیری پستی / تیپاکس"
            placeholder="مثال: 12345678901234567890"
            value={trackingCode}
            onChangeText={setTrackingCode}
            required
            containerStyle={{ marginTop: spacing.sm }}
          />
        )}

        <Input
          label="توضیحات و یادداشت تغییر وضعیت"
          placeholder="یادداشت اداری (اختیاری)..."
          value={adminNote}
          onChangeText={setAdminNote}
          multiline
          numberOfLines={3}
          style={{ height: 70 }}
        />

        <View style={styles.modalButtonsRow}>
          <Button
            title="ثبت تغییرات"
            onPress={handleSaveStatus}
            loading={isSubmitting}
            variant="primary"
            style={{ flex: 1 }}
          />
          <Button
            title="انصراف"
            onPress={() => setStatusModalVisible(false)}
            variant="secondary"
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
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
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  statusCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRightWidth: 4,
    borderRightColor: colors.primary[700],
  },
  statusHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  trackingBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  trackingLabel: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  trackingCodeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary[800],
  },
  statusActionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardSectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[900],
    maxWidth: '65%',
    textAlign: 'left',
  },
  contactBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  callButton: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary[800],
  },
  smsButton: {
    backgroundColor: colors.accent.blueLight,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  smsButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent.blue,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemPriceCol: {
    alignItems: 'flex-start',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  itemUnitPrice: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  itemInfoCol: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: spacing.md,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'right',
  },
  itemMetaRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: '500',
  },
  itemSku: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  financialRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  financialLabel: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  financialValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[800],
  },
  financialRowTotal: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.neutral[600],
    textAlign: 'right',
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 13,
    color: colors.neutral[800],
    textAlign: 'right',
    lineHeight: 20,
  },
  modalSubTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.neutral[700],
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  statusOptions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusOptionBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionBtnActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  statusOptionText: {
    fontSize: 13,
    color: colors.neutral[700],
    textAlign: 'right',
  },
  statusOptionTextActive: {
    color: colors.primary[800],
    fontWeight: 'bold',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
