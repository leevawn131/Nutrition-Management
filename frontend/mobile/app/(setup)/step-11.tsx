import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { useSetup } from '@/context/setup-context';

interface IngredientItem {
  id: string;
  name: string;
  iconType: 'material' | 'fa6';
  iconName: string;
  color: string;
}

const INGREDIENTS: IngredientItem[] = [
  { id: 'Rượu', name: 'Rượu', iconType: 'material', iconName: 'glass-wine', color: '#9D174D' },
  { id: 'Thịt bò', name: 'Thịt bò', iconType: 'material', iconName: 'food-steak', color: '#DC2626' },
  { id: 'Caffeine', name: 'Caffeine', iconType: 'material', iconName: 'coffee', color: '#78350F' },
  { id: 'Cần tây', name: 'Cần tây', iconType: 'material', iconName: 'leaf', color: '#16A34A' },
  { id: 'Thịt gà', name: 'Thịt gà', iconType: 'material', iconName: 'food-drumstick', color: '#D97706' },
  { id: 'Ớt', name: 'Ớt', iconType: 'material', iconName: 'chili-mild', color: '#EF4444' },
  { id: 'Rau mùi', name: 'Rau mùi', iconType: 'material', iconName: 'sprout', color: '#059669' },
  { id: 'Trứng', name: 'Trứng', iconType: 'material', iconName: 'egg', color: '#FBBF24' },
  { id: 'Cà tím', name: 'Cà tím', iconType: 'fa6', iconName: 'eggplant', color: '#7C3AED' },
  { id: 'Cá', name: 'Cá', iconType: 'material', iconName: 'fish', color: '#0284C7' },
  { id: 'Tỏi', name: 'Tỏi', iconType: 'fa6', iconName: 'clover', color: '#B45309' },
  { id: 'Gluten', name: 'Gluten', iconType: 'material', iconName: 'barley', color: '#D97706' },
  { id: 'Sữa', name: 'Sữa', iconType: 'material', iconName: 'cup-water', color: '#F472B6' },
  { id: 'Nấm', name: 'Nấm', iconType: 'material', iconName: 'mushroom', color: '#A16207' },
  { id: 'Mù tạt', name: 'Mù tạt', iconType: 'material', iconName: 'spoon-sugar', color: '#CA8A04' },
  { id: 'Các loại hạt', name: 'Các loại hạt', iconType: 'material', iconName: 'peanut', color: '#B45309' },
  { id: 'Hành', name: 'Hành', iconType: 'material', iconName: 'flower-tulip', color: '#8B5CF6' },
  { id: 'Thịt lợn', name: 'Thịt lợn', iconType: 'material', iconName: 'food-croissant', color: '#E11D48' },
  { id: 'Mè', name: 'Mè', iconType: 'material', iconName: 'grain', color: '#D97706' },
  { id: 'Tôm', name: 'Tôm', iconType: 'material', iconName: 'shrimp', color: '#EA580C' },
];

export default function SetupStep11Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const [selectedAvoids, setSelectedAvoids] = useState<string[]>(wizardData.allergies || []);

  const handleToggle = (name: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSelectedAvoids((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    updateWizardData({
      allergies: selectedAvoids,
    });
    router.push('/(setup)/step-12');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={11} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>
            Hãy cho chúng tôi biết thêm để tránh những nguyên liệu không phù hợp với bạn.
          </Text>
          <Text style={styles.title}>Bạn có dị ứng hoặc không thích nguyên liệu nào không?</Text>
          <Text style={styles.description}>
            Hãy chọn một hoặc nhiều nguyên liệu bạn muốn tránh. Nếu không có, bạn có thể bỏ qua bước
            này và nhấn &apos;Tiếp theo&apos;
          </Text>
        </View>

        {/* Chips Grid */}
        <View style={styles.chipsGrid}>
          {INGREDIENTS.map((item) => {
            const isSelected = selectedAvoids.includes(item.name);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => handleToggle(item.name)}
                activeOpacity={0.85}>
                <View style={[styles.iconCircle, { backgroundColor: `${item.color}15` }]}>
                  {item.iconType === 'material' ? (
                    <MaterialCommunityIcons
                      name={item.iconName as any}
                      size={18}
                      color={item.color}
                    />
                  ) : (
                    <FontAwesome6 name={item.iconName as any} size={16} color={item.color} />
                  )}
                </View>

                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item.name}
                </Text>

                {isSelected && (
                  <Ionicons name="checkmark-circle" size={16} color="#EF4444" style={styles.checkIcon} />
                )}
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
    lineHeight: 19,
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
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  chipSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextSelected: {
    color: '#DC2626',
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: -2,
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
