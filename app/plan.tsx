import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityService } from '@/services/activity.service';
import { mealPlanService } from '@/services/meal_plan.service';
import { Activity, ActivityLog } from '@/types/activity.types';
import { FoodItem, MealPlanItem, MealType, Recipe } from '@/types/plan.types';

type Section = 'meals' | 'activities';
type ViewMode = 'day' | 'week';

interface DayInfo {
  label: string;
  date: number;
  weekend?: boolean;
}

interface WeekInfo {
  index: number;
  label: string;
  range: string;
  fullRange: string;
  days: DayInfo[];
}

const WEEKS_DATA: WeekInfo[] = [
  {
    index: 0,
    label: 'Tuần trước',
    range: '10/08 - 16/08',
    fullRange: '10/08/2026 - 16/08/2026',
    days: [
      { label: 'T2', date: 10 },
      { label: 'T3', date: 11 },
      { label: 'T4', date: 12 },
      { label: 'T5', date: 13 },
      { label: 'T6', date: 14 },
      { label: 'T7', date: 15, weekend: true },
      { label: 'CN', date: 16, weekend: true },
    ],
  },
  {
    index: 1,
    label: 'Tuần này',
    range: '17/08 - 23/08',
    fullRange: '17/08/2026 - 23/08/2026',
    days: [
      { label: 'T2', date: 17 },
      { label: 'T3', date: 18 },
      { label: 'T4', date: 19 },
      { label: 'T5', date: 20 },
      { label: 'T6', date: 21 },
      { label: 'T7', date: 22, weekend: true },
      { label: 'CN', date: 23, weekend: true },
    ],
  },
  {
    index: 2,
    label: 'Tuần sau',
    range: '24/08 - 30/08',
    fullRange: '24/08/2026 - 30/08/2026',
    days: [
      { label: 'T2', date: 24 },
      { label: 'T3', date: 25 },
      { label: 'T4', date: 26 },
      { label: 'T5', date: 27 },
      { label: 'T6', date: 28 },
      { label: 'T7', date: 29, weekend: true },
      { label: 'CN', date: 30, weekend: true },
    ],
  },
];

const MEAL_CATEGORIES: { key: MealType; title: string }[] = [
  { key: 'breakfast', title: 'Bữa sáng' },
  { key: 'lunch', title: 'Bữa trưa' },
  { key: 'dinner', title: 'Bữa tối' },
  { key: 'snack', title: 'Đồ ăn thêm trong ngày' },
];

