import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Range = 7 | 30;

const weekLabels = ['T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4'];

function SummaryCard({ icon, iconColor, backgroundColor, label, value }: { icon: React.ReactNode; iconColor: string; backgroundColor: string; label: string; value: string }) {
  return <View style={[styles.summaryCard, { backgroundColor }]}><View style={[styles.summaryIcon, { backgroundColor: '#FFFFFF' }]}>{icon}</View><View style={styles.summaryCopy}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, { color: iconColor }]}>{value}</Text></View></View>;
}

function HabitGrid({ range }: { range: Range }) {
  const labels = range === 7 ? weekLabels : ['T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4'];
  return <View>
    <View style={styles.legend}><View style={styles.legendItem}><View style={styles.activityLegend} /><Text style={styles.legendText}>Vận động</Text></View><View style={styles.legendItem}><View style={styles.mealLegend} /><Text style={styles.legendText}>Bữa ăn đã ghi</Text></View></View>
    <View style={[styles.grid, range === 30 && styles.gridThirty]}>{labels.map((label, index) => <View key={`${label}-${index}`} style={[styles.gridCell, range === 30 && styles.gridCellThirty]} />)}</View>
    <View style={[styles.gridLabels, range === 30 && styles.gridLabelsThirty]}>{labels.map((label, index) => <Text key={`${label}-label-${index}`} style={[styles.gridLabel, range === 30 && styles.gridLabelThirty]}>{label}</Text>)}</View>
    <View style={styles.scale}><Text style={styles.scaleText}>0%</Text><View style={[styles.scaleColor, { backgroundColor: '#F0F1F3' }]} /><View style={[styles.scaleColor, { backgroundColor: '#D8F5EA' }]} /><View style={[styles.scaleColor, { backgroundColor: '#8AD9BA' }]} /><View style={[styles.scaleColor, { backgroundColor: '#49C99B' }]} /><Text style={styles.scaleText}>100%</Text></View>
  </View>;
}

function MealRhythm({ range }: { range: Range }) {
  const labels = range === 7 ? weekLabels : ['T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4'];
  return <View style={styles.rhythmSection}>
    <Text style={styles.sectionTitle}>Nhịp Bữa ăn (Chrononutrition)</Text>
    <View style={styles.rhythmCards}><View style={styles.rhythmCard}><Text style={styles.rhythmLabel}>Bữa đầu TB</Text><Text style={styles.rhythmValue}>--</Text></View><View style={styles.rhythmCard}><Text style={styles.rhythmLabel}>Cửa sổ ăn</Text><Text style={styles.rhythmValue}>~0h</Text></View><View style={styles.rhythmCard}><Text style={styles.rhythmLabel}>Nhất quán giờ ăn</Text><Text style={styles.rhythmValueMuted}>Chưa đủ dữ liệu</Text></View></View>
    <View style={styles.timeLabels}><Text style={styles.timeLabel}>05:00</Text><Text style={styles.timeLabel}>10:00</Text><Text style={styles.timeLabel}>15:00</Text><Text style={styles.timeLabel}>21:00</Text></View>
    {labels.map((label, index) => <View key={`${label}-${index}`} style={styles.rhythmRow}><Text style={styles.rhythmDay}>{label}</Text><View style={styles.rhythmTrack}><Text style={styles.rhythmDash}>-</Text></View></View>)}
  </View>;
}

