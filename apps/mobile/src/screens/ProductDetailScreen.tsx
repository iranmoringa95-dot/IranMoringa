import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { ProductBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { formatDirectToman, toPersianDigits } from '../utils/formatters';
import {
  Package,
  Layers,
  DollarSign,
  Edit3,
  Sliders,
  CheckCircle,
  EyeOff,
  Archive,
  Sparkles,
} from 'lucide-react-native';

interface ProductDetailScreenProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  onBack,
}) => {
  const { products, updateProductInventory, updateProductStatus } = useApp();
  const [stockModalVisible, setStockModalVisible] = useState<boolean>(false);
  const [newStock, setNewStock] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <View style={styles.container}>
        <Header title="مشخصات محصول" onBack={onBack} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>محصول مورد نظر یافت نشد</Text>
          <Button title="بازگشت" onPress={onBack} variant="outline" style={{ marginTop: spacing.md }} />
        </View>
      </View>
    );
  }

  const priceToman = Math.floor(product.price_irr / 10);
  const comparePriceToman = product.compare_at_price_irr ? Math.floor(product.compare_at_price_irr / 10) : null;
  const costPriceToman = product.cost_price_irr ? Math.floor(product.cost_price_irr / 10) : null;

  const handleOpenStockModal = () => {
    setNewStock(product.on_hand.toString());
    setStockModalVisible(true);
  };

  const handleSaveStock = async () => {
    const parsed = parseInt(newStock.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('خطا', 'لطفاً یک عدد معتبر برای موجودی انبار وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProductInventory(product.id, parsed);
      setStockModalVisible(false);
      Alert.alert('موفقیت', 'موجودی انبار با موفقیت به‌روزرسانی شد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async () => {
    const nextStatus = product.status === 'published' ? 'unpublished' : 'published';
    await updateProductStatus(product.id, nextStatus);
    Alert.alert('موفقیت', `وضعیت محصول به ${nextStatus === 'published' ? 'منتشر شده' : 'غیرفعال'} تغییر یافت.`);
  };

  const handleArchive = async () => {
    Alert.alert('بایگانی محصول', 'آیا از بایگانی این محصول اطمینان دارید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'بایگانی',
        style: 'destructive',
        onPress: async () => {
          await updateProductStatus(product.id, 'archived');
          Alert.alert('موفقیت', 'محصول با موفقیت بایگانی شد.');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title={product.title_fa}
        subtitle={`کد انبارداری: ${product.sku}`}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Media & Header */}
        <Card style={styles.mediaCard}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Package size={48} color={colors.neutral[300]} />
            </View>
          )}

          <View style={styles.titleRow}>
            <ProductBadge status={product.status} />
            <Text style={styles.productTitle}>{product.title_fa}</Text>
          </View>

          <Text style={styles.categoryName}>
            دسته‌بندی: {product.category_name || 'مکمل‌ها و فرآورده‌های مورینگا'}
          </Text>

          {product.short_description_fa ? (
            <Text style={styles.shortDesc}>{product.short_description_fa}</Text>
          ) : null}
        </Card>

        {/* Pricing & Stock Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionTitle}>قیمت‌گذاری و انبارداری</Text>
            <DollarSign size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.priceHighlight}>{formatDirectToman(priceToman)}</Text>
            <Text style={styles.infoLabel}>قیمت فروش به مشتری:</Text>
          </View>

          {comparePriceToman && (
            <View style={styles.infoRow}>
              <Text style={styles.comparePriceText}>{formatDirectToman(comparePriceToman)}</Text>
              <Text style={styles.infoLabel}>قیمت قبل از تخفیف:</Text>
            </View>
          )}

          {costPriceToman && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{formatDirectToman(costPriceToman)}</Text>
              <Text style={styles.infoLabel}>قیمت تمام‌شده (خرید):</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.inventoryRow}>
            <Button
              title="ویرایش موجودی"
              onPress={handleOpenStockModal}
              variant="outline"
              size="sm"
              icon={<Sliders size={14} color={colors.primary[700]} />}
            />
            <View style={styles.stockCol}>
              <Text style={styles.stockCountText}>
                {toPersianDigits(product.on_hand)} عدد موجود در انبار
              </Text>
              <Text style={styles.stockReservedText}>
                ({toPersianDigits(product.reserved || 0)} رزرو شده در سفارشات)
              </Text>
            </View>
          </View>
        </Card>

        {/* Full Description Card */}
        {product.description_fa ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>توضیحات تکمیلی محصول:</Text>
            <Text style={styles.fullDescText}>{product.description_fa}</Text>
          </Card>
        ) : null}

        {/* Specifications Card */}
        {product.specifications && product.specifications.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.cardSectionHeader}>
              <Text style={styles.sectionTitle}>جدول مشخصات فنی</Text>
              <Sparkles size={18} color={colors.primary[700]} />
            </View>

            <View style={styles.divider} />

            {product.specifications.map((spec, idx) => (
              <View key={idx} style={styles.specItemRow}>
                <Text style={styles.specItemVal}>{spec.value}</Text>
                <Text style={styles.specItemKey}>{spec.key}:</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Status Actions */}
        <View style={styles.statusActionGroup}>
          <Button
            title={product.status === 'published' ? 'غیرفعال‌سازی محصول' : 'انتشار محصول'}
            onPress={handleTogglePublish}
            variant={product.status === 'published' ? 'secondary' : 'primary'}
            icon={
              product.status === 'published' ? (
                <EyeOff size={16} color={colors.neutral[800]} />
              ) : (
                <CheckCircle size={16} color={colors.neutral.white} />
              )
            }
            style={{ flex: 1 }}
          />

          <Button
            title="بایگانی"
            onPress={handleArchive}
            variant="danger"
            icon={<Archive size={16} color={colors.neutral.white} />}
            style={{ width: 100 }}
          />
        </View>
      </ScrollView>

      {/* Stock Adjustment Modal */}
      <Modal
        visible={stockModalVisible}
        onClose={() => setStockModalVisible(false)}
        title="تنظیم موجودی انبار"
      >
        <Text style={styles.stockModalDesc}>
          موجودی فیزیکی فعلی برای محصول «{product.title_fa}» را وارد کنید:
        </Text>

        <Input
          label="تعداد موجودی انبار (عدد)"
          keyboardType="numeric"
          value={newStock}
          onChangeText={setNewStock}
          required
        />

        <View style={styles.modalButtonsRow}>
          <Button
            title="ذخیره موجودی"
            onPress={handleSaveStock}
            loading={isSubmitting}
            variant="primary"
            style={{ flex: 1 }}
          />
          <Button
            title="انصراف"
            onPress={() => setStockModalVisible(false)}
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
  mediaCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.neutral[100],
  },
  heroPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingBottom: 0,
    gap: spacing.sm,
  },
  productTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[900],
    textAlign: 'right',
  },
  categoryName: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'right',
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  shortDesc: {
    fontSize: 13,
    color: colors.neutral[700],
    textAlign: 'right',
    padding: spacing.md,
    paddingTop: spacing.xs,
    lineHeight: 20,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: 13,
    color: colors.neutral[800],
    fontWeight: '500',
  },
  priceHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  comparePriceText: {
    fontSize: 13,
    color: colors.neutral[400],
    textDecorationLine: 'line-through',
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  stockCol: {
    alignItems: 'flex-end',
  },
  stockCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  stockReservedText: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  fullDescText: {
    fontSize: 13,
    color: colors.neutral[700],
    textAlign: 'right',
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  specItemRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  specItemKey: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  specItemVal: {
    fontSize: 12,
    color: colors.neutral[900],
  },
  statusActionGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  stockModalDesc: {
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