export default function PlanScreen() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('activities');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(20);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [mealSheetVisible, setMealSheetVisible] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');

  // Meal plans state
  const [plannedMeals, setPlannedMeals] = useState<MealPlanItem[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const formattedDateStr = `2026-08-${String(selectedDate).padStart(2, '0')}`;
  const currentWeek = WEEKS_DATA[selectedWeek] || WEEKS_DATA[1];

  const loadData = useCallback(async () => {
    try {
      if (section === 'meals') {
        setLoadingMeals(true);
        const items = await mealPlanService.getMealPlans(formattedDateStr);
        setPlannedMeals(items);
      } else {
        setLoadingActivities(true);
        const logs = await activityService.getActivityLogs(formattedDateStr);
        setActivityLogs(logs);
      }
    } catch (error) {
      console.warn('Error loading plan data:', error);
    } finally {
      setLoadingMeals(false);
      setLoadingActivities(false);
    }
  }, [formattedDateStr, section]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSelectWeek = (weekIndex: number) => {
    setSelectedWeek(weekIndex);
    const targetWeek = WEEKS_DATA[weekIndex];
    if (targetWeek) {
      const isDateInWeek = targetWeek.days.some((d) => d.date === selectedDate);
      if (!isDateInWeek) {
        setSelectedDate(targetWeek.days[0].date);
      }
    }
  };

  const handleSelectDate = (dateNum: number) => {
    setSelectedDate(dateNum);
  };

  const handleOpenAddMeal = (mealType: MealType) => {
    setActiveMealType(mealType);
    setMealSheetVisible(true);
  };

  const handleSelectAddRecipe = () => {
    setMealSheetVisible(false);
    router.push({
      pathname: '/recipes',
      params: {
        mealType: activeMealType,
        planDate: formattedDateStr,
      },
    });
  };

  const handleSelectAddIngredient = () => {
    setMealSheetVisible(false);
    router.push({
      pathname: '/ingredients',
      params: {
        mealType: activeMealType,
        planDate: formattedDateStr,
      },
    });
  };

  const handleDeleteMealItem = async (item: MealPlanItem) => {
    let title = 'món ăn';
    if (typeof item.recipe_id === 'object' && item.recipe_id?.title) {
      title = item.recipe_id.title;
    } else if (typeof item.food_item_id === 'object' && item.food_item_id?.name) {
      title = item.food_item_id.name;
    }

    const executeDelete = async () => {
      setPlannedMeals((prev) => prev.filter((m) => m._id !== item._id));
      try {
        await mealPlanService.deleteMealPlanItem(item._id);
      } catch (err) {
        console.warn('Error deleting meal item:', err);
      } finally {
        loadData();
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(`Bạn có chắc muốn xoá "${title}" khỏi thực đơn?`)
          : true;
      if (confirmed) {
        await executeDelete();
      }
    } else {
      Alert.alert('Xoá khỏi kế hoạch', `Bạn có chắc muốn xoá "${title}" khỏi thực đơn?`, [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: executeDelete,
        },
      ]);
    }
  };

  const handleDeleteActivity = async (log: ActivityLog) => {
    const actName =
      (typeof log.activity_id === 'object' && log.activity_id?.name) ||
      log.custom_activity_name ||
      'hoạt động';

    const executeDelete = async () => {
      setActivityLogs((prev) => prev.filter((a) => a._id !== log._id));
      try {
        await activityService.deleteActivityLog(log._id);
      } catch (err) {
        console.warn('Error deleting activity log:', err);
      } finally {
        loadData();
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(`Bạn có chắc muốn xoá "${actName}" khỏi kế hoạch hoạt động?`)
          : true;
      if (confirmed) {
        await executeDelete();
      }
    } else {
      Alert.alert('Xoá hoạt động', `Bạn có chắc muốn xoá "${actName}" khỏi kế hoạch?`, [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: executeDelete,
        },
      ]);
    }
  };

  const handleOpenAddActivity = () => {
    router.push({
      pathname: '/activity',
      params: {
        planDate: formattedDateStr,
      },
    });
  };

  // Compute total planned calories and macros for selected day
  let totalCalories = 0;
  let totalCarb = 0;
  let totalProtein = 0;
  let totalFat = 0;

  plannedMeals.forEach((item) => {
    if (item.recipe_id && typeof item.recipe_id === 'object') {
      const r = item.recipe_id as Recipe;
      totalCalories += r.calories_per_serving || 0;
      totalProtein += r.protein_g || 0;
      totalCarb += r.carb_g || 0;
      totalFat += r.fat_g || 0;
    } else if (item.food_item_id && typeof item.food_item_id === 'object') {
      const f = item.food_item_id as FoodItem;
      totalCalories += f.calories_per_100g || 0;
      totalProtein += f.protein_per_100g || 0;
      totalCarb += f.carb_per_100g || 0;
      totalFat += f.fat_per_100g || 0;
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#10294B" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Kế hoạch</Text>
            <Text style={styles.subtitle}>
              {viewMode === 'week'
                ? `${currentWeek.label.toLowerCase()} (${currentWeek.fullRange})`
                : `thứ ${getDayName(selectedDate)}, ${selectedDate} tháng 8, 2026`}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Section and View Mode Switcher */}
        <View style={styles.controlsRow}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, section === 'meals' && styles.segmentActive]}
              onPress={() => setSection('meals')}>
              <Text style={[styles.segmentText, section === 'meals' && styles.segmentActiveText]}>
                Bữa ăn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, section === 'activities' && styles.segmentActive]}
              onPress={() => setSection('activities')}>
              <Text style={[styles.segmentText, section === 'activities' && styles.segmentActiveText]}>
                Hoạt động
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.segmentedControlSmall}>
            <TouchableOpacity
              style={[styles.segment, viewMode === 'day' && styles.segmentActive]}
              onPress={() => setViewMode('day')}>
              <Text style={[styles.segmentText, viewMode === 'day' && styles.segmentActiveText]}>
                Ngày
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, viewMode === 'week' && styles.segmentActive]}
              onPress={() => setViewMode('week')}>
              <Text style={[styles.segmentText, viewMode === 'week' && styles.segmentActiveText]}>
                Tuần
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Picker when in week mode */}
        {viewMode === 'week' ? (
          <View style={styles.weekPicker}>
            {WEEKS_DATA.map((week) => {
              const isWeekActive = selectedWeek === week.index;
              return (
                <TouchableOpacity
                  key={week.label}
                  style={[styles.weekItem, isWeekActive && styles.weekItemActive]}
                  onPress={() => handleSelectWeek(week.index)}
                  activeOpacity={0.7}>
                  <Text style={[styles.weekLabel, isWeekActive && styles.activeText]}>
                    {week.label}
                  </Text>
                  <Text style={[styles.weekRange, isWeekActive && styles.activeText]}>
                    {week.range}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.dayPicker}>
            {currentWeek.days.map((day) => {
              const isDateActive = selectedDate === day.date;
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[styles.dayItem, isDateActive && styles.dayItemActive]}
                  onPress={() => handleSelectDate(day.date)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.dayLabel,
                      day.weekend && styles.weekend,
                      isDateActive && styles.activeText,
                    ]}>
                    {day.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayDate,
                      day.weekend && styles.weekend,
                      isDateActive && styles.activeText,
                    ]}>
                    {day.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Content depending on section */}
        {section === 'meals' ? (
          <MealPlan
            viewMode={viewMode}
            currentWeekDays={currentWeek.days}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            plannedMeals={plannedMeals}
            loading={loadingMeals}
            totalCalories={totalCalories}
            totalCarb={totalCarb}
            totalProtein={totalProtein}
            totalFat={totalFat}
            onAddMeal={handleOpenAddMeal}
            onDeleteMealItem={handleDeleteMealItem}
          />
        ) : (
          <ActivityPlan
            viewMode={viewMode}
            currentWeekDays={currentWeek.days}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            activityLogs={activityLogs}
            loading={loadingActivities}
            onAddActivity={handleOpenAddActivity}
            onDeleteActivity={handleDeleteActivity}
          />
        )}
      </ScrollView>

      {/* Floating Bottom Quick Actions */}
      <View style={styles.floatingBar}>
        <TouchableOpacity
          style={styles.mascotButton}
          onPress={() => router.push('/habit-analysis')}
          activeOpacity={0.8}>
          <View style={styles.mascotCircle}>
            <MaterialCommunityIcons name="chef-hat" size={20} color="#49C99B" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickPill}
          onPress={() => router.push('/habit-analysis')}
          activeOpacity={0.8}>
          <Text style={styles.quickPillText}>Phân tích {section === 'meals' ? 'bữa ăn' : 'thói quen'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickPill}
          onPress={() => (section === 'meals' ? router.push('/recipes') : handleOpenAddActivity())}
          activeOpacity={0.8}>
          <Text style={styles.quickPillText}>{section === 'meals' ? 'Mẹo meal prep' : 'Thêm hoạt động'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickPill}
          onPress={() => router.push('/activity-insights')}
          activeOpacity={0.8}>
          <Text style={styles.quickPillText}>Xem tiến độ</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet for Recipe / Ingredient Selection */}
      <MealOptionsSheet
        visible={mealSheetVisible}
        onClose={() => setMealSheetVisible(false)}
        onSelectRecipe={handleSelectAddRecipe}
        onSelectIngredient={handleSelectAddIngredient}
      />
    </SafeAreaView>
  );
}

function getDayName(dateNum: number): string {
  switch (dateNum) {
    case 10: case 17: case 24: return 'hai';
    case 11: case 18: case 25: return 'ba';
    case 12: case 19: case 26: return 'tư';
    case 13: case 20: case 27: return 'năm';
    case 14: case 21: case 28: return 'sáu';
    case 15: case 22: case 29: return 'bảy';
    case 16: case 23: case 30: return 'nhất';
    default: return 'năm';
  }
}

function MealOptionsSheet({
  visible,
  onClose,
  onSelectRecipe,
  onSelectIngredient,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectRecipe: () => void;
  onSelectIngredient: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <TouchableOpacity style={styles.sheetDismissArea} onPress={onClose} activeOpacity={1} />
        <View style={styles.mealSheet}>
          <TouchableOpacity style={styles.mealSheetOption} onPress={onSelectRecipe} activeOpacity={0.8}>
            <MaterialCommunityIcons name="chef-hat" size={28} color="#49C99B" />
            <Text style={[styles.mealSheetText, { color: '#49C99B' }]}>Thêm công thức</Text>
          </TouchableOpacity>

          <View style={styles.mealSheetDivider} />

          <TouchableOpacity
            style={styles.mealSheetOption}
            onPress={onSelectIngredient}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="food-apple-outline" size={29} color="#F59E0B" />
            <Text style={[styles.mealSheetText, { color: '#F59E0B' }]}>Thêm nguyên liệu</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.sheetCancel} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.sheetCancelText}>Huỷ</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function MealPlan({
  viewMode,
  currentWeekDays,
  selectedDate,
  onSelectDate,
  plannedMeals,
  loading,
  totalCalories,
  totalCarb,
  totalProtein,
  totalFat,
  onAddMeal,
  onDeleteMealItem,
}: {
  viewMode: ViewMode;
  currentWeekDays: DayInfo[];
  selectedDate: number;
  onSelectDate: (dateNum: number) => void;
  plannedMeals: MealPlanItem[];
  loading: boolean;
  totalCalories: number;
  totalCarb: number;
  totalProtein: number;
  totalFat: number;
  onAddMeal: (mealType: MealType) => void;
  onDeleteMealItem: (item: MealPlanItem) => void;
}) {
  const router = useRouter();

  return (
    <View>
      {/* Top Nutrition & Macro Indicators */}
      {viewMode === 'day' ? (
        <>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Thông tin dinh dưỡng</Text>
            <View style={styles.actionIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/nutrition')}
                accessibilityLabel="Xem biểu đồ dinh dưỡng">
                <Ionicons name="bar-chart-outline" size={21} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/ingredients')}
                accessibilityLabel="Thêm nguyên liệu">
                <Ionicons name="document-text" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Calorie Stats */}
          <View style={styles.calorieRow}>
            <Text style={styles.calorie}>{Math.round(totalCalories)}</Text>
            <Text style={styles.calorieUnit}>/ 1492 kcal</Text>
          </View>

          {/* Macros */}
          <View style={styles.macrosRow}>
            <View style={styles.macro}>
              <Text style={styles.macroLabel}>Đường bột</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(100, (totalCarb / 213) * 100)}%`, backgroundColor: '#38BDF8' },
                  ]}
                />
              </View>
              <Text style={styles.macroValue}>{Math.round(totalCarb)}g / 213g</Text>
            </View>

            <View style={styles.macro}>
              <Text style={styles.macroLabel}>Chất đạm</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(100, (totalProtein / 74) * 100)}%`, backgroundColor: '#49C99B' },
                  ]}
                />
              </View>
              <Text style={styles.macroValue}>{Math.round(totalProtein)}g / 74g</Text>
            </View>

            <View style={styles.macro}>
              <Text style={styles.macroLabel}>Chất béo</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(100, (totalFat / 38) * 100)}%`, backgroundColor: '#F59E0B' },
                  ]}
                />
              </View>
              <Text style={styles.macroValue}>{Math.round(totalFat)}g / 38g</Text>
            </View>
          </View>

          <Metric title="Điểm dinh dưỡng" value="1" suffix="/10" status="Thấp" filled />
          <Metric title="Độ đa dạng thực phẩm" value="0" suffix="/10" status="Thấp" />
        </>
      ) : (
        <>
          {/* Week Mode Diversity Score Blocks */}
          <View style={styles.weekScoreHeader}>
            <View style={styles.scoreBlocksRow}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.scoreBlock,
                    i < 5 ? styles.scoreBlockYellow : styles.scoreBlockGray,
                  ]}
                />
              ))}
            </View>

            <View style={styles.diversityRow}>
              <View style={styles.diversityTitleWrap}>
                <Text style={styles.diversityTitle}>Độ đa dạng thực phẩm</Text>
                <Ionicons name="information-circle" size={18} color="#475569" />
              </View>
            </View>

            <View style={styles.diversityScoreRow}>
              <Text style={styles.diversityValue}>1</Text>
              <Text style={styles.diversitySuffix}>/10</Text>
              <Text style={styles.diversityStatus}>Thấp</Text>
            </View>

            <View style={styles.diversityProgressBarTrack}>
              <View style={[styles.diversityProgressBar, { width: '10%' }]} />
            </View>
          </View>
        </>
      )}

      {/* Menu Header */}
      <View style={styles.planHeader}>
        <Text style={styles.sectionTitle}>Thực đơn của bạn</Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/recipes')}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="auto-fix" size={18} color="#FFFFFF" />
          <Text style={styles.exploreText}>Khám phá thực đơn mẫu</Text>
        </TouchableOpacity>
      </View>

      {/* When in Week mode: Horizontal Day Picker Strip */}
      {viewMode === 'week' && (
        <View style={styles.weekDaysStrip}>
          {currentWeekDays.map((day) => {
            const isSelected = selectedDate === day.date;
            return (
              <TouchableOpacity
                key={day.date}
                style={[styles.weekDayPill, isSelected && styles.weekDayPillActive]}
                onPress={() => onSelectDate(day.date)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.weekDayLabel,
                    day.weekend && styles.weekendText,
                    isSelected && styles.weekDayTextActive,
                  ]}>
                  {day.label}
                </Text>
                <Text
                  style={[
                    styles.weekDayDate,
                    day.weekend && styles.weekendText,
                    isSelected && styles.weekDayTextActive,
                  ]}>
                  {day.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Meal Groups for Selected Day */}
      <View style={styles.mealGroups}>
        {loading && plannedMeals.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#49C99B" />
            <Text style={styles.loadingText}>Đang tải thực đơn ngày {selectedDate}/08...</Text>
          </View>
        ) : (
          MEAL_CATEGORIES.map(({ key, title }) => {
            const itemsInGroup = plannedMeals.filter((m) => m.meal_type === key);

            return (
              <View key={key} style={styles.mealGroup}>
                <View style={styles.mealGroupHeader}>
                  <Text style={styles.mealGroupTitle}>{title}</Text>
                  <TouchableOpacity
                    style={styles.mealAddButton}
                    onPress={() => onAddMeal(key)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Thêm món vào ${title}`}>
                    <Ionicons name="add" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {itemsInGroup.length === 0 ? (
                  <View style={styles.mealEmpty}>
                    <View style={styles.mealEmptyIcon}>
                      <MaterialCommunityIcons name="silverware-fork-knife" size={34} color="#CBD5E1" />
                      <View style={styles.mealHeart}>
                        <MaterialCommunityIcons name="heart" size={15} color="#FFFFFF" />
                      </View>
                    </View>
                    <View style={styles.mealEmptyCopy}>
                      <Text style={styles.mealEmptyTitle}>Chưa có món ăn</Text>
                      <Text style={styles.mealEmptyText}>Thêm món để đạt mục tiêu dinh dưỡng</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mealItemsList}>
                    {itemsInGroup.map((item) => {
                      const isRecipe = item.source === 'recipe' || Boolean(item.recipe_id);
                      const recipe = typeof item.recipe_id === 'object' ? (item.recipe_id as Recipe) : null;
                      const food = typeof item.food_item_id === 'object' ? (item.food_item_id as FoodItem) : null;

                      const itemName = recipe?.title || food?.name || (isRecipe ? 'Công thức nấu ăn' : 'Nguyên liệu');
                      const itemCalories = recipe?.calories_per_serving || food?.calories_per_100g || 0;
                      const itemProtein = recipe?.protein_g || food?.protein_per_100g || 0;
                      const itemImg = recipe?.image_url || food?.image_url;

                      return (
                        <View key={item._id} style={styles.plannedMealCard}>
                          <View style={styles.mealItemThumb}>
                            {itemImg ? (
                              <Image source={{ uri: itemImg }} style={styles.mealItemImage} />
                            ) : (
                              <View style={styles.mealItemImageFallback}>
                                <MaterialCommunityIcons
                                  name={isRecipe ? 'chef-hat' : 'food-apple-outline'}
                                  size={24}
                                  color="#49C99B"
                                />
                              </View>
                            )}
                          </View>

                          <View style={styles.mealItemDetails}>
                            <Text style={styles.mealItemName} numberOfLines={1}>
                              {itemName}
                            </Text>
                            <Text style={styles.mealItemNutrition}>
                              {item.food_item_id ? '100 g' : `${Math.round(itemCalories)} kcal · ${Math.round(itemProtein)}g đạm`}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => onDeleteMealItem(item)}
                            activeOpacity={0.7}
                            accessibilityLabel="Xoá món khỏi bữa ăn">
                            <Ionicons name="trash-outline" size={18} color="#EF5555" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

function Metric({
  title,
  value,
  suffix,
  status,
  filled = false,
}: {
  title: string;
  value: string;
  suffix: string;
  status: string;
  filled?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricTitleRow}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Ionicons name="information-circle" size={21} color="#475569" />
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricSuffix}>{suffix}</Text>
        <Text style={styles.metricStatus}>{status}</Text>
      </View>
      <View style={styles.scoreTrack}>
        {Array.from({ length: 10 }).map((_, index) => (
          <View key={index} style={[styles.scoreSegment, filled && index === 0 && styles.scoreFilled]} />
        ))}
      </View>
    </View>
  );
}

const getActivityIconAndColor = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('chạy')) return { icon: 'run' as const, color: '#81C784', bg: '#ECFDF5' };
  if (lower.includes('đạp xe')) return { icon: 'bike' as const, color: '#9CCC65', bg: '#F7FEE7' };
  if (lower.includes('gym') || lower.includes('tạ') || lower.includes('kháng lực'))
    return { icon: 'weight-lifter' as const, color: '#F4A261', bg: '#FFF7ED' };
  if (lower.includes('bơi')) return { icon: 'swim' as const, color: '#4FC3F7', bg: '#F0F9FF' };
  if (lower.includes('yoga') || lower.includes('giãn')) return { icon: 'yoga' as const, color: '#90CAF9', bg: '#EFF6FF' };
  if (lower.includes('cardio') || lower.includes('hiit')) return { icon: 'run-fast' as const, color: '#F3C35C', bg: '#FEFCE8' };
  if (lower.includes('nhảy')) return { icon: 'jump-rope' as const, color: '#7EAFD0', bg: '#F0F9FF' };
  return { icon: 'dumbbell' as const, color: '#80CBC4', bg: '#F0FDFA' };
};

