import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { OrderBadge } from '../components/Badge';
import { formatDirectToman, formatJalaliDate, toPersianDigits } from '../utils/formatters';
import { TabKey } from '../components/TabBar';
import {
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  PlusCircle,
  Plus,
  ArrowLeft,
  Clock,
  TrendingUp,
} from 'lucide-react-native';

interface DashboardScreenProps {
  onNavigateTab: (tab: TabKey) => void;
  onOpenOrderDetail: (orderId: string) => void;
  onOpenCreateOrder: () => void;
  onOpenCreateProduct: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateTab,
  onOpenOrderDetail,
  onOpenCreateOrder,
  onOpenCreateProduct,
}) => {
  const { stats, orders, isLoading, refreshAll, isOnline } = useApp();

  const recentOrders = orders.slice(0, 5);

  return (
    <View style={styles.container}>
      <Header
        title="پنل مدیریت فروشگاه سبزینه"
        subtitle="MoringaLab Store Manager"
        showRefresh
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshAll}
            colors={[colors.primary[700]]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              💾 حالت آفلاین فعال است: اطلاعات و سفارشات قبلی در حافظه گوشی ذخیره شده و قابل مشاهده و مدیریت هستند.
            </Text>
          </View>
        )}

        {/* Quick Action Banner */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionPrimary]}
            onPress={onOpenCreateOrder}
            activeOpacity={0.8}
          >
            <Plus size={20} color={colors.neutral.white} />
            <Text style={styles.quickActionTextPrimary}>ثبت سفارش جدید</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionSecondary]}
            onPress={onOpenCreateProduct}
            activeOpacity={0.8}
          >
            <PlusCircle size={20} color={colors.primary[700]} />
            <Text style={styles.quickActionTextSecondary}>تعریف محصول</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>خلاصه وضعیت فروشگاه</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="فروش کل"
            value={formatDirectToman(stats?.total_sales_toman || 0)}
            subtitle={`${toPersianDigits(stats?.total_orders || 0)} سفارش ثبت شده`}
            icon={<TrendingUp size={22} color={colors.primary[700]} />}
            iconBgColor={colors.primary[50]}
          />
          <StatCard
            title="سفارش‌های در انتظار"
            value={`${toPersianDigits(stats?.pending_orders || 0)} سفارش`}
            subtitle="نیازمند اقدام و آماده‌سازی"
            icon={<Clock size={22} color={colors.status.pending} />}
            iconBgColor={colors.status.pendingBg}
          />
        </View>

        <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
          <TouchableOpacity
            style={styles.gridNavCard}
            onPress={() => onNavigateTab('Products')}
            activeOpacity={0.7}
          >
            <View style={[styles.miniIcon, { backgroundColor: colors.accent.amberLight }]}>
              <AlertTriangle size={18} color={colors.accent.amber} />
            </View>
            <View style={styles.gridNavContent}>
              <Text style={styles.gridNavTitle}>کسری انبار</Text>
              <Text style={styles.gridNavValue}>
                {toPersianDigits(stats?.low_stock_count || 0)} قلم کالا
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridNavCard}
            onPress={() => onNavigateTab('Customers')}
            activeOpacity={0.7}
          >
            <View style={[styles.miniIcon, { backgroundColor: colors.accent.blueLight }]}>
              <Users size={18} color={colors.accent.blue} />
            </View>
            <View style={styles.gridNavContent}>
              <Text style={styles.gridNavTitle}>مشتریان فعال</Text>
              <Text style={styles.gridNavValue}>مشاهده پرونده‌ها</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => onNavigateTab('Orders')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={colors.primary[700]} />
            <Text style={styles.seeAllText}>مشاهده همه</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>آخرین سفارشات دریافتی</Text>
        </View>

        {recentOrders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ShoppingBag size={40} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>هنوز سفارشی ثبت نشده است</Text>
          </Card>
        ) : (
          recentOrders.map((ord) => (
            <Card
              key={ord.id}
              style={styles.orderCard}
              onPress={() => onOpenOrderDetail(ord.id)}
            >
              <View style={styles.orderHeader}>
                <OrderBadge status={ord.status} />
                <View style={styles.orderNumContainer}>
                  <Text style={styles.orderNumber}>{toPersianDigits(ord.order_number)}</Text>
                  <Text style={styles.orderDate}>{formatJalaliDate(ord.created_at)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.orderCustomerRow}>
                <Text style={styles.customerName}>{ord.address.recipient_name}</Text>
                <Text style={styles.customerCity}>
                  {ord.address.city} - {ord.address.province}
                </Text>
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.itemsSummary} numberOfLines={1}>
                  {toPersianDigits(ord.items.length)} قلم کالا ({ord.items[0]?.product_title})
                </Text>
                <Text style={styles.orderTotal}>
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
  quickActionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  quickActionPrimary: {
    backgroundColor: colors.primary[700],
  },
  quickActionSecondary: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  quickActionTextPrimary: {
    color: colors.neutral.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickActionTextSecondary: {
    color: colors.primary[800],
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.neutral[800],
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridNavCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  gridNavContent: {
    alignItems: 'flex-end',
    flex: 1,
  },
  gridNavTitle: {
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'right',
  },
  gridNavValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 2,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.neutral[400],
    marginTop: spacing.sm,
    fontSize: 13,
  },
  orderCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNumContainer: {
    alignItems: 'flex-end',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  orderDate: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  orderCustomerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  customerCity: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  orderFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  itemsSummary: {
    fontSize: 11,
    color: colors.neutral[500],
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  offlineBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'right',
    lineHeight: 18,
    fontWeight: '500',
  },
});