export default function HabitAnalysisScreen() {
  const router = useRouter();
  const [range, setRange] = useState<Range>(7);

  return <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại"><Ionicons name="arrow-back" size={24} color="#10294B" /></TouchableOpacity><Text style={styles.headerTitle}>Phân tích Thói quen</Text><View style={styles.rangeToggle}><TouchableOpacity style={[styles.rangeOption, range === 7 && styles.rangeActive]} onPress={() => setRange(7)}><Text style={[styles.rangeText, range === 7 && styles.rangeTextActive]}>7 ngày</Text></TouchableOpacity><TouchableOpacity style={[styles.rangeOption, range === 30 && styles.rangeActive]} onPress={() => setRange(30)}><Text style={[styles.rangeText, range === 30 && styles.rangeTextActive]}>30 ngày</Text></TouchableOpacity></View></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Tổng quan</Text>
      <View style={styles.summaryGrid}><SummaryCard icon={<Ionicons name="calendar-outline" size={28} color="#49C99B" />} iconColor="#10294B" backgroundColor="#EAF9F3" label="Ngày active" value={`0/${range}`} /><SummaryCard icon={<MaterialCommunityIcons name="silverware-fork-knife" size={27} color="#F59E0B" />} iconColor="#10294B" backgroundColor="#FFF4ED" label="Ghi nhật ký" value={`0/${range} ngày`} /><SummaryCard icon={<Ionicons name="checkmark-circle-outline" size={29} color="#3B82F6" />} iconColor="#10294B" backgroundColor="#EEF3FF" label="Hoàn thành KH" value="0%" /><SummaryCard icon={<Ionicons name="time-outline" size={29} color="#EF6256" />} iconColor="#10294B" backgroundColor="#FFF1F0" label="Thời gian vận động" value="--" /></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Lịch Hoạt động &amp; Nhật ký</Text><HabitGrid range={range} /></View>
      <MealRhythm range={range} />
      <View style={styles.insightSection}><View style={styles.insightHeading}><Ionicons name="bulb-outline" size={25} color="#F2C632" /><Text style={styles.sectionTitle}>Nhận xét</Text></View><View style={styles.insightCard}><Text style={styles.insightText}>Chuỗi gián đoạn dài nhất: {range === 7 ? '7' : '30'} ngày. Hãy nhớ quy tắc &quot;never miss twice&quot; - bỏ 1 ngày là bình thường, đừng để cascading.</Text></View></View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 82, borderBottomWidth: 1, borderBottomColor: '#F0F1F3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 18 },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 25, fontWeight: '800', color: '#10294B' },
  rangeToggle: { flexDirection: 'row', backgroundColor: '#F3F3F5', borderRadius: 25, padding: 4 },
  rangeOption: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22 },
  rangeActive: { backgroundColor: '#FFFFFF' },
  rangeText: { fontSize: 18, color: '#64748B' },
  rangeTextActive: { color: '#49C99B', fontWeight: '700' },
  content: { padding: 32, paddingBottom: 48 },
  section: { marginTop: 42 },
  sectionTitle: { fontSize: 27, lineHeight: 34, fontWeight: '800', color: '#10294B', marginBottom: 24 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  summaryCard: { width: '47%', minHeight: 128, borderRadius: 20, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryIcon: { width: 52, height: 52, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1 },
  summaryLabel: { fontSize: 17, lineHeight: 24, color: '#334155', marginBottom: 2 },
  summaryValue: { fontSize: 27, fontWeight: '800' },
  legend: { flexDirection: 'row', gap: 28, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityLegend: { width: 20, height: 20, borderRadius: 5, backgroundColor: '#49C99B' },
  mealLegend: { width: 20, height: 20, borderRadius: 5, backgroundColor: '#49C99B' },
  legendText: { fontSize: 17, color: '#A1A8B2' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCell: { width: '13.4%', aspectRatio: 1, borderRadius: 10, backgroundColor: '#F0F1F3' },
  gridLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  gridLabel: { fontSize: 15, color: '#7C858F' },
  scale: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 28 },
  scaleText: { fontSize: 15, color: '#A1A8B2' },
  scaleColor: { width: 25, height: 25, borderRadius: 4 },
  rhythmSection: { marginTop: 42 },
  rhythmCards: { flexDirection: 'row', gap: 12 },
  rhythmCard: { flex: 1, minHeight: 126, borderRadius: 18, backgroundColor: '#F5F4FA', padding: 16, alignItems: 'center', justifyContent: 'center' },
  rhythmLabel: { fontSize: 17, color: '#334155', textAlign: 'center', marginBottom: 8 },
  rhythmValue: { fontSize: 25, color: '#10294B', fontWeight: '800' },
  rhythmValueMuted: { fontSize: 21, lineHeight: 27, color: '#64748B', fontWeight: '800', textAlign: 'center' },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, marginBottom: 10 },
  timeLabel: { fontSize: 15, color: '#A1A8B2' },
  rhythmRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  rhythmDay: { width: 42, fontSize: 17, color: '#A1A8B2' },
  rhythmTrack: { flex: 1, height: 46, borderRadius: 10, backgroundColor: '#F5F4FA', alignItems: 'center', justifyContent: 'center' },
  rhythmDash: { color: '#A1A8B2', fontSize: 17 },
  insightSection: { marginTop: 48 },
  insightHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightCard: { borderRadius: 20, backgroundColor: '#FFF1F0', padding: 26 },
  insightText: { fontSize: 21, lineHeight: 31, color: '#10294B' },
});
