import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { toPersianDigits } from '../utils/formatters';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
} from 'lucide-react-native';

export type TabKey = 'Dashboard' | 'Orders' | 'Products' | 'Customers' | 'Settings';

interface TabBarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ currentTab, onSelectTab }) => {
  const { stats } = useApp();

  const tabs: Array<{ key: TabKey; label: string; icon: any; badge?: number }> = [
    {
      key: 'Dashboard',
      label: 'داشبورد',
      icon: LayoutDashboard,
    },
    {
      key: 'Orders',
      label: 'سفارش‌ها',
      icon: ShoppingBag,
      badge: stats?.pending_orders,
    },
    {
      key: 'Products',
      label: 'محصولات',
      icon: Package,
      badge: stats?.low_stock_count,
    },
    {
      key: 'Customers',
      label: 'مشتریان',
      icon: Users,
    },
    {
      key: 'Settings',
      label: 'تنظیمات',
      icon: Settings,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Icon
                  size={22}
                  color={isActive ? colors.primary[700] : colors.neutral[400]}
                />
                {tab.badge && tab.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{toPersianDigits(tab.badge)}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    ...shadows.lg,
  },
  tabBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    minWidth: 60,
  },
  tabItemActive: {},
  iconWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    left: -8,
    backgroundColor: colors.accent.red,
    borderRadius: borderRadius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.neutral.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tabLabel: {
    fontSize: 11,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary[700],
    fontWeight: 'bold',
  },
});
