import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RangeType = 7 | 30;

const weekDays = ['T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4'];

export default function HabitAnalysisScreen() {
  const router = useRouter();
  const [range, setRange] = useState<RangeType>(7);

  const activeDaysCount = 0;
  const loggedDaysCount = range === 7 ? 0 : 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={20} color="#10294B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          Phân tích Thói quen
        </Text>

        <View style={styles.rangeToggleContainer}>
          <TouchableOpacity
            style={[styles.rangePill, range === 7 && styles.rangePillActive]}
            activeOpacity={0.8}
            onPress={() => setRange(7)}>
            <Text style={[styles.rangePillText, range === 7 && styles.rangePillTextActive]}>
              7 ngày
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangePill, range === 30 && styles.rangePillActive]}
            activeOpacity={0.8}
            onPress={() => setRange(30)}>
            <Text style={[styles.rangePillText, range === 30 && styles.rangePillTextActive]}>
              30 ngày
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Section 1: Tổng quan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.summaryGrid}>
            {/* Card 1: Ngày active */}
            <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
              <View style={styles.summaryIconCircle}>
                <Ionicons name="calendar-outline" size={22} color="#34D399" />
              </View>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>Ngày active</Text>
                <Text style={styles.summaryValue}>{activeDaysCount}/{range}</Text>
              </View>
            </View>

            {/* Card 2: Ghi nhật ký */}
            <View style={[styles.summaryCard, { backgroundColor: '#FFF7ED' }]}>
              <View style={styles.summaryIconCircle}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#F59E0B" />
              </View>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>Ghi nhật ký</Text>
                <Text style={styles.summaryValue}>{loggedDaysCount}/{range} ngày</Text>
              </View>
            </View>

            {/* Card 3: Hoàn thành KH */}
            <View style={[styles.summaryCard, { backgroundColor: '#F0F4FF' }]}>
              <View style={styles.summaryIconCircle}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#3B82F6" />
              </View>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>Hoàn thành KH</Text>
                <Text style={styles.summaryValue}>0%</Text>
              </View>
            </View>

            {/* Card 4: Thời gian vận động */}
            <View style={[styles.summaryCard, { backgroundColor: '#FFF1F2' }]}>
              <View style={styles.summaryIconCircle}>
                <Ionicons name="time-outline" size={22} color="#EF4444" />
              </View>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>Thời gian vận động</Text>
                <Text style={styles.summaryValue}>--</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Lịch Hoạt động & Nhật ký */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch Hoạt động &amp; Nhật ký</Text>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Vận động</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Bữa ăn đã ghi</Text>
            </View>
          </View>

          {/* Heatmap Grid */}
          {range === 7 ? (
            <View style={styles.sevenDayContainer}>
              {/* Row 1: Vận động */}
              <View style={styles.sevenDayRow}>
                {weekDays.map((_, i) => (
                  <View key={`act-${i}`} style={styles.sevenDayCell} />
                ))}
              </View>
              {/* Row 2: Bữa ăn */}
              <View style={styles.sevenDayRow}>
                {weekDays.map((_, i) => (
                  <View key={`meal-${i}`} style={styles.sevenDayCell} />
                ))}
              </View>
              {/* Day Labels */}
              <View style={styles.sevenDayLabelsRow}>
                {weekDays.map((day, i) => (
                  <Text key={`label-${day}-${i}`} style={styles.sevenDayLabel}>
                    {day}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.thirtyDayContainer}>
              {/* Row 1: Vận động (30 ô) */}
              <View style={styles.thirtyDayRow}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <View key={`act-30-${i}`} style={styles.thirtyDayCell} />
                ))}
              </View>
              {/* Row 2: Bữa ăn (30 ô, ô số 14 màu xanh) */}
              <View style={styles.thirtyDayRow}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <View
                    key={`meal-30-${i}`}
                    style={[
                      styles.thirtyDayCell,
                      i === 13 && styles.thirtyDayCellActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Scale Legend (0% - 100%) */}
          <View style={styles.scaleContainer}>
            <Text style={styles.scaleText}>0%</Text>
            <View style={[styles.scaleBlock, { backgroundColor: '#F0F1F3' }]} />
            <View style={[styles.scaleBlock, { backgroundColor: '#D8F5EA' }]} />
            <View style={[styles.scaleBlock, { backgroundColor: '#8AD9BA' }]} />
            <View style={[styles.scaleBlock, { backgroundColor: '#49C99B' }]} />
            <Text style={styles.scaleText}>100%</Text>
          </View>
        </View>

        {/* Section 3: Nhịp Bữa ăn (Chrononutrition) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhịp Bữa ăn (Chrononutrition)</Text>

          <View style={styles.chronoCardsRow}>
            {/* Card 1: Bữa đầu TB */}
            <View style={styles.chronoCard}>
              <Text style={styles.chronoCardLabel}>Bữa đầu TB</Text>
              <Text style={styles.chronoCardValue}>
                {range === 7 ? '--' : '14:46'}
              </Text>
            </View>

            {/* Card 2: Cửa sổ ăn */}
            <View style={styles.chronoCard}>
              <Text style={styles.chronoCardLabel}>Cửa sổ ăn</Text>
              <Text style={styles.chronoCardValue}>~0h</Text>
            </View>

            {/* Card 3: Nhất quán giờ ăn */}
            <View style={styles.chronoCard}>
              <Text style={styles.chronoCardLabel}>Nhất quán giờ ăn</Text>
              <Text style={styles.chronoCardMutedValue}>
                Chưa đủ dữ liệu
              </Text>
            </View>
          </View>

          {/* Timeline chart (shown in 7-day mode) */}
          {range === 7 && (
            <View style={styles.timelineContainer}>
              {/* Time header labels */}
              <View style={styles.timeHeaderRow}>
                <Text style={styles.timeHeaderText}>05:00</Text>
                <Text style={styles.timeHeaderText}>10:00</Text>
                <Text style={styles.timeHeaderText}>15:00</Text>
                <Text style={styles.timeHeaderText}>21:00</Text>
              </View>

              {/* Guideline line indicator at ~21:00 */}
              <View style={styles.timelineGuideLine} />

              {/* 7 Daily Tracks */}
              {weekDays.map((day, i) => (
                <View key={`chrono-${day}-${i}`} style={styles.timelineTrackRow}>
                  <Text style={styles.timelineDayLabel}>{day}</Text>
                  <View style={styles.timelineTrack}>
                    <Text style={styles.timelineTrackDash}>—</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 4: 💡 Nhận xét */}
        <View style={styles.section}>
          <View style={styles.insightHeaderRow}>
            <Ionicons name="bulb-outline" size={22} color="#F59E0B" />
            <Text style={styles.insightTitle}>Nhận xét</Text>
          </View>

          {range === 7 ? (
            <View style={styles.insightCard}>
              <Text style={styles.insightText}>
                Chuỗi gián đoạn dài nhất: 7 ngày. Hãy nhớ quy tắc &quot;never miss twice&quot; — bỏ 1 ngày là bình thường, đừng để cascading.
              </Text>
            </View>
          ) : (
            <View style={styles.insightList}>
              <View style={styles.insightCard}>
                <Text style={styles.insightText}>
                  Bạn chỉ ghi được 1/30 ngày. Nhật ký hiệu quả nhất khi log ≥5 ngày/tuần (NIH, 2023).
                </Text>
              </View>
              <View style={styles.insightCard}>
                <Text style={styles.insightText}>
                  Chuỗi gián đoạn dài nhất: 15 ngày. Hãy nhớ quy tắc &quot;never miss twice&quot; — bỏ 1 ngày là bình thường, đừng để cascading.
                </Text>
              </View>
            </View>
          )}
        </View>
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
    paddingTop: 8,
    paddingBottom: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
  },
  rangeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F8',
    borderRadius: 18,
    padding: 3,
    flexShrink: 0,
  },
  rangePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  rangePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  rangePillTextActive: {
    color: '#49C99B',
    fontWeight: '700',
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10294B',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#49C99B',
  },
  legendText: {
    fontSize: 13,
    color: '#64748B',
  },
  sevenDayContainer: {
    gap: 8,
  },
  sevenDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sevenDayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F0F1F3',
  },
  sevenDayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sevenDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  thirtyDayContainer: {
    gap: 6,
  },
  thirtyDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 3,
  },
  thirtyDayCell: {
    flex: 1,
    height: 10,
    borderRadius: 2.5,
    backgroundColor: '#F0F1F3',
  },
  thirtyDayCellActive: {
    backgroundColor: '#49C99B',
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  scaleText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  scaleBlock: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  chronoCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chronoCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 14,
    backgroundColor: '#F6F7FA',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chronoCardLabel: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  chronoCardValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10294B',
  },
  chronoCardMutedValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  timelineContainer: {
    marginTop: 8,
    position: 'relative',
  },
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 34,
    paddingRight: 10,
    marginBottom: 8,
  },
  timeHeaderText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  timelineGuideLine: {
    position: 'absolute',
    top: 24,
    bottom: 4,
    right: 28,
    width: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    zIndex: 1,
  },
  timelineTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  timelineDayLabel: {
    width: 24,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  timelineTrack: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F6F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTrackDash: {
    color: '#CBD0D6',
    fontSize: 14,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10294B',
  },
  insightList: {
    gap: 10,
  },
  insightCard: {
    borderRadius: 16,
    backgroundColor: '#FFF5F3',
    padding: 16,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#10294B',
    fontWeight: '500',
  },
});
