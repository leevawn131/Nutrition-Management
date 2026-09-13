import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { groceryService } from '@/services/grocery.service';
import { RecipeIngredient } from '@/types/plan.types';

export interface GroceryIngredientItem {
  name: string;
  quantity?: number | string | null;
  unit?: string | null;
  category: 'CHẤT BÉO' | 'CÁ VÀ HẢI SẢN' | 'CỦ' | 'RAU VÀ GIA VỊ';
  image_url: string;
  bg_color: string;
}

const DEFAULT_LAU_INGREDIENTS: GroceryIngredientItem[] = [
  // CHẤT BÉO
  {
    name: 'Dầu ăn',
    quantity: '1',
    unit: 'thìa canh',
    category: 'CHẤT BÉO',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=160',
    bg_color: '#FEF9C3',
  },
  // CÁ VÀ HẢI SẢN
  {
    name: 'Cá rô phi',
    quantity: '500',
    unit: 'g',
    category: 'CÁ VÀ HẢI SẢN',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=160',
    bg_color: '#F1F5F9',
  },
  {
    name: 'Tôm sú',
    quantity: '300',
    unit: 'g',
    category: 'CÁ VÀ HẢI SẢN',
    image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=160',
    bg_color: '#E0F2FE',
  },
  // CỦ
  {
    name: 'Cà chua',
    quantity: '2',
    unit: 'quả (vừa)',
    category: 'CỦ',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=160',
    bg_color: '#FFEDD5',
  },
  {
    name: 'Hành khô (hành tím)',
    quantity: '3',
    unit: 'muỗng canh băm',
    category: 'CỦ',
    image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=160',
    bg_color: '#F3E8FF',
  },
  {
    name: 'Tỏi ta',
    quantity: '5',
    unit: 'tép',
    category: 'CỦ',
    image_url: 'https://images.unsplash.com/photo-1615477045952-b430db808945?w=160',
    bg_color: '#FEF3C7',
  },
  // RAU VÀ GIA VỊ
  {
    name: 'Rau muống',
    quantity: '300',
    unit: 'g',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=160',
    bg_color: '#DCFCE7',
  },
  {
    name: 'Cải thảo (bắp cải thảo)',
    quantity: '300',
    unit: 'g',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=160',
    bg_color: '#ECFDF5',
  },
  {
    name: 'Ớt tươi (Ớt cay)',
    quantity: '3',
    unit: 'quả',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=160',
    bg_color: '#FEE2E2',
  },
  {
    name: 'Mắm tôm đặc',
    quantity: '20',
    unit: 'g',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160',
    bg_color: '#EDE9FE',
  },
  {
    name: 'Nước',
    quantity: '1.5',
    unit: 'lít',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=160',
    bg_color: '#E0F2FE',
  },
  {
    name: 'Muối',
    quantity: '1',
    unit: 'thìa cà phê',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=160',
    bg_color: '#F1F5F9',
  },
  {
    name: 'Đường kính',
    quantity: '15',
    unit: 'g',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=160',
    bg_color: '#FEF3C7',
  },
  {
    name: 'Bún',
    quantity: '600',
    unit: 'g',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=160',
    bg_color: '#F3F4F6',
  },
  {
    name: 'Rau mùi tàu (ngò gai)',
    quantity: '20',
    unit: 'g',
    category: 'RAU VÀ GIA VỊ',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=160',
    bg_color: '#DCFCE7',
  },
];

interface GroceryCartModalProps {
  visible: boolean;
  recipeTitle?: string;
  recipeIngredients?: RecipeIngredient[];
  onClose: () => void;
  onAddedSuccess?: (count: number) => void;
}

