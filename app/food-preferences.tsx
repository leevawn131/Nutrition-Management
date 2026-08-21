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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { PreferenceChip } from '@/components/profile/preference-chip';
import { getAuthToken, getCachedUser, setCachedUser } from '@/services/storage.service';
import { userService } from '@/services/user.service';
import { User } from '@/types/auth.types';

// Preset Lists
const PRESET_DIETS = [
  'Ăn uống bình thường',
  'Ăn chay',
  'Thuần chay',
  'Ít tinh bột',
  'Keto',
  'Giàu đạm',
  'Eat Clean',
  'Khác',
];

const PRESET_FAVORITE_FOODS = [
  'Phở',
  'Bún bò',
  'Cơm tấm',
  'Bánh mì',
  'Gỏi cuốn',
  'Cơm rang',
  'Mì',
  'Cá',
  'Thịt gà',
  'Thịt bò',
  'Hải sản',
];

const PRESET_CUISINES = [
  'Miền Bắc Việt Nam',
  'Miền Trung Việt Nam',
  'Miền Nam Việt Nam',
  'Trung Quốc',
  'Nhật Bản',
  'Hàn Quốc',
  'Thái Lan',
  'Châu Âu',
  'Địa Trung Hải',
  'Khác',
];

const PRESET_ALLERGIES = [
  'Đậu phộng',
  'Sữa',
  'Trứng',
  'Hải sản',
  'Tôm',
  'Cua',
  'Cá',
  'Đậu nành',
  'Gluten',
  'Khác',
];

