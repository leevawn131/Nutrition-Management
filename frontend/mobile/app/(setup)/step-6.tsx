import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { useSetup } from '@/context/setup-context';
import { userService } from '@/services/user.service';
import { goalService } from '@/services/goal.service';
import { getAuthToken } from '@/services/storage.service';

export default function SetupStep6Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const currentWeight = wizardData.weight_kg || 60;
  const currentHeight = wizardData.height_cm || 165;

  // Calculate BMI
  const bmi = useMemo(() => {
    const heightM = currentHeight / 100;
    if (heightM <= 0) return 21.5;
    return parseFloat((currentWeight / (heightM * heightM)).toFixed(1));
  }, [currentWeight, currentHeight]);

  const bmiStatus = useMemo(() => {
    if (bmi < 18.5) {
      return {
        label: 'Bạn đang ở mức thiếu cân',
        desc: 'Hãy theo dõi thêm và tham khảo ý kiến chuyên gia nếu cần, đặc biệt nếu bạn đang quan tâm đến sức khỏe cơ bắp.',
        color: '#3B82F6',
        positionPct: 15,
      };
    } else if (bmi <= 22.9) {
      return {
        label: 'Bạn đang ở mức cân đối lý tưởng',
        desc: 'Chỉ số thể trạng của bạn rất tốt. Hãy duy trì thói quen ăn uống lành mạnh và tập luyện đều đặn.',
        color: '#10B981',
        positionPct: 45,
      };
    } else if (bmi <= 24.9) {
      return {
        label: 'Bạn đang ở mức thừa cân nhẹ',
        desc: 'Một kế hoạch dinh dưỡng kiểm soát calo khoa học sẽ giúp bạn lấy lại vóc dáng nhanh chóng.',
        color: '#F59E0B',
        positionPct: 70,
      };
    } else {
      return {
        label: 'Bạn đang ở mức cần giảm cân',
        desc: 'Hãy kiên trì theo đuổi chế độ thâm hụt calo an toàn kết hợp tăng cường vận động hàng ngày.',
        color: '#EF4444',
        positionPct: 90,
      };
    }
  }, [bmi]);

  const [targetWeight, setTargetWeight] = useState<string>(
    wizardData.target_weight ? String(wizardData.target_weight) : String(currentWeight)
  );
  const [durationWeeks, setDurationWeeks] = useState<string>(
    wizardData.target_duration_weeks ? String(wizardData.target_duration_weeks) : '12'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAdjustWeight = (delta: number) => {
    const current = parseFloat(targetWeight) || currentWeight;
    const next = Math.max(30, Math.min(200, current + delta));
    setTargetWeight(String(parseFloat(next.toFixed(1))));
  };

  const handleAdjustWeeks = (delta: number) => {
    const current = parseInt(durationWeeks, 10) || 12;
    const next = Math.max(1, Math.min(52, current + delta));
    setDurationWeeks(String(next));
  };

  const handleNext = async () => {
    const targetW = parseFloat(targetWeight);
    const durationW = parseInt(durationWeeks, 10);

    if (isNaN(targetW) || targetW < 30 || targetW > 200) {
      Alert.alert('Mục tiêu cân nặng không hợp lệ', 'Vui lòng nhập mục tiêu cân nặng từ 30 đến 200 kg.');
      return;
    }

    if (isNaN(durationW) || durationW < 1 || durationW > 52) {
      Alert.alert('Thời gian không hợp lệ', 'Vui lòng nhập thời gian từ 1 đến 52 tuần.');
      return;
    }

    let goalType: 'lose' | 'maintain' | 'gain' = 'maintain';
    if (targetW < currentWeight - 0.2) {
      goalType = 'lose';
    } else if (targetW > currentWeight + 0.2) {
      goalType = 'gain';
    }

    setIsLoading(true);

    try {
      const token = await getAuthToken();
      if (token) {
        // 1. Persist physical profile to backend so server can calculate TDEE & Goal
        await userService.updateProfile(token, {
          gender: wizardData.gender,
          date_of_birth: wizardData.date_of_birth,
          height_cm: wizardData.height_cm,
          weight_kg: wizardData.weight_kg,
          activity_level: wizardData.activity_level,
        });

        // 2. Fetch Goal Recommendation from backend API
        const recommendation = await goalService.recommendGoal(token, {
          goal: goalType,
          target_weight: targetW,
          target_duration_weeks: durationW,
        });

        if (recommendation) {
          updateWizardData({
            goal: goalType,
            target_weight: targetW,
            target_duration_weeks: durationW,
            recommended_calories: Math.round(recommendation.recommendedTargetCalories),
            tdee: Math.round(recommendation.tdee),
          });
        } else {
          // Fallback calculation if backend network is unreachable
          updateWizardData({
            goal: goalType,
            target_weight: targetW,
            target_duration_weeks: durationW,
            recommended_calories: 2000,
            tdee: 2200,
          });
        }
      } else {
        updateWizardData({
          goal: goalType,
          target_weight: targetW,
          target_duration_weeks: durationW,
          recommended_calories: 2000,
        });
      }

      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }

      router.push('/(setup)/step-7');
    } catch (error) {
      console.warn('Error in step 6 goal recommendation:', error);
      router.push('/(setup)/step-7');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={6} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Subtitle & BMI Header */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>
            Dựa trên chiều cao và cân nặng của bạn, chúng tôi đã tính chỉ số BMI
          </Text>
          <Text style={styles.bmiTitle}>BMI của bạn: {bmi}</Text>
        </View>

        {/* BMI Color Bar Gauge */}
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeSegment, { backgroundColor: '#3B82F6', flex: 2 }]} />
            <View style={[styles.gaugeSegment, { backgroundColor: '#10B981', flex: 3 }]} />
            <View style={[styles.gaugeSegment, { backgroundColor: '#F59E0B', flex: 2 }]} />
            <View style={[styles.gaugeSegment, { backgroundColor: '#EF4444', flex: 3 }]} />
          </View>
          <View style={[styles.gaugePointer, { left: `${bmiStatus.positionPct}%` }]}>
            <Ionicons name="caret-down" size={16} color="#0F172A" />
          </View>
        </View>

        {/* Advisory Banner Card */}
        <View style={[styles.advisoryCard, { backgroundColor: bmiStatus.color }]}>
          <Ionicons name="information-circle" size={24} color="#FFFFFF" style={styles.infoIcon} />
          <View style={styles.advisoryTextWrapper}>
            <Text style={styles.advisoryTitle}>{bmiStatus.label}</Text>
            <Text style={styles.advisoryDesc}>{bmiStatus.desc}</Text>
          </View>
        </View>

        {/* 1. TARGET WEIGHT INPUT */}
        <View style={styles.inputSection}>
          <Text style={styles.inputSectionTitle}>Mục tiêu cân nặng của bạn là bao nhiêu</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleAdjustWeight(-0.5)}
              activeOpacity={0.7}>
              <Ionicons name="remove" size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.valueDisplay}>
              <TextInput
                style={styles.valueInput}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.valueUnit}>kg</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleAdjustWeight(0.5)}
              activeOpacity={0.7}>
              <Ionicons name="add" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. TARGET DURATION INPUT */}
        <View style={styles.inputSection}>
          <Text style={styles.inputSectionTitle}>Bạn muốn đạt mục tiêu này trong bao lâu?</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleAdjustWeeks(-1)}
              activeOpacity={0.7}>
              <Ionicons name="remove" size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.valueDisplay}>
              <TextInput
                style={styles.valueInput}
                value={durationWeeks}
                onChangeText={setDurationWeeks}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.valueUnit}>tuần</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleAdjustWeeks(1)}
              activeOpacity={0.7}>
              <Ionicons name="add" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color="#475569" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.88}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Tiếp theo</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleSection: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 19,
  },
  bmiTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F2644',
  },
  gaugeContainer: {
    marginBottom: 20,
    position: 'relative',
    paddingTop: 6,
  },
  gaugeTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeSegment: {
    height: '100%',
  },
  gaugePointer: {
    position: 'absolute',
    top: -10,
    marginLeft: -8,
  },
  advisoryCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 28,
  },
  infoIcon: {
    marginTop: 2,
  },
  advisoryTextWrapper: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  advisoryDesc: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2644',
    marginBottom: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  valueInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
    textAlign: 'center',
    minWidth: 50,
  },
  valueUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    gap: 6,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34D399',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
