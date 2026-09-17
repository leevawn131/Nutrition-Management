import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMealPlanPreviewPayload } from '@/types/chat.types';

interface ChatMealPlanPreviewProps {
  payload: ChatMealPlanPreviewPayload;
  onConfirm: () => void;
  onEdit: () => void;
  onViewRecipe?: (recipeId?: string, meal?: any) => void;
  disabled?: boolean;
}

export const ChatMealPlanPreview: React.FC<ChatMealPlanPreviewProps> = ({
  payload,
  onConfirm,
  onEdit,
  onViewRecipe,
  disabled = false,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  if (!payload || !payload.days || payload.days.length === 0) return null;

  const mealTypeConfig: Record<string, { label: string; bg: string; color: string }> = {
    breakfast: { label: '🌅 Sáng', bg: '#FEF3C7', color: '#B45309' },
    lunch: { label: '☀️ Trưa', bg: '#DCFCE7', color: '#15803D' },
    dinner: { label: '🌙 Tối', bg: '#E0E7FF', color: '#4338CA' },
    snack: { label: '🍎 Phụ', bg: '#FCE7F3', color: '#BE185D' },
  };

  const activeDay = payload.days[selectedDayIndex] || payload.days[0];

  // Fallback tính toán chỉ số dinh dưỡng nếu chưa có sẵn từ payload
  const nutSummary =
    payload.nutrition_summary ||
    (() => {
      let totP = 0;
      let totC = 0;
      let totF = 0;
      const count = payload.days?.length || 1;
      payload.days?.forEach((d) => {
        totP += d.day_protein_g || 0;
        totC += d.day_carbs_g || 0;
        totF += d.day_fat_g || 0;
      });
      const avgP = Math.round(totP / count);
      const avgC = Math.round(totC / count);
      const avgF = Math.round(totF / count);
      const pKcal = avgP * 4;
      const cKcal = avgC * 4;
      const fKcal = avgF * 9;
      const totK = pKcal + cKcal + fKcal || 1;
      return {
        avg_calories: payload.average_calories || 0,
        target_calories: payload.target_calories_per_day,
        avg_protein_g: avgP,
        avg_carbs_g: avgC,
        avg_fat_g: avgF,
        protein_pct: Math.round((pKcal / totK) * 100),
        carb_pct: Math.round((cKcal / totK) * 100),
        fat_pct: Math.max(0, 100 - Math.round((pKcal / totK) * 100) - Math.round((cKcal / totK) * 100)),
        water_liters: '2.0 - 2.5L',
        fiber_g: '25 - 30g',
      };
    })();

  const renderDayMeals = (day: typeof activeDay) => (
    <View style={styles.mealsContainer}>
      {day.meals.map((m, mIdx) => {
        const typeCfg = mealTypeConfig[m.meal_type] || {
          label: m.meal_type,
          bg: '#F3F4F6',
          color: '#374151',
        };

        return (
          <TouchableOpacity
            key={`meal-${mIdx}`}
            style={styles.mealCard}
            activeOpacity={0.7}
            onPress={() => onViewRecipe?.(m.recipe_id, m)}
          >
            <View style={styles.mealHeader}>
              <View style={[styles.mealTypeBadge, { backgroundColor: typeCfg.bg }]}>
                <Text style={[styles.mealTypeBadgeText, { color: typeCfg.color }]}>
                  {typeCfg.label}
                </Text>
              </View>
              <View style={styles.mealHeaderRight}>
                <Text style={styles.mealCaloBadge}>🔥 {Math.round(m.calories)} kcal</Text>
                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
              </View>
            </View>

            <Text style={styles.mealTitle} numberOfLines={2}>
              {m.title}
            </Text>

            <View style={styles.mealMacroRow}>
              <Text style={styles.mealMacroItem}>💪 {m.protein_g || 0}g Đạm</Text>
              <Text style={styles.mealMacroDot}>•</Text>
              <Text style={styles.mealMacroItem}>🌾 {m.carbs_g || 0}g Carb</Text>
              <Text style={styles.mealMacroDot}>•</Text>
              <Text style={styles.mealMacroItem}>🥑 {m.fat_g || 0}g Béo</Text>
            </View>

            <View style={styles.mealTapHint}>
              <Ionicons name="restaurant-outline" size={11} color="#059669" />
              <Text style={styles.mealTapHintText}>Bấm để xem chi tiết & công thức</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Overview Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTopRow}>
          <Text style={styles.bannerTitle}>
            📅 Kế hoạch thực đơn {payload.plan_period || `${payload.days.length} ngày`}
          </Text>
          {payload.days.length > 1 && (
            <TouchableOpacity
              style={styles.toggleViewBtn}
              onPress={() => setViewMode((prev) => (prev === 'single' ? 'all' : 'single'))}
              activeOpacity={0.7}
            >
              <Ionicons
                name={viewMode === 'single' ? 'list-outline' : 'calendar-outline'}
                size={14}
                color="#047857"
              />
              <Text style={styles.toggleViewText}>
                {viewMode === 'single' ? 'Xem tất cả' : 'Từng ngày'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.bannerSub}>
          Trung bình ~{payload.average_calories || 0} kcal/ngày
          {payload.target_calories_per_day
            ? ` • Mục tiêu: ${payload.target_calories_per_day} kcal`
            : ''}
        </Text>
      </View>

      {/* 1. Phần giải thích ở trên cái kế hoạch (Rationale / Định hướng dinh dưỡng) */}
      <View style={styles.explanationBox}>
        <View style={styles.explanationHeader}>
          <Ionicons name="sparkles" size={14} color="#047857" />
          <Text style={styles.explanationTitle}>Định hướng & Cơ sở dinh dưỡng</Text>
        </View>
        <Text style={styles.explanationText}>
          {payload.explanation ||
            `Thực đơn ${payload.days.length} ngày được thiết kế cân bằng khoa học, bám sát mức năng lượng ~${payload.average_calories} kcal/ngày. Các món ăn giàu đạm, đủ vi chất và phân bổ đều để bạn duy trì năng lượng bền bỉ.`}
        </Text>
      </View>

      {/* Mode 1: Interactive Day Tabs & Single Day Detail */}
      {viewMode === 'single' ? (
        <View style={styles.body}>
          {/* Day Selector Tabs (if multiple days) */}
          {payload.days.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContainer}
            >
              {payload.days.map((day, dIdx) => {
                const isSelected = selectedDayIndex === dIdx;
                return (
                  <TouchableOpacity
                    key={`day-tab-${dIdx}`}
                    style={[styles.tabItem, isSelected && styles.tabItemActive]}
                    onPress={() => setSelectedDayIndex(dIdx)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.tabItemTitle, isSelected && styles.tabItemTitleActive]}>
                      Ngày {dIdx + 1}
                    </Text>
                    <Text style={[styles.tabItemCalo, isSelected && styles.tabItemCaloActive]}>
                      {day.day_calories} kcal
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Selected Day Content */}
          <View style={styles.activeDayCard}>
            <View style={styles.activeDayHeader}>
              <Text style={styles.activeDayTitle}>
                {activeDay.day_label || `Ngày ${selectedDayIndex + 1}`}
              </Text>
              <View style={styles.activeDayCaloBadge}>
                <Text style={styles.activeDayCaloText}>Tổng: {activeDay.day_calories} kcal</Text>
              </View>
            </View>

            {/* Daily Macro Summary */}
            <View style={styles.dailyMacroBar}>
              <View style={styles.macroMiniBox}>
                <Text style={styles.macroMiniVal}>{activeDay.day_protein_g || 0}g</Text>
                <Text style={styles.macroMiniLbl}>Đạm</Text>
              </View>
              <View style={styles.macroMiniDivider} />
              <View style={styles.macroMiniBox}>
                <Text style={styles.macroMiniVal}>{activeDay.day_carbs_g || 0}g</Text>
                <Text style={styles.macroMiniLbl}>Đường bột</Text>
              </View>
              <View style={styles.macroMiniDivider} />
              <View style={styles.macroMiniBox}>
                <Text style={styles.macroMiniVal}>{activeDay.day_fat_g || 0}g</Text>
                <Text style={styles.macroMiniLbl}>Chất béo</Text>
              </View>
            </View>

            {/* Meals in the day */}
            {renderDayMeals(activeDay)}
          </View>
        </View>
      ) : (
        /* Mode 2: View All Days list */
        <View style={styles.allDaysContainer}>
          {payload.days.map((day, dIdx) => (
            <View key={`all-day-${dIdx}`} style={styles.allDayCard}>
              <View style={styles.allDayHeader}>
                <Text style={styles.allDayTitle}>{day.day_label || `Ngày ${dIdx + 1}`}</Text>
                <Text style={styles.allDayCalo}>{day.day_calories} kcal</Text>
              </View>
              {renderDayMeals(day)}
            </View>
          ))}
        </View>
      )}

      {/* 2. Chi tiết thông tin dinh dưỡng ở dưới cùng (sau kế hoạch) */}
      <View style={styles.nutritionDetailSection}>
        <View style={styles.nutritionSectionHeader}>
          <Ionicons name="pie-chart-outline" size={15} color="#059669" />
          <Text style={styles.nutritionSectionTitle}>Chi tiết thông tin dinh dưỡng tổng thể</Text>
        </View>

        {/* 3 Macro Cards */}
        <View style={styles.macroCardsRow}>
          <View style={[styles.macroDetailCard, { borderTopColor: '#3B82F6' }]}>
            <Text style={styles.macroCardName}>💪 Đạm (Protein)</Text>
            <Text style={styles.macroCardValue}>{nutSummary.avg_protein_g}g</Text>
            <Text style={styles.macroCardRatio}>{nutSummary.protein_pct}% calo</Text>
          </View>

          <View style={[styles.macroDetailCard, { borderTopColor: '#F59E0B' }]}>
            <Text style={styles.macroCardName}>🌾 Đường bột</Text>
            <Text style={styles.macroCardValue}>{nutSummary.avg_carbs_g}g</Text>
            <Text style={styles.macroCardRatio}>{nutSummary.carb_pct}% calo</Text>
          </View>

          <View style={[styles.macroDetailCard, { borderTopColor: '#10B981' }]}>
            <Text style={styles.macroCardName}>🥑 Chất béo</Text>
            <Text style={styles.macroCardValue}>{nutSummary.avg_fat_g}g</Text>
            <Text style={styles.macroCardRatio}>{nutSummary.fat_pct}% calo</Text>
          </View>
        </View>

        {/* Extra Guidelines: Nước, chất xơ, thói quen sinh hoạt */}
        <View style={styles.guidelinesBox}>
          <View style={styles.guidelineItem}>
            <Ionicons name="water-outline" size={13} color="#0284C7" />
            <Text style={styles.guidelineText}>
              Nước uống: <Text style={styles.guidelineHighlight}>{nutSummary.water_liters || '2.0 - 2.5L'}/ngày</Text> (hỗ trợ trao đổi chất)
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="nutrition-outline" size={13} color="#059669" />
            <Text style={styles.guidelineText}>
              Chất xơ: <Text style={styles.guidelineHighlight}>{nutSummary.fiber_g || '25 - 30g'}/ngày</Text> (hỗ trợ tiêu hóa & no lâu)
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="moon-outline" size={13} color="#D97706" />
            <Text style={styles.guidelineText}>
              Bữa tối nên cách giờ ngủ <Text style={styles.guidelineHighlight}>ít nhất 2.5 - 3 tiếng</Text> để cơ thể nghỉ ngơi tối ưu.
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.btnConfirm, disabled && styles.btnDisabled]}
          disabled={disabled}
          activeOpacity={0.8}
          onPress={onConfirm}
        >
          <Text style={styles.btnConfirmText}>✅ Đồng ý, lưu kế hoạch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnEdit, disabled && styles.btnDisabled]}
          disabled={disabled}
          activeOpacity={0.8}
          onPress={onEdit}
        >
          <Text style={styles.btnEditText}>✏️ Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  banner: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
    marginRight: 8,
  },
  toggleViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  toggleViewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  bannerSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 3,
  },
  explanationBox: {
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  explanationText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  body: {
    paddingBottom: 4,
  },
  tabsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 78,
  },
  tabItemActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  tabItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabItemTitleActive: {
    color: '#FFFFFF',
  },
  tabItemCalo: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabItemCaloActive: {
    color: '#E6FFFA',
    fontWeight: '600',
  },
  activeDayCard: {
    padding: 12,
  },
  activeDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeDayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 6,
  },
  activeDayCaloBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeDayCaloText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  dailyMacroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  macroMiniBox: {
    flex: 1,
    alignItems: 'center',
  },
  macroMiniVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  macroMiniLbl: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  macroMiniDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E7EB',
  },
  mealsContainer: {
    gap: 8,
  },
  mealCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mealTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mealTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mealCaloBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  mealMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealMacroItem: {
    fontSize: 11,
    color: '#6B7280',
  },
  mealMacroDot: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  mealTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  mealTapHintText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  allDaysContainer: {
    padding: 12,
    gap: 12,
  },
  allDayCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  allDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  allDayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  allDayCalo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  btnConfirm: {
    flex: 1.4,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnEdit: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEditText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  nutritionDetailSection: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nutritionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  nutritionSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  macroCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  macroDetailCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  macroCardName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 2,
  },
  macroCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  macroCardRatio: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  guidelinesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guidelineText: {
    fontSize: 11,
    color: '#4B5563',
    flex: 1,
    lineHeight: 16,
  },
  guidelineHighlight: {
    fontWeight: '700',
    color: '#111827',
  },
});