export function GroceryCartModal({
  visible,
  recipeTitle = 'Lẩu cá tôm',
  recipeIngredients,
  onClose,
  onAddedSuccess,
}: GroceryCartModalProps) {
  const items = DEFAULT_LAU_INGREDIENTS;

  // Track checked state of each ingredient
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    items.forEach((_, i) => {
      init[i] = true;
    });
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkedCount = Object.values(checkedMap).filter(Boolean).length;
  const isAllChecked = checkedCount === items.length;

  const handleToggleAll = () => {
    const nextState = !isAllChecked;
    const updated: Record<number, boolean> = {};
    items.forEach((_, i) => {
      updated[i] = nextState;
    });
    setCheckedMap(updated);
  };

  const handleToggleItem = (index: number) => {
    setCheckedMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAddToCart = async () => {
    if (checkedCount === 0) {
      if (Platform.OS === 'web') {
        window.alert('Vui lòng chọn ít nhất 1 nguyên liệu!');
      } else {
        Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 nguyên liệu!');
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedItems = items
        .filter((_, idx) => Boolean(checkedMap[idx]))
        .map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          image_url: item.image_url,
          checked: false,
          recipe_name: recipeTitle,
        }));

      await groceryService.addIngredients(selectedItems);

      const msg = `Đã thêm ${checkedCount} nguyên liệu vào giỏ đi chợ thành công!`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Giỏ đi chợ', msg);
      }

      onAddedSuccess?.(checkedCount);
      onClose();
    } catch (err) {
      console.warn('Error adding to grocery cart:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by category
  const categories: Array<'CHẤT BÉO' | 'CÁ VÀ HẢI SẢN' | 'CỦ' | 'RAU VÀ GIA VỊ'> = [
    'CHẤT BÉO',
    'CÁ VÀ HẢI SẢN',
    'CỦ',
    'RAU VÀ GIA VỊ',
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityLabel="Quay lại">
            <Ionicons name="arrow-back" size={22} color="#10294B" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Thêm nguyên liệu vào giỏ</Text>

          <TouchableOpacity
            style={[styles.checkAllButton, isAllChecked && styles.checkAllButtonActive]}
            onPress={handleToggleAll}
            activeOpacity={0.8}
            accessibilityLabel="Chọn tất cả">
            <Ionicons
              name="checkmark"
              size={18}
              color={isAllChecked ? '#FFFFFF' : '#49C99B'}
            />
          </TouchableOpacity>
        </View>

        {/* Ingredients List Grouped by Category */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {categories.map((category) => {
            const categoryItems = items
              .map((item, originalIndex) => ({ item, originalIndex }))
              .filter(({ item }) => item.category === category);

            if (categoryItems.length === 0) return null;

            return (
              <View key={category} style={styles.categorySection}>
                {/* Category Header with Divider Line */}
                <View style={styles.categoryHeaderRow}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View style={styles.categoryLine} />
                </View>

                {/* Items in Category */}
                <View style={styles.categoryItemsList}>
                  {categoryItems.map(({ item, originalIndex }) => {
                    const isChecked = Boolean(checkedMap[originalIndex]);

                    return (
                      <TouchableOpacity
                        key={originalIndex}
                        style={[styles.ingredientCard, isChecked && styles.ingredientCardChecked]}
                        onPress={() => handleToggleItem(originalIndex)}
                        activeOpacity={0.7}>
                        {/* Circular Image Icon with pastel background */}
                        <View
                          style={[
                            styles.itemImageWrapper,
                            { backgroundColor: item.bg_color || '#F1F5F9' },
                          ]}>
                          <Image
                            source={{ uri: item.image_url }}
                            style={styles.itemImage}
                            resizeMode="cover"
                          />
                        </View>

                        {/* Title & Quantity */}
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemText} numberOfLines={2}>
                            <Text style={styles.itemQuantity}>
                              {item.quantity ? `${item.quantity} ` : ''}
                              {item.unit ? `${item.unit} ` : ''}
                            </Text>
                            <Text style={styles.itemName}>{item.name}</Text>
                          </Text>
                        </View>

                        {/* Right Green Checkmark Circle */}
                        <View
                          style={[
                            styles.checkboxCircle,
                            isChecked && styles.checkboxCircleActive,
                          ]}>
                          {isChecked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Floating Green Button matching screenshot */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
            accessibilityLabel={`Thêm ${checkedCount} nguyên liệu vào giỏ`}>
            <Ionicons name="bag-check" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.submitButtonText}>Thêm {checkedCount} nguyên liệu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
    textAlign: 'center',
  },
  checkAllButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#49C99B',
  },
  checkAllButtonActive: {
    backgroundColor: '#49C99B',
    borderColor: '#49C99B',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  categoryItemsList: {
    gap: 10,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ingredientCardChecked: {
    backgroundColor: '#FAFAFC',
    borderColor: '#E2E8F0',
  },
  itemImageWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  itemQuantity: {
    fontWeight: '800',
    color: '#10294B',
  },
  itemName: {
    fontWeight: '500',
    color: '#334155',
  },
  checkboxCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxCircleActive: {
    backgroundColor: '#49C99B',
    borderColor: '#49C99B',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#49C99B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#49C99B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
