import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { NutritionDonut } from '@/components/setup/nutrition-donut';
import { useSetup } from '@/context/setup-context';
import { goalService } from '@/services/goal.service';
import { getAuthToken } from '@/services/storage.service';

export default function SetupStep7Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData } = useSetup();

  const recommendedCalories = wizardData.recommended_calories || 2150;
  const [isLoading, setIsLoading] = useState(false);

  // Macro preview estimations (Visual display only for Module C presentation)
  const proteinG = Math.round((recommendedCalories * 0.2) / 4);
  const carbG = Math.round((recommendedCalories * 0.54) / 4);
  const fatG = Math.round((recommendedCalories * 0.26) / 9);
  const unsaturatedFatG = Math.round(fatG * 0.3);

  const handleNext = async () => {
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      if (token && wizardData.goal) {
        // Confirm goal and recommended calories via Goal API
        await goalService.confirmGoal(token, {
          goal: wizardData.goal,
          target_weight: wizardData.target_weight,
          target_duration_weeks: wizardData.target_duration_weeks,
          target_calories: recommendedCalories,
        });
      }

      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }

      router.push('/(setup)/step-8');
    } catch (error) {
      console.warn('Error in confirming goal:', error);
      router.push('/(setup)/step-8');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={7} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>
            Dựa trên hồ sơ của bạn, đây là nhu cầu dinh dưỡng mỗi ngày:
          </Text>
          <Text style={styles.caloriesNumber}>
            {recommendedCalories.toLocaleString()}{' '}
            <Text style={styles.caloriesUnit}>kcal</Text>
          </Text>
          <Text style={styles.caloriesLabel}>Lượng calo khuyến nghị mỗi ngày</Text>
        </View>

        {/* Macro Donut Ring */}
        <NutritionDonut
          proteinPct={20}
          carbPct={54}
          fatPct={26}
          proteinG={proteinG}
          carbG={carbG}
          fatG={fatG}
        />

        {/* Calculation Summary Box */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Tỷ lệ dinh dưỡng (phương pháp tuyến tính): 20% đạm ({proteinG}g), 54% đường bột ({carbG}
            g), 26% béo ({fatG}g). Phù hợp với thể trạng và mục tiêu năng lượng khoa học của bạn.
            Phương pháp dinh dưỡng cân bằng giúp chuyển tiếp mục tiêu mượt mà và bền vững hơn.
          </Text>
        </View>

        {/* Energy breakdown details */}
        <View style={styles.detailSection}>
          <Text style={styles.detailHeader}>Chất sinh năng lượng</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailName}>Chất đạm (Protein)</Text>
            <Text style={styles.detailValue}>{proteinG} g</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailName}>Chất béo (Fat)</Text>
            <Text style={styles.detailValue}>{fatG} g</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailName}>Chất béo không bão hòa</Text>
            <Text style={styles.detailValue}>{unsaturatedFatG} g</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailName}>Đường bột (Carbohydrate)</Text>
            <Text style={styles.detailValue}>{carbG} g</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 20,
  },
  caloriesNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F2644',
    letterSpacing: -0.5,
  },
  caloriesUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 21,
  },
  detailSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  detailHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F2644',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#334155',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2644',
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
