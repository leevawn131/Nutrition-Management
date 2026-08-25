import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { useSetup } from '@/context/setup-context';

type ActivityLevel = 'light' | 'moderate' | 'active';

const ACTIVITY_OPTIONS: { id: ActivityLevel; title: string; desc: string }[] = [
  {
    id: 'light',
    title: 'Chủ yếu ít vận động',
    desc: 'Ngồi nhiều, ít đi lại, vận động nhẹ dưới 30 phút mỗi ngày.',
  },
  {
    id: 'moderate',
    title: 'Vận động vừa phải',
    desc: 'Đi lại thường xuyên, làm việc đứng nhiều hoặc tập thể dục 30-60 phút mỗi ngày',
  },
  {
    id: 'active',
    title: 'Vận động nhiều',
    desc: 'Làm việc tay chân nặng, hoặc tập thể dục trên 60 phút mỗi ngày',
  },
];

export default function SetupStep4Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel>(
    (wizardData.activity_level as ActivityLevel) || 'light'
  );

  const handleSelect = (level: ActivityLevel) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSelectedActivity(level);
    updateWizardData({ activity_level: level });
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    updateWizardData({ activity_level: selectedActivity });
    router.push('/(setup)/step-5');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={4} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Hãy để chúng tôi hiểu thêm về mức độ vận động của bạn</Text>
          <Text style={styles.title}>Bạn có thường xuyên vận động không?</Text>
          <Text style={styles.description}>
            Hãy chọn mức độ vận động hàng ngày của bạn, bao gồm công việc, sinh hoạt giải trí, hoạt động thể thao
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsList}>
          {ACTIVITY_OPTIONS.map((opt) => {
            const isSelected = selectedActivity === opt.id;
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
                    <Text style={styles.optionTitle}>{opt.title}</Text>
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
    fontSize: 14,
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
