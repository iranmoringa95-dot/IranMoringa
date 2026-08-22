import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TierBadge, OrderBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { formatDirectToman, formatJalaliDate, toPersianDigits } from '../utils/formatters';
import {
  Phone,
  MessageSquare,
  MapPin,
  ShoppingBag,
  User,
  Calendar,
  Wallet,
  ChevronLeft,
} from 'lucide-react-native';

interface CustomerDetailScreenProps {
  customerId: string;
  onBack: () => void;
  onOpenOrderDetail: (orderId: string) => void;
}

export const CustomerDetailScreen: React.FC<CustomerDetailScreenProps> = ({
  customerId,
  onBack,
  onOpenOrderDetail,
}) => {
  const { customers, orders } = useApp();

  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return (
      <View style={styles.container}>
        <Header title="پرونده مشتری" onBack={onBack} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>پرونده مشتری یافت نشد</Text>
          <Button title="بازگشت" onPress={onBack} variant="outline" style={{ marginTop: spacing.md }} />
        </View>
      </View>
    );
  }

  // Find all orders for this customer (match customer_id or phone)
  const customerOrders = orders.filter(
    (o) =>
      (o.customer_id && o.customer_id === customer.id) ||
      o.address.recipient_phone === customer.phone ||
      (o.guest_phone && o.guest_phone === customer.phone)
  );

  const handleCall = () => {
    Linking.openURL(`tel:${customer.phone}`);
  };

  const handleSMS = () => {
    const msg = encodeURIComponent(`سلام ${customer.full_name} عزیز از فروشگاه محصولات ارگانیک مورینگا سبزینه در خدمت شما هستیم.`);
    Linking.openURL(`sms:${customer.phone}${Platform.OS === 'ios' ? '&' : '?'}body=${msg}`);
  };

  return (
    <View style={styles.container}>
      <Header
        title={customer.full_name}
        subtitle={toPersianDigits(customer.phone)}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TierBadge tier={customer.tier} />
            <View style={styles.avatarRow}>
              <View style={styles.nameContainer}>
                <Text style={styles.fullName}>{customer.full_name}</Text>
                <Text style={styles.phone}>{toPersianDigits(customer.phone)}</Text>
              </View>
              <View style={styles.avatar}>
                <User size={24} color={colors.primary[800]} />
              </View>
            </View>
          </View>

          {/* Quick Contact Buttons */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={[styles.contactBtn, styles.callBtn]}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Phone size={16} color={colors.primary[700]} />
              <Text style={styles.callBtnText}>تماس تلفنی</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, styles.smsBtn]}
              onPress={handleSMS}
              activeOpacity={0.7}
            >
              <MessageSquare size={16} color={colors.accent.blue} />
              <Text style={styles.smsBtnText}>ارسال پیامک</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Address Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>نشانی پستی و موقعیت</Text>
            <MapPin size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{customer.province}، {customer.city}</Text>
            <Text style={styles.infoLabel}>استان و شهر:</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{customer.postal_address || 'ثبت نشده'}</Text>
            <Text style={styles.infoLabel}>نشانی کامل:</Text>
          </View>

          {customer.postal_code ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{toPersianDigits(customer.postal_code)}</Text>
              <Text style={styles.infoLabel}>کد پستی:</Text>
            </View>
          ) : null}
        </Card>

        {/* Customer Stats Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>آمار و عملکرد خرید</Text>
            <Wallet size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>تعداد کل سفارش‌ها</Text>
              <Text style={styles.statVal}>
                {toPersianDigits(customer.total_orders || customerOrders.length)} سفارش
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>مجموع مبالغ خرید</Text>
              <Text style={[styles.statVal, { color: colors.primary[700] }]}>
                {formatDirectToman(customer.total_spent_toman)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Order History Section */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>
            سوابق سفارشات ({toPersianDigits(customerOrders.length)} سفارش)
          </Text>
          <ShoppingBag size={18} color={colors.primary[700]} />
        </View>

        {customerOrders.length === 0 ? (
          <Card style={styles.emptyOrdersCard}>
            <ShoppingBag size={32} color={colors.neutral[300]} />
            <Text style={styles.emptyOrdersText}>هنوز سفارشی برای این مشتری ثبت نشده است</Text>
          </Card>
        ) : (
          customerOrders.map((ord) => (
            <Card
              key={ord.id}
              style={styles.orderHistoryCard}
              onPress={() => onOpenOrderDetail(ord.id)}
            >
              <View style={styles.historyCardTop}>
                <OrderBadge status={ord.status} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.historyOrderNumber}>
                    {toPersianDigits(ord.order_number)}
                  </Text>
                  <Text style={styles.historyOrderDate}>
                    {formatJalaliDate(ord.created_at)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.historyCardBottom}>
                <View style={styles.detailLink}>
                  <ChevronLeft size={16} color={colors.primary[700]} />
                  <Text style={styles.detailLinkText}>مشاهده سفارش</Text>
                </View>
                <Text style={styles.historyTotal}>
                  {formatDirectToman(Math.floor(ord.total_irr / 10))}
                </Text>
              </View>
            </Card>
          ))
        )}
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
  profileCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'flex-end',
  },
  fullName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  phone: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  callBtn: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary[800],
  },
  smsBtn: {
    backgroundColor: colors.accent.blueLight,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  smsBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent.blue,
  },
  sectionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
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
    fontWeight: '500',
    color: colors.neutral[800],
    maxWidth: '65%',
    textAlign: 'left',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  historyHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyOrdersCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyOrdersText: {
    fontSize: 13,
    color: colors.neutral[400],
    marginTop: spacing.xs,
  },
  orderHistoryCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyOrderNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  historyOrderDate: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  historyCardBottom: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailLinkText: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: '600',
  },
});
