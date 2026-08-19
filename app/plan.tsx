import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Section = 'meals' | 'activities';
type ViewMode = 'day' | 'week';

const days = [
  { label: 'CN', date: 16, weekend: true }, { label: 'T2', date: 17 }, { label: 'T3', date: 18 },
  { label: 'T4', date: 19 }, { label: 'T5', date: 20 }, { label: 'T6', date: 21 }, { label: 'T7', date: 22, weekend: true },
];
const weeks = [
  { label: 'Tuần trước', range: '10/08 - 16/08' }, { label: 'Tuần này', range: '17/08 - 23/08' }, { label: 'Tuần sau', range: '24/08 - 30/08' },
];

export default function PlanScreen() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('meals');
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(19);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [mealSheetVisible, setMealSheetVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#10294B" /></TouchableOpacity>
          <View style={styles.headerText}><Text style={styles.title}>Kế hoạch</Text><Text style={styles.subtitle}>{viewMode === 'week' ? 'tuần này (17/08/2026 - 23/08/2026)' : 'thứ tư, 19 tháng 8, 2026'}</Text></View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity style={[styles.segment, section === 'meals' && styles.segmentActive]} onPress={() => setSection('meals')}><Text style={[styles.segmentText, section === 'meals' && styles.segmentActiveText]}>Bữa ăn</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, section === 'activities' && styles.segmentActive]} onPress={() => setSection('activities')}><Text style={[styles.segmentText, section === 'activities' && styles.segmentActiveText]}>Hoạt động</Text></TouchableOpacity>
          </View>
          <View style={styles.segmentedControlSmall}>
            <TouchableOpacity style={[styles.segment, viewMode === 'day' && styles.segmentActive]} onPress={() => setViewMode('day')}><Text style={[styles.segmentText, viewMode === 'day' && styles.segmentActiveText]}>Ngày</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, viewMode === 'week' && styles.segmentActive]} onPress={() => setViewMode('week')}><Text style={[styles.segmentText, viewMode === 'week' && styles.segmentActiveText]}>Tuần</Text></TouchableOpacity>
          </View>
        </View>

        {viewMode === 'day' ? <View style={styles.dayPicker}>{days.map((day) => <TouchableOpacity key={day.date} style={[styles.dayItem, selectedDate === day.date && styles.dayItemActive]} onPress={() => setSelectedDate(day.date)}><Text style={[styles.dayLabel, day.weekend && styles.weekend, selectedDate === day.date && styles.activeText]}>{day.label}</Text><Text style={[styles.dayDate, day.weekend && styles.weekend, selectedDate === day.date && styles.activeText]}>{day.date}</Text></TouchableOpacity>)}</View> : <View style={styles.weekPicker}>{weeks.map((week, index) => <TouchableOpacity key={week.label} style={[styles.weekItem, selectedWeek === index && styles.weekItemActive]} onPress={() => setSelectedWeek(index)}><Text style={[styles.weekLabel, selectedWeek === index && styles.activeText]}>{week.label}</Text><Text style={[styles.weekRange, selectedWeek === index && styles.activeText]}>{week.range}</Text></TouchableOpacity>)}</View>}

        {section === 'meals' ? <MealPlan viewMode={viewMode} onAddMeal={() => setMealSheetVisible(true)} /> : <ActivityPlan viewMode={viewMode} onAddActivity={() => router.push('/activity')} />}
      </ScrollView>

      <MealOptionsSheet visible={mealSheetVisible} onClose={() => setMealSheetVisible(false)} />
    </SafeAreaView>
  );
}

function MealOptionsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.sheetBackdrop}>
      <TouchableOpacity style={styles.sheetDismissArea} onPress={onClose} activeOpacity={1} />
      <View style={styles.mealSheet}>
        <TouchableOpacity style={styles.mealSheetOption} onPress={onClose}>
          <MaterialCommunityIcons name="chef-hat" size={28} color="#49C99B" />
          <Text style={[styles.mealSheetText, { color: '#49C99B' }]}>Thêm công thức</Text>
        </TouchableOpacity>
        <View style={styles.mealSheetDivider} />
        <TouchableOpacity style={styles.mealSheetOption} onPress={onClose}>
          <MaterialCommunityIcons name="food-apple-outline" size={29} color="#F59E0B" />
          <Text style={[styles.mealSheetText, { color: '#F59E0B' }]}>Thêm nguyên liệu</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
        <Text style={styles.sheetCancelText}>Huỷ</Text>
      </TouchableOpacity>
    </View>
  </Modal>;
}

