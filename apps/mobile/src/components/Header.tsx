import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { RefreshCw, Wifi, WifiOff, ArrowRight } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  showRefresh = true,
  onRefresh,
  rightAction,
}) => {
  const { isOnline, refreshAll, isLoading } = useApp();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      refreshAll();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.actionsLeft}>
          {rightAction}
          {showRefresh && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleRefresh}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <RefreshCw size={18} color={isLoading ? colors.primary[400] : colors.primary[100]} />
            </TouchableOpacity>
          )}
          <View style={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]}>
            {isOnline ? (
              <Wifi size={12} color="#059669" />
            ) : (
              <WifiOff size={12} color="#dc2626" />
            )}
            <Text style={[styles.statusText, isOnline ? styles.textOnline : styles.textOffline]}>
              {isOnline ? 'آنلاین' : 'آفلاین/دمو'}
            </Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <ArrowRight size={22} color={colors.neutral.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary[900],
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  title: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  subtitle: {
    color: colors.primary[200],
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusOnline: {
    backgroundColor: '#d1fae5',
  },
  statusOffline: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  textOnline: {
    color: '#059669',
  },
  textOffline: {
    color: '#dc2626',
  },
});
