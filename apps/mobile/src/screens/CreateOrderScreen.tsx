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
import { Modal } from '../components/Modal';
import { formatDirectToman, toPersianDigits } from '../utils/formatters';
import { Product, Customer } from '../types';
import {
  User,
  Package,
  Plus,
  Trash2,
  Truck,
  CheckCircle,
  Search,
  Users,
} from 'lucide-react-native';

interface CreateOrderScreenProps {
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
}

interface SelectedItem {
  product: Product;
  quantity: number;
}

export const CreateOrderScreen: React.FC<CreateOrderScreenProps> = ({
  onBack,
  onOrderCreated,
}) => {
  const { products, customers, createOrder } = useApp();

  // Customer State
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [province, setProvince] = useState<string>('تهران');
  const [city, setCity] = useState<string>('تهران');
  const [postalAddress, setPostalAddress] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');

  // Items State
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [productPickerVisible, setProductPickerVisible] = useState<boolean>(false);
  const [customerPickerVisible, setCustomerPickerVisible] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Shipping & Pricing State
  const [shippingMethod, setShippingMethod] = useState<string>('پست پیشتاز');
  const [shippingFeeToman, setShippingFeeToman] = useState<string>('۴۵۰۰۰');
  const [discountToman, setDiscountToman] = useState<string>('۰');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calculations
  const subtotalToman = selectedItems.reduce(
    (sum, it) => sum + Math.floor(it.product.price_irr / 10) * it.quantity,
    0
  );
  const parsedShippingFee = parseInt(shippingFeeToman.replace(/[^0-9]/g, ''), 10) || 0;
  const parsedDiscount = parseInt(discountToman.replace(/[^0-9]/g, ''), 10) || 0;
  const totalToman = Math.max(0, subtotalToman + parsedShippingFee - parsedDiscount);

  // Handlers
  const handleSelectCustomer = (cust: Customer) => {
    setRecipientName(cust.full_name);
    setRecipientPhone(cust.phone);
    setCity(cust.city || 'تهران');
    setProvince(cust.province || 'تهران');
    setPostalAddress(cust.postal_address || '');
    setPostalCode(cust.postal_code || '');
    setCustomerPickerVisible(false);
  };

  const handleAddProduct = (prod: Product) => {
    const existingIndex = selectedItems.findIndex((it) => it.product.id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { product: prod, quantity: 1 }]);
    }
    setProductPickerVisible(false);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...selectedItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setSelectedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const handleSubmitOrder = async () => {
    if (!recipientName.trim() || !recipientPhone.trim()) {
      Alert.alert('خطا', 'لطفاً نام تحویل‌گیرنده و شماره تماس را وارد کنید.');
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('خطا', 'لطفاً حداقل یک محصول به سفارش اضافه کنید.');
      return;
    }
    if (!postalAddress.trim()) {
      Alert.alert('خطا', 'لطفاً نشانی کامل تحویل‌گیرنده را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = selectedItems.map((it) => ({
        product_id: it.product.id,
        product_title: it.product.title_fa,
        sku: it.product.sku,
        unit_price_irr: it.product.price_irr,
        quantity: it.quantity,
      }));

      const newOrder = await createOrder({
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        province: province.trim(),
        city: city.trim(),
        postal_address: postalAddress.trim(),
        postal_code: postalCode.trim(),
        shipping_method: shippingMethod,
        discount_irr: parsedDiscount * 10,
        shipping_fee_irr: parsedShippingFee * 10,
        notes: notes.trim(),
        items: itemsPayload,
      });

      Alert.alert('موفقیت', `سفارش شماره ${newOrder.order_number} با موفقیت ثبت شد.`, [
        {
          text: 'مشاهده سفارش',
          onPress: () => onOrderCreated(newOrder.id),
        },
      ]);
    } catch {
      Alert.alert('خطا', 'ثبت سفارش با مشکل مواجه شد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title_fa.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  return (
    <View style={styles.container}>
      <Header title="ثبت سفارش جدید" onBack={onBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity
              style={styles.pickCustomerBtn}
              onPress={() => setCustomerPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Users size={14} color={colors.primary[700]} />
              <Text style={styles.pickCustomerBtnText}>انتخاب مشتری از لیست</Text>
            </TouchableOpacity>
            <View style={styles.sectionHeaderTitleGroup}>
              <Text style={styles.sectionTitle}>۱. مشخصات خریدار و تحویل‌گیرنده</Text>
              <User size={18} color={colors.primary[700]} />
            </View>
          </View>

          <View style={styles.divider} />

          <Input
            label="نام و نام خانوادگی تحویل‌گیرنده"
            placeholder="مثال: علی رضایی"
            value={recipientName}
            onChangeText={setRecipientName}
            required
          />

          <Input
            label="شماره موبایل"
            placeholder="مثال: 09123456789"
            keyboardType="phone-pad"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            required
          />

          <View style={styles.rowInputs}>
            <Input
              label="استان"
              placeholder="تهران"
              value={province}
              onChangeText={setProvince}
              containerStyle={{ flex: 1 }}
              required
            />
            <Input
              label="شهر"
              placeholder="تهران"
              value={city}
              onChangeText={setCity}
              containerStyle={{ flex: 1 }}
              required
            />
          </View>

          <Input
            label="نشانی کامل پستی"
            placeholder="خیابان، کوچه، پلاک، واحد..."
            value={postalAddress}
            onChangeText={setPostalAddress}
            multiline
            numberOfLines={2}
            required
          />

          <Input
            label="کد پستی ده رقمی (اختیاری)"
            placeholder="مثال: 1987654321"
            keyboardType="numeric"
            value={postalCode}
            onChangeText={setPostalCode}
          />
        </Card>

        {/* Order Items Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity
              style={styles.addProductBtn}
              onPress={() => setProductPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Plus size={14} color={colors.neutral.white} />
              <Text style={styles.addProductBtnText}>افزودن محصول</Text>
            </TouchableOpacity>
            <View style={styles.sectionHeaderTitleGroup}>
              <Text style={styles.sectionTitle}>۲. اقلام سفارش</Text>
              <Package size={18} color={colors.primary[700]} />
            </View>
          </View>

          <View style={styles.divider} />

          {selectedItems.length === 0 ? (
            <View style={styles.noItemsBox}>
              <Text style={styles.noItemsText}>
                هنوز محصولی به سفارش اضافه نشده است.
              </Text>
              <Button
                title="انتخاب محصول از کاتالوگ"
                onPress={() => setProductPickerVisible(true)}
                variant="outline"
                size="sm"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          ) : (
            selectedItems.map((it, idx) => {
              const unitPriceToman = Math.floor(it.product.price_irr / 10);
              const lineTotalToman = unitPriceToman * it.quantity;
              return (
                <View key={it.product.id || idx} style={styles.selectedItemRow}>
                  <TouchableOpacity
                    style={styles.deleteItemBtn}
                    onPress={() => handleRemoveItem(idx)}
                  >
                    <Trash2 size={16} color={colors.accent.red} />
                  </TouchableOpacity>

                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateQuantity(idx, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{toPersianDigits(it.quantity)}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateQuantity(idx, -1)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{it.product.title_fa}</Text>
                    <Text style={styles.itemPrice}>
                      {formatDirectToman(lineTotalToman)} ({formatDirectToman(unitPriceToman)} × {toPersianDigits(it.quantity)})
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>

        {/* Shipping & Notes Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }} />
            <View style={styles.sectionHeaderTitleGroup}>
              <Text style={styles.sectionTitle}>۳. شیوه ارسال و هزینه‌ها</Text>
              <Truck size={18} color={colors.primary[700]} />
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.inputLabel}>شیوه ارسال:</Text>
          <View style={styles.shippingOptions}>
            {['پست پیشتاز', 'تیپاکس', 'پیک شهری', 'تحویل حضوری'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.shippingOptionBtn,
                  shippingMethod === m && styles.shippingOptionBtnActive,
                ]}
                onPress={() => setShippingMethod(m)}
              >
                <Text
                  style={[
                    styles.shippingOptionText,
                    shippingMethod === m && styles.shippingOptionTextActive,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowInputs}>
            <Input
              label="هزینه ارسال (تومان)"
              value={shippingFeeToman}
              onChangeText={setShippingFeeToman}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="مبلغ تخفیف (تومان)"
              value={discountToman}
              onChangeText={setDiscountToman}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </View>

          <Input
            label="یادداشت سفارش (اختیاری)"
            placeholder="توضیحات و هماهنگی‌های لازم..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />
        </Card>

        {/* Order Summary & Submit Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{formatDirectToman(subtotalToman)}</Text>
            <Text style={styles.summaryLabel}>جمع مبالغ کالاها:</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{formatDirectToman(parsedShippingFee)}</Text>
            <Text style={styles.summaryLabel}>هزینه ارسال:</Text>
          </View>
          {parsedDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryValue, { color: colors.accent.red }]}>
                - {formatDirectToman(parsedDiscount)}
              </Text>
              <Text style={styles.summaryLabel}>تخفیف ویژه:</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalValue}>{formatDirectToman(totalToman)}</Text>
            <Text style={styles.summaryTotalLabel}>مبلغ کل سفارش:</Text>
          </View>

          <Button
            title="ثبت نهایی سفارش"
            onPress={handleSubmitOrder}
            loading={isSubmitting}
            variant="primary"
            size="lg"
            icon={<CheckCircle size={18} color={colors.neutral.white} />}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </ScrollView>

      {/* Product Picker Modal */}
      <Modal
        visible={productPickerVisible}
        onClose={() => setProductPickerVisible(false)}
        title="انتخاب محصول از کاتالوگ"
      >
        <Input
          placeholder="جستجوی عنوان محصول یا کد SKU..."
          value={productSearch}
          onChangeText={setProductSearch}
          containerStyle={{ marginBottom: spacing.sm }}
        />

        {filteredProducts.map((prod) => (
          <TouchableOpacity
            key={prod.id}
            style={styles.pickerItem}
            onPress={() => handleAddProduct(prod)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerPriceCol}>
              <Text style={styles.pickerPrice}>
                {formatDirectToman(Math.floor(prod.price_irr / 10))}
              </Text>
              <Text style={styles.pickerStock}>
                موجودی: {toPersianDigits(prod.on_hand)}
              </Text>
            </View>
            <View style={styles.pickerInfoCol}>
              <Text style={styles.pickerTitle}>{prod.title_fa}</Text>
              <Text style={styles.pickerSku}>کد: {prod.sku}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Modal>

      {/* Customer Picker Modal */}
      <Modal
        visible={customerPickerVisible}
        onClose={() => setCustomerPickerVisible(false)}
        title="انتخاب مشتری از بانک اطلاعات"
      >
        <Input
          placeholder="جستجوی نام یا شماره موبایل..."
          value={customerSearch}
          onChangeText={setCustomerSearch}
          containerStyle={{ marginBottom: spacing.sm }}
        />

        {filteredCustomers.map((cust) => (
          <TouchableOpacity
            key={cust.id}
            style={styles.pickerItem}
            onPress={() => handleSelectCustomer(cust)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerPriceCol}>
              <Text style={styles.pickerPrice}>{cust.city}</Text>
              <Text style={styles.pickerStock}>
                {toPersianDigits(cust.total_orders)} سفارش
              </Text>
            </View>
            <View style={styles.pickerInfoCol}>
              <Text style={styles.pickerTitle}>{cust.full_name}</Text>
              <Text style={styles.pickerSku}>{toPersianDigits(cust.phone)}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  pickCustomerBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
  },
  pickCustomerBtnText: {
    fontSize: 11,
    color: colors.primary[800],
    fontWeight: 'bold',
  },
  addProductBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[700],
  },
  addProductBtnText: {
    fontSize: 11,
    color: colors.neutral.white,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  noItemsBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noItemsText: {
    fontSize: 13,
    color: colors.neutral[400],
  },
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  deleteItemBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
    color: colors.neutral[900],
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: 11,
    color: colors.primary[700],
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  shippingOptions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  shippingOptionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
  shippingOptionBtnActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[700],
  },
  shippingOptionText: {
    fontSize: 12,
    color: colors.neutral[700],
  },
  shippingOptionTextActive: {
    color: colors.primary[800],
    fontWeight: 'bold',
  },
  summaryCard: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  summaryTotalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerPriceCol: {
    alignItems: 'flex-start',
  },
  pickerPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  pickerStock: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  pickerInfoCol: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: spacing.md,
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'right',
  },
  pickerSku: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
});