function MealPlan({ viewMode, onAddMeal }: { viewMode: ViewMode; onAddMeal: () => void }) {
  const router = useRouter();

  return <View>
    <View style={styles.titleRow}><Text style={styles.sectionTitle}>Thông tin dinh dưỡng</Text><View style={styles.actionIcons}><TouchableOpacity style={styles.iconButton} onPress={() => router.push('/nutrition')} accessibilityLabel="Xem biểu đồ dinh dưỡng"><Ionicons name="bar-chart-outline" size={21} color="#64748B" /></TouchableOpacity><TouchableOpacity style={styles.iconButton} onPress={() => router.push('/ingredients')} accessibilityLabel="Thêm nguyên liệu"><Ionicons name="document-text" size={20} color="#64748B" /></TouchableOpacity></View></View>
    <View style={styles.calorieRow}><Text style={styles.calorie}>0</Text><Text style={styles.calorieUnit}>/ 1492 kcal</Text></View>
    {viewMode === 'week' && <Text style={styles.average}>Trung bình dựa trên 0/7 ngày có dữ liệu</Text>}
    <View style={styles.macrosRow}>{[['Đường bột', '213g'], ['Chất đạm', '74g'], ['Chất béo', '38g']].map(([label, target]) => <View key={label} style={styles.macro}><Text style={styles.macroLabel}>{label}</Text><View style={styles.progressTrack} /><Text style={styles.macroValue}>0g / {target}</Text></View>)}</View>
    <Metric title="Điểm dinh dưỡng" value="1" suffix="/10" status="Thấp" filled /><Metric title="Độ đa dạng thực phẩm" value="0" suffix="/10" status="Thấp" />
    <View style={styles.planHeader}><Text style={styles.sectionTitle}>Thực đơn của bạn</Text><TouchableOpacity style={styles.exploreButton}><MaterialCommunityIcons name="chef-hat" size={18} color="#FFFFFF" /><Text style={styles.exploreText}>Khám phá thực đơn mẫu</Text></TouchableOpacity></View>
    <View style={styles.mealGroups}>
      {['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Đồ ăn thêm trong ngày'].map((meal) => (
        <View key={meal} style={styles.mealGroup}>
          <View style={styles.mealGroupHeader}>
            <Text style={styles.mealGroupTitle}>{meal}</Text>
            <TouchableOpacity style={styles.mealAddButton} onPress={onAddMeal}>
              <Ionicons name="add" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={styles.mealEmpty}>
            <View style={styles.mealEmptyIcon}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={34} color="#CBD5E1" />
              <View style={styles.mealHeart}><MaterialCommunityIcons name="heart" size={15} color="#FCD34D" /></View>
            </View>
            <View style={styles.mealEmptyCopy}>
              <Text style={styles.mealEmptyTitle}>Chưa có món ăn</Text>
              <Text style={styles.mealEmptyText}>Thêm món để đạt mục tiêu dinh dưỡng</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>;
}

function Metric({ title, value, suffix, status, filled = false }: { title: string; value: string; suffix: string; status: string; filled?: boolean }) {
  return <View style={styles.metric}><View style={styles.metricTitleRow}><Text style={styles.metricTitle}>{title}</Text><Ionicons name="information-circle" size={21} color="#475569" /></View><View style={styles.metricValueRow}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricSuffix}>{suffix}</Text><Text style={styles.metricStatus}>{status}</Text></View><View style={styles.scoreTrack}>{Array.from({ length: 10 }).map((_, index) => <View key={index} style={[styles.scoreSegment, filled && index === 0 && styles.scoreFilled]} />)}</View></View>;
}

function ActivityPlan({ viewMode, onAddActivity }: { viewMode: ViewMode; onAddActivity: () => void }) {
  const router = useRouter();

  return <View>
    <View style={styles.titleRow}><Text style={styles.sectionTitle}>{viewMode === 'week' ? 'Kế hoạch tuần này' : 'Kế hoạch hoạt động'}</Text><View style={styles.actionIcons}><TouchableOpacity style={styles.iconButton} onPress={() => router.push('/activity-insights')} accessibilityLabel="Xem biểu đồ hoạt động"><Ionicons name="bar-chart-outline" size={21} color="#64748B" /></TouchableOpacity><TouchableOpacity style={styles.iconButton} onPress={() => router.push('/activity-goals')} accessibilityLabel="Chỉnh mục tiêu vận động"><Ionicons name="options-outline" size={21} color="#64748B" /></TouchableOpacity></View></View>
    <View style={styles.activityLabelRow}><Text style={styles.activityLabel}>phút vận động · {viewMode === 'week' ? 'tuần này' : 'hôm nay'}</Text><Text style={styles.boost}>Cần tăng tốc</Text></View>
    <View style={styles.calorieRow}><Text style={styles.activityValue}>0</Text><Text style={styles.calorieUnit}>/ 150 phút</Text></View><View style={styles.activityTrack} /><Text style={styles.remain}>Còn 150 phút · 5 ngày còn lại trong tuần</Text>
    {viewMode === 'week' && <View style={styles.targetDays}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <View key={day} style={styles.targetDay}><View style={styles.targetBar} /><Text style={styles.targetLabel}>{day}</Text></View>)}</View>}
    <View style={styles.statsGrid}><Stat icon="list-outline" color="#10B981" bg="#E8FBF4" label="Hoạt động" value="0" /><Stat icon="time-outline" color="#EF6C6C" bg="#FFF1F1" label={viewMode === 'week' ? 'Phút dự kiến' : 'Dự kiến'} value={viewMode === 'week' ? '0' : '0 phút'} /><Stat icon="flame-outline" color="#F59E0B" bg="#FFF7E9" label="Kcal dự kiến" value="0" /><Stat icon={viewMode === 'week' ? 'dumbbell' : 'water'} color="#3B82F6" bg="#EEF4FF" label={viewMode === 'week' ? 'Buổi kháng lực' : 'Nước (ml)'} value={viewMode === 'week' ? '0/2' : '0'} /></View>
    <View style={styles.activityDaySection}>
      <View style={styles.activityDayHeader}>
        <Text style={styles.sectionTitle}>Hoạt động trong ngày</Text>
        <View style={styles.actionIcons}>
          <TouchableOpacity style={styles.iconButton}><Ionicons name="swap-horizontal-outline" size={21} color="#64748B" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onAddActivity}><Ionicons name="add" size={22} color="#64748B" /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.activityEmpty}>
        <View style={styles.activityEmptyIcon}><MaterialCommunityIcons name="heart-outline" size={46} color="#CBD5E1" /></View>
        <Text style={styles.activityEmptyTitle}>Chưa có hoạt động nào</Text>
        <Text style={styles.activityEmptyText}>Chưa có hoạt động nào được lên kế hoạch. Hãy thêm hoạt động hoặc tạo thói quen mới.</Text>
        <TouchableOpacity style={styles.addActivityButton}><Text style={styles.addActivityText}>Thêm hoạt động</Text></TouchableOpacity>
      </View>
    </View>
  </View>;
}

