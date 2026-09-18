import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalAdherenceModal } from '@/components/plan/goal-adherence-modal';
import { MealAnalysisModal } from '@/components/plan/meal-analysis-modal';
import { GoalAdherenceData, GoalAdherenceDay, goalService } from '@/services/goal.service';
import { getAuthToken } from '@/services/storage.service';

const { width } = Dimensions.get('window');

export default function GoalAdherenceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<GoalAdherenceData | null>(null);
  const [selectedDay, setSelectedDay] = useState<GoalAdherenceDay | null>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

  // 3-day deviation confirmation modal
  const [modalVisible, setModalVisible] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const hasDismissedModalRef = useRef(false);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const dismissModal = useCallback(async () => {
    hasDismissedModalRef.current = true;
    setModalVisible(false);
    try {
      await AsyncStorage.setItem('@nutrition_app:adherence_dismissed_date', todayStr);
    } catch {}
  }, [todayStr]);

  const loadAdherenceData = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await goalService.getGoalAdherence(token, rangeDays);
      if (res) {
        setData(res);
        if (res.days && res.days.length > 0) {
          setSelectedDay(res.days[res.days.length - 1]);
        }
        // If 3+ consecutive deviated days, show prompt modal if not already dismissed
        if (res.needsAdjustmentConfirmation && !hasDismissedModalRef.current) {
          try {
            const dismissed = await AsyncStorage.getItem('@nutrition_app:adherence_dismissed_date');
            if (dismissed !== todayStr) {
              setModalVisible(true);
            }
          } catch {
            setModalVisible(true);
          }
        }
      }
    } catch (err) {
      console.warn('Error loading goal adherence data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rangeDays, todayStr]);

  useFocusEffect(
    useCallback(() => {
      loadAdherenceData();
    }, [loadAdherenceData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdherenceData();
  };

  const handleAcceptSuggestion = async () => {
    if (!data?.suggestedPlan) return;
    setAdjusting(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await goalService.confirmAdherenceAdjustment(token, {
        action: 'accept_suggestion',
        new_target_calories: data.suggestedPlan.suggestedTargetCalories,
        template_id: data.suggestedPlan.templates[0]?._id,
      });

      if (res.success) {
        await dismissModal();
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }
        Alert.alert(
          'Đã cập nhật kế hoạch! 🎉',
          `Mục tiêu mới ${data.suggestedPlan.suggestedTargetCalories} kcal đã được áp dụng. Chúc bạn duy trì thật tốt!`,
          [
            {
              text: 'Xem kế hoạch',
              onPress: () => router.replace('/plan' as any),
            },
          ]
        );
        loadAdherenceData();
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật kế hoạch lúc này.');
    } finally {
      setAdjusting(false);
    }
  };

  const handleKeepCurrent = async () => {
    setAdjusting(true);
    try {
      const token = await getAuthToken();
      if (token) {
        await goalService.confirmAdherenceAdjustment(token, {
          action: 'keep_current',
        });
      }
      await dismissModal();
      Alert.alert('Ghi nhận', 'Hệ thống sẽ tiếp tục theo dõi theo kế hoạch hiện tại.');
    } catch (e) {
      await dismissModal();
    } finally {
      setAdjusting(false);
    }
  };

  const handleViewPlanDetails = (templateId?: string) => {
    dismissModal();
    const id = templateId || data?.suggestedPlan?.templates?.[0]?._id;
    if (id) {
      router.push({ pathname: '/sample-plan-detail', params: { id } } as any);
    } else {
      router.push('/sample-plans' as any);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Đang tải tiến độ duy trì mục tiêu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const streak = data?.currentOnTrackStreak || 0;
  const adherenceRate = data?.adherenceRate || 0;
  const deviatedDays = data?.consecutiveDeviatedDays || 0;
  const suggestedPlan = data?.suggestedPlan;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#10294B" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Tiến độ Duy trì Mục tiêu</Text>
          <Text style={styles.headerSubtitle}>Theo dõi tuân thủ kế hoạch dinh dưỡng</Text>
        </View>
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => router.push('/goal-setting' as any)}
          activeOpacity={0.8}>
          <Ionicons name="options-outline" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}>
        {/* Section 1: Hero Adherence Metrics Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="trophy" size={16} color="#F59E0B" />
              <Text style={styles.heroBadgeText}>
                {adherenceRate >= 80 ? 'Duy trì xuất sắc' : adherenceRate >= 50 ? 'Khá ổn định' : 'Cần cải thiện'}
              </Text>
            </View>

            {/* Range Toggle Pill */}
            <View style={styles.rangeToggle}>
              <TouchableOpacity
                style={[styles.rangePill, rangeDays === 7 && styles.rangePillActive]}
                onPress={() => setRangeDays(7)}>
                <Text style={[styles.rangePillText, rangeDays === 7 && styles.rangePillTextActive]}>
                  7 ngày
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rangePill, rangeDays === 14 && styles.rangePillActive]}
                onPress={() => setRangeDays(14)}>
                <Text style={[styles.rangePillText, rangeDays === 14 && styles.rangePillTextActive]}>
                  14 ngày
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Ngày đạt liên tiếp</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: adherenceRate >= 70 ? '#10B981' : '#F59E0B' }]}>
                {adherenceRate}%
              </Text>
              <Text style={styles.statLabel}>Tỷ lệ tuân thủ</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: deviatedDays >= 3 ? '#EF4444' : '#64748B' }]}>
                {deviatedDays}
              </Text>
              <Text style={styles.statLabel}>Ngày lệch gần nhất</Text>
            </View>
          </View>

          {deviatedDays >= 3 && (
            <View style={styles.warningBanner}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.warningBannerText}>
                Bạn đã không theo kế hoạch {deviatedDays} ngày liên tiếp. Hãy xem gợi ý điều chỉnh bên dưới!
              </Text>
            </View>
          )}
        </View>

        {/* Section 2: Day-by-day Tracker Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhật ký tuân thủ theo ngày</Text>
          <Text style={styles.sectionSub}>Chọn một ngày để xem chi tiết dinh dưỡng và kế hoạch</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysStrip}>
            {data?.days.map((day) => {
              const isSelected = selectedDay?.date === day.date;
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}>
                  <Text style={styles.dayOfWeekText}>{day.dayOfWeek}</Text>
                  <Text style={styles.dayDateText}>{day.date.split('-')[2]}</Text>

                  {/* Status Indicator Dot */}
                  <View style={[styles.statusDot, { backgroundColor: day.statusColor }]} />
                  <Text style={[styles.dayStatusText, { color: day.statusColor }]} numberOfLines={1}>
                    {day.status === 'on_track' ? 'Đạt' : day.status === 'over_target' ? 'Vượt' : day.status === 'under_target' ? 'Hụt' : 'Lỡ'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section 3: Selected Day Details Card */}
        {selectedDay && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailHeaderLeft}>
                <Text style={styles.detailDateTitle}>
                  {selectedDay.dayOfWeek}, {selectedDay.date}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${selectedDay.statusColor}15` }]}>
                  <Text style={[styles.statusBadgeText, { color: selectedDay.statusColor }]}>
                    {selectedDay.statusLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.calorieBox}>
                <Text style={styles.calNumber}>{selectedDay.caloriesConsumed}</Text>
                <Text style={styles.calTarget}>/ {selectedDay.targetCalories} kcal</Text>
              </View>
            </View>

            <Text style={styles.detailMessage}>{selectedDay.statusMessage}</Text>

            {/* Diet Quality Score Banner */}
            {selectedDay.dietQualityScore && selectedDay.dietQualityScore.score > 0 && (
              <View style={styles.dietScoreBanner}>
                <View
                  style={[
                    styles.dietScoreCircle,
                    { borderColor: selectedDay.dietQualityScore.gradeColor },
                  ]}>
                  <Text
                    style={[
                      styles.dietScoreNumber,
                      { color: selectedDay.dietQualityScore.gradeColor },
                    ]}>
                    {selectedDay.dietQualityScore.score}
                  </Text>
                  <Text style={styles.dietScoreMax}>/100</Text>
                </View>
                <View style={styles.dietScoreInfo}>
                  <View style={styles.dietScoreTitleRow}>
                    <Text style={styles.dietScoreLabel}>Điểm chất lượng bữa ăn</Text>
                    <View
                      style={[
                        styles.dietGradeBadge,
                        { backgroundColor: `${selectedDay.dietQualityScore.gradeColor}18` },
                      ]}>
                      <Text
                        style={[
                          styles.dietGradeText,
                          { color: selectedDay.dietQualityScore.gradeColor },
                        ]}>
                        Hạng {selectedDay.dietQualityScore.grade} • {selectedDay.dietQualityScore.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dietScoreSummary} numberOfLines={2}>
                    {selectedDay.dietQualityScore.summary}
                  </Text>
                </View>
              </View>
            )}

            {/* Macro details */}
            <View style={styles.macrosRow}>
              <View style={styles.macroChip}>
                <Text style={styles.macroChipLabel}>Đạm</Text>
                <Text style={styles.macroChipVal}>{selectedDay.proteinConsumed}g</Text>
              </View>
              <View style={styles.macroChip}>
                <Text style={styles.macroChipLabel}>Đường bột</Text>
                <Text style={styles.macroChipVal}>{selectedDay.carbConsumed}g</Text>
              </View>
              <View style={styles.macroChip}>
                <Text style={styles.macroChipLabel}>Chất béo</Text>
                <Text style={styles.macroChipVal}>{selectedDay.fatConsumed}g</Text>
              </View>
              {selectedDay.caloriesBurned > 0 && (
                <View style={[styles.macroChip, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.macroChipLabel, { color: '#B45309' }]}>Vận động</Text>
                  <Text style={[styles.macroChipVal, { color: '#B45309' }]}>-{selectedDay.caloriesBurned} kcal</Text>
                </View>
              )}
            </View>

            {/* Planned Meals Completion */}
            {selectedDay.plannedCount > 0 && (
              <View style={styles.planProgressRow}>
                <Ionicons name="restaurant" size={16} color="#64748B" />
                <Text style={styles.planProgressText}>
                  Đã ăn theo kế hoạch: {selectedDay.completedPlannedCount}/{selectedDay.plannedCount} món ({selectedDay.planCompletionPercent}%)
                </Text>
              </View>
            )}

            {/* Micronutrients Progress Section */}
            {selectedDay.micronutrients && selectedDay.micronutrients.length > 0 && (
              <View style={styles.microSection}>
                <View style={styles.microSectionHeader}>
                  <View style={styles.microHeaderLeft}>
                    <Ionicons name="leaf-outline" size={15} color="#059669" />
                    <Text style={styles.microSectionTitle}>Tiến độ vi chất dinh dưỡng</Text>
                  </View>
                  <Text style={styles.microSectionHint}>
                    {selectedDay.micronutrients.filter((m) => m.status === 'optimal').length}/{selectedDay.micronutrients.length} đạt chuẩn
                  </Text>
                </View>

                <View style={styles.microGrid}>
                  {selectedDay.micronutrients.map((m) => {
                    const isOptimal = m.status === 'optimal';
                    const isExcess = m.status === 'excessive';
                    const statusBg = isOptimal ? '#DCFCE7' : isExcess ? '#FEE2E2' : '#FEF3C7';
                    const statusColor = isOptimal ? '#166534' : isExcess ? '#991B1B' : '#92400E';
                    const barColor = isOptimal ? '#10B981' : isExcess ? '#EF4444' : '#F59E0B';
                    const statusLabel = isOptimal ? 'Đầy đủ' : isExcess ? 'Thừa' : 'Thiếu';

                    return (
                      <View key={m.id || m.name} style={styles.microCard}>
                        <View style={styles.microCardTop}>
                          <Text style={styles.microCardName} numberOfLines={1}>{m.name}</Text>
                          <View style={[styles.microBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.microBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                          </View>
                        </View>
                        <Text style={styles.microCardVal}>
                          {m.amount} <Text style={styles.microCardTarget}>/ {m.target} {m.unit}</Text>
                        </Text>
                        <View style={styles.microBarTrack}>
                          <View
                            style={[
                              styles.microBarFill,
                              {
                                width: `${Math.min(m.percent, 100)}%`,
                                backgroundColor: barColor,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Meal Analysis CTA Button */}
            <TouchableOpacity
              style={styles.analysisCtaBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAnalysisModalVisible(true);
              }}
              activeOpacity={0.88}>
              <View style={styles.analysisCtaLeft}>
                <View style={styles.analysisCtaIconWrap}>
                  <Ionicons name="sparkles" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.analysisCtaTitle}>Phân tích Món ăn & Hướng Dinh dưỡng</Text>
                  <Text style={styles.analysisCtaSub}>
                    Bấm để kiểm tra độ chuẩn hướng, cân bằng chất & giải pháp
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0284C7" />
            </TouchableOpacity>
          </View>
        )}

        {/* Section 4: Suggested Plan & Adaptation Section */}
        {suggestedPlan && (
          <View style={styles.suggestedCard}>
            <View style={styles.suggestedHeader}>
              <View style={styles.suggestedIconWrap}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestedCardTitle}>Gợi ý Kế hoạch mới tối ưu</Text>
                <Text style={styles.suggestedCardSub}>Điều chỉnh để phù hợp với nhịp sinh học thực tế</Text>
              </View>
            </View>

            <Text style={styles.suggestedReason}>{suggestedPlan.reason}</Text>

            <View style={styles.suggestedCalorieBox}>
              <View style={styles.suggestedCalItem}>
                <Text style={styles.suggestedCalLabel}>Mục tiêu hiện tại</Text>
                <Text style={styles.suggestedCalOld}>{suggestedPlan.currentCalories} kcal</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#10B981" />
              <View style={styles.suggestedCalItem}>
                <Text style={[styles.suggestedCalLabel, { color: '#059669' }]}>Mục tiêu đề xuất</Text>
                <Text style={styles.suggestedCalNew}>{suggestedPlan.suggestedTargetCalories} kcal</Text>
              </View>
            </View>

            {/* Suggested Sample Templates */}
            {suggestedPlan.templates && suggestedPlan.templates.length > 0 && (
              <View style={styles.suggestedTemplatesSection}>
                <Text style={styles.suggestedTemplatesTitle}>Thực đơn mẫu phù hợp gợi ý:</Text>
                {suggestedPlan.templates.slice(0, 2).map((t) => (
                  <TouchableOpacity
                    key={t._id}
                    style={styles.templateRow}
                    onPress={() => handleViewPlanDetails(t._id)}
                    activeOpacity={0.75}>
                    <Image
                      source={{
                        uri:
                          t.image_url ||
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80',
                      }}
                      style={styles.templateThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateTitle} numberOfLines={1}>{t.name}</Text>
                      <Text style={styles.templateDesc} numberOfLines={1}>
                        {t.description || 'Thực đơn cân bằng năng lượng'}
                      </Text>
                    </View>
                    <View style={styles.templateDetailBadge}>
                      <Text style={styles.templateDetailBadgeText}>Xem ›</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.viewPlanPrimaryBtn}
              onPress={() => handleViewPlanDetails()}
              activeOpacity={0.88}>
              <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
              <Text style={styles.viewPlanPrimaryBtnText}>Xem chi tiết kế hoạch gợi ý</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyDirectBtn}
              onPress={handleAcceptSuggestion}
              disabled={adjusting}
              activeOpacity={0.75}>
              {adjusting ? (
                <ActivityIndicator color="#10B981" size="small" />
              ) : (
                <Text style={styles.applyDirectBtnText}>Áp dụng ngay không cần xem</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Over-3-Days Deviation Modal */}
      <GoalAdherenceModal
        visible={modalVisible}
        onClose={dismissModal}
        consecutiveDays={deviatedDays || 3}
        suggestedPlan={suggestedPlan}
        onAcceptSuggestion={handleAcceptSuggestion}
        onKeepCurrent={handleKeepCurrent}
        onViewPlanDetails={handleViewPlanDetails}
        loading={adjusting}
      />

      {/* Meal & Micronutrient In-depth Analysis Modal */}
      <MealAnalysisModal
        visible={analysisModalVisible}
        onClose={() => setAnalysisModalVisible(false)}
        day={selectedDay}
        insets={insets}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FAFAFB' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#10294B' },
  headerSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 2 },
  settingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  heroBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B45309',
  },
  rangeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  rangePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9,
  },
  rangePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  rangePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rangePillTextActive: {
    color: '#10294B',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#10294B',
  },
  statLabel: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F1F5F9',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#B91C1C',
    fontWeight: '600',
    lineHeight: 18,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  daysStrip: {
    marginTop: 4,
  },
  dayCard: {
    width: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  dayCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dayDateText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10294B',
    marginVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  dayStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailHeaderLeft: {
    flex: 1,
  },
  detailDateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  calorieBox: {
    alignItems: 'flex-end',
  },
  calNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10294B',
  },
  calTarget: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginVertical: 10,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  macroChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  macroChipLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  macroChipVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10294B',
    marginTop: 2,
  },
  planProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  planProgressText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  microSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  microSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  microHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  microSectionHint: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#059669',
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  microCard: {
    width: (width - 40 - 28 - 8) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  microCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  microCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    marginRight: 4,
  },
  microBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  microBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  microCardVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  microCardTarget: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  microBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  microBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  analysisCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  analysisCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  analysisCtaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisCtaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  analysisCtaSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  suggestedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  suggestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  suggestedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10294B',
  },
  suggestedCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  suggestedReason: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  suggestedCalorieBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  suggestedCalItem: {
    alignItems: 'center',
  },
  suggestedCalLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestedCalOld: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  suggestedCalNew: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },
  suggestedTemplatesSection: {
    marginBottom: 16,
  },
  suggestedTemplatesTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  templateThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10294B',
  },
  templateDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  applySuggestedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  applySuggestedBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dietScoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dietScoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dietScoreNumber: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },
  dietScoreMax: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: -2,
  },
  dietScoreInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dietScoreTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
    flexWrap: 'wrap',
    gap: 4,
  },
  dietScoreLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  dietGradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dietGradeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dietScoreSummary: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  templateDetailBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  templateDetailBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  viewPlanPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  viewPlanPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  applyDirectBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    marginTop: 6,
  },
  applyDirectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
});
