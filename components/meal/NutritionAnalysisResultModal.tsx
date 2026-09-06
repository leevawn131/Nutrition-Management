import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AIRecognitionResult, MealType } from '@/types/meal.types';

interface NutritionAnalysisResultModalProps {
  visible: boolean;
  imageUri?: string | null;
  result?: AIRecognitionResult | null;
  onClose: () => void;
  onConfirmSave: (data: {
    food_name: string;
    portion_grams: number;
    calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
    meal_type: MealType;
    recognition_id?: string;
  }) => void;
}

export const NutritionAnalysisResultModal: React.FC<NutritionAnalysisResultModalProps> = ({
  visible,
  imageUri,
  result,
  onClose,
  onConfirmSave,
}) => {
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayName = days[now.getDay()];
    const dateFormatted = `${dayName}, ${now.getDate()} tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    setCurrentDateStr(dateFormatted);
    setCurrentTimeStr(timeFormatted);
  }, [visible]);

  if (!visible || !result) return null;

  // Calculate percentages
  const calories = Math.round(result.calories || 0);
  const proteinG = Math.round(result.protein_g || 0);
  const carbG = Math.round(result.carb_g || 0);
  const fatG = Math.round(result.fat_g || 0);

  const totalMacroG = proteinG + carbG + fatG || 1;
  const carbPct = Math.round((carbG / totalMacroG) * 100);
  const proteinPct = Math.round((proteinG / totalMacroG) * 100);
  const fatPct = Math.round((fatG / totalMacroG) * 100);

  const glycemicLoad =
    result.glycemic_load !== undefined && result.glycemic_load !== null
      ? Math.round(result.glycemic_load * 10) / 10
      : Math.round(((carbG * 55) / 100) * 10) / 10;
  const glPositionPct = Math.min(100, Math.max(0, (glycemicLoad / 30) * 100));

  const handleSave = () => {
    onConfirmSave({
      food_name: result.food_name || 'Bữa ăn',
      portion_grams: result.estimated_weight_g || 200,
      calories,
      protein_g: result.protein_g || 0,
      carb_g: result.carb_g || 0,
      fat_g: result.fat_g || 0,
      meal_type: mealType,
      recognition_id: result.recognition_id,
    });
  };

  const getMealTypeLabel = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return 'Bữa sáng';
      case 'lunch':
        return 'Bữa trưa';
      case 'dinner':
        return 'Bữa tối';
      case 'snack':
        return 'Bữa phụ';
      default:
        return 'Bữa ăn';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn}>
            <Ionicons name="close" size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phân tích dinh dưỡng</Text>
          <TouchableOpacity style={styles.headerShareBtn}>
            <Ionicons name="paper-plane-outline" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Top Banner Image */}
          {imageUri ? (
            <View style={styles.bannerImageContainer}>
              <Image source={{ uri: imageUri }} style={styles.bannerImage} resizeMode="cover" />
            </View>
          ) : null}

          {/* Section Title */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Dinh dưỡng cho bữa ăn của bạn:</Text>
            <Ionicons name="information-circle-outline" size={18} color="#94A3B8" />
          </View>

          {/* Donut Macro Breakdown Card */}
          <View style={styles.macroCard}>
            {/* Donut Chart */}
            <View style={styles.donutContainer}>
              <View style={styles.donutOuter}>
                <View style={styles.donutInner}>
                  <Text style={styles.donutCalorieNum}>{calories}</Text>
                  <Text style={styles.donutCalorieLabel}>kCal</Text>
                </View>
              </View>
            </View>

            {/* Macro Stats Legend */}
            <View style={styles.macroLegendColumn}>
              {/* Carbs */}
              <View style={styles.macroLegendRow}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.macroName}>Tinh bột</Text>
                <Text style={styles.macroPct}>{carbPct}%</Text>
                <Text style={styles.macroGrams}>({carbG})g</Text>
              </View>

              {/* Protein */}
              <View style={styles.macroLegendRow}>
                <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.macroName}>Chất đạm</Text>
                <Text style={styles.macroPct}>{proteinPct}%</Text>
                <Text style={styles.macroGrams}>({proteinG})g</Text>
              </View>

              {/* Fat */}
              <View style={styles.macroLegendRow}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.macroName}>Chất béo</Text>
                <Text style={styles.macroPct}>{fatPct}%</Text>
                <Text style={styles.macroGrams}>({fatG})g</Text>
              </View>
            </View>
          </View>

          {/* Glycemic Load (GL) Gauge */}
          <View style={styles.glContainer}>
            <Text style={styles.glText}>
              Chỉ số tải đường huyết (Glycemic Load):{' '}
              <Text style={styles.glValue}>{glycemicLoad}</Text>
            </Text>

            {/* Scale Bar */}
            <View style={styles.glBarContainer}>
              <View style={styles.glBarBackground} />
              {/* Pointer indicator */}
              <View style={[styles.glPointer, { left: `${glPositionPct}%` }]}>
                <View style={styles.glPointerTriangle} />
              </View>
            </View>
            <View style={styles.glScaleLabels}>
              <Text style={styles.glScaleNum}>10</Text>
              <Text style={styles.glScaleNum}>20</Text>
            </View>
          </View>

          {/* Date & Time Selectors */}
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Ngày ghi nhận:</Text>
            <TouchableOpacity style={styles.pickerBtn}>
              <Text style={styles.pickerBtnText}>{currentDateStr}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            <Text style={[styles.pickerLabel, { marginTop: 12 }]}>Giờ ăn:</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => {
                const types: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
                const currentIndex = types.indexOf(mealType);
                const nextType = types[(currentIndex + 1) % types.length];
                setMealType(nextType);
              }}
            >
              <Text style={styles.pickerBtnText}>
                {currentTimeStr} ({getMealTypeLabel(mealType)})
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Detailed Ingredients Breakdown */}
          <Text style={styles.ingredientsHeader}>Các món trong bữa ăn:</Text>
          <View style={styles.dishSummaryRow}>
            <Text style={styles.dishTitle}>{result.food_name || 'Bữa ăn chính'}</Text>
            <Text style={styles.dishCalories}>{calories} kCal</Text>
          </View>

          {result.ingredients && result.ingredients.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ingredientsScroll}>
              {result.ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingredientCard}>
                  <View style={styles.ingredientImagePlaceholder}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#64748B" />
                  </View>
                  <Text style={styles.ingredientName} numberOfLines={1}>
                    {ing.name}
                  </Text>
                  <Text style={styles.ingredientWeight}>{ing.estimated_weight_g}g</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.ingredientCardSingle}>
              <Text style={styles.ingredientName}>{result.food_name}</Text>
              <Text style={styles.ingredientWeight}>{result.estimated_weight_g || 200}g</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Floating Save Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="bookmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>Lưu vào nhật ký bữa ăn</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
    borderBottomColor: '#F1F5F9',
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerShareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  bannerImageContainer: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  macroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  donutContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: '#10B981',
    borderTopColor: '#3B82F6',
    borderRightColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCalorieNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  donutCalorieLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  macroLegendColumn: {
    flex: 1,
    marginLeft: 16,
    gap: 10,
  },
  macroLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  macroName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  macroPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 4,
  },
  macroGrams: {
    fontSize: 12,
    color: '#94A3B8',
  },
  glContainer: {
    marginBottom: 20,
  },
  glText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  glValue: {
    color: '#EF4444',
    fontWeight: '800',
  },
  glBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'visible',
    marginVertical: 4,
  },
  glBarBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  glPointer: {
    position: 'absolute',
    top: 8,
    marginLeft: -6,
  },
  glPointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
  },
  glScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '30%',
    marginTop: 12,
  },
  glScaleNum: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  pickerSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 6,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  ingredientsHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  dishSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dishTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  dishCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  ingredientsScroll: {
    flexDirection: 'row',
  },
  ingredientCard: {
    width: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ingredientImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
    textAlign: 'center',
  },
  ingredientWeight: {
    fontSize: 11,
    color: '#64748B',
  },
  ingredientCardSingle: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
