import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { FoodItemCard } from './FoodItemCard';
import { FoodItem } from '@/types/food.types';
import { IngredientInput, MealType } from '@/types/meal.types';

interface SelectedIngredient extends IngredientInput {
  item: FoodItem;
}

interface ManualMealLogModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSave: (data: {
    meal_type: MealType;
    ingredients: IngredientInput[];
    totalCalories: number;
    totalProtein: number;
    totalCarb: number;
    totalFat: number;
  }) => Promise<void> | void;
}

export const ManualMealLogModal: React.FC<ManualMealLogModalProps> = ({
  visible,
  onClose,
  onConfirmSave,
}) => {
  const { searchQuery, setSearchQuery, foods, loading } = useFoodSearch();
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [submitting, setSubmitting] = useState(false);

  // Toggle selection of food item
  const handleToggleSelectFood = (item: FoodItem) => {
    const existingIndex = selectedIngredients.findIndex((ing) => ing.food_item_id === item._id);
    if (existingIndex >= 0) {
      // Remove
      setSelectedIngredients(selectedIngredients.filter((ing) => ing.food_item_id !== item._id));
    } else {
      // Add default 100g
      setSelectedIngredients([
        ...selectedIngredients,
        {
          food_item_id: item._id,
          weight_g: 100,
          item,
          name: item.name,
          calories_per_100g: item.calories_per_100g,
          protein_per_100g: item.protein_per_100g,
          carb_per_100g: item.carb_per_100g,
          fat_per_100g: item.fat_per_100g,
        },
      ]);
    }
  };

  // Update quantity in grams
  const handleUpdateWeight = (food_item_id: string, weightText: string) => {
    const weightNum = parseFloat(weightText) || 0;
    setSelectedIngredients(
      selectedIngredients.map((ing) =>
        ing.food_item_id === food_item_id ? { ...ing, weight_g: weightNum } : ing
      )
    );
  };

  // Real-time Macro calculation
  const calculateTotals = () => {
    let calories = 0;
    let protein = 0;
    let carb = 0;
    let fat = 0;

    selectedIngredients.forEach((ing) => {
      const factor = (ing.weight_g || 0) / 100;
      calories += (ing.calories_per_100g || 0) * factor;
      protein += (ing.protein_per_100g || 0) * factor;
      carb += (ing.carb_per_100g || 0) * factor;
      fat += (ing.fat_per_100g || 0) * factor;
    });

    return {
      calories: Math.round(calories * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      carb: Math.round(carb * 10) / 10,
      fat: Math.round(fat * 10) / 10,
    };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    if (selectedIngredients.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Thông báo: Vui lòng chọn ít nhất 1 nguyên liệu/món ăn.');
      } else {
        Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 nguyên liệu/món ăn.');
      }
      return;
    }

    try {
      setSubmitting(true);
      await onConfirmSave({
        meal_type: mealType,
        ingredients: selectedIngredients.map((ing) => ({
          food_item_id: ing.food_item_id,
          weight_g: ing.weight_g,
        })),
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarb: totals.carb,
        totalFat: totals.fat,
      });
    } catch (err: any) {
      console.error('Lỗi khi nhấn lưu bữa ăn:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Tự nấu & Ghi thủ công</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm nguyên liệu / món ăn..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Meal Type Chip Selection */}
          <View style={styles.mealTypeRow}>
            {[
              { key: 'breakfast', label: 'Bữa sáng' },
              { key: 'lunch', label: 'Bữa trưa' },
              { key: 'dinner', label: 'Bữa tối' },
              { key: 'snack', label: 'Bữa phụ' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.mealTypeChip,
                  mealType === item.key && styles.mealTypeChipActive,
                ]}
                onPress={() => setMealType(item.key as MealType)}
              >
                <Text
                  style={[
                    styles.mealTypeChipText,
                    mealType === item.key && styles.mealTypeChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Ingredients Gram Inputs */}
          {selectedIngredients.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedTitle}>
                Đã chọn ({selectedIngredients.length} nguyên liệu):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedScroll}>
                {selectedIngredients.map((ing) => (
                  <View key={ing.food_item_id} style={styles.selectedCard}>
                    <Text style={styles.selectedName} numberOfLines={1}>
                      {ing.name}
                    </Text>
                    <View style={styles.gramInputWrapper}>
                      <TextInput
                        style={styles.gramInput}
                        keyboardType="numeric"
                        value={ing.weight_g.toString()}
                        onChangeText={(val) => handleUpdateWeight(ing.food_item_id, val)}
                      />
                      <Text style={styles.gramUnit}>g</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleSelectFood(ing.item)}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              {/* Total Calculation Bar */}
              <View style={styles.totalsSummaryCard}>
                <View style={styles.totalCalorieRow}>
                  <Text style={styles.totalCalorieLabel}>Tổng năng lượng:</Text>
                  <Text style={styles.totalCalorieValue}>{totals.calories} kcal</Text>
                </View>
                <Text style={styles.totalsMacroText}>
                  Đạm: {totals.protein}g • Đường: {totals.carb}g • Béo: {totals.fat}g
                </Text>
              </View>
            </View>
          )}

          {/* Catalog Food Items list */}
          <Text style={styles.catalogTitle}>Danh mục món ăn:</Text>
          <FlatList
            data={foods}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const isSelected = selectedIngredients.some((ing) => ing.food_item_id === item._id);
              return (
                <FoodItemCard
                  item={item}
                  isSelected={isSelected}
                  onSelect={handleToggleSelectFood}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />

          {/* Save Button */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {submitting ? 'Đang lưu bữa ăn...' : `Lưu bữa ăn (${totals.calories} kcal)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  mealTypeChipActive: {
    backgroundColor: '#059669',
  },
  mealTypeChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  mealTypeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  selectedScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minWidth: 110,
  },
  selectedName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  gramInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gramInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    minWidth: 40,
    textAlign: 'center',
  },
  gramUnit: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  totalsSummaryCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  totalCalorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCalorieLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  totalCalorieValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
  },
  totalsMacroText: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 80,
  },
  actionRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    zIndex: 9999,
    elevation: 20,
  },
  saveBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