function ActivityPlan({
  viewMode,
  currentWeekDays,
  selectedDate,
  onSelectDate,
  activityLogs,
  loading,
  onAddActivity,
  onDeleteActivity,
}: {
  viewMode: ViewMode;
  currentWeekDays: DayInfo[];
  selectedDate: number;
  onSelectDate: (dateNum: number) => void;
  activityLogs: ActivityLog[];
  loading: boolean;
  onAddActivity: () => void;
  onDeleteActivity: (log: ActivityLog) => void;
}) {
  const router = useRouter();

  // Compute total duration and calories burned for the day
  const totalMinutes = activityLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const totalCaloriesBurned = activityLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
  const strengthCount = activityLogs.filter((log) => {
    const name = ((typeof log.activity_id === 'object' && log.activity_id?.name) || log.custom_activity_name || '').toLowerCase();
    return name.includes('gym') || name.includes('tạ') || name.includes('kháng lực');
  }).length;

  const targetMinutes = 150;
  const progressPercent = Math.min(100, Math.round((totalMinutes / targetMinutes) * 100));

  return (
    <View>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>
          {viewMode === 'week' ? 'Kế hoạch tuần này' : 'Kế hoạch hoạt động'}
        </Text>
        <View style={styles.actionIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/activity-insights')}
            accessibilityLabel="Xem biểu đồ hoạt động">
            <Ionicons name="bar-chart-outline" size={21} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/activity-goals')}
            accessibilityLabel="Chỉnh mục tiêu vận động">
            <Ionicons name="options-outline" size={21} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.activityLabelRow}>
        <Text style={styles.activityLabel}>
          phút vận động · {viewMode === 'week' ? 'tuần này' : 'hôm nay'}
        </Text>
        <Text style={styles.boost}>{totalMinutes >= targetMinutes ? 'Đã đạt mục tiêu' : 'Cần tăng tốc'}</Text>
      </View>

      <View style={styles.calorieRow}>
        <Text style={styles.activityValue}>{totalMinutes}</Text>
        <Text style={styles.calorieUnit}>/ {targetMinutes} phút</Text>
      </View>

      <View style={styles.activityTrack}>
        <View style={[styles.activityTrackFill, { width: `${progressPercent}%` }]} />
      </View>

      <Text style={styles.remain}>
        {totalMinutes >= targetMinutes
          ? `Tuyệt vời! Bạn đã hoàn thành ${totalMinutes} phút vận động.`
          : `Còn ${targetMinutes - totalMinutes} phút · Tiếp tục duy trì luyện tập!`}
      </Text>

      {viewMode === 'week' && (
        <View style={styles.targetDays}>
          {currentWeekDays.map((day) => {
            const isSelected = selectedDate === day.date;
            return (
              <TouchableOpacity
                key={day.date}
                style={styles.targetDay}
                onPress={() => onSelectDate(day.date)}>
                <View
                  style={[
                    styles.targetBar,
                    isSelected && { borderColor: '#49C99B', backgroundColor: '#49C99B' },
                  ]}
                />
                <Text
                  style={[
                    styles.targetLabel,
                    isSelected && { color: '#49C99B', fontWeight: '700' },
                  ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.statsGrid}>
        <Stat
          icon="list-outline"
          color="#10B981"
          bg="#E8FBF4"
          label="Hoạt động"
          value={String(activityLogs.length)}
        />
        <Stat
          icon="time-outline"
          color="#EF6C6C"
          bg="#FFF1F1"
          label={viewMode === 'week' ? 'Phút dự kiến' : 'Dự kiến'}
          value={viewMode === 'week' ? String(totalMinutes) : `${totalMinutes} phút`}
        />
        <Stat
          icon="flame-outline"
          color="#F59E0B"
          bg="#FFF7E9"
          label="Kcal dự kiến"
          value={String(totalCaloriesBurned)}
        />
        <Stat
          icon={viewMode === 'week' ? 'dumbbell' : 'water'}
          color="#3B82F6"
          bg="#EEF4FF"
          label={viewMode === 'week' ? 'Buổi kháng lực' : 'Nước (ml)'}
          value={viewMode === 'week' ? `${strengthCount}/2` : '1500'}
        />
      </View>

      {/* Activity Day Section */}
      <View style={styles.activityDaySection}>
        <View style={styles.activityDayHeader}>
          <Text style={styles.sectionTitle}>Hoạt động trong ngày</Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={onAddActivity}>
              <Ionicons name="add" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* When in Week mode: Horizontal Day Picker Strip */}
        {viewMode === 'week' && (
          <View style={styles.weekDaysStrip}>
            {currentWeekDays.map((day) => {
              const isSelected = selectedDate === day.date;
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[styles.weekDayPill, isSelected && styles.weekDayPillActive]}
                  onPress={() => onSelectDate(day.date)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.weekDayLabel,
                      day.weekend && styles.weekendText,
                      isSelected && styles.weekDayTextActive,
                    ]}>
                    {day.label}
                  </Text>
                  <Text
                    style={[
                      styles.weekDayDate,
                      day.weekend && styles.weekendText,
                      isSelected && styles.weekDayTextActive,
                    ]}>
                    {day.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Activities List */}
        {loading && activityLogs.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#49C99B" />
            <Text style={styles.loadingText}>Đang tải hoạt động ngày {selectedDate}/08...</Text>
          </View>
        ) : activityLogs.length === 0 ? (
          <View style={styles.activityEmpty}>
            <View style={styles.activityEmptyIcon}>
              <MaterialCommunityIcons name="heart-outline" size={46} color="#CBD5E1" />
            </View>
            <Text style={styles.activityEmptyTitle}>Chưa có hoạt động nào</Text>
            <Text style={styles.activityEmptyText}>
              Chưa có hoạt động nào được lên kế hoạch cho ngày {selectedDate}/08. Hãy thêm hoạt động để rèn luyện sức khoẻ.
            </Text>
            <TouchableOpacity
              style={styles.addActivityButton}
              onPress={onAddActivity}
              activeOpacity={0.85}>
              <Text style={styles.addActivityText}>Thêm hoạt động</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activityList}>
            {activityLogs.map((log) => {
              const actName =
                (typeof log.activity_id === 'object' && log.activity_id?.name) ||
                log.custom_activity_name ||
                'Hoạt động thể chất';
              const visuals = getActivityIconAndColor(actName);

              return (
                <View key={log._id} style={styles.activityLogCard}>
                  <View style={[styles.activityLogIconWrap, { backgroundColor: visuals.bg }]}>
                    <MaterialCommunityIcons name={visuals.icon} size={28} color={visuals.color} />
                  </View>

                  <View style={styles.activityLogDetails}>
                    <Text style={styles.activityLogName} numberOfLines={1}>
                      {actName}
                    </Text>
                    <Text style={styles.activityLogInfo}>
                      {log.duration_minutes} phút · {log.calories_burned} kcal tiêu hao
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDeleteActivity(log)}
                    activeOpacity={0.7}
                    accessibilityLabel="Xoá hoạt động">
                    <Ionicons name="trash-outline" size={18} color="#EF5555" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function Stat({
  icon,
  color,
  bg,
  label,
  value,
}: {
  icon: string;
  color: string;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]}>
      <View style={styles.statIcon}>
        {icon === 'dumbbell' ? (
          <MaterialCommunityIcons name="dumbbell" size={22} color={color} />
        ) : (
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={color} />
        )}
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingBottom: 90 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 42 },
  title: { fontSize: 22, fontWeight: '800', color: '#10294B' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#64748B' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F1F1F3', borderRadius: 24, padding: 4 },
  segmentedControlSmall: { flexDirection: 'row', backgroundColor: '#F1F1F3', borderRadius: 24, padding: 4 },
  segment: { minWidth: 70, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 9, borderRadius: 20 },
  segmentActive: { backgroundColor: '#FFFFFF' },
  segmentText: { fontSize: 16, color: '#64748B' },
  segmentActiveText: { color: '#49C99B', fontWeight: '700' },
  activeText: { color: '#FFFFFF' },
  dayPicker: { flexDirection: 'row', backgroundColor: '#F5F5F9', borderRadius: 18, padding: 4, marginBottom: 28 },
  dayItem: { flex: 1, minHeight: 88, alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 8 },
  dayItemActive: { backgroundColor: '#49C99B' },
  dayLabel: { fontSize: 13, color: '#64748B', marginBottom: 6, textAlign: 'center' },
  dayDate: { fontSize: 22, fontWeight: '800', color: '#10294B', textAlign: 'center' },
  weekend: { color: '#EF7777' },
  weekPicker: { flexDirection: 'row', backgroundColor: '#F5F5F9', borderRadius: 18, padding: 4, marginBottom: 20 },
  weekItem: { flex: 1, minHeight: 76, alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingHorizontal: 4, paddingVertical: 8 },
  weekItemActive: { backgroundColor: '#49C99B' },
  weekLabel: { fontSize: 13, color: '#64748B', marginBottom: 6, textAlign: 'center' },
  weekRange: { fontSize: 14, fontWeight: '800', color: '#10294B', textAlign: 'center' },
  weekScoreHeader: { marginBottom: 20 },
  scoreBlocksRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  scoreBlock: { flex: 1, height: 6, borderRadius: 3 },
  scoreBlockYellow: { backgroundColor: '#F59E0B' },
  scoreBlockGray: { backgroundColor: '#E2E8F0' },
  diversityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  diversityTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  diversityTitle: { fontSize: 17, fontWeight: '700', color: '#10294B' },
  diversityScoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  diversityValue: { fontSize: 32, fontWeight: '800', color: '#EF5555' },
  diversitySuffix: { fontSize: 18, color: '#94A3B8', marginLeft: 2 },
  diversityStatus: { marginLeft: 'auto', fontSize: 16, fontWeight: '700', color: '#EF5555' },
  diversityProgressBarTrack: { height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  diversityProgressBar: { height: '100%', backgroundColor: '#EF5555', borderRadius: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#10294B' },
  actionIcons: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  calorie: { fontSize: 44, fontWeight: '800', color: '#EF5555' },
  calorieUnit: { marginLeft: 5, fontSize: 19, color: '#A1A8B2' },
  average: { fontSize: 14, color: '#A1A8B2', marginBottom: 16 },
  macrosRow: { flexDirection: 'row', gap: 14, marginBottom: 26 },
  macro: { flex: 1 },
  macroLabel: { fontSize: 15, color: '#10294B', marginBottom: 8 },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#E2E5E8', marginBottom: 7, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  macroValue: { fontSize: 13, color: '#EF5555' },
  metric: { marginBottom: 26 },
  metricTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricTitle: { fontSize: 19, color: '#475569' },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 9 },
  metricValue: { fontSize: 33, fontWeight: '800', color: '#EF5555' },
  metricSuffix: { fontSize: 17, color: '#A1A8B2', marginLeft: 3 },
  metricStatus: { marginLeft: 'auto', fontSize: 17, fontWeight: '700', color: '#EF5555' },
  scoreTrack: { flexDirection: 'row', gap: 4 },
  scoreSegment: { flex: 1, height: 8, backgroundColor: '#E0E4E8', borderRadius: 3 },
  scoreFilled: { backgroundColor: '#EF5555' },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  exploreButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#49C99B', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10 },
  exploreText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  weekDaysStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 4,
    marginTop: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  weekDayPill: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 6,
  },
  weekDayPillActive: {
    backgroundColor: '#49C99B',
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  weekDayDate: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10294B',
  },
  weekendText: {
    color: '#EF7777',
  },
  weekDayTextActive: {
    color: '#FFFFFF',
  },
  mealGroups: { marginTop: 14 },
  mealGroup: { marginBottom: 22 },
  mealGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  mealGroupTitle: { fontSize: 18, fontWeight: '700', color: '#10294B' },
  mealAddButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  mealEmpty: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  mealEmptyIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center', position: 'relative', marginRight: 14 },
  mealHeart: { position: 'absolute', right: -2, bottom: 0, width: 23, height: 23, borderRadius: 12, backgroundColor: '#49C99B', alignItems: 'center', justifyContent: 'center' },
  mealEmptyCopy: { flex: 1 },
  mealEmptyTitle: { fontSize: 16, fontWeight: '700', color: '#10294B', marginBottom: 4 },
  mealEmptyText: { fontSize: 13, color: '#64748B' },
  mealItemsList: { gap: 10 },
  plannedMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
  },
  mealItemThumb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealItemImage: { width: '100%', height: '100%', borderRadius: 27 },
  mealItemImageFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  mealItemDetails: { flex: 1 },
  mealItemName: { fontSize: 16, fontWeight: '700', color: '#10294B', marginBottom: 4 },
  mealItemNutrition: { fontSize: 14, color: '#64748B' },
  deleteButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF1F1', alignItems: 'center', justifyContent: 'center' },
  loadingBox: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#64748B' },
  activityLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  activityLabel: { fontSize: 15, fontWeight: '700', color: '#10294B' },
  boost: { backgroundColor: '#FFF0ED', color: '#EF6C5B', fontSize: 15, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  activityValue: { fontSize: 52, fontWeight: '800', color: '#10294B' },
  activityTrack: { height: 9, backgroundColor: '#E2E5E8', borderRadius: 6, marginBottom: 12, overflow: 'hidden' },
  activityTrackFill: { height: '100%', backgroundColor: '#49C99B', borderRadius: 6 },
  remain: { fontSize: 15, color: '#A1A8B2', marginBottom: 20 },
  targetDays: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  targetDay: { flex: 1, alignItems: 'center', gap: 8 },
  targetBar: { width: '100%', height: 8, borderWidth: 2, borderColor: '#E2E5E8', borderRadius: 4 },
  targetLabel: { fontSize: 12, color: '#A1A8B2' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  stat: { width: '48%', minHeight: 112, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  statIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 15, color: '#10294B', marginBottom: 5 },
  statValue: { fontSize: 25, fontWeight: '800', color: '#10294B' },
  activityDaySection: { marginTop: 30, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#EEF0F2' },
  activityDayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  activityEmpty: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  activityEmptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  activityEmptyTitle: { fontSize: 19, fontWeight: '800', color: '#10294B', marginBottom: 8 },
  activityEmptyText: { fontSize: 14, lineHeight: 21, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  addActivityButton: { backgroundColor: '#49C99B', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 22 },
  addActivityText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  activityList: { gap: 10 },
  activityLogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
  },
  activityLogIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLogDetails: { flex: 1 },
  activityLogName: { fontSize: 16, fontWeight: '700', color: '#10294B', marginBottom: 4 },
  activityLogInfo: { fontSize: 14, color: '#64748B' },
  floatingBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mascotButton: {
    marginRight: 4,
  },
  mascotCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#49C99B',
  },
  quickPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10294B',
  },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)', justifyContent: 'flex-end', padding: 16 },
  sheetDismissArea: { flex: 1 },
  mealSheet: { backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden' },
  mealSheetOption: { minHeight: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  mealSheetDivider: { height: 1, backgroundColor: '#EEF0F2' },
  mealSheetText: { fontSize: 22, fontWeight: '700' },
  sheetCancel: { height: 86, marginTop: 16, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  sheetCancelText: { fontSize: 22, color: '#EF5555', fontWeight: '600' },
});
