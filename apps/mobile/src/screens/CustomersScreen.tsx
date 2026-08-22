import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { TierBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { formatDirectToman, toPersianDigits } from '../utils/formatters';
import { Customer } from '../types';
import {
  Search,
  Users,
  Phone,
  MapPin,
  ShoppingBag,
  ChevronLeft,
} from 'lucide-react-native';

interface CustomersScreenProps {
  onOpenCustomerDetail: (customerId: string) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  onOpenCustomerDetail,
}) => {
  const { customers, isLoading, refreshCustomers } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCustomers = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderCustomerItem = ({ item: cust }: { item: Customer }) => (
    <Card
      style={styles.customerCard}
      onPress={() => onOpenCustomerDetail(cust.id)}
    >
      <View style={styles.cardHeader}>
        <TierBadge tier={cust.tier} />
        <View style={styles.nameGroup}>
          <Text style={styles.customerName}>{cust.full_name}</Text>
          <Text style={styles.phoneText}>{toPersianDigits(cust.phone)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.locationRow}>
        <Text style={styles.locationText} numberOfLines={1}>
          {cust.province}، {cust.city} {cust.postal_address ? `- ${cust.postal_address}` : ''}
        </Text>
        <MapPin size={13} color={colors.neutral[400]} />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>مجموع خرید:</Text>
          <Text style={styles.metricValue}>
            {formatDirectToman(cust.total_spent_toman)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>تعداد سفارش:</Text>
          <Text style={styles.metricValue}>
            {toPersianDigits(cust.total_orders)} سفارش
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => handleCall(cust.phone)}
          activeOpacity={0.7}
        >
          <Phone size={13} color={colors.primary[700]} />
          <Text style={styles.callText}>تماس</Text>
        </TouchableOpacity>

        <View style={styles.detailLink}>
          <ChevronLeft size={16} color={colors.primary[700]} />
          <Text style={styles.detailLinkText}>مشاهده پرونده و سفارشات</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="بانک اطلاعات مشتریان"
        subtitle={`${toPersianDigits(filteredCustomers.length)} پرونده مشتری`}
        showRefresh
        onRefresh={() => refreshCustomers(searchQuery)}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="جستجوی نام مشتری، شماره موبایل یا شهر..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          <Search size={18} color={colors.neutral[400]} style={styles.searchIcon} />
        </View>
      </View>

      {/* Customers List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refreshCustomers(searchQuery)}
            colors={[colors.primary[700]]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={36} color={colors.neutral[400]} />}
            title="مشتری با این مشخصات یافت نشد"
            description="می‌توانید عبارت جستجو را تغییر دهید."
          />
        }
      />
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
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  customerCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameGroup: {
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  phoneText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: 12,
    color: colors.neutral[600],
    flex: 1,
    textAlign: 'right',
  },
  metricsRow: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'space-between',
  },
  metricItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  callButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
  },
  callText: {
    fontSize: 11,
    color: colors.primary[800],
    fontWeight: 'bold',
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
});
