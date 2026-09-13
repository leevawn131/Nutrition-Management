import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { useSetup } from '@/context/setup-context';

type GoalIntent = 'weight_control' | 'medical_support' | 'healthy_lifestyle';

const GOAL_OPTIONS: { id: GoalIntent; title: string; desc: string }[] = [
  {
    id: 'weight_control',
    title: 'Kiểm soát cân nặng & Duy trì vóc dáng',
    desc: 'Giảm cân, tăng cân, duy trì cân nặng và giữ gìn sức khỏe, thể lực tốt',
  },
  {
    id: 'medical_support',
    title: 'Hỗ trợ điều trị bệnh lý',
    desc: 'Kiểm soát tiểu đường, tim mạch, huyết áp...',
  },
  {
    id: 'healthy_lifestyle',
    title: 'Sống khỏe mạnh, khoa học',
    desc: 'Xây dựng lối sống lành mạnh và bền vững',
  },
];

export default function SetupStep2Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const [selectedIntent, setSelectedIntent] = useState<GoalIntent>(
    wizardData.goalIntent || 'healthy_lifestyle'
  );

  const handleSelect = (intent: GoalIntent) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSelectedIntent(intent);
    updateWizardData({ goalIntent: intent });
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    updateWizardData({ goalIntent: selectedIntent });
    router.push('/(setup)/step-3');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={2} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Titles */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Mong muốn của bạn khi sử dụng the.Nutri là gì?</Text>
          <Text style={styles.title}>Hãy chọn mục tiêu chính mà bạn muốn đạt được</Text>
          <Text style={styles.description}>
            Thông tin này giúp chúng tôi cá nhân hóa trải nghiệm và đưa ra gợi ý phù hợp nhất cho bạn
          </Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {GOAL_OPTIONS.map((opt) => {
            const isSelected = selectedIntent === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSelect(opt.id)}
                activeOpacity={0.88}>
                <View style={styles.optionHeader}>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.optionTextWrapper}>
                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                      {opt.title}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color="#475569" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.88}>
            <Text style={styles.nextButtonText}>Tiếp theo</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#64748B',
    marginBottom: 6,
  },
  title: {
    fontSize: 20.5,
    fontWeight: '800',
    color: '#0F2644',
    lineHeight: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  optionsList: {
    gap: 14,
  },
  optionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  optionCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#34D399',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
  },
  optionTextWrapper: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#0F2644',
  },
  optionDesc: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 19,
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
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
