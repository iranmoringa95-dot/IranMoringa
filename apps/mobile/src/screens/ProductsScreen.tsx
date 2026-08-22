import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { ProductBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { formatDirectToman, toPersianDigits } from '../utils/formatters';
import { Product } from '../types';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Layers,
  ChevronLeft,
} from 'lucide-react-native';

interface ProductsScreenProps {
  onOpenProductDetail: (productId: string) => void;
  onOpenCreateProduct: () => void;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({
  onOpenProductDetail,
  onOpenCreateProduct,
}) => {
  const { products, categories, isLoading, refreshProducts } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = products.filter((prod) => {
    if (selectedCategory && prod.category_id !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return prod.title_fa.toLowerCase().includes(q) || prod.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const renderProductItem = ({ item: prod }: { item: Product }) => {
    const priceToman = Math.floor(prod.price_irr / 10);
    const isLowStock = prod.on_hand <= 5;

    return (
      <Card
        style={styles.productCard}
        onPress={() => onOpenProductDetail(prod.id)}
      >
        <View style={styles.cardContent}>
          {/* Product Image */}
          {prod.image_url ? (
            <Image source={{ uri: prod.image_url }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Package size={24} color={colors.neutral[400]} />
            </View>
          )}

          {/* Product Details */}
          <View style={styles.productDetails}>
            <View style={styles.topRow}>
              <ProductBadge status={prod.status} />
              <Text style={styles.productTitle} numberOfLines={2}>
                {prod.title_fa}
              </Text>
            </View>

            <Text style={styles.categoryText} numberOfLines={1}>
              دسته‌بندی: {prod.category_name || 'عمومی'}
            </Text>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.stockBadge,
                  isLowStock ? styles.stockBadgeLow : styles.stockBadgeOk,
                ]}
              >
                {isLowStock && <AlertTriangle size={11} color={colors.accent.amber} />}
                <Text
                  style={[
                    styles.stockText,
                    isLowStock ? styles.stockTextLow : styles.stockTextOk,
                  ]}
                >
                  موجودی: {toPersianDigits(prod.on_hand)} عدد
                </Text>
              </View>

              <Text style={styles.skuText}>کد: {prod.sku}</Text>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.detailLink}>
                <ChevronLeft size={16} color={colors.primary[700]} />
                <Text style={styles.detailLinkText}>مشخصات و ویرایش</Text>
              </View>
              <Text style={styles.priceText}>{formatDirectToman(priceToman)}</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="مدیریت محصولات"
        subtitle={`${toPersianDigits(filteredProducts.length)} محصول در کاتالوگ`}
        showRefresh
        onRefresh={() => refreshProducts({ q: searchQuery, category: selectedCategory })}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="جستجوی نام محصول یا کد SKU..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          <Search size={18} color={colors.neutral[400]} style={styles.searchIcon} />
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryBtn,
              !selectedCategory && styles.categoryBtnActive,
            ]}
            onPress={() => setSelectedCategory('')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryBtnText,
                !selectedCategory && styles.categoryBtnTextActive,
              ]}
            >
              همه دسته‌ها
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBtn,
                  isSelected && styles.categoryBtnActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    isSelected && styles.categoryBtnTextActive,
                  ]}
                >
                  {cat.name_fa}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refreshProducts({ q: searchQuery, category: selectedCategory })}
            colors={[colors.primary[700]]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Layers size={36} color={colors.neutral[400]} />}
            title="محصولی یافت نشد"
            description="می‌توانید محصول جدیدی به کاتالوگ فروشگاه اضافه کنید."
            actionTitle="تعریف محصول جدید"
            onAction={onOpenCreateProduct}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onOpenCreateProduct}
        activeOpacity={0.85}
      >
        <Plus size={24} color={colors.neutral.white} />
        <Text style={styles.fabText}>تعریف محصول</Text>
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
  categoriesWrapper: {
    paddingVertical: spacing.sm,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    flexDirection: 'row-reverse',
  },
  categoryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBtnActive: {
    backgroundColor: colors.primary[700],
    borderColor: colors.primary[700],
  },
  categoryBtnText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  categoryBtnTextActive: {
    color: colors.neutral.white,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 3,
  },
  productCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  productTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.neutral[900],
    textAlign: 'right',
    marginLeft: spacing.xs,
  },
  categoryText: {
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'right',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stockBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  stockBadgeOk: {
    backgroundColor: colors.primary[50],
  },
  stockBadgeLow: {
    backgroundColor: colors.accent.amberLight,
  },
  stockText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockTextOk: {
    color: colors.primary[800],
  },
  stockTextLow: {
    color: colors.accent.amber,
  },
  skuText: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  bottomRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceText: {
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
