import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mealLogService } from '@/services/meal_log.service';
import { PeriodStatistics } from '@/types/meal_log.types';

type RangeType = 7 | 30;

export default function HabitAnalysisScreen() {
  const router = useRouter();
  const [range, setRange] = useState<RangeType>(7);
  const [statistics, setStatistics] = useState<PeriodStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mealLogService.getStatistics(range);
      setStatistics(data);
    } catch (err) {
      console.warn('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [loadStatistics])
  );

  const activeDaysCount = statistics?.activeDaysCount || 0;
  const loggedDaysCount = statistics?.loggedDaysCount || 0;
  const planCompletionPercent = statistics?.planCompletionPercent || 0;
  const daysList = statistics?.days || [];
  const totalBurnedMinutes = daysList.reduce((acc, d) => acc + (d.durationMinutes || 0), 0);

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
          <Text style={styles.sectionTitle}>Tổng quan {range} ngày qua</Text>
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
                <Text style={styles.summaryValue}>{planCompletionPercent}%</Text>
              </View>
            </View>

            {/* Card 4: Thời gian vận động */}
            <View style={[styles.summaryCard, { backgroundColor: '#FFF1F2' }]}>
              <View style={styles.summaryIconCircle}>
                <Ionicons name="time-outline" size={22} color="#EF4444" />
              </View>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>Vận động</Text>
                <Text style={styles.summaryValue}>
                  {totalBurnedMinutes > 0 ? `${totalBurnedMinutes} phút` : '--'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Lịch Hoạt động & Nhật ký Heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch Hoạt động &amp; Nhật ký</Text>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={styles.legendText}>Vận động</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Bữa ăn đã ghi</Text>
            </View>
          </View>

          {/* Heatmap Grid */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.loadingText}>Đang tổng hợp dữ liệu...</Text>
            </View>
          ) : range === 7 ? (
            <View style={styles.sevenDayContainer}>
              {/* Row 1: Vận động */}
              <View style={styles.sevenDayRow}>
                {daysList.map((d, i) => (
                  <View
                    key={`act-${i}`}
                    style={[
                      styles.sevenDayCell,
                      d.hasActivity && { backgroundColor: '#38BDF8' },
                    ]}
                  />
                ))}
              </View>
              {/* Row 2: Bữa ăn */}
              <View style={styles.sevenDayRow}>
                {daysList.map((d, i) => (
                  <View
                    key={`meal-${i}`}
                    style={[
                      styles.sevenDayCell,
                      d.hasMeal && { backgroundColor: '#10B981' },
                    ]}
                  />
                ))}
              </View>
              {/* Day Labels */}
              <View style={styles.sevenDayLabelsRow}>
                {daysList.map((d, i) => {
                  const dayNum = d.date.split('-')[2];
                  return (
                    <Text key={`label-${i}`} style={styles.sevenDayLabel}>
                      {dayNum}/08
                    </Text>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.thirtyDayContainer}>
              {/* Row 1: Vận động (30 ô) */}
              <View style={styles.thirtyDayRow}>
                {daysList.map((d, i) => (
                  <View
                    key={`act-30-${i}`}
                    style={[
                      styles.thirtyDayCell,
                      d.hasActivity && { backgroundColor: '#38BDF8' },
                    ]}
                  />
                ))}
              </View>
              {/* Row 2: Bữa ăn (30 ô) */}
              <View style={styles.thirtyDayRow}>
                {daysList.map((d, i) => (
                  <View
                    key={`meal-30-${i}`}
                    style={[
                      styles.thirtyDayCell,
                      d.hasMeal && styles.thirtyDayCellActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Scale Legend (0% - 100%) */}
          <View style={styles.scaleContainer}>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabelText}>0%</Text>
              <Text style={styles.scaleLabelText}>50%</Text>
              <Text style={styles.scaleLabelText}>100%</Text>
            </View>
            <View style={styles.scaleBarTrack}>
              <View style={[styles.scaleBarBlock, { backgroundColor: '#E2E8F0' }]} />
              <View style={[styles.scaleBarBlock, { backgroundColor: '#A7F3D0' }]} />
              <View style={[styles.scaleBarBlock, { backgroundColor: '#34D399' }]} />
              <View style={[styles.scaleBarBlock, { backgroundColor: '#10B981' }]} />
              <View style={[styles.scaleBarBlock, { backgroundColor: '#047857' }]} />
            </View>
          </View>
        </View>

        {/* Section 3: Daily Calorie Consumption Bar Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diễn biến Calo nạp theo ngày</Text>
          <View style={styles.trendCard}>
            <View style={styles.trendBarsRow}>
              {daysList.slice(range === 7 ? -7 : -14).map((d, i) => {
                const heightPercent = Math.min(100, Math.max(10, Math.round((d.caloriesConsumed / 2500) * 100)));
                const dayNum = d.date.split('-')[2];
                return (
                  <View key={`bar-${i}`} style={styles.trendBarCol}>
                    <Text style={styles.trendBarVal}>
                      {d.caloriesConsumed > 0 ? Math.round(d.caloriesConsumed) : ''}
                    </Text>
                    <View style={styles.trendBarBg}>
                      <View
                        style={[
                          styles.trendBarFill,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: d.caloriesConsumed > 0 ? '#10B981' : '#E2E8F0',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.trendBarDay}>{dayNum}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
  },
  rangeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
  },
  rangePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rangePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  rangePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  rangePillTextActive: {
    color: '#10294B',
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10294B',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  sevenDayContainer: {
    backgroundColor: '#FAFAFB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  sevenDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  sevenDayCell: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  sevenDayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sevenDayLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  thirtyDayContainer: {
    backgroundColor: '#FAFAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  thirtyDayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  thirtyDayCell: {
    width: '9%',
    height: 22,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  thirtyDayCellActive: {
    backgroundColor: '#10B981',
  },
  scaleContainer: {
    marginTop: 14,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scaleLabelText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  scaleBarTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
  },
  scaleBarBlock: {
    flex: 1,
  },
  trendCard: {
    backgroundColor: '#FAFAFB',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  trendBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: 6,
  },
  trendBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  trendBarVal: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  trendBarBg: {
    width: 14,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 7,
  },
  trendBarDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
});
