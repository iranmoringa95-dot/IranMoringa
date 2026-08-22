import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '../types';
import { getOrderStatusInfo, getProductStatusInfo, getTierInfo } from '../utils/formatters';
import { borderRadius, spacing } from '../theme/spacing';

interface OrderBadgeProps {
  status: OrderStatus;
}

export const OrderBadge: React.FC<OrderBadgeProps> = ({ status }) => {
  const info = getOrderStatusInfo(status);
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

interface ProductBadgeProps {
  status: string;
}

export const ProductBadge: React.FC<ProductBadgeProps> = ({ status }) => {
  const info = getProductStatusInfo(status);
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

interface TierBadgeProps {
  tier: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier }) => {
  const info = getTierInfo(tier);
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
