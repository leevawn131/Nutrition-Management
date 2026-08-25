import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { WelcomeMascot } from '@/components/setup/welcome-mascot';

export default function SetupStep1Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    router.push('/(setup)/step-2');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header with Exit button and Progress bar */}
      <StepHeader currentStep={1} totalSteps={16} showBack={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Mascot Character Illustration */}
        <View style={styles.mascotArea}>
          <WelcomeMascot />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>
            Chào mừng bạn đến{'\n'}với the.Nutri!
          </Text>
          <Text style={styles.description}>
            Để tạo ra kế hoạch dinh dưỡng cá nhân hóa hoàn hảo cho bạn, chúng tôi cần hiểu rõ về mục
            tiêu và lối sống của bạn. Hãy dành 2-3 phút để hoàn thành khảo sát này nhé!
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarInner}>
          <View style={styles.flexSpacer} />
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.88}
            accessibilityLabel="Tiếp tục sang bước tiếp theo">
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
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  mascotArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  textContent: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F2644',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  description: {
    fontSize: 15.5,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 320,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  flexSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34D399',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
