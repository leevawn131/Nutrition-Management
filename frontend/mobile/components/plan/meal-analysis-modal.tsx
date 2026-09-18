import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AIMealAnalysisResult,
  DayMealAnalysis,
  GoalAdherenceDay,
  MicronutrientItem,
  goalService,
} from '@/services/goal.service';
import { getAuthToken } from '@/services/storage.service';

const { width } = Dimensions.get('window');

interface MealAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  day: GoalAdherenceDay | null;
  insets?: EdgeInsets;
}

export function MealAnalysisModal({ visible, onClose, day, insets }: MealAnalysisModalProps) {
  const hookInsets = useSafeAreaInsets();
  const currentInsets = insets || hookInsets;

  // Optimized insets for modern iPhone (Dynamic Island / Notch) & Android (Punch-hole / Notch):
  // - iPhone 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16, 16 Pro (Dynamic Island): top is 54-59pt.
  // - iPhone X, XS, 11, 12, 13, 14 (Notch): top is 44-47pt.
  // - Android with Punch Hole: StatusBar.currentHeight (24-40dp) + extra padding.
  const safeTop = Math.max(
    currentInsets?.top || 0,
    Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 28)
  );

  const safeBottom = Math.max(
    currentInsets?.bottom || 0,
    Platform.OS === 'ios' ? 34 : 16
  );

  const [activeTab, setActiveTab] = useState<'adherence' | 'nutrients' | 'guidance'>('adherence');
  const [aiAdvice, setAiAdvice] = useState<AIMealAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAIAdvice = useCallback(async () => {
    if (!day) return;
    setAiLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const res = await goalService.getAIMealAnalysis(token, day.date);
      if (res && res.success && res.data) {
        setAiAdvice(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch AI advice:', e);
    } finally {
      setAiLoading(false);
    }
  }, [day]);

  // Auto-fetch Gemini 3.5 Flash advice when switching to guidance tab
  useEffect(() => {
    if (visible && day && activeTab === 'guidance' && !aiAdvice && !aiLoading) {
      fetchAIAdvice();
    }
  }, [visible, day, activeTab, aiAdvice, aiLoading, fetchAIAdvice]);

  if (!day) return null;

  const analysis: DayMealAnalysis | undefined = day.mealAnalysis;
  const micronutrients: MicronutrientItem[] = day.micronutrients || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={[styles.safeArea, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={Platform.OS === 'android'}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Phân tích Bữa ăn & Dinh dưỡng
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {day.dayOfWeek}, {day.date} • {day.caloriesConsumed} / {day.targetCalories} kcal
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* 3 Nav Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'adherence' && styles.tabBtnActive]}
            onPress={() => setActiveTab('adherence')}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={activeTab === 'adherence' ? '#10B981' : '#6B7280'}
            />
            <Text
              style={[styles.tabBtnText, activeTab === 'adherence' && styles.tabBtnTextActive]}
              numberOfLines={1}>
              1. Chuẩn hướng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'nutrients' && styles.tabBtnActive]}
            onPress={() => setActiveTab('nutrients')}>
            <Ionicons
              name="pie-chart-outline"
              size={15}
              color={activeTab === 'nutrients' ? '#10B981' : '#6B7280'}
            />
            <Text
              style={[styles.tabBtnText, activeTab === 'nutrients' && styles.tabBtnTextActive]}
              numberOfLines={1}>
              2. Các chất
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'guidance' && styles.tabBtnActive]}
            onPress={() => setActiveTab('guidance')}>
            <Ionicons
              name="sparkles-outline"
              size={15}
              color={activeTab === 'guidance' ? '#10B981' : '#6B7280'}
            />
            <Text
              style={[styles.tabBtnText, activeTab === 'guidance' && styles.tabBtnTextActive]}
              numberOfLines={1}>
              3. Cần làm gì
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}>

          {/* ============================================================== */}
          {/* TAB 1: ĐÃ ĂN CHUẨN HƯỚNG CHƯA (SO VỚI KẾ HOẠCH BỮA ĂN)         */}
          {/* ============================================================== */}
          {activeTab === 'adherence' && (
            <View>
              {/* Diet Quality Score Card (0 - 100) */}
              {day.dietQualityScore && day.dietQualityScore.score > 0 && (
                <View style={styles.dietScoreCard}>
                  <View style={styles.dietScoreTop}>
                    <View
                      style={[
                        styles.dietScoreCircle,
                        { borderColor: day.dietQualityScore.gradeColor },
                      ]}>
                      <Text
                        style={[
                          styles.dietScoreNum,
                          { color: day.dietQualityScore.gradeColor },
                        ]}>
                        {day.dietQualityScore.score}
                      </Text>
                      <Text style={styles.dietScoreMax}>/100</Text>
                    </View>
                    <View style={styles.dietScoreInfo}>
                      <View style={styles.dietScoreGradeRow}>
                        <Text style={styles.dietScoreHeader}>Chất lượng Dinh dưỡng</Text>
                        <View
                          style={[
                            styles.gradePill,
                            { backgroundColor: `${day.dietQualityScore.gradeColor}18` },
                          ]}>
                          <Text
                            style={[
                              styles.gradePillText,
                              { color: day.dietQualityScore.gradeColor },
                            ]}>
                            Hạng {day.dietQualityScore.grade} • {day.dietQualityScore.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.dietScoreSummary}>
                        {day.dietQualityScore.summary}
                      </Text>
                    </View>
                  </View>

                  {/* 4 Pillars Breakdown */}
                  <View style={styles.dietScoreBreakdown}>
                    <View style={styles.pillarItem}>
                      <Text style={styles.pillarLabel}>Calo</Text>
                      <Text style={styles.pillarVal}>
                        {day.dietQualityScore.breakdown.calorieScore}/30
                      </Text>
                      <View style={styles.pillarBarTrack}>
                        <View
                          style={[
                            styles.pillarBarFill,
                            {
                              width: `${(day.dietQualityScore.breakdown.calorieScore / 30) * 100}%`,
                              backgroundColor: '#10B981',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.pillarItem}>
                      <Text style={styles.pillarLabel}>Đa lượng</Text>
                      <Text style={styles.pillarVal}>
                        {day.dietQualityScore.breakdown.macroScore}/30
                      </Text>
                      <View style={styles.pillarBarTrack}>
                        <View
                          style={[
                            styles.pillarBarFill,
                            {
                              width: `${(day.dietQualityScore.breakdown.macroScore / 30) * 100}%`,
                              backgroundColor: '#6366F1',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.pillarItem}>
                      <Text style={styles.pillarLabel}>Vi chất</Text>
                      <Text style={styles.pillarVal}>
                        {day.dietQualityScore.breakdown.microScore}/30
                      </Text>
                      <View style={styles.pillarBarTrack}>
                        <View
                          style={[
                            styles.pillarBarFill,
                            {
                              width: `${(day.dietQualityScore.breakdown.microScore / 30) * 100}%`,
                              backgroundColor: '#F59E0B',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.pillarItem}>
                      <Text style={styles.pillarLabel}>Kế hoạch</Text>
                      <Text style={styles.pillarVal}>
                        {day.dietQualityScore.breakdown.adherenceScore}/10
                      </Text>
                      <View style={styles.pillarBarTrack}>
                        <View
                          style={[
                            styles.pillarBarFill,
                            {
                              width: `${(day.dietQualityScore.breakdown.adherenceScore / 10) * 100}%`,
                              backgroundColor: '#0284C7',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Verdict Card */}
              <View
                style={[
                  styles.verdictCard,
                  { borderColor: analysis?.planAdherence.color || '#10B981' },
                ]}>
                <View style={styles.verdictHeader}>
                  <View
                    style={[
                      styles.verdictBadge,
                      { backgroundColor: `${analysis?.planAdherence.color || '#10B981'}15` },
                    ]}>
                    <Ionicons
                      name="compass-outline"
                      size={16}
                      color={analysis?.planAdherence.color || '#10B981'}
                    />
                    <Text
                      style={[
                        styles.verdictBadgeText,
                        { color: analysis?.planAdherence.color || '#10B981' },
                      ]}>
                      {analysis?.planAdherence.title || 'Đánh giá kế hoạch'}
                    </Text>
                  </View>
                  <Text style={styles.adherenceRateBadge}>
                    Khớp: {analysis?.planAdherence.planAdherencePercent || 0}%
                  </Text>
                </View>

                <Text style={styles.verdictDesc}>
                  {analysis?.planAdherence.verdict ||
                    'Đối chiếu giữa các món bạn đã lên lịch và các món thực tế bạn đã ghi nhận trong ngày.'}
                </Text>
              </View>

              <Text style={styles.sectionHeaderTitle}>Đối chiếu chi tiết 4 bữa ăn:</Text>

              {/* Meals comparison list */}
              {analysis?.planAdherence.mealsComparison.map((meal) => (
                <View key={meal.mealType} style={styles.mealCompareCard}>
                  <View style={styles.mealCompareTop}>
                    <View style={styles.mealTypeBadge}>
                      <Ionicons
                        name={
                          meal.mealType === 'breakfast'
                            ? 'sunny-outline'
                            : meal.mealType === 'lunch'
                            ? 'restaurant-outline'
                            : meal.mealType === 'dinner'
                            ? 'moon-outline'
                            : 'cafe-outline'
                        }
                        size={15}
                        color="#4B5563"
                      />
                      <Text style={styles.mealTypeTitle}>{meal.mealLabel}</Text>
                    </View>
                    <View
                      style={[
                        styles.mealStatusBadge,
                        { backgroundColor: `${meal.statusColor}15` },
                      ]}>
                      <Text style={[styles.mealStatusText, { color: meal.statusColor }]}>
                        {meal.statusLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mealCompareBody}>
                    <View style={styles.mealCompareRow}>
                      <Text style={styles.compareLabel}>• Kế hoạch ({meal.targetCalories} kcal):</Text>
                      <Text style={styles.compareValuePlanned} numberOfLines={2}>
                        {meal.plannedDish}
                      </Text>
                    </View>

                    <View style={styles.mealCompareRow}>
                      <Text style={styles.compareLabel}>• Đã ăn ({meal.actualCalories} kcal):</Text>
                      <Text style={styles.compareValueActual} numberOfLines={2}>
                        {meal.actualLoggedDish}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CÁC CHẤT ĐÃ PHÙ HỢP CHƯA (ĐA LƯỢNG & VI CHẤT)           */}
          {/* ============================================================== */}
          {activeTab === 'nutrients' && (
            <View>
              <Text style={styles.sectionHeaderTitle}>Chất dinh dưỡng đa lượng (Macros):</Text>

              {/* Macro Cards */}
              {analysis?.nutrientsAssessment.map((n) => (
                <View key={n.name} style={styles.nutrientCard}>
                  <View style={styles.nutrientCardTop}>
                    <Text style={styles.nutrientName}>{n.name}</Text>
                    <View
                      style={[
                        styles.nutrientStatusBadge,
                        { backgroundColor: `${n.statusColor}15` },
                      ]}>
                      <Text style={[styles.nutrientStatusText, { color: n.statusColor }]}>
                        {n.statusLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.nutrientNumbersRow}>
                    <Text style={styles.nutrientActual}>
                      {n.actual} <Text style={styles.nutrientUnit}>{n.unit}</Text>
                    </Text>
                    <Text style={styles.nutrientTarget}>/ Mục tiêu: {n.target} {n.unit}</Text>
                  </View>

                  <Text style={styles.nutrientEvaluation}>{n.evaluation}</Text>
                </View>
              ))}

              <Text style={[styles.sectionHeaderTitle, { marginTop: 20 }]}>
                Tiến độ vi chất & Cảnh báo thừa/thiếu:
              </Text>

              {/* Micronutrient grid */}
              <View style={styles.microGrid}>
                {micronutrients.map((micro) => (
                  <View key={micro.id} style={styles.microCard}>
                    <View style={styles.microHeader}>
                      <Text style={styles.microName}>{micro.name}</Text>
                      <View
                        style={[
                          styles.microStatusBadge,
                          { backgroundColor: `${micro.statusColor}15` },
                        ]}>
                        <Text style={[styles.microStatusText, { color: micro.statusColor }]}>
                          {micro.statusLabel}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.microNumbers}>
                      {micro.amount} <Text style={styles.microUnit}>{micro.unit}</Text>{' '}
                      <Text style={styles.microTarget}>/ {micro.target} {micro.unit}</Text>
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.microBarBg}>
                      <View
                        style={[
                          styles.microBarFill,
                          {
                            width: `${Math.min(100, micro.percent)}%`,
                            backgroundColor: micro.statusColor,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.microComment}>{micro.comment}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* TAB 3: CẦN LÀM GÌ ĐỂ PHÙ HỢP VỚI MỤC TIÊU HƠN?                 */}
          {/* ============================================================== */}
          {activeTab === 'guidance' && (
            <View>
              {/* Gemini 3.5 Flash AI Advisor Section */}
              <View style={styles.aiCardContainer}>
                <View style={styles.aiAdvisorHeader}>
                  <View style={styles.aiAdvisorBadge}>
                    <Ionicons name="sparkles" size={14} color="#6366F1" />
                    <Text style={styles.aiAdvisorBadgeText}>Bác sĩ Dinh dưỡng AI</Text>
                  </View>
                  <View style={styles.aiModelBadge}>
                    <Text style={styles.aiModelBadgeText}>Trợ lý AI</Text>
                  </View>
                </View>

                {aiLoading ? (
                  <View style={styles.aiLoadingWrap}>
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text style={styles.aiLoadingText}>
                      Trợ lý AI đang phân tích sâu dữ liệu ăn uống của bạn...
                    </Text>
                  </View>
                ) : aiAdvice ? (
                  <View>
                    <Text style={styles.aiVerdictText}>{aiAdvice.aiDoctorVerdict}</Text>

                    {aiAdvice.nutritionCritique ? (
                      <View style={styles.aiCritiqueBox}>
                        <Ionicons name="medical" size={15} color="#4F46E5" />
                        <Text style={styles.aiCritiqueText}>{aiAdvice.nutritionCritique}</Text>
                      </View>
                    ) : null}

                    <Text style={styles.aiSectionTitle}>Chỉ dẫn hành động từ AI:</Text>
                    {aiAdvice.actionableSteps.map((step, idx) => (
                      <View key={idx} style={styles.aiStepRow}>
                        <View style={styles.aiStepBadge}>
                          <Text style={styles.aiStepBadgeText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.aiStepText}>{step}</Text>
                      </View>
                    ))}

                    {aiAdvice.proTip ? (
                      <View style={styles.aiProTipBox}>
                        <Ionicons name="bulb" size={15} color="#D97706" />
                        <Text style={styles.aiProTipText}>{aiAdvice.proTip}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={styles.refreshAiBtn}
                      onPress={fetchAIAdvice}
                      disabled={aiLoading}
                      activeOpacity={0.75}>
                      <Ionicons name="refresh" size={13} color="#6366F1" />
                      <Text style={styles.refreshAiBtnText}>Phân tích lại với Trợ lý AI</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.aiPromptWrap}>
                    <Text style={styles.aiPromptDesc}>
                      Nhận lời khuyên y khoa cá nhân hóa may đo riêng cho ngày hôm nay từ Trợ lý AI.
                    </Text>
                    <TouchableOpacity
                      style={styles.triggerAiBtn}
                      onPress={fetchAIAdvice}
                      activeOpacity={0.88}>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                      <Text style={styles.triggerAiBtnText}>Kích hoạt Bác sĩ AI phân tích</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Algorithmic Baseline Advice */}
              <View style={styles.guidanceHeroCard}>
                <View style={styles.guidanceHeroHeader}>
                  <Ionicons name="clipboard-outline" size={20} color="#10B981" />
                  <Text style={styles.guidanceHeroTitle}>
                    Kế hoạch đối chiếu chuẩn y khoa
                  </Text>
                </View>
                <Text style={styles.guidanceHeroSubtitle}>
                  Dựa trên lượng calo và vi chất đã nạp hôm nay:
                </Text>
              </View>

              <Text style={styles.sectionHeaderTitle}>Các việc cần làm theo định lượng:</Text>

              {analysis?.actionableAdvice.map((advice, index) => (
                <View key={index} style={styles.adviceItem}>
                  <View style={styles.adviceNumberBadge}>
                    <Text style={styles.adviceNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.adviceText}>{advice}</Text>
                </View>
              ))}

              {/* Goal-Specific Long Term Tip */}
              <View style={styles.proTipCard}>
                <View style={styles.proTipHeader}>
                  <Ionicons name="star" size={18} color="#10B981" />
                  <Text style={styles.proTipTitle}>Bí quyết duy trì bền vững</Text>
                </View>
                <Text style={styles.proTipBody}>
                  Một ngày ăn thừa hoặc thiếu không làm hỏng cả quá trình. Quan trọng nhất là bám sát mục tiêu trung bình cả tuần. Đừng tự phạt bản thân bằng cách nhịn đói, hãy tiếp tục ăn đủ bữa và uống đủ nước nhé!
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Complete Button */}
          <TouchableOpacity style={styles.footerBtn} activeOpacity={0.88} onPress={onClose}>
            <Text style={styles.footerBtnText}>Đã hiểu & Tiếp tục cố gắng</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabBtnTextActive: {
    fontWeight: '700',
    color: '#10B981',
  },

  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  // Verdict Card
  verdictCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  verdictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verdictBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  adherenceRateBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  verdictDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },

  // Meal compare card
  mealCompareCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  mealCompareTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealTypeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  mealStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mealStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mealCompareBody: {
    gap: 6,
  },
  mealCompareRow: {
    flexDirection: 'column',
  },
  compareLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  compareValuePlanned: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
    marginTop: 2,
  },
  compareValueActual: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    marginTop: 2,
  },

  // Nutrient Card
  nutrientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  nutrientCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutrientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  nutrientStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nutrientStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nutrientNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  nutrientActual: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  nutrientUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  nutrientTarget: {
    fontSize: 13,
    color: '#6B7280',
  },
  nutrientEvaluation: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
  },

  // Micronutrient grid
  microGrid: {
    gap: 10,
    marginBottom: 16,
  },
  microCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  microHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  microName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  microStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  microStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  microNumbers: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  microUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  microTarget: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  microBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  microBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  microComment: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },

  // Guidance Hero
  guidanceHeroCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  guidanceHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  guidanceHeroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  guidanceHeroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#78350F',
  },

  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  adviceNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },

  proTipCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  proTipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  proTipBody: {
    fontSize: 13,
    lineHeight: 18,
    color: '#047857',
  },

  // Gemini 3.5 Flash AI Styles
  aiCardContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    padding: 16,
    marginBottom: 16,
  },
  aiAdvisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiAdvisorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiAdvisorBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#6366F1',
  },
  aiModelBadge: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiModelBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  aiLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  aiLoadingText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
    flex: 1,
  },
  aiVerdictText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1E1B4B',
    fontWeight: '600',
    marginBottom: 10,
  },
  aiCritiqueBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginBottom: 12,
  },
  aiCritiqueText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3730A3',
    flex: 1,
  },
  aiSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312E81',
    marginBottom: 8,
  },
  aiStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  aiStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiStepBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  aiStepText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#1F2937',
  },
  aiProTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  aiProTipText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#92400E',
    flex: 1,
    fontWeight: '500',
  },
  refreshAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
  },
  refreshAiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  aiPromptWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  aiPromptDesc: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 12,
  },
  triggerAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  triggerAiBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Footer Button
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  footerBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Diet Quality Score Card styles
  dietScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dietScoreTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dietScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  dietScoreNum: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  dietScoreMax: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: -2,
  },
  dietScoreInfo: {
    flex: 1,
    marginLeft: 14,
  },
  dietScoreGradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  dietScoreHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  gradePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gradePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dietScoreSummary: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  dietScoreBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pillarItem: {
    flex: 1,
    alignItems: 'center',
  },
  pillarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  pillarVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pillarBarTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pillarBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
