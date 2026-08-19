import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiaryScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'meals' | 'activities'>('meals');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(19);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [displayMode, setDisplayMode] = useState('Tất cả');
  const [displayModeVisible, setDisplayModeVisible] = useState(false);

  const today = new Date();
  const weekHeaderDates = [
    'tuần trước (10/08/2026 - 16/08/2026)',
    'tuần này (17/08/2026 - 23/08/2026)',
    'tuần sau (24/08/2026 - 30/08/2026)',
  ];
  const dateString = viewMode === 'week'
    ? weekHeaderDates[selectedWeek + 1]
    : `${['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][today.getDay()]}, ${selectedDate} tháng ${today.getMonth() + 1}, ${today.getFullYear()}`;

  const calendarDates = [
    { day: 'CN', date: 16, isWeekend: true },
    { day: 'T2', date: 17, isWeekend: false },
    { day: 'T3', date: 18, isWeekend: false },
    { day: 'T4', date: 19, isWeekend: false, isToday: true },
    { day: 'T5', date: 20, isWeekend: false },
    { day: 'T6', date: 21, isWeekend: false },
    { day: 'T7', date: 22, isWeekend: true },
  ];

  const weekRanges = [
    { label: 'Tuần trước', range: '10/08 - 16/08', offset: -1 },
    { label: 'Tuần này', range: '17/08 - 23/08', offset: 0 },
    { label: 'Tuần sau', range: '24/08 - 30/08', offset: 1 },
  ];

  const mealGroups = [
    { id: 'breakfast', label: 'Bữa sáng', items: [] },
    { id: 'lunch', label: 'Bữa trưa', items: [] },
    { id: 'dinner', label: 'Bữa tối', items: [] },
    { id: 'snacks', label: 'Đồ ăn thêm trong ngày', items: [] },
  ];

  const diaryDays = [
    { day: 'T2', date: 17 },
    { day: 'T3', date: 18 },
    { day: 'T4', date: 19 },
    { day: 'T5', date: 20 },
    { day: 'T6', date: 21 },
    { day: 'T7', date: 22, weekend: true },
    { day: 'CN', date: 23, weekend: true },
  ];

  const displayModes = ['Đã ghi nhận', 'Chưa hoàn thành', 'Tất cả', 'Chỉ hoạt động', 'Chỉ bữa ăn'];

  const renderDiaryScreen = () => (
    <SafeAreaView style={styles.diarySafeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.diaryContainer} contentContainerStyle={styles.diaryContent} showsVerticalScrollIndicator={false}>
        <View style={styles.diaryHeader}>
          <Text style={styles.diaryTitle}>Nhật ký của bạn</Text>
          <View style={styles.diaryHeaderActions}>
            <TouchableOpacity style={styles.diaryIconButton}>
              <Ionicons name="paper-plane-outline" size={22} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.diaryIconButton}>
              <Ionicons name="bar-chart-outline" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.diaryWeekPicker}>
          <View style={styles.diaryWeekCell}>
            <Text style={styles.diaryWeekLabel}>Tuần trước</Text>
            <Text style={styles.diaryWeekDate}>10/08 - 16/08</Text>
          </View>
          <View style={[styles.diaryWeekCell, styles.diaryWeekCellActive]}>
            <Text style={[styles.diaryWeekLabel, styles.diaryActiveText]}>Tuần này</Text>
            <Text style={[styles.diaryWeekDate, styles.diaryActiveText]}>17/08 - 23/08</Text>
          </View>
          <View style={[styles.diaryWeekCell, styles.diaryWeekCellDisabled]}>
            <Text style={styles.diaryWeekLabel}>Tuần sau</Text>
            <Text style={styles.diaryWeekDate}>24/08 - 30/08</Text>
          </View>
        </View>

        <View style={styles.diaryDayPicker}>
          {diaryDays.map((item) => (
            <TouchableOpacity
              key={item.date}
              style={[styles.diaryDayCell, selectedDate === item.date && styles.diaryDayCellActive]}
              onPress={() => setSelectedDate(item.date)}>
              <Text style={[styles.diaryDayLabel, item.weekend && styles.diaryWeekendText, selectedDate === item.date && styles.diaryActiveText]}>{item.day}</Text>
              <Text style={[styles.diaryDayDate, item.weekend && styles.diaryWeekendText, selectedDate === item.date && styles.diaryActiveText]}>{item.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.diarySummary}>
          <Text style={styles.diarySummaryTitle}>thứ tư, 19 tháng 8, 2026 · Hôm nay</Text>
          <View style={styles.diarySummaryRow}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#F59E0B" />
            <Text style={styles.diarySummaryLabel}>Bữa ăn đã ghi</Text>
            <View style={styles.mealDots}>
              {[0, 1, 2, 3].map((dot) => <View key={dot} style={styles.mealDot} />)}
            </View>
            <Text style={styles.diarySummaryValue}>0/4</Text>
          </View>
          <View style={styles.diarySummaryRow}>
            <MaterialCommunityIcons name="dumbbell" size={22} color="#49C99B" />
            <Text style={styles.diarySummaryLabel}>Vận động</Text>
            <View style={styles.diaryActivityLine} />
            <Text style={styles.diarySummaryMuted}>--</Text>
          </View>
        </View>

        <View style={styles.diaryEventsHeader}>
          <Text style={styles.diaryEventsTitle}>Sự kiện trong ngày</Text>
          <TouchableOpacity onPress={() => setDisplayModeVisible(true)} style={styles.diaryFilterButton}>
            <Text style={styles.diaryFilterText}>{displayMode}</Text>
            <Ionicons name="chevron-down" size={18} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        <View style={styles.diaryEmptyState}>
          <View style={styles.diaryEmptyIcon}>
            <Ionicons name="document-text-outline" size={38} color="#64748B" />
          </View>
          <Text style={styles.diaryEmptyTitle}>Chưa có dữ liệu hôm nay</Text>
          <Text style={styles.diaryEmptyText}>Nhấn nút &quot;+&quot; ở thanh dưới để ghi lại bữa ăn và hoạt động.</Text>
        </View>
      </ScrollView>

      <Modal visible={displayModeVisible} transparent animationType="fade" onRequestClose={() => setDisplayModeVisible(false)}>
        <View style={styles.displayModalBackdrop}>
          <View style={styles.displaySheet}>
            <Text style={styles.displaySheetTitle}>Chế độ hiển thị</Text>
            {displayModes.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.displayOption, displayMode === mode && styles.displayOptionActive]}
                onPress={() => { setDisplayMode(mode); setDisplayModeVisible(false); }}>
                <Text style={[styles.displayOptionText, displayMode === mode && styles.displayOptionTextActive]}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.displayCancel} onPress={() => setDisplayModeVisible(false)}>
            <Text style={styles.displayCancelText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );

  return renderDiaryScreen();

}

