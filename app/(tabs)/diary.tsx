import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
  const [activeTab, setActiveTab] = useState('meals');
  const [selectedDate, setSelectedDate] = useState(18);

  const today = new Date();
  const dateString = `${['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][today.getDay()]}, ${today.getDate()} tháng ${today.getMonth() + 1}, ${today.getFullYear()}`;

  const calendarDates = [
    { day: 'T7', date: 15, isWeekend: false },
    { day: 'CN', date: 16, isWeekend: true },
    { day: 'T2', date: 17, isWeekend: false },
    { day: 'T3', date: 18, isWeekend: false, isToday: true },
    { day: 'T4', date: 19, isWeekend: false },
    { day: 'T5', date: 20, isWeekend: false },
    { day: 'T6', date: 21, isWeekend: false },
  ];

  const mealGroups = [
    { id: 'breakfast', label: 'Bữa sáng', items: [] },
    { id: 'lunch', label: 'Bữa trưa', items: [] },
    { id: 'dinner', label: 'Bữa tối', items: [] },
    { id: 'snacks', label: 'Đồ ăn thêm trong ngày', items: [] },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Kế hoạch</Text>
            <Text style={styles.headerDate}>{dateString}</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'meals' && styles.tabActive]}
            onPress={() => setActiveTab('meals')}>
            <Text style={[styles.tabText, activeTab === 'meals' && styles.tabTextActive]}>
              Bữa ăn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'activities' && styles.tabActive]}
            onPress={() => setActiveTab('activities')}>
            <Text style={[styles.tabText, activeTab === 'activities' && styles.tabTextActive]}>
              Hoạt động
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'day' && styles.tabActive]}
            onPress={() => setActiveTab('day')}>
            <Text style={[styles.tabText, activeTab === 'day' && styles.tabTextActive]}>
              Ngày
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'week' && styles.tabActive]}
            onPress={() => setActiveTab('week')}>
            <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>
              Tuần
            </Text>
          </TouchableOpacity>
        </View>

        {/* CALENDAR */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
          <View style={styles.calendarRow}>
            {calendarDates.map((item) => (
              <TouchableOpacity
                key={item.date}
                style={[
                  styles.calendarItem,
                  item.isToday && styles.calendarItemToday,
                  selectedDate === item.date && styles.calendarItemSelected,
                ]}
                onPress={() => setSelectedDate(item.date)}>
                <Text style={[styles.calendarLabel, item.isWeekend && styles.calendarLabelWeekend]}>
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.calendarDate,
                    item.isToday && styles.calendarDateToday,
                    item.isWeekend && styles.calendarDateWeekend,
                  ]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ACTIVITIES TAB CONTENT */}
        {activeTab === 'activities' && (
          <>
            {/* Activity Header */}
            <View style={styles.activityHeaderSection}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.sectionTitle}>Kế hoạch hoạt động</Text>
                <View style={styles.activityIcons}>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="paper-plane-outline" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="bar-chart-outline" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="settings-outline" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.activityLabelRow}>
                <Text style={styles.activityLabel}>phút vận động · tuần này</Text>
                <TouchableOpacity style={styles.accelerateBtn}>
                  <Text style={styles.accelerateBtnText}>Căn tăng tốc</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.activityValueRow}>
                <Text style={styles.activityValue}>0</Text>
                <Text style={styles.activityUnit}>/ 150 phút</Text>
              </View>

              <View style={styles.activityProgressBar}>
                <View style={styles.activityProgressFill} />
              </View>

              <Text style={styles.activityRemainText}>Còn 150 phút · 6 ngày còn lại trong tuần</Text>
            </View>

            {/* Activity Stats Grid */}
            <View style={styles.activityStatsGrid}>
              <View style={[styles.activityStatCard, { backgroundColor: '#DFF7EE' }]}>
                <View style={[styles.activityStatIconCircle, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name="list-outline" size={22} color="#10B981" />
                </View>
                <View style={styles.activityStatTextWrap}>
                  <Text style={styles.activityStatLabel}>Hoạt động</Text>
                  <Text style={styles.activityStatValue}>0</Text>
                </View>
              </View>

              <View style={[styles.activityStatCard, { backgroundColor: '#FDE7F1' }]}>
                <View style={[styles.activityStatIconCircle, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name="time-outline" size={22} color="#EC4899" />
                </View>
                <View style={styles.activityStatTextWrap}>
                  <Text style={styles.activityStatLabel}>Phút dự kiến</Text>
                  <Text style={styles.activityStatValue}>0</Text>
                </View>
              </View>

              <View style={[styles.activityStatCard, { backgroundColor: '#FEF3C7' }]}>
                <View style={[styles.activityStatIconCircle, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name="flame-outline" size={22} color="#D97706" />
                </View>
                <View style={styles.activityStatTextWrap}>
                  <Text style={styles.activityStatLabel}>Kcal dự kiến</Text>
                  <Text style={styles.activityStatValue}>0</Text>
                </View>
              </View>

              <View style={[styles.activityStatCard, { backgroundColor: '#E0F2FE' }]}>
                <View style={[styles.activityStatIconCircle, { backgroundColor: '#FFFFFF' }]}>
                  <MaterialCommunityIcons name="dumbbell" size={22} color="#F59E0B" />
                </View>
                <View style={styles.activityStatTextWrap}>
                  <Text style={styles.activityStatLabel}>Buổi kháng lực</Text>
                  <Text style={styles.activityStatValue}>0/2</Text>
                </View>
              </View>

              <View style={[styles.activityStatCardWide, { backgroundColor: '#EAF3FF' }]}>
                <View style={[styles.activityStatIconCircle, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name="calendar-outline" size={22} color="#3B82F6" />
                </View>
                <View style={styles.activityStatTextWrap}>
                  <Text style={styles.activityStatLabel}>Ngày có kế hoạch</Text>
                  <Text style={styles.activityStatValue}>0/7</Text>
                </View>
              </View>
            </View>

            {/* Activity in Day */}
            <View style={styles.activityInDaySection}>
              <View style={styles.activityInDayHeader}>
                <Text style={styles.sectionTitle}>Hoạt động trong ngày</Text>
                <View style={styles.activityActionBtns}>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="swap-horizontal-outline" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="add" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.emptyActivityState}>
                <View style={styles.emptyActivityIcon}>
                  <MaterialCommunityIcons name="heart-outline" size={48} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyActivityTitle}>Chưa có hoạt động nào</Text>
                <Text style={styles.emptyActivityText}>
                  Chưa có hoạt động nào được lên kế hoạch. Hãy thêm hoạt động hoặc tạo thói quen mới.
                </Text>
                <TouchableOpacity style={styles.addActivityBtn}>
                  <Text style={styles.addActivityBtnText}>Thêm hoạt động</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* MEALS TAB CONTENT */}
        {activeTab === 'meals' && (
          <>
            {/* NUTRITION INFO */}
            <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Thông tin dinh dưỡng</Text>

          <View style={styles.calorieCard}>
            <Text style={styles.calorieValue}>0</Text>
            <Text style={styles.calorieLabel}>/ 1492 kcal</Text>
          </View>

          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Đường bột</Text>
              <View style={styles.macroBar}>
                <View style={styles.macroBarEmpty} />
              </View>
              <Text style={styles.macroValue}>0g / 213g</Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Chất đạm</Text>
              <View style={styles.macroBar}>
                <View style={styles.macroBarEmpty} />
              </View>
              <Text style={styles.macroValue}>0g / 74g</Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Chất béo</Text>
              <View style={styles.macroBar}>
                <View style={styles.macroBarEmpty} />
              </View>
              <Text style={styles.macroValue}>0g / 38g</Text>
            </View>
          </View>
        </View>

        {/* NUTRITION SCORE */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreHeader}>
            <Text style={styles.sectionTitle}>Điểm dinh dưỡng</Text>
            <TouchableOpacity style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>1</Text>
            <Text style={styles.scoreMax}>/10</Text>
            <Text style={styles.scoreBadge}>Thấp</Text>
          </View>

          <View style={styles.scoreBar}>
            <View style={styles.scoreBarFill} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
          </View>
        </View>

        {/* FOOD DIVERSITY */}
        <View style={styles.diversitySection}>
          <View style={styles.diversityHeader}>
            <Text style={styles.sectionTitle}>Độ đa dạng thực phẩm</Text>
            <TouchableOpacity style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={styles.diversityRow}>
            <Text style={styles.diversityValue}>0</Text>
            <Text style={styles.diversityMax}>/10</Text>
            <Text style={styles.diversityBadge}>Thấp</Text>
          </View>

          <View style={styles.scoreBar}>
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
            <View style={styles.scoreBarEmpty} />
          </View>
        </View>

        {/* MEAL PLAN */}
        <View style={styles.mealPlanSection}>
          <View style={styles.mealPlanHeader}>
            <Text style={styles.sectionTitle}>Thực đơn của bạn</Text>
            <TouchableOpacity style={styles.exploreBtn}>
              <MaterialCommunityIcons name="chef-hat" size={18} color="#FFFFFF" />
              <Text style={styles.exploreBtnText}>Khám phá thực đơn mẫu</Text>
            </TouchableOpacity>
          </View>

          {mealGroups.map((group) => (
            <View key={group.id} style={styles.mealGroup}>
              <View style={styles.mealGroupHeader}>
                <Text style={styles.mealGroupTitle}>{group.label}</Text>
                <TouchableOpacity style={styles.addBtn}>
                  <Ionicons name="add" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              {group.items.length === 0 && (
                <View style={styles.emptyMealState}>
                  <View style={styles.emptyMealIcon}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={48} color="#CBD5E1" />
                    <View style={styles.emptyMealHeart}>
                      <MaterialCommunityIcons name="heart" size={24} color="#FCD34D" />
                    </View>
                  </View>
                  <Text style={styles.emptyMealTitle}>Chưa có món ăn hôm nay!</Text>
                  <Text style={styles.emptyMealText}>
                    Bắt đầu thêm món để đạt được mục tiêu dinh dưỡng
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
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
    justifyContent: 'space-between',
  },
  activityStatCardWide: {
    width: '100%',
    minHeight: 92,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'flex-end',
  },
  activityStatLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'right',
  },
  activityStatValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
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

