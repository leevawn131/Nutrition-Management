import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getAuthToken, getCachedUser, setCachedUser } from '@/services/storage.service';
import { userService } from '@/services/user.service';
import { User } from '@/types/auth.types';

type GenderType = 'male' | 'female' | 'other';
type ActivityLevelType = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface ActivityOption {
  id: ActivityLevelType;
  title: string;
  desc: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    id: 'sedentary',
    title: 'Ít vận động',
    desc: 'Hầu như không tập luyện, làm việc văn phòng ngồi nhiều',
    icon: 'seat-recline-normal',
  },
  {
    id: 'light',
    title: 'Vận động nhẹ',
    desc: 'Hoạt động nhẹ hoặc tập luyện 1–3 ngày/tuần',
    icon: 'walk',
  },
  {
    id: 'moderate',
    title: 'Vận động vừa',
    desc: 'Tập luyện vừa phải khoảng 3–5 ngày/tuần',
    icon: 'run',
  },
  {
    id: 'active',
    title: 'Vận động nhiều',
    desc: 'Hoạt động thể chất thường xuyên 6–7 ngày/tuần',
    icon: 'bike',
  },
  {
    id: 'very_active',
    title: 'Rất năng động',
    desc: 'Hoạt động thể chất cường độ cao hoặc lao động thể lực',
    icon: 'weight-lifter',
  },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [birthYear, setBirthYear] = useState<string>('2000');
  const [gender, setGender] = useState<GenderType>('female');
  const [heightCm, setHeightCm] = useState<string>('165');
  const [weightKg, setWeightKg] = useState<string>('55');
  const [activityLevel, setActivityLevel] = useState<ActivityLevelType>('light');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [showActivityPicker, setShowActivityPicker] = useState<boolean>(false);

  // Load current user profile
  useEffect(() => {
    async function loadUserData() {
      try {
        const cached = await getCachedUser();
        if (cached) {
          prefillForm(cached);
        }

        const token = await getAuthToken();
        if (token) {
          const freshUser = await userService.getProfile(token);
          if (freshUser) {
            prefillForm(freshUser);
            await setCachedUser(freshUser);
          }
        }
      } catch (error) {
        console.warn('Error loading personal info:', error);
      } finally {
        setIsLoading(false);
      }
    }

    function prefillForm(userData: User) {

      if (userData.date_of_birth) {
        const yearStr = String(userData.date_of_birth).substring(0, 4);
        setBirthYear(yearStr);
      }

      if (userData.gender) {
        setGender(userData.gender as GenderType);
      }

      if (userData.height_cm) {
        setHeightCm(String(userData.height_cm));
      }

      if (userData.weight_kg) {
        setWeightKg(String(userData.weight_kg));
      }

      if (userData.activity_level) {
        setActivityLevel(userData.activity_level as ActivityLevelType);
      }
    }

    loadUserData();
  }, []);

  const handleGenderSelect = (val: GenderType) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setGender(val);
    setHasChanges(true);
  };

  const handleActivitySelect = (level: ActivityLevelType) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setActivityLevel(level);
    setShowActivityPicker(false);
    setHasChanges(true);
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings' as any);
    }
  };

  const handleSave = async () => {
    const yearNum = parseInt(birthYear.trim(), 10);
    const heightNum = parseFloat(heightCm.trim());
    const weightNum = parseFloat(weightKg.trim());
    const currentYear = new Date().getFullYear();

    // Validations
    if (isNaN(yearNum) || yearNum < 1920 || yearNum > currentYear - 5) {
      Alert.alert('Năm sinh không hợp lệ', 'Vui lòng nhập năm sinh hợp lệ (ví dụ: 2000).');
      return;
    }

    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 250) {
      Alert.alert('Chiều cao không hợp lệ', 'Vui lòng nhập chiều cao từ 50 đến 250 cm.');
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 300) {
      Alert.alert('Cân nặng không hợp lệ', 'Vui lòng nhập cân nặng từ 20 đến 300 kg.');
      return;
    }

    setIsSaving(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      const formattedDob = `${yearNum}-06-15`;

      // ONLY submit supported Profile-owned fields (Module A rules)
      const updatedUser = await userService.updateProfile(token, {
        date_of_birth: formattedDob,
        gender,
        height_cm: heightNum,
        weight_kg: weightNum,
        activity_level: activityLevel,
      });

      if (updatedUser) {
        await setCachedUser(updatedUser);
      }

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      Alert.alert('Thành công', 'Cập nhật thông tin cá nhân thành công!', [
        {
          text: 'Đồng ý',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/settings' as any);
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error saving personal info:', error);
      Alert.alert('Lỗi', error.message || 'Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentActivityInfo =
    ACTIVITY_OPTIONS.find((opt) => opt.id === activityLevel) || ACTIVITY_OPTIONS[1];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 1. TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay lại">
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Thông tin cá nhân</Text>

          <View style={styles.placeholderRight} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* FIELD 1: NĂM SINH */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Năm sinh</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={birthYear}
                onChangeText={(text) => {
                  setBirthYear(text);
                  setHasChanges(true);
                }}
                placeholder="Nhập năm sinh (ví dụ: 2000)"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
              />
              <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
            </View>
          </View>

          {/* FIELD 2: GIỚI TÍNH */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Giới tính:</Text>
            <View style={styles.genderRow}>
              {/* Nữ */}
              <TouchableOpacity
                style={[styles.genderCard, gender === 'female' && styles.genderCardSelected]}
                onPress={() => handleGenderSelect('female')}
                activeOpacity={0.88}>
                <View
                  style={[
                    styles.radioCircle,
                    gender === 'female' && styles.radioCircleSelected,
                  ]}>
                  {gender === 'female' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.genderText}>Nữ</Text>
              </TouchableOpacity>

              {/* Nam */}
              <TouchableOpacity
                style={[styles.genderCard, gender === 'male' && styles.genderCardSelected]}
                onPress={() => handleGenderSelect('male')}
                activeOpacity={0.88}>
                <View
                  style={[styles.radioCircle, gender === 'male' && styles.radioCircleSelected]}>
                  {gender === 'male' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.genderText}>Nam</Text>
              </TouchableOpacity>

              {/* Khác */}
              <TouchableOpacity
                style={[styles.genderCard, gender === 'other' && styles.genderCardSelected]}
                onPress={() => handleGenderSelect('other')}
                activeOpacity={0.88}>
                <View
                  style={[styles.radioCircle, gender === 'other' && styles.radioCircleSelected]}>
                  {gender === 'other' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.genderText}>Khác</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FIELD 3: CHIỀU CAO */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Chiều cao</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={heightCm}
                onChangeText={(text) => {
                  setHeightCm(text);
                  setHasChanges(true);
                }}
                placeholder="Ví dụ: 165"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.unitText}>cm</Text>
            </View>
          </View>

          {/* FIELD 4: CÂN NẶNG */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Cân nặng</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={weightKg}
                onChangeText={(text) => {
                  setWeightKg(text);
                  setHasChanges(true);
                }}
                placeholder="Ví dụ: 55"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.unitText}>kg</Text>
            </View>
          </View>

          {/* FIELD 5: MỨC ĐỘ VẬN ĐỘNG (Replaces Wearable Device Section) */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionHeader}>Mức độ vận động</Text>
            <Text style={styles.sectionSubheader}>
              Giúp tính toán chính xác nhu cầu năng lượng và calo mục tiêu của bạn
            </Text>

            {/* Collapsed Selector Box */}
            <TouchableOpacity
              style={[
                styles.activitySelectorCard,
                showActivityPicker && styles.activitySelectorCardActive,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                }
                setShowActivityPicker(!showActivityPicker);
              }}
              activeOpacity={0.88}>
              <View style={styles.activityCurrentRow}>
                <View style={styles.activityIconCircle}>
                  <MaterialCommunityIcons
                    name={currentActivityInfo.icon}
                    size={22}
                    color="#10B981"
                  />
                </View>
                <View style={styles.activityCurrentTextWrapper}>
                  <Text style={styles.activityCurrentTitle}>{currentActivityInfo.title}</Text>
                  <Text style={styles.activityCurrentDesc}>{currentActivityInfo.desc}</Text>
                </View>
                <Ionicons
                  name={showActivityPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#94A3B8"
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Options List */}
            {showActivityPicker && (
              <View style={styles.activityOptionsContainer}>
                {ACTIVITY_OPTIONS.map((opt) => {
                  const isSelected = activityLevel === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.activityOptionItem,
                        isSelected && styles.activityOptionItemSelected,
                      ]}
                      onPress={() => handleActivitySelect(opt.id)}
                      activeOpacity={0.85}>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>

                      <View style={styles.activityOptionTextWrapper}>
                        <Text
                          style={[
                            styles.activityOptionTitle,
                            isSelected && styles.activityOptionTitleSelected,
                          ]}>
                          {opt.title}
                        </Text>
                        <Text style={styles.activityOptionDesc}>{opt.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* BOTTOM SAVE BUTTON */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            activeOpacity={0.88}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={styles.saveIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F2644',
    letterSpacing: -0.3,
  },
  placeholderRight: {
    width: 38,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
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
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  unitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 52,
    gap: 8,
    justifyContent: 'center',
  },
  genderCardSelected: {
    borderColor: '#34D399',
    backgroundColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
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
  activitySection: {
    marginTop: 8,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2644',
    marginBottom: 4,
  },
  sectionSubheader: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  activitySelectorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  activitySelectorCardActive: {
    borderColor: '#34D399',
    backgroundColor: '#FFFFFF',
  },
  activityCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCurrentTextWrapper: {
    flex: 1,
  },
  activityCurrentTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 2,
  },
  activityCurrentDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  activityOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  activityOptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  activityOptionItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  activityOptionTextWrapper: {
    flex: 1,
  },
  activityOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 3,
  },
  activityOptionTitleSelected: {
    color: '#059669',
  },
  activityOptionDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    alignItems: 'flex-end',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34D399',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveIcon: {
    marginLeft: 2,
  },
});