const styles = StyleSheet.create({
  diarySafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  diaryContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  diaryContent: {
    paddingHorizontal: 32,
    paddingBottom: 36,
  },
  diaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 18,
  },
  diaryTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10294B',
  },
  diaryHeaderActions: {
    flexDirection: 'row',
    gap: 10,
  },
  diaryIconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryWeekPicker: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F9',
    borderRadius: 18,
    padding: 4,
    marginBottom: 16,
  },
  diaryWeekCell: {
    flex: 1,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 2,
  },
  diaryWeekCellActive: {
    backgroundColor: '#49C99B',
  },
  diaryWeekCellDisabled: {
    opacity: 0.45,
  },
  diaryWeekLabel: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 7,
  },
  diaryWeekDate: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10294B',
  },
  diaryActiveText: {
    color: '#FFFFFF',
  },
  diaryDayPicker: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F9',
    borderRadius: 18,
    padding: 4,
    marginBottom: 28,
  },
  diaryDayCell: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  diaryDayCellActive: {
    backgroundColor: '#49C99B',
  },
  diaryDayLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 7,
  },
  diaryDayDate: {
    fontSize: 25,
    fontWeight: '800',
    color: '#10294B',
  },
  diaryWeekendText: {
    color: '#F3B8B8',
  },
  diarySummary: {
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
    paddingTop: 36,
    paddingBottom: 48,
  },
  diarySummaryTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 34,
  },
  diarySummaryRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  diarySummaryLabel: {
    fontSize: 18,
    color: '#64748B',
  },
  mealDots: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  mealDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#F1F2F5',
  },
  diarySummaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10294B',
  },
  diaryActivityLine: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#F1F2F5',
    marginLeft: 20,
  },
  diarySummaryMuted: {
    fontSize: 18,
    color: '#CBD0D6',
  },
  diaryEventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 58,
  },
  diaryEventsTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#10294B',
  },
  diaryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  diaryFilterText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
  },
  diaryEmptyState: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  diaryEmptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F6F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  diaryEmptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 22,
  },
  diaryEmptyText: {
    fontSize: 19,
    lineHeight: 29,
    textAlign: 'center',
    color: '#64748B',
  },
  displayModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    padding: 16,
  },
  displaySheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  displaySheetTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#10294B',
    textAlign: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  displayOption: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  displayOptionActive: {
    backgroundColor: '#E5F7F0',
  },
  displayOptionText: {
    fontSize: 23,
    color: '#10294B',
  },
  displayOptionTextActive: {
    color: '#49C99B',
  },
  displayCancel: {
    height: 108,
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayCancelText: {
    fontSize: 23,
    color: '#10294B',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  spacer: {
    width: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F3',
    borderRadius: 24,
    padding: 4,
  },
  segmentedControlSmall: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F3',
    borderRadius: 24,
    padding: 4,
  },
  tab: {
    minWidth: 72,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#D1FAE5',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#10B981',
  },
  calendarScroll: {
    marginBottom: 20,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  calendarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weekPicker: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F9',
    borderRadius: 18,
    padding: 4,
    marginBottom: 20,
  },
  weekItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  weekItemSelected: {
    backgroundColor: '#49C99B',
  },
  weekLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  weekRange: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekTextSelected: {
    color: '#FFFFFF',
  },
  calendarItem: {
    width: 56,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  calendarItemToday: {
    backgroundColor: '#10B981',
  },
  calendarItemSelected: {
    backgroundColor: '#D1FAE5',
  },
  calendarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  calendarLabelWeekend: {
    color: '#EF4444',
  },
  calendarDate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  calendarDateToday: {
    color: '#FFFFFF',
  },
  calendarDateWeekend: {
    color: '#EF4444',
  },
  nutritionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  weekAverage: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: -4,
    marginBottom: 14,
  },
  calorieCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#EF4444',
  },
  calorieLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  macroBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 6,
  },
  macroBarEmpty: {
    height: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  macroValue: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  scoreSection: {
    marginBottom: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EF4444',
  },
  scoreMax: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 4,
  },
  scoreBadge: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  scoreBar: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreBarFill: {
    flex: 1,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  scoreBarEmpty: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  diversitySection: {
    marginBottom: 20,
  },
  diversityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  diversityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  diversityValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  diversityMax: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 4,
  },
  diversityBadge: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  mealPlanSection: {
    marginBottom: 20,
  },
  mealPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mealGroup: {
    marginBottom: 16,
  },
  mealGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealGroupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMealState: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyMealIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  emptyMealHeart: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 4,
  },
  emptyMealTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyMealText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  /* Activity Styles */
  activityHeaderSection: {
    marginBottom: 20,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activityIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  accelerateBtn: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  accelerateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  activityValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  activityValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  activityUnit: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 4,
  },
  activityProgressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  activityProgressFill: {
    height: '100%',
    width: '0%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  activityRemainText: {
    fontSize: 13,
    color: '#64748B',
  },
  activityTargetDays: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
    marginBottom: 10,
  },
  activityTargetDay: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  activityTargetBar: {
    width: '100%',
    height: 8,
    borderWidth: 2,
    borderColor: '#E2E5E8',
    borderRadius: 5,
  },
  activityTargetBarDone: {
    borderColor: '#D6DCE1',
    backgroundColor: '#FFFFFF',
  },
  activityTargetLabel: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  activityTargetHint: {
    fontSize: 13,
    color: '#A1A1AA',
    marginBottom: 16,
  },
  activityStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  activityStatCard: {
    width: '48%',
    minHeight: 108,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  activityStatCardWide: {
    width: '100%',
    minHeight: 92,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  activityStatIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityStatTextWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  activityStatLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'left',
  },
  activityStatValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'left',
  },
  activityInDaySection: {
    marginBottom: 20,
  },
  activityInDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activityActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyActivityState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActivityIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyActivityTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyActivityText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  addActivityBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addActivityBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

