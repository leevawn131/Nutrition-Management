import React, { useState } from 'react';
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
import { getAuthToken, setCachedUser } from '@/services/storage.service';

export default function SetupStep12Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, resetWizardData } = useSetup();

  const [referralCode, setReferralCode] = useState<string>(wizardData.referral_code || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleBack = () => {
    if (wizardData.shareNutritionPreferences) {
      router.push('/(setup)/step-11');
    } else {
      router.push('/(setup)/step-8');
    }
  };

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);

    try {
      const token = await getAuthToken();
      if (token) {
        // 1. Build standardized food_preferences array
        const preferences: { preference_type: string; value: string }[] = [];

        if (wizardData.diet_type && wizardData.diet_type !== 'None') {
          preferences.push({
            preference_type: 'diet_type',
            value: wizardData.diet_type,
          });
        }

        if (wizardData.cuisine_preferences && wizardData.cuisine_preferences.length > 0) {
          wizardData.cuisine_preferences.forEach((cuisine) => {
            preferences.push({
              preference_type: 'favorite',
              value: cuisine,
            });
          });
        }

        if (wizardData.allergies && wizardData.allergies.length > 0) {
          wizardData.allergies.forEach((allergy) => {
            preferences.push({
              preference_type: 'allergy',
              value: allergy,
            });
          });
        }

        // 2. Persist Profile-owned fields via Profile API
        const updatedUser = await userService.updateProfile(token, {
          gender: wizardData.gender,
          date_of_birth: wizardData.date_of_birth,
          height_cm: wizardData.height_cm,
          weight_kg: wizardData.weight_kg,
          activity_level: wizardData.activity_level,
          food_preferences: preferences as any,
        });

        if (updatedUser) {
          await setCachedUser(updatedUser);
        }
      }

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      resetWizardData();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.warn('Error completing setup:', error);
      Alert.alert(
        'Hoàn tất thiết lập',
        'Đã lưu thông tin hồ sơ thành công! Đang chuyển hướng về trang chủ...',
        [{ text: 'Đồng ý', onPress: () => router.replace('/(tabs)') }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={12} totalSteps={12} showBack={true} onBack={handleBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Bạn có mã giới thiệu từ bạn bè không?</Text>
          <Text style={styles.title}>Nhập mã giới thiệu (nếu có)</Text>
          <Text style={styles.description}>
            Nếu bạn không có mã giới thiệu, hãy bỏ qua bước này và nhấn &apos;Hoàn tất&apos;
          </Text>
        </View>

        {/* Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Mã giới thiệu:</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={referralCode}
              onChangeText={setReferralCode}
              placeholder="Nhập mã giới thiệu"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
            <Ionicons name="gift-outline" size={20} color="#94A3B8" />
          </View>
        </View>

        {/* Celebration Hint Card */}
        <View style={styles.celebrationCard}>
          <View style={styles.celebrationIconCircle}>
            <Ionicons name="sparkles" size={22} color="#10B981" />
          </View>
          <View style={styles.celebrationTextWrapper}>
            <Text style={styles.celebrationTitle}>Hồ sơ cá nhân hóa đã sẵn sàng!</Text>
            <Text style={styles.celebrationDesc}>
              Kế hoạch calo và dinh dưỡng phù hợp nhất đã được chuẩn bị riêng cho bạn.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isSubmitting}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color="#475569" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteSetup}
            disabled={isSubmitting}
            activeOpacity={0.88}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.completeButtonText}>Hoàn tất</Text>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
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
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 15.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  celebrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
    marginTop: 8,
  },
  celebrationIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationTextWrapper: {
    flex: 1,
  },
  celebrationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 3,
  },
  celebrationDesc: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 130,
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
