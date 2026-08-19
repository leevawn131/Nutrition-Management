import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { useSetup } from '@/context/setup-context';

interface DietOption {
  id: string;
  name: string;
  desc: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

const DIET_OPTIONS: DietOption[] = [
  {
    id: 'Lacto Vegetarian',
    name: 'Lacto Vegetarian',
    desc: 'Ăn chay có sữa',
    icon: 'cheese',
    color: '#F59E0B',
  },
  {
    id: 'Ovo Vegetarian',
    name: 'Ovo Vegetarian',
    desc: 'Ăn chay có trứng và sữa',
    icon: 'egg',
    color: '#EAB308',
  },
  {
    id: 'Ovo-Lacto Vegetarian',
    name: 'Ovo-Lacto Vegetarian',
    desc: 'Ăn chay có trứng, sữa và cá',
    icon: 'fish',
    color: '#06B6D4',
  },
  {
    id: 'Pescatarian',
    name: 'Pescatarian',
    desc: 'Ăn chay có cá',
    icon: 'fishbowl-outline',
    color: '#3B82F6',
  },
  {
    id: 'Vegan',
    name: 'Vegan',
    desc: 'Ăn chay thuần',
    icon: 'sprout',
    color: '#10B981',
  },
  {
    id: 'Vegetarian',
    name: 'Vegetarian',
    desc: 'Ăn chay thường (không trứng, không sữa)',
    icon: 'leaf',
    color: '#059669',
  },
  {
    id: 'Low Carb',
    name: 'Low Carb',
    desc: 'Ăn ít tinh bột',
    icon: 'food-drumstick-outline',
    color: '#EF4444',
  },
  {
    id: 'Eat Clean',
    name: 'Eat Clean',
    desc: 'Ăn sạch, thực phẩm nguyên bản tự nhiên',
    icon: 'food-apple-outline',
    color: '#84CC16',
  },
  {
    id: 'Keto',
    name: 'Keto',
    desc: 'Chế độ ăn giàu chất béo tốt, ít tinh bột',
    icon: 'food-outline',
    color: '#14B8A6',
  },
  {
    id: 'None',
    name: 'Không có',
    desc: 'Không theo chế độ ăn kiêng đặc biệt',
    icon: 'silverware-fork-knife',
    color: '#64748B',
  },
];

export default function SetupStep9Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const [selectedDiet, setSelectedDiet] = useState<string>(wizardData.diet_type || 'None');

  const handleSelectDiet = (id: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSelectedDiet(id);
    updateWizardData({ diet_type: id });
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    updateWizardData({ diet_type: selectedDiet });
    router.push('/(setup)/step-10');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={9} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Chúng tôi muốn hiểu thêm về sở thích ăn uống của bạn.</Text>
          <Text style={styles.title}>Bạn có đang theo một chế độ ăn đặc biệt nào không?</Text>
          <Text style={styles.description}>
            Nếu bạn không áp dụng chế độ ăn đặc biệt nào, hãy bỏ qua bước này và nhấn &apos;Tiếp theo&apos;
          </Text>
        </View>

        {/* List of Diets */}
        <View style={styles.optionsList}>
          {DIET_OPTIONS.map((diet) => {
            const isSelected = selectedDiet === diet.id;
            return (
              <TouchableOpacity
                key={diet.id}
                style={[styles.dietCard, isSelected && styles.dietCardSelected]}
                onPress={() => handleSelectDiet(diet.id)}
                activeOpacity={0.88}>
                <View style={[styles.dietIconCircle, { backgroundColor: `${diet.color}18` }]}>
                  <MaterialCommunityIcons name={diet.icon} size={24} color={diet.color} />
                </View>

                <View style={styles.dietTextWrapper}>
                  <Text style={[styles.dietTitle, isSelected && styles.dietTitleSelected]}>
                    {diet.name}
                  </Text>
                  <Text style={styles.dietDesc}>{diet.desc}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
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
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F2644',
    lineHeight: 27,
    marginBottom: 8,
  },
  description: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 20,
  },
  optionsList: {
    gap: 12,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 14,
    gap: 14,
  },
  dietCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  dietIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietTextWrapper: {
    flex: 1,
  },
  dietTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 2,
  },
  dietTitleSelected: {
    color: '#0F2644',
  },
  dietDesc: {
    fontSize: 12.5,
    color: '#64748B',
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
