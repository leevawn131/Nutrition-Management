import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { useSetup } from '@/context/setup-context';

export default function SetupStep8Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const [shareConsent, setShareConsent] = useState<boolean>(
    wizardData.shareNutritionPreferences !== undefined
      ? wizardData.shareNutritionPreferences
      : true
  );

  const handleSelect = (val: boolean) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setShareConsent(val);
    updateWizardData({ shareNutritionPreferences: val });
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    updateWizardData({ shareNutritionPreferences: shareConsent });

    if (shareConsent) {
      router.push('/(setup)/step-9');
    } else {
      router.push('/(setup)/step-12');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={8} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            Để có thể giúp bạn xây dựng kế hoạch ăn uống phù hợp và khám phá các món ăn hấp dẫn tại
            the.Nutri, chúng tôi muốn hiểu hơn về sở thích ẩm thực của bạn.
          </Text>
          <Text style={styles.description}>
            Chúng tôi cam kết bảo vệ quyền riêng tư của bạn, mọi thông tin bạn cung cấp sẽ được bảo
            mật tuyệt đối. Nếu bạn chọn từ chối, bạn vẫn có thể cung cấp hoặc thay đổi thông tin này
            bất kỳ lúc nào trong ứng dụng.
          </Text>
        </View>

        {/* 2 Options */}
        <View style={styles.optionsList}>
          {/* Option 1: Agree */}
          <TouchableOpacity
            style={[styles.optionCard, shareConsent && styles.optionCardSelected]}
            onPress={() => handleSelect(true)}
            activeOpacity={0.88}>
            <View style={[styles.radioCircle, shareConsent && styles.radioCircleSelected]}>
              {shareConsent && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.optionText}>Đồng ý, tôi sẽ chia sẻ những thông tin đó</Text>
          </TouchableOpacity>

          {/* Option 2: Decline / Later */}
          <TouchableOpacity
            style={[styles.optionCard, !shareConsent && styles.optionCardSelected]}
            onPress={() => handleSelect(false)}
            activeOpacity={0.88}>
            <View style={[styles.radioCircle, !shareConsent && styles.radioCircleSelected]}>
              {!shareConsent && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.optionText}>Không, hãy để sau</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#0F2644',
    lineHeight: 27,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
  },
  optionsList: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 18,
    gap: 14,
  },
  optionCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
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
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2644',
    lineHeight: 20,
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
