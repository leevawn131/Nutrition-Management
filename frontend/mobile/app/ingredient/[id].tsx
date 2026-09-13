import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { DAILY_VALUES, calculateDVPercentage } from '@/constants/dailyValues';
import { recipeService } from '@/services/recipe.service';

interface NutrientRow {
  key: string;
  label: string;
  valueDisplay: string;
  dvPercent: string;
}

export default function IngredientDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const ingredientId = params.id || 'thit-bo-xay';
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [ingredient, setIngredient] = useState<any>(null);

  useEffect(() => {
    fetchIngredientDetail();
  }, [ingredientId]);

  const fetchIngredientDetail = async () => {
    setLoading(true);
    try {
      // Try search or fetch ingredient by ID/query
      const queryName = params.name || ingredientId.replace(/-/g, ' ');
      const res = await recipeService.searchFoods(queryName);
      if (res && res.data && res.data.length > 0) {
        setIngredient(res.data[0]);
      } else {
        // Fallback default mockup for 'Thịt bò xay' if backend has no item
        setIngredient({
          _id: 'thit-bo-xay-sample',
          name: params.name || 'Thịt bò xay',
          description:
            'Thịt bò xay tươi là một nguyên liệu rất phổ biến trong các bữa ăn nhờ vào sự tiện lợi và dồi dào chất đạm.',
          calories_per_100g: 198,
          protein_per_100g: 19.4,
          fat_per_100g: 12.7,
          carb_per_100g: 0,
          calcium_mg: 12,
          potassium_mg: 289,
          zinc_mg: 5,
          unsaturated_fat_g: 0.5,
          vitamin_b12_ug: 2,
          iron_mg: 2,
          magnesium_mg: 19,
          phosphorus_mg: 175,
          sodium_mg: 68,
          cholesterol_mg: 62,
          trans_fat_g: 0.8,
          saturated_fat_g: 5.3,
        });
      }
    } catch (e) {
      console.error('Error loading ingredient detail:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    const msg = `Đã chọn nguyên liệu "${ingredient?.name || 'Thịt bò xay'}"`;
    if (Platform.OS === 'web') alert(msg);
    else Alert.alert('Thành công 🎉', msg);
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải thông tin nguyên liệu...</Text>
      </SafeAreaView>
    );
  }

  // Build rows array matching Screenshot #2 order
  const buildNutrientRows = (): NutrientRow[] => {
    if (!ingredient) return [];

    const fat = ingredient.fat_per_100g || ingredient.fat_g || 12.7;
    const calcium = ingredient.calcium_mg || 12;
    const potassium = ingredient.potassium_mg || 289;
    const zinc = ingredient.zinc_mg || 5;
    const unsatFat = ingredient.unsaturated_fat_g || 0.5;
    const vitB12 = ingredient.vitamin_b12_ug || 2;
    const iron = ingredient.iron_mg || 2;
    const mag = ingredient.magnesium_mg || 19;
    const phos = ingredient.phosphorus_mg || 175;
    const sodium = ingredient.sodium_mg || 68;
    const chol = ingredient.cholesterol_mg || 62;
    const transFat = ingredient.trans_fat_g || 0.8;
    const satFat = ingredient.saturated_fat_g || 5.3;
    const protein = ingredient.protein_per_100g || ingredient.protein_g || 19.4;
    const calories = ingredient.calories_per_100g || ingredient.calories || 198;

    return [
      {
        key: 'fat_g',
        label: 'Chất béo',
        valueDisplay: `${fat} g`,
        dvPercent: calculateDVPercentage(fat, 'fat_g'),
      },
      {
        key: 'calcium_mg',
        label: 'Canxi',
        valueDisplay: `${calcium} mg`,
        dvPercent: calculateDVPercentage(calcium, 'calcium_mg'),
      },
      {
        key: 'potassium_mg',
        label: 'Kali',
        valueDisplay: `${potassium} mg`,
        dvPercent: calculateDVPercentage(potassium, 'potassium_mg'),
      },
      {
        key: 'zinc_mg',
        label: 'Kẽm',
        valueDisplay: `${zinc} mg`,
        dvPercent: calculateDVPercentage(zinc, 'zinc_mg'),
      },
      {
        key: 'unsaturated_fat_g',
        label: 'Chất béo không bão hòa',
        valueDisplay: `${unsatFat} g`,
        dvPercent: calculateDVPercentage(unsatFat, 'unsaturated_fat_g'),
      },
      {
        key: 'vitamin_b12_ug',
        label: 'Vitamin B-12',
        valueDisplay: `${vitB12} ug`,
        dvPercent: calculateDVPercentage(vitB12, 'vitamin_b12_ug'),
      },
      {
        key: 'iron_mg',
        label: 'Sắt',
        valueDisplay: `${iron} mg`,
        dvPercent: calculateDVPercentage(iron, 'iron_mg'),
      },
      {
        key: 'magnesium_mg',
        label: 'Magiê',
        valueDisplay: `${mag} mg`,
        dvPercent: calculateDVPercentage(mag, 'magnesium_mg'),
      },
      {
        key: 'phosphorus_mg',
        label: 'Phốt pho',
        valueDisplay: `${phos} mg`,
        dvPercent: calculateDVPercentage(phos, 'phosphorus_mg'),
      },
      {
        key: 'sodium_mg',
        label: 'Natri',
        valueDisplay: `${sodium} mg`,
        dvPercent: calculateDVPercentage(sodium, 'sodium_mg'),
      },
      {
        key: 'cholesterol_mg',
        label: 'Cholesterol',
        valueDisplay: `${chol} mg`,
        dvPercent: calculateDVPercentage(chol, 'cholesterol_mg'),
      },
      {
        key: 'trans_fat_g',
        label: 'Chất béo chuyển hóa',
        valueDisplay: `${transFat} g`,
        dvPercent: calculateDVPercentage(transFat, 'trans_fat_g'),
      },
      {
        key: 'saturated_fat_g',
        label: 'Chất béo bão hoà',
        valueDisplay: `${satFat} g`,
        dvPercent: calculateDVPercentage(satFat, 'saturated_fat_g'),
      },
      {
        key: 'protein_g',
        label: 'Chất đạm',
        valueDisplay: `${protein} g`,
        dvPercent: calculateDVPercentage(protein, 'protein_g'),
      },
      {
        key: 'calories',
        label: 'Năng lượng',
        valueDisplay: `${calories} Calo`,
        dvPercent: calculateDVPercentage(calories, 'calories'),
      },
    ];
  };

  const nutrientList = buildNutrientRows();

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin nguyên liệu</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <FlatList
        data={nutrientList}
        keyExtractor={item => item.key}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        ListHeaderComponent={() => (
          <View style={styles.ingredientInfoSection}>
            <Text style={styles.ingredientName}>{ingredient?.name || 'Thịt bò xay'}</Text>
            <Text style={styles.ingredientDescription}>
              {ingredient?.description ||
                'Thịt bò xay tươi là một nguyên liệu rất phổ biến trong các bữa ăn nhờ vào sự tiện lợi và dồi dào chất đạm.'}
            </Text>

            {/* Table Column Headers */}
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeaderLeft}>Nutrient per 100 gram</Text>
              <Text style={styles.tableHeaderRight}>% DV</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <View style={styles.rowRightGroup}>
              <Text style={styles.rowValue}>{item.valueDisplay}</Text>
              <Text style={styles.rowDv}>{item.dvPercent}</Text>
            </View>
          </View>
        )}
      />

      {/* Sticky Bottom Action Button */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
        <TouchableOpacity style={styles.addStickyBtn} onPress={handleAddIngredient}>
          <Feather name="shopping-bag" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addStickyBtnText}>Thêm nguyên liệu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 15,
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  ingredientInfoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ingredientName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  ingredientDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderLeft: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  tableHeaderRight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: {
    fontSize: 14.5,
    color: '#334155',
    fontWeight: '500',
  },
  rowRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  rowDv: {
    fontSize: 13.5,
    color: '#94A3B8',
    width: 48,
    textAlign: 'right',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addStickyBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addStickyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