export default function FoodPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [customFoods, setCustomFoods] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);

  // Input states for custom additions
  const [customFoodInput, setCustomFoodInput] = useState<string>('');
  const [customAllergyInput, setCustomAllergyInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Load existing user profile & preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const cached = await getCachedUser();
        if (cached) {
          parsePreferences(cached);
        }

        const token = await getAuthToken();
        if (token) {
          const freshUser = await userService.getProfile(token);
          if (freshUser) {
            parsePreferences(freshUser);
            await setCachedUser(freshUser);
          }
        }
      } catch (error) {
        console.warn('Error loading food preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }

    function parsePreferences(userData: User) {
      const prefs = userData.food_preferences || [];

      const diets: string[] = [];
      const foods: string[] = [];
      const cFoods: string[] = [];
      const cuisines: string[] = [];
      const allergies: string[] = [];
      const cAllergies: string[] = [];

      prefs.forEach((item) => {
        const val = item.value?.trim();
        if (!val) return;

        if (item.preference_type === 'diet_type') {
          diets.push(val);
        } else if (item.preference_type === 'favorite') {
          if (PRESET_CUISINES.includes(val)) {
            cuisines.push(val);
          } else if (PRESET_FAVORITE_FOODS.includes(val)) {
            foods.push(val);
          } else {
            cFoods.push(val);
          }
        } else if (item.preference_type === 'allergy') {
          if (PRESET_ALLERGIES.includes(val)) {
            allergies.push(val);
          } else {
            cAllergies.push(val);
          }
        }
      });

      setSelectedDiets(diets);
      setSelectedFoods(foods);
      setCustomFoods(cFoods);
      setSelectedCuisines(cuisines);
      setSelectedAllergies(allergies);
      setCustomAllergies(cAllergies);
    }

    loadPreferences();
  }, []);

  // Toggle helper for preset arrays
  const toggleSelection = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
    setHasChanges(true);
  };

  // Add custom favorite food
  const handleAddCustomFood = () => {
    const trimmed = customFoodInput.trim();
    if (!trimmed) return;

    if (
      selectedFoods.map((f) => f.toLowerCase()).includes(trimmed.toLowerCase()) ||
      customFoods.map((f) => f.toLowerCase()).includes(trimmed.toLowerCase())
    ) {
      Alert.alert('Trùng lặp', `Món "${trimmed}" đã có trong danh sách yêu thích.`);
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    setCustomFoods([...customFoods, trimmed]);
    setCustomFoodInput('');
    setHasChanges(true);
  };

  // Remove custom favorite food
  const handleRemoveCustomFood = (item: string) => {
    setCustomFoods(customFoods.filter((x) => x !== item));
    setHasChanges(true);
  };

  // Add custom allergy
  const handleAddCustomAllergy = () => {
    const trimmed = customAllergyInput.trim();
    if (!trimmed) return;

    if (
      selectedAllergies.map((a) => a.toLowerCase()).includes(trimmed.toLowerCase()) ||
      customAllergies.map((a) => a.toLowerCase()).includes(trimmed.toLowerCase())
    ) {
      Alert.alert('Trùng lặp', `Thực phẩm dị ứng "${trimmed}" đã có trong danh sách.`);
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    setCustomAllergies([...customAllergies, trimmed]);
    setCustomAllergyInput('');
    setHasChanges(true);
  };

  // Remove custom allergy
  const handleRemoveCustomAllergy = (item: string) => {
    setCustomAllergies(customAllergies.filter((x) => x !== item));
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
    setIsSaving(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      // Build food_preferences payload matching the exact supported schema
      const foodPreferences: {
        preference_type: 'diet_type' | 'allergy' | 'favorite' | 'dislike';
        value: string;
      }[] = [];

      // 1. Diet Types
      selectedDiets.forEach((val) => {
        if (val.trim()) {
          foodPreferences.push({ preference_type: 'diet_type', value: val.trim() });
        }
      });

      // 2. Favorite Foods (presets + custom)
      [...selectedFoods, ...customFoods].forEach((val) => {
        if (val.trim()) {
          foodPreferences.push({ preference_type: 'favorite', value: val.trim() });
        }
      });

      // 3. Favorite Cuisines
      selectedCuisines.forEach((val) => {
        if (val.trim()) {
          foodPreferences.push({ preference_type: 'favorite', value: val.trim() });
        }
      });

      // 4. Allergies (presets + custom)
      [...selectedAllergies, ...customAllergies].forEach((val) => {
        if (val.trim()) {
          foodPreferences.push({ preference_type: 'allergy', value: val.trim() });
        }
      });

      // ONLY send food_preferences to Profile API (Module A rules)
      const updatedUser = await userService.updateProfile(token, {
        food_preferences: foodPreferences,
      });

      if (updatedUser) {
        await setCachedUser(updatedUser);
      }

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      Alert.alert('Thành công', 'Cập nhật sở thích ăn uống thành công!', [
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
      console.error('Error saving food preferences:', error);
      Alert.alert('Lỗi', error.message || 'Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalSelectedCount =
    selectedDiets.length +
    selectedFoods.length +
    customFoods.length +
    selectedCuisines.length +
    selectedAllergies.length +
    customAllergies.length;

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

          <Text style={styles.headerTitle}>Sở thích ăn uống</Text>

          <View style={styles.placeholderRight} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Subtle Empty state banner when nothing is selected */}
          {totalSelectedCount === 0 && (
            <View style={styles.emptyStateBanner}>
              <Ionicons name="sparkles-outline" size={18} color="#10B981" />
              <Text style={styles.emptyStateText}>
                Bạn chưa thiết lập sở thích ăn uống. Hãy chọn hoặc thêm các mục bên dưới nhé!
              </Text>
            </View>
          )}

          {/* SECTION 1: CHẾ ĐỘ ĂN */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="restaurant-outline" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Chế độ ăn</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Chọn phong cách hoặc chế độ dinh dưỡng bạn đang áp dụng
            </Text>

            <View style={styles.chipsWrap}>
              {PRESET_DIETS.map((diet) => (
                <PreferenceChip
                  key={diet}
                  label={diet}
                  selected={selectedDiets.includes(diet)}
                  onPress={() => toggleSelection(diet, selectedDiets, setSelectedDiets)}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* SECTION 2: MÓN ĂN YÊU THÍCH */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="heart-outline" size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>Món ăn yêu thích</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Chọn món ăn quen thuộc hoặc tự thêm món bạn ưa thích
            </Text>

            {/* Presets */}
            <View style={styles.chipsWrap}>
              {PRESET_FAVORITE_FOODS.map((food) => (
                <PreferenceChip
                  key={food}
                  label={food}
                  selected={selectedFoods.includes(food)}
                  onPress={() => toggleSelection(food, selectedFoods, setSelectedFoods)}
                />
              ))}

              {/* Custom foods chips */}
              {customFoods.map((food) => (
                <PreferenceChip
                  key={`custom-${food}`}
                  label={food}
                  selected={true}
                  onPress={() => handleRemoveCustomFood(food)}
                  onRemove={() => handleRemoveCustomFood(food)}
                />
              ))}
            </View>

            {/* Custom Input */}
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customTextInput}
                value={customFoodInput}
                onChangeText={setCustomFoodInput}
                placeholder="Thêm món yêu thích khác..."
                placeholderTextColor="#94A3B8"
                onSubmitEditing={handleAddCustomFood}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.addCustomBtn,
                  !customFoodInput.trim() && styles.addCustomBtnDisabled,
                ]}
                onPress={handleAddCustomFood}
                disabled={!customFoodInput.trim()}
                activeOpacity={0.8}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addCustomBtnText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* SECTION 3: LOẠI ẨM THỰC YÊU THÍCH */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="globe-outline" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Loại ẩm thực yêu thích</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Các nền văn hóa ẩm thực và hương vị vùng miền bạn yêu thích
            </Text>

            <View style={styles.chipsWrap}>
              {PRESET_CUISINES.map((cuisine) => (
                <PreferenceChip
                  key={cuisine}
                  label={cuisine}
                  selected={selectedCuisines.includes(cuisine)}
                  onPress={() => toggleSelection(cuisine, selectedCuisines, setSelectedCuisines)}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* SECTION 4: THỰC PHẨM / NGUYÊN LIỆU DỊ ỨNG */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Thực phẩm / nguyên liệu dị ứng</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Giúp hệ thống cảnh báo và gợi ý thực đơn an toàn cho bạn
            </Text>

            {/* Presets */}
            <View style={styles.chipsWrap}>
              {PRESET_ALLERGIES.map((allergy) => (
                <PreferenceChip
                  key={allergy}
                  label={allergy}
                  selected={selectedAllergies.includes(allergy)}
                  onPress={() => toggleSelection(allergy, selectedAllergies, setSelectedAllergies)}
                />
              ))}

              {/* Custom allergies chips */}
              {customAllergies.map((allergy) => (
                <PreferenceChip
                  key={`custom-allergy-${allergy}`}
                  label={allergy}
                  selected={true}
                  onPress={() => handleRemoveCustomAllergy(allergy)}
                  onRemove={() => handleRemoveCustomAllergy(allergy)}
                />
              ))}
            </View>

            {/* Custom Input */}
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customTextInput}
                value={customAllergyInput}
                onChangeText={setCustomAllergyInput}
                placeholder="Thêm thành phần dị ứng khác..."
                placeholderTextColor="#94A3B8"
                onSubmitEditing={handleAddCustomAllergy}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.addCustomBtn,
                  !customAllergyInput.trim() && styles.addCustomBtnDisabled,
                ]}
                onPress={handleAddCustomAllergy}
                disabled={!customAllergyInput.trim()}
                activeOpacity={0.8}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addCustomBtnText}>Thêm</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyStateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  emptyStateText: {
    flex: 1,
    fontSize: 13.5,
    color: '#065F46',
    fontWeight: '500',
    lineHeight: 18,
  },
  section: {
    paddingVertical: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F2644',
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  customTextInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 4,
  },
  addCustomBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addCustomBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
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
