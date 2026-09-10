import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mealLogService } from '@/services/meal_log.service';
import { DailySummary, MealLog } from '@/types/meal_log.types';
import { MealType } from '@/types/plan.types';

interface DayInfo {
  label: string;
  dayName: string;
  date: number;
  month: number;
  year: number;
  fullDate: string;
  displayDate: string;
  weekend?: boolean;
  isToday?: boolean;
}

interface WeekInfo {
  index: number;
  label: string;
  range: string;
  fullRange: string;
  days: DayInfo[];
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_NAMES = ['hai', 'ba', 'tư', 'năm', 'sáu', 'bảy', 'chủ nhật'];

function formatYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function generateWeeksData(refDate: Date = new Date()): WeekInfo[] {
  const currentMonday = getMonday(refDate);
  const todayStr = formatYYYYMMDD(refDate);
  const weekLabels = ['Tuần trước', 'Tuần này', 'Tuần sau'];
  const weekOffsets = [-7, 0, 7];

  return weekOffsets.map((offset, index) => {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() + offset);

    const days: DayInfo[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);

      const dayNumber = d.getDate();
      const monthNumber = d.getMonth() + 1;
      const yearNumber = d.getFullYear();
      const fullDate = formatYYYYMMDD(d);
      const displayDate = `${String(dayNumber).padStart(2, '0')}/${String(monthNumber).padStart(2, '0')}`;

      days.push({
        label: DAY_LABELS[i],
        dayName: DAY_NAMES[i],
        date: dayNumber,
        month: monthNumber,
        year: yearNumber,
        fullDate,
        displayDate,
        weekend: i === 5 || i === 6,
        isToday: fullDate === todayStr,
      });
    }

    const startDay = days[0];
    const endDay = days[6];
    const range = `${startDay.displayDate} - ${endDay.displayDate}`;
    const fullRange = `${startDay.displayDate}/${startDay.year} - ${endDay.displayDate}/${endDay.year}`;

    return {
      index,
      label: weekLabels[index],
      range,
      fullRange,
      days,
    };
  });
}

const MEAL_SECTIONS: { key: MealType; title: string; icon: string; color: string }[] = [
  { key: 'breakfast', title: 'Bữa sáng', icon: 'weather-sunset-up', color: '#F59E0B' },
  { key: 'lunch', title: 'Bữa trưa', icon: 'weather-sunny', color: '#3B82F6' },
  { key: 'dinner', title: 'Bữa tối', icon: 'weather-night', color: '#8B5CF6' },
  { key: 'snack', title: 'Bữa phụ & Tráng miệng', icon: 'food-apple-outline', color: '#10B981' },
];

