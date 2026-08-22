import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ProductSpecification } from '../types';
import {
  Plus,
  Trash2,
  Package,
  Layers,
  DollarSign,
  FileText,
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';

interface CreateProductScreenProps {
  onBack: () => void;
  onProductCreated: (productId: string) => void;
}

export const CreateProductScreen: React.FC<CreateProductScreenProps> = ({
  onBack,
  onProductCreated,
}) => {
  const { categories, createProduct } = useApp();

  // Form State
  const [titleFA, setTitleFA] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || 'cat-1');
  const [sku, setSku] = useState<string>('');
  const [priceToman, setPriceToman] = useState<string>('');
  const [comparePriceToman, setComparePriceToman] = useState<string>('');
  const [costPriceToman, setCostPriceToman] = useState<string>('');
  const [onHand, setOnHand] = useState<string>('20');
  const [weightGrams, setWeightGrams] = useState<string>('100');
  const [shortDesc, setShortDesc] = useState<string>('');
  const [fullDesc, setFullDesc] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80'
  );

  // Specifications
  const [specs, setSpecs] = useState<ProductSpecification[]>([
    { key: 'نوع فرآوری', value: 'خشک‌شده در سایه' },
    { key: 'خلوص', value: '۱۰۰٪ ارگانیک' },
  ]);
  const [newSpecKey, setNewSpecKey] = useState<string>('');
  const [newSpecValue, setNewSpecValue] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecs([...specs, { key: newSpecKey.trim(), value: newSpecValue.trim() }]);
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const handleRemoveSpec = (index: number) => {
    const updated = [...specs];
    updated.splice(index, 1);
    setSpecs(updated);
  };

  const handleSubmit = async () => {
    if (!titleFA.trim()) {
      Alert.alert('خطا', 'لطفاً نام محصول را وارد کنید.');
      return;
    }
    const cleanPrice = parseInt(priceToman.replace(/[^0-9]/g, ''), 10);
    if (!cleanPrice || cleanPrice <= 0) {
      Alert.alert('خطا', 'لطفاً مبلغ معتبر برای قیمت فروش وارد کنید.');
      return;
    }
    if (!sku.trim()) {
      Alert.alert('خطا', 'لطفاً شناسه انبارداری (کد SKU) را وارد کنید.');
      return;
    }

    const cleanComparePrice = parseInt(comparePriceToman.replace(/[^0-9]/g, ''), 10) || undefined;
    const cleanCostPrice = parseInt(costPriceToman.replace(/[^0-9]/g, ''), 10) || undefined;
    const cleanStock = parseInt(onHand.replace(/[^0-9]/g, ''), 10) || 0;
    const cleanWeight = parseInt(weightGrams.replace(/[^0-9]/g, ''), 10) || 100;

    const matchedCat = categories.find((c) => c.id === selectedCategory);

    setIsSubmitting(true);
    try {
      const created = await createProduct({
        title_fa: titleFA.trim(),
        slug: slug.trim() || undefined,
        category_id: selectedCategory,
        category_name: matchedCat?.name_fa,
        price_irr: cleanPrice * 10,
        compare_at_price_irr: cleanComparePrice ? cleanComparePrice * 10 : undefined,
        cost_price_irr: cleanCostPrice ? cleanCostPrice * 10 : undefined,
        sku: sku.trim(),
        on_hand: cleanStock,
        weight_grams: cleanWeight,
        short_description_fa: shortDesc.trim(),
        description_fa: fullDesc.trim(),
        image_url: imageUrl.trim(),
        specifications: specs,
      });

      Alert.alert('موفقیت', 'محصول با موفقیت در کاتالوگ فروشگاه ثبت شد.', [
        {
          text: 'مشاهده محصول',
          onPress: () => onProductCreated(created.id),
        },
      ]);
    } catch {
      Alert.alert('خطا', 'ثبت محصول با مشکل مواجه شد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="تعریف محصول جدید" onBack={onBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info Card */}
        <Card style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionTitle}>۱. اطلاعات پایه محصول</Text>
            <Package size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <Input
            label="نام محصول (فارسی)"
            placeholder="مثال: پودر برگ مورینگا اولیفرا خالص (۱۰۰ گرم)"
            value={titleFA}
            onChangeText={setTitleFA}
            required
          />

          <Input
            label="شناسه انبارداری (SKU)"
            placeholder="مثال: MOR-PWD-100"
            value={sku}
            onChangeText={setSku}
            required
          />

          <Input
            label="اسلاگ / نامک انگلیسی (اختیاری)"
            placeholder="مثال: moringa-leaf-powder-100g"
            value={slug}
            onChangeText={setSlug}
          />

          <Text style={styles.inputLabel}>دسته‌بندی محصول:</Text>
          <View style={styles.categoryPicker}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catOption,
                    isSelected && styles.catOptionActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.catOptionText,
                      isSelected && styles.catOptionTextActive,
                    ]}
                  >
                    {cat.name_fa}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Pricing & Stock Card */}
        <Card style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionTitle}>۲. قیمت‌گذاری و موجودی انبار</Text>
            <DollarSign size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <Input
            label="قیمت فروش نهایی (تومان)"
            placeholder="مثال: 225000"
            keyboardType="numeric"
            value={priceToman}
            onChangeText={setPriceToman}
            required
          />

          <View style={styles.rowInputs}>
            <Input
              label="قیمت قبل از تخفیف (تومان)"
              placeholder="مثال: 260000"
              keyboardType="numeric"
              value={comparePriceToman}
              onChangeText={setComparePriceToman}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="قیمت تمام‌شده (تومان)"
              placeholder="مثال: 130000"
              keyboardType="numeric"
              value={costPriceToman}
              onChangeText={setCostPriceToman}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <View style={styles.rowInputs}>
            <Input
              label="موجودی اولیه در انبار (عدد)"
              placeholder="مثال: 50"
              keyboardType="numeric"
              value={onHand}
              onChangeText={setOnHand}
              containerStyle={{ flex: 1 }}
              required
            />
            <Input
              label="وزن ناخالص (گرم)"
              placeholder="مثال: 120"
              keyboardType="numeric"
              value={weightGrams}
              onChangeText={setWeightGrams}
              containerStyle={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Description & Media Card */}
        <Card style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionTitle}>۳. توضیحات و تصویر</Text>
            <FileText size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          <Input
            label="توضیح کوتاه محصول"
            placeholder="یک خط توضیح مختصر درباره خواص و کاربرد..."
            value={shortDesc}
            onChangeText={setShortDesc}
          />

          <Input
            label="توضیحات کامل و ویژگی‌ها"
            placeholder="توضیحات جامع، شیوه مصرف، خواص دارویی..."
            value={fullDesc}
            onChangeText={setFullDesc}
            multiline
            numberOfLines={4}
            style={{ height: 90 }}
          />

          <Input
            label="آدرس اینترنتی تصویر محصول (URL)"
            placeholder="https://..."
            value={imageUrl}
            onChangeText={setImageUrl}
          />
        </Card>

        {/* Technical Specifications Card */}
        <Card style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionTitle}>۴. مشخصات و جدول ویژگی‌ها</Text>
            <Sparkles size={18} color={colors.primary[700]} />
          </View>

          <View style={styles.divider} />

          {specs.map((sp, idx) => (
            <View key={idx} style={styles.specRow}>
              <TouchableOpacity
                style={styles.specDeleteBtn}
                onPress={() => handleRemoveSpec(idx)}
              >
                <Trash2 size={15} color={colors.accent.red} />
              </TouchableOpacity>
              <Text style={styles.specVal}>{sp.value}</Text>
              <Text style={styles.specKey}>{sp.key}:</Text>
            </View>
          ))}

          <View style={styles.addSpecBox}>
            <View style={styles.rowInputs}>
              <Input
                placeholder="مقدار (مثال: ۱۰۰٪ ارگانیک)"
                value={newSpecValue}
                onChangeText={setNewSpecValue}
                containerStyle={{ flex: 1 }}
              />
              <Input
                placeholder="عنوان ویژگی (مثال: نوع خلوص)"
                value={newSpecKey}
                onChangeText={setNewSpecKey}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Button
              title="افزودن ویژگی به جدول"
              onPress={handleAddSpec}
              variant="secondary"
              size="sm"
              icon={<Plus size={14} color={colors.neutral[800]} />}
            />
          </View>
        </Card>

        {/* Submit Action */}
        <Button
          title="ذخیره و انتشار محصول"
          onPress={handleSubmit}
          loading={isSubmitting}
          variant="primary"
          size="lg"
          icon={<CheckCircle size={18} color={colors.neutral.white} />}
          style={{ marginBottom: spacing.xxxl }}
        />
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
  card: {
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
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  categoryPicker: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  catOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
  catOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[700],
  },
  catOptionText: {
    fontSize: 12,
    color: colors.neutral[700],
  },
  catOptionTextActive: {
    color: colors.primary[800],
    fontWeight: 'bold',
  },
  rowInputs: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  specRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  specKey: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  specVal: {
    fontSize: 12,
    color: colors.neutral[900],
    flex: 1,
    textAlign: 'left',
    marginRight: spacing.sm,
  },
  specDeleteBtn: {
    padding: 4,
  },
  addSpecBox: {
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
});
