import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { OrderBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { formatDirectToman, formatJalaliDate, toPersianDigits } from '../utils/formatters';
import { OrderStatus, Order } from '../types';
import {
  Search,
  Plus,
  ShoppingBag,
  Filter,
  Phone,
  MapPin,
  ChevronLeft,
} from 'lucide-react-native';

interface OrdersScreenProps {
  onOpenOrderDetail: (orderId: string) => void;
  onOpenCreateOrder: () => void;
}

const FILTER_TABS: Array<{ label: string; value: string }> = [
  { label: 'همه سفارشات', value: '' },
  { label: 'در حال پردازش', value: 'processing' },
  { label: 'ارسال شده', value: 'shipped' },
  { label: 'در انتظار پرداخت', value: 'pending_payment' },
  { label: 'تحویل داده شده', value: 'delivered' },
  { label: 'لغو شده', value: 'cancelled' },
];

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onOpenOrderDetail,
  onOpenCreateOrder,
}) => {
  const { orders, isLoading, refreshOrders } = useApp();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOrders = orders.filter((ord) => {
    if (selectedStatus && ord.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = ord.order_number.toLowerCase().includes(q);
      const matchName = ord.address.recipient_name.toLowerCase().includes(q);
      const matchPhone = ord.address.recipient_phone.includes(q);
      return matchNum || matchName || matchPhone;
    }
    return true;
  });

  const renderOrderItem = ({ item: ord }: { item: Order }) => (
    <Card
      style={styles.orderCard}
      onPress={() => onOpenOrderDetail(ord.id)}
    >
      <View style={styles.cardHeader}>
        <OrderBadge status={ord.status} />
        <View style={styles.orderNumGroup}>
          <Text style={styles.orderNumber}>{toPersianDigits(ord.order_number)}</Text>
          <Text style={styles.orderDate}>{formatJalaliDate(ord.created_at)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.customerRow}>
        <View style={styles.iconWithText}>
          <Text style={styles.customerName}>{ord.address.recipient_name}</Text>
        </View>
        <View style={styles.iconWithText}>
          <Text style={styles.phoneText}>{toPersianDigits(ord.address.recipient_phone)}</Text>
          <Phone size={14} color={colors.neutral[400]} />
        </View>
      </View>

      <View style={styles.addressRow}>
        <Text style={styles.addressText} numberOfLines={1}>
          {ord.address.province}، {ord.address.city} - {ord.address.postal_address}
        </Text>
        <MapPin size={13} color={colors.neutral[400]} />
      </View>

      <View style={styles.itemsRow}>
        {ord.items.map((it, idx) => (
          <Text key={idx} style={styles.itemTag} numberOfLines={1}>
            {it.product_title} × {toPersianDigits(it.quantity)}
          </Text>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.detailLink}>
          <ChevronLeft size={16} color={colors.primary[700]} />
          <Text style={styles.detailLinkText}>جزئیات و اقدام</Text>
        </View>
        <View style={styles.totalGroup}>
          <Text style={styles.totalLabel}>مبلغ کل سفارش:</Text>
          <Text style={styles.totalAmount}>
            {formatDirectToman(Math.floor(ord.total_irr / 10))}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="مدیریت سفارشات"
        subtitle={`${toPersianDigits(filteredOrders.length)} سفارش یافت شد`}
        showRefresh
        onRefresh={() => refreshOrders({ status: selectedStatus, q: searchQuery })}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="جستجوی شماره سفارش، نام خریدار یا موبایل..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          <Search size={18} color={colors.neutral[400]} style={styles.searchIcon} />
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedStatus === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setSelectedStatus(tab.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refreshOrders({ status: selectedStatus, q: searchQuery })}
            colors={[colors.primary[700]]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<ShoppingBag size={36} color={colors.neutral[400]} />}
            title="سفارشی با این مشخصات یافت نشد"
            description="می‌توانید فیلترها را تغییر داده یا سفارش جدیدی ثبت کنید."
            actionTitle="ثبت سفارش جدید"
            onAction={onOpenCreateOrder}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onOpenCreateOrder}
        activeOpacity={0.85}
      >
        <Plus size={24} color={colors.neutral.white} />
        <Text style={styles.fabText}>سفارش جدید</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginLeft: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.neutral[900],
    paddingVertical: 0,
  },
  tabsWrapper: {
    paddingVertical: spacing.sm,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    flexDirection: 'row-reverse',
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[700],
    borderColor: colors.primary[700],
  },
  tabText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.neutral.white,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 3,
  },
  orderCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNumGroup: {
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
  customerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconWithText: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  phoneText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  addressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  addressText: {
    fontSize: 12,
    color: colors.neutral[500],
    flex: 1,
    textAlign: 'right',
  },
  itemsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.sm,
  },
  itemTag: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    fontSize: 11,
    color: colors.neutral[700],
    maxWidth: '100%',
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  totalGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  totalAmount: {
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
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.primary[700],
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...shadows.lg,
  },
  fabText: {
    color: colors.neutral.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
