import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { useSetup } from '@/context/setup-context';

export default function SetupStep3Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const [birthYear, setBirthYear] = useState<string>(
    wizardData.date_of_birth ? wizardData.date_of_birth.substring(0, 4) : '1998'
  );
  const [gender, setGender] = useState<'male' | 'female'>(
    (wizardData.gender as 'male' | 'female') || 'female'
  );
  const [heightCm, setHeightCm] = useState<string>(
    wizardData.height_cm ? String(wizardData.height_cm) : '165'
  );
  const [weightKg, setWeightKg] = useState<string>(
    wizardData.weight_kg ? String(wizardData.weight_kg) : '55'
  );

  const handleGenderSelect = (val: 'male' | 'female') => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setGender(val);
  };

  const handleNext = () => {
    const yearNum = parseInt(birthYear, 10);
    const heightNum = parseFloat(heightCm);
    const weightNum = parseFloat(weightKg);

    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1920 || yearNum > currentYear - 5) {
      Alert.alert('Năm sinh không hợp lệ', 'Vui lòng nhập năm sinh hợp lệ (ví dụ: 1998).');
      return;
    }

    if (isNaN(heightNum) || heightNum < 80 || heightNum > 250) {
      Alert.alert('Chiều cao không hợp lệ', 'Vui lòng nhập chiều cao từ 80 đến 250 cm.');
      return;
    }

    if (isNaN(weightNum) || weightNum < 25 || weightNum > 300) {
      Alert.alert('Cân nặng không hợp lệ', 'Vui lòng nhập cân nặng từ 25 đến 300 kg.');
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    // Save demographic & physical data in wizard state
    const formattedDob = `${yearNum}-06-15`; // default standard month/day
    updateWizardData({
      gender,
      date_of_birth: formattedDob,
      height_cm: heightNum,
      weight_kg: weightNum,
    });

    router.push('/(setup)/step-4');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={3} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Hãy để chúng tôi hiểu thêm về bạn</Text>
        </View>

        {/* 1. NĂM SINH */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Năm sinh:</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={birthYear}
              onChangeText={setBirthYear}
              placeholder="Nhập năm sinh (ví dụ: 1998)"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={4}
            />
            <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
          </View>
        </View>

        {/* 2. GIỚI TÍNH */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Giới tính:</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderCard, gender === 'female' && styles.genderCardSelected]}
              onPress={() => handleGenderSelect('female')}
              activeOpacity={0.88}>
              <View style={[styles.radioCircle, gender === 'female' && styles.radioCircleSelected]}>
                {gender === 'female' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.genderText}>Nữ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderCard, gender === 'male' && styles.genderCardSelected]}
              onPress={() => handleGenderSelect('male')}
              activeOpacity={0.88}>
              <View style={[styles.radioCircle, gender === 'male' && styles.radioCircleSelected]}>
                {gender === 'male' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.genderText}>Nam</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. CHIỀU CAO */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Chiều cao (cm):</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="Chia sẻ chiều cao của bạn"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <Text style={styles.unitText}>cm</Text>
          </View>
        </View>

        {/* 4. CÂN NẶNG */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Cân nặng (kg):</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="Chia sẻ cân nặng của bạn"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <Text style={styles.unitText}>kg</Text>
          </View>
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2644',
  },
  fieldGroup: {
    marginBottom: 18,
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
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
  },
  genderCardSelected: {
    borderColor: '#34D399',
    backgroundColor: '#FFFFFF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#34D399',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
  },
  genderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
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