export default function DiaryScreen() {
  const router = useRouter();

  const todayStr = useMemo(() => formatYYYYMMDD(new Date()), []);
  const weeksData = useMemo(() => generateWeeksData(new Date()), []);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(1);
  const [selectedFullDate, setSelectedFullDate] = useState(todayStr);
  const [displayMode, setDisplayMode] = useState('Tất cả');
  const [displayModeVisible, setDisplayModeVisible] = useState(false);

  // Live data states
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick add log modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addMealType, setAddMealType] = useState<MealType>('breakfast');
  const [dishName, setDishName] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [carbInput, setCarbInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedDateStr = selectedFullDate;
  const currentWeek = weeksData[selectedWeekIndex] || weeksData[1];
  const selectedDayInfo =
    currentWeek.days.find((d) => d.fullDate === selectedFullDate) ||
    weeksData.flatMap((w) => w.days).find((d) => d.fullDate === selectedFullDate) ||
    currentWeek.days[0];

  const loadDiaryData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mealLogService.getDailySummary(formattedDateStr);
      setSummary(data);
    } catch (err) {
      console.warn('Error loading diary summary:', err);
    } finally {
      setLoading(false);
    }
  }, [formattedDateStr]);

  useEffect(() => {
    loadDiaryData();
  }, [loadDiaryData]);

  useFocusEffect(
    useCallback(() => {
      loadDiaryData();
    }, [loadDiaryData])
  );

  const handleSelectWeek = (weekIndex: number) => {
    setSelectedWeekIndex(weekIndex);
    const targetWeek = weeksData[weekIndex];
    if (targetWeek) {
      const isDateInWeek = targetWeek.days.some((d) => d.fullDate === selectedFullDate);
      if (!isDateInWeek) {
        const todayInWeek = targetWeek.days.find((d) => d.fullDate === todayStr);
        const newDay = todayInWeek || targetWeek.days[0];
        setSelectedFullDate(newDay.fullDate);
      }
    }
  };

  const handleSelectDate = (fullDate: string) => {
    setSelectedFullDate(fullDate);
    const weekWithDay = weeksData.find((w) => w.days.some((d) => d.fullDate === fullDate));
    if (weekWithDay && weekWithDay.index !== selectedWeekIndex) {
      setSelectedWeekIndex(weekWithDay.index);
    }
  };

  const handleOpenAddModal = (mealType: MealType) => {
    setAddMealType(mealType);
    setDishName('');
    setCaloriesInput('');
    setProteinInput('');
    setCarbInput('');
    setFatInput('');
    setAddModalVisible(true);
  };

  const handleSaveMealLog = async () => {
    if (!dishName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên món ăn');
      return;
    }
    const cal = Number(caloriesInput);
    if (isNaN(cal) || cal <= 0) {
      Alert.alert('Sai định dạng', 'Vui lòng nhập lượng Calo hợp lệ (> 0)');
      return;
    }

    setIsSubmitting(true);
    try {
      await mealLogService.createMealLog({
        meal_type: addMealType,
        description_text: dishName.trim(),
        calories: Math.round(cal),
        protein_g: Number(proteinInput) || 0,
        carb_g: Number(carbInput) || 0,
        fat_g: Number(fatInput) || 0,
        logged_at: formattedDateStr,
        input_method: 'text',
      });
      setAddModalVisible(false);
      loadDiaryData();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể ghi nhật ký ăn uống lúc này');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (log: MealLog) => {
    const title = log.description_text || 'món ăn';
    const execute = async () => {
      try {
        await mealLogService.deleteMealLog(log._id);
        loadDiaryData();
      } catch (err) {
        console.warn('Error deleting meal log:', err);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(`Bạn có chắc muốn xoá nhật ký "${title}"?`)
          : true;
      if (confirmed) execute();
    } else {
      Alert.alert('Xoá nhật ký', `Bạn có chắc muốn xoá "${title}"?`, [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: execute },
      ]);
    }
  };

  const consumedCalories = summary?.consumed.calories || 0;
  const targetCalories = summary?.targets.calories || 2000;
  const calPercent = summary?.percentages.calories || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nhật ký ăn uống</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => router.push('/plan')}
              accessibilityLabel="Xem kế hoạch">
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => router.push('/habit-analysis')}
              accessibilityLabel="Xem phân tích thói quen">
              <Ionicons name="bar-chart-outline" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Selector */}
        <View style={styles.weekPicker}>
          {weeksData.map((week) => {
            const isWeekActive = selectedWeekIndex === week.index;
            return (
              <TouchableOpacity
                key={week.label}
                style={[styles.weekCell, isWeekActive && styles.weekCellActive]}
                activeOpacity={0.7}
                onPress={() => handleSelectWeek(week.index)}>
                <Text style={[styles.weekLabel, isWeekActive && styles.activeText]}>
                  {week.label}
                </Text>
                <Text style={[styles.weekDate, isWeekActive && styles.activeText]}>
                  {week.range}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Day Picker */}
        <View style={styles.dayPicker}>
          {currentWeek.days.map((item) => {
            const isSelected = selectedFullDate === item.fullDate;
            return (
              <TouchableOpacity
                key={item.fullDate}
                style={[styles.dayCell, isSelected && styles.dayCellActive]}
                activeOpacity={0.7}
                onPress={() => handleSelectDate(item.fullDate)}>
                <Text
                  style={[
                    styles.dayLabel,
                    item.weekend && styles.weekendText,
                    isSelected && styles.activeText,
                  ]}>
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.dayDate,
                    item.weekend && styles.weekendText,
                    isSelected && styles.activeText,
                  ]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Summary Card */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>
            {selectedDayInfo.dayName === 'chủ nhật'
              ? `Chủ nhật, ${selectedDayInfo.date} tháng ${selectedDayInfo.month}, ${selectedDayInfo.year}`
              : `Thứ ${selectedDayInfo.dayName}, ${selectedDayInfo.date} tháng ${selectedDayInfo.month}, ${selectedDayInfo.year}`}
            {selectedDayInfo.isToday ? ' · Hôm nay' : ''}
          </Text>

          {/* Calorie & Macro Target Progress */}
          <View style={styles.calorieCard}>
            <View style={styles.calorieTop}>
              <View>
                <Text style={styles.calorieLabel}>Năng lượng đã nạp</Text>
                <View style={styles.calorieValueRow}>
                  <Text style={styles.calorieMain}>{consumedCalories}</Text>
                  <Text style={styles.calorieSub}>/ {targetCalories} kcal</Text>
                </View>
              </View>
              <View style={styles.calorieBadge}>
                <Text style={styles.calorieBadgeText}>{calPercent}% mục tiêu</Text>
              </View>
            </View>

            <View style={styles.calorieTrack}>
              <View
                style={[
                  styles.calorieTrackFill,
                  {
                    width: `${Math.min(100, calPercent)}%`,
                    backgroundColor: calPercent > 100 ? '#EF4444' : '#10B981',
                  },
                ]}
              />
            </View>

            {/* Macro Breakdown */}
            <View style={styles.macrosRow}>
              <View style={styles.macroCol}>
                <Text style={styles.macroTitle}>Đạm</Text>
                <Text style={styles.macroVal}>
                  {summary?.consumed.protein_g || 0}g / {summary?.targets.protein_g || 0}g
                </Text>
                <View style={styles.macroTrack}>
                  <View
                    style={[
                      styles.macroTrackFill,
                      { width: `${summary?.percentages.protein || 0}%`, backgroundColor: '#10B981' },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.macroCol}>
                <Text style={styles.macroTitle}>Carb</Text>
                <Text style={styles.macroVal}>
                  {summary?.consumed.carb_g || 0}g / {summary?.targets.carb_g || 0}g
                </Text>
                <View style={styles.macroTrack}>
                  <View
                    style={[
                      styles.macroTrackFill,
                      { width: `${summary?.percentages.carb || 0}%`, backgroundColor: '#3B82F6' },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.macroCol}>
                <Text style={styles.macroTitle}>Béo</Text>
                <Text style={styles.macroVal}>
                  {summary?.consumed.fat_g || 0}g / {summary?.targets.fat_g || 0}g
                </Text>
                <View style={styles.macroTrack}>
                  <View
                    style={[
                      styles.macroTrackFill,
                      { width: `${summary?.percentages.fat || 0}%`, backgroundColor: '#F59E0B' },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Quick Metrics Row */}
          <View style={styles.quickMetricsRow}>
            <View style={styles.quickMetricBox}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#F59E0B" />
              <Text style={styles.quickMetricLabel}>Bữa ăn đã ghi</Text>
              <Text style={styles.quickMetricValue}>
                {summary?.loggedMealTypesCount || 0}/4 bữa
              </Text>
            </View>

            <View style={styles.quickMetricBox}>
              <Ionicons name="flame" size={18} color="#0284C7" />
              <Text style={styles.quickMetricLabel}>Calo tiêu hao</Text>
              <Text style={styles.quickMetricValue}>
                {summary?.burned.calories ? `${summary.burned.calories} kcal` : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Meal Logs by Category */}
        <View style={styles.mealSectionsWrap}>
          {MEAL_SECTIONS.map(({ key, title, icon, color }) => {
            const logsInGroup = summary?.mealsByType[key] || [];
            const groupCalories = logsInGroup.reduce((s, l) => s + (l.calories || 0), 0);

            return (
              <View key={key} style={styles.mealCardSection}>
                <View style={styles.mealCardHeader}>
                  <View style={styles.mealCardTitleRow}>
                    <View style={[styles.mealIconCircle, { backgroundColor: `${color}15` }]}>
                      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
                    </View>
                    <View>
                      <Text style={styles.mealCardTitle}>{title}</Text>
                      <Text style={styles.mealCardCalories}>
                        {logsInGroup.length > 0 ? `${groupCalories} kcal` : 'Chưa ghi nhận'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addLogBtn}
                    onPress={() => handleOpenAddModal(key)}
                    activeOpacity={0.7}>
                    <Ionicons name="add" size={20} color="#10B981" />
                    <Text style={styles.addLogBtnText}>Ghi món</Text>
                  </TouchableOpacity>
                </View>

                {/* List of logged dishes */}
                {logsInGroup.length > 0 ? (
                  <View style={styles.logsList}>
                    {logsInGroup.map((item) => (
                      <View key={item._id} style={styles.logItemRow}>
                        <View style={styles.logItemBullet} />
                        <View style={styles.logItemInfo}>
                          <Text style={styles.logItemName}>
                            {item.description_text ||
                              (typeof item.food_item_id === 'object' && item.food_item_id?.name) ||
                              'Món ăn'}
                          </Text>
                          <Text style={styles.logItemMacros}>
                            {item.calories} kcal
                            {item.protein_g ? ` · ${item.protein_g}g đạm` : ''}
                            {item.carb_g ? ` · ${item.carb_g}g carb` : ''}
                            {item.fat_g ? ` · ${item.fat_g}g béo` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteLogBtn}
                          onPress={() => handleDeleteLog(item)}
                          activeOpacity={0.7}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyLogPrompt}
                    onPress={() => handleOpenAddModal(key)}
                    activeOpacity={0.8}>
                    <Ionicons name="add-circle-outline" size={18} color="#94A3B8" />
                    <Text style={styles.emptyLogText}>Nhấn để thêm món đã ăn</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal Quick Log Meal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setAddModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.addModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>
                Ghi nhật ký {MEAL_SECTIONS.find((m) => m.key === addMealType)?.title.toLowerCase()}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Tên món ăn hoặc thực phẩm *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: Cơm sườn bì chả, Phở bò, Ức gà áp chảo..."
                placeholderTextColor="#94A3B8"
                value={dishName}
                onChangeText={setDishName}
              />

              <Text style={styles.inputLabel}>Năng lượng (kcal) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: 550"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={caloriesInput}
                onChangeText={setCaloriesInput}
              />

              <Text style={styles.inputLabel}>Thông tin dinh dưỡng Macros (tuỳ chọn)</Text>
              <View style={styles.macrosInputRow}>
                <View style={styles.macroInputCol}>
                  <Text style={styles.macroInputSubLabel}>Đạm (g)</Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="VD: 25"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={proteinInput}
                    onChangeText={setProteinInput}
                  />
                </View>
                <View style={styles.macroInputCol}>
                  <Text style={styles.macroInputSubLabel}>Carb (g)</Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="VD: 60"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={carbInput}
                    onChangeText={setCarbInput}
                  />
                </View>
                <View style={styles.macroInputCol}>
                  <Text style={styles.macroInputSubLabel}>Béo (g)</Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="VD: 15"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={fatInput}
                    onChangeText={setFatInput}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveLogBtn, isSubmitting && styles.saveLogBtnDisabled]}
                onPress={handleSaveMealLog}
                disabled={isSubmitting}
                activeOpacity={0.85}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.saveLogBtnText}>Lưu vào nhật ký</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#10294B', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPicker: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  weekCell: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  weekCellActive: { backgroundColor: '#49C99B' },
  weekCellDisabled: { opacity: 0.55 },
  weekLabel: { fontSize: 13, color: '#64748B', marginBottom: 4, fontWeight: '500' },
  weekDate: { fontSize: 14, fontWeight: '700', color: '#10294B' },
  activeText: { color: '#FFFFFF' },
  dayPicker: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  dayCell: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  dayCellActive: { backgroundColor: '#49C99B' },
  dayLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  dayDate: { fontSize: 18, fontWeight: '800', color: '#10294B' },
  weekendText: { color: '#F87171' },
  summarySection: { marginBottom: 20 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#10294B', marginBottom: 14 },
  calorieCard: {
    backgroundColor: '#FAFAFB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  calorieTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  calorieLabel: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  calorieValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  calorieMain: { fontSize: 28, fontWeight: '800', color: '#10294B' },
  calorieSub: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  calorieBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  calorieBadgeText: { fontSize: 12.5, fontWeight: '700', color: '#059669' },
  calorieTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  calorieTrackFill: { height: '100%', borderRadius: 4 },
  macrosRow: { flexDirection: 'row', gap: 10 },
  macroCol: { flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  macroTitle: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  macroVal: { fontSize: 13, fontWeight: '700', color: '#10294B', marginBottom: 6 },
  macroTrack: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  macroTrackFill: { height: '100%', borderRadius: 2 },
  quickMetricsRow: { flexDirection: 'row', gap: 10 },
  quickMetricBox: {
    flex: 1,
    backgroundColor: '#FAFAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 4,
  },
  quickMetricLabel: { fontSize: 12, color: '#64748B' },
  quickMetricValue: { fontSize: 15, fontWeight: '700', color: '#10294B' },
  mealSectionsWrap: { gap: 14 },
  mealCardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  mealCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mealCardTitle: { fontSize: 16, fontWeight: '700', color: '#10294B' },
  mealCardCalories: { fontSize: 12.5, color: '#64748B', marginTop: 1 },
  addLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addLogBtnText: { fontSize: 12.5, fontWeight: '700', color: '#059669' },
  logsList: { gap: 8 },
  logItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  logItemBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  logItemInfo: { flex: 1 },
  logItemName: { fontSize: 14.5, fontWeight: '700', color: '#10294B' },
  logItemMacros: { fontSize: 12, color: '#64748B', marginTop: 2 },
  deleteLogBtn: { padding: 6 },
  emptyLogPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FAFAFB',
  },
  emptyLogText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  addModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#10294B' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalForm: { gap: 14 },
  inputLabel: { fontSize: 13.5, fontWeight: '700', color: '#10294B', marginBottom: 6 },
  textInput: {
    height: 48,
    backgroundColor: '#FAFAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#10294B',
    marginBottom: 12,
  },
  macrosInputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  macroInputCol: { flex: 1 },
  macroInputSubLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  textInputSmall: {
    height: 44,
    backgroundColor: '#FAFAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#10294B',
    textAlign: 'center',
  },
  saveLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 50,
    marginTop: 6,
  },
  saveLogBtnDisabled: { opacity: 0.6 },
  saveLogBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