function Stat({ icon, color, bg, label, value }: { icon: string; color: string; bg: string; label: string; value: string }) {
  return <View style={[styles.stat, { backgroundColor: bg }]}><View style={styles.statIcon}>{icon === 'dumbbell' ? <MaterialCommunityIcons name="dumbbell" size={22} color={color} /> : <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={color} />}</View><View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' }, container: { flex: 1, backgroundColor: '#FFFFFF' }, content: { paddingHorizontal: 32, paddingBottom: 42 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }, backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }, headerText: { flex: 1, alignItems: 'center' }, headerSpacer: { width: 42 }, title: { fontSize: 22, fontWeight: '800', color: '#10294B' }, subtitle: { marginTop: 4, fontSize: 14, color: '#64748B' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }, segmentedControl: { flexDirection: 'row', backgroundColor: '#F1F1F3', borderRadius: 24, padding: 4 }, segmentedControlSmall: { flexDirection: 'row', backgroundColor: '#F1F1F3', borderRadius: 24, padding: 4 }, segment: { minWidth: 70, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 9, borderRadius: 20 }, segmentActive: { backgroundColor: '#FFFFFF' }, segmentText: { fontSize: 16, color: '#64748B' }, segmentActiveText: { color: '#49C99B', fontWeight: '700' }, activeText: { color: '#FFFFFF' },
  dayPicker: { flexDirection: 'row', backgroundColor: '#F5F5F9', borderRadius: 18, padding: 4, marginBottom: 28 }, dayItem: { flex: 1, minHeight: 92, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }, dayItemActive: { backgroundColor: '#49C99B' }, dayLabel: { fontSize: 14, color: '#64748B', marginBottom: 7 }, dayDate: { fontSize: 24, fontWeight: '800', color: '#10294B' }, weekend: { color: '#EF7777' },
  weekPicker: { flexDirection: 'row', backgroundColor: '#F5F5F9', borderRadius: 18, padding: 4, marginBottom: 28 }, weekItem: { flex: 1, minHeight: 92, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }, weekItemActive: { backgroundColor: '#49C99B' }, weekLabel: { fontSize: 14, color: '#64748B', marginBottom: 7 }, weekRange: { fontSize: 15, fontWeight: '800', color: '#10294B' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, sectionTitle: { fontSize: 23, fontWeight: '800', color: '#10294B' }, actionIcons: { flexDirection: 'row', gap: 8 }, iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 }, calorie: { fontSize: 44, fontWeight: '800', color: '#EF5555' }, calorieUnit: { marginLeft: 5, fontSize: 19, color: '#A1A8B2' }, average: { fontSize: 14, color: '#A1A8B2', marginBottom: 16 }, macrosRow: { flexDirection: 'row', gap: 14, marginBottom: 26 }, macro: { flex: 1 }, macroLabel: { fontSize: 15, color: '#10294B', marginBottom: 8 }, progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#E2E5E8', marginBottom: 7 }, macroValue: { fontSize: 13, color: '#EF5555' },
  metric: { marginBottom: 26 }, metricTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, metricTitle: { fontSize: 19, color: '#475569' }, metricValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 9 }, metricValue: { fontSize: 33, fontWeight: '800', color: '#EF5555' }, metricSuffix: { fontSize: 17, color: '#A1A8B2', marginLeft: 3 }, metricStatus: { marginLeft: 'auto', fontSize: 17, fontWeight: '700', color: '#EF5555' }, scoreTrack: { flexDirection: 'row', gap: 4 }, scoreSegment: { flex: 1, height: 8, backgroundColor: '#E0E4E8', borderRadius: 3 }, scoreFilled: { backgroundColor: '#EF5555' }, planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, exploreButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#49C99B', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 11 }, exploreText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  mealGroups: { marginTop: 24 }, mealGroup: { marginBottom: 22 }, mealGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, mealGroupTitle: { fontSize: 18, fontWeight: '700', color: '#10294B' }, mealAddButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }, mealEmpty: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 }, mealEmptyIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center', position: 'relative', marginRight: 14 }, mealHeart: { position: 'absolute', right: -2, bottom: 0, width: 23, height: 23, borderRadius: 12, backgroundColor: '#49C99B', alignItems: 'center', justifyContent: 'center' }, mealEmptyCopy: { flex: 1 }, mealEmptyTitle: { fontSize: 16, fontWeight: '700', color: '#10294B', marginBottom: 4 }, mealEmptyText: { fontSize: 13, color: '#64748B' },
  activityLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, activityLabel: { fontSize: 15, fontWeight: '700', color: '#10294B' }, boost: { backgroundColor: '#FFF0ED', color: '#EF6C5B', fontSize: 15, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 }, activityValue: { fontSize: 52, fontWeight: '800', color: '#10294B' }, activityTrack: { height: 9, backgroundColor: '#E2E5E8', borderRadius: 6, marginBottom: 12 }, remain: { fontSize: 15, color: '#A1A8B2', marginBottom: 20 }, targetDays: { flexDirection: 'row', gap: 8, marginBottom: 24 }, targetDay: { flex: 1, alignItems: 'center', gap: 8 }, targetBar: { width: '100%', height: 8, borderWidth: 2, borderColor: '#E2E5E8', borderRadius: 4 }, targetLabel: { fontSize: 12, color: '#A1A8B2' }, statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }, stat: { width: '48%', minHeight: 112, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, statIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, statLabel: { fontSize: 15, color: '#10294B', marginBottom: 5 }, statValue: { fontSize: 25, fontWeight: '800', color: '#10294B' },
  activityDaySection: { marginTop: 30, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#EEF0F2' }, activityDayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, activityEmpty: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }, activityEmptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, activityEmptyTitle: { fontSize: 19, fontWeight: '800', color: '#10294B', marginBottom: 8 }, activityEmptyText: { fontSize: 14, lineHeight: 21, color: '#64748B', textAlign: 'center', marginBottom: 20 }, addActivityButton: { backgroundColor: '#49C99B', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 22 }, addActivityText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)', justifyContent: 'flex-end', padding: 16 }, sheetDismissArea: { flex: 1 }, mealSheet: { backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden' }, mealSheetOption: { minHeight: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 }, mealSheetDivider: { height: 1, backgroundColor: '#EEF0F2' }, mealSheetText: { fontSize: 22, fontWeight: '700' }, sheetCancel: { height: 86, marginTop: 16, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, sheetCancelText: { fontSize: 22, color: '#EF5555', fontWeight: '600' },
});
