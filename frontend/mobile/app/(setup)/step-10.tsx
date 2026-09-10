import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { useSetup } from '@/context/setup-context';

interface CuisineOption {
  id: string;
  title: string;
  desc: string;
}

const CUISINE_OPTIONS: CuisineOption[] = [
  {
    id: 'Ẩm thực miền Bắc Việt Nam',
    title: 'Ẩm thực miền Bắc Việt Nam',
    desc: 'phở Hà Nội, bún chả, bánh cuốn...',
  },
  {
    id: 'Ẩm thực miền Trung Việt Nam',
    title: 'Ẩm thực miền Trung Việt Nam',
    desc: 'mì Quảng, bún bò Huế, bánh bèo...',
  },
  {
    id: 'Ẩm thực miền Nam Việt Nam',
    title: 'Ẩm thực miền Nam Việt Nam',
    desc: 'hủ tiếu, bánh xèo, lẩu mắm...',
  },
  {
    id: 'Ẩm thực vùng núi Việt Nam',
    title: 'Ẩm thực vùng núi Việt Nam',
    desc: 'thắng cố, thịt gác bếp, cơm lam...',
  },
  {
    id: 'Ẩm thực Hàn Quốc',
    title: 'Ẩm thực Hàn Quốc',
    desc: 'kimchi, bibimbap, thịt nướng BBQ...',
  },
  {
    id: 'Ẩm thực Nhật Bản',
    title: 'Ẩm thực Nhật Bản',
    desc: 'sushi, ramen, sashimi...',
  },
  {
    id: 'Ẩm thực Địa Trung Hải / Âu Mỹ',
    title: 'Ẩm thực Địa Trung Hải / Âu Mỹ',
    desc: 'salad ô-liu, pasta, ức gà áp chảo...',
  },
];

export default function SetupStep10Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    wizardData.cuisine_preferences || ['Ẩm thực miền Bắc Việt Nam']
  );

  const handleToggleCuisine = (id: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSelectedCuisines((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    updateWizardData({ cuisine_preferences: selectedCuisines });
    router.push('/(setup)/step-11');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={10} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Hãy cho chúng tôi biết một chút về món ăn bạn yêu thích.</Text>
          <Text style={styles.title}>Bạn yêu thích những phong cách ẩm thực nào?</Text>
          <Text style={styles.description}>
            Bạn có thể chọn một hoặc nhiều phong cách ẩm thực yêu thích. Nếu không có sở thích cụ thể,
            hãy bỏ qua bước này và nhấn &apos;Tiếp theo&apos;
          </Text>
        </View>

        {/* Multi-select Cards */}
        <View style={styles.optionsList}>
          {CUISINE_OPTIONS.map((cuisine) => {
            const isSelected = selectedCuisines.includes(cuisine.id);
            return (
              <TouchableOpacity
                key={cuisine.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleToggleCuisine(cuisine.id)}
                activeOpacity={0.88}>
                <View style={[styles.checkboxCircle, isSelected && styles.checkboxCircleSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>

                <View style={styles.optionTextWrapper}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                    {cuisine.title}
                  </Text>
                  <Text style={styles.optionDesc}>{cuisine.desc}</Text>
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
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
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    borderColor: '#34D399',
    backgroundColor: '#34D399',
  },
  optionTextWrapper: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 3,
  },
  optionTitleSelected: {
    color: '#0F2644',
  },
  optionDesc: {
    fontSize: 13,
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
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
