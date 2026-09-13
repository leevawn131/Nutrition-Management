import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIRecognitionResult, MealType } from '@/types/meal.types';

interface AIConfirmationModalProps {
  visible: boolean;
  loading: boolean;
  imageUri?: string | null;
  result?: AIRecognitionResult | null;
  onClose: () => void;
  onConfirmSave: (data: {
    food_name: string;
    portion_grams: number;
    calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
    meal_type: MealType;
    recognition_id?: string;
  }) => void;
}

export const AIConfirmationModal: React.FC<AIConfirmationModalProps> = ({
  visible,
  loading,
  imageUri,
  result,
  onClose,
  onConfirmSave,
}) => {
  const [foodName, setFoodName] = useState('');
  const [weightGrams, setWeightGrams] = useState('200');
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carb, setCarb] = useState('0');
  const [fat, setFat] = useState('0');
  const [mealType, setMealType] = useState<MealType>('lunch');

  useEffect(() => {
    if (result) {
      setFoodName(result.food_name || '');
      setWeightGrams(result.estimated_weight_g ? result.estimated_weight_g.toString() : '200');
      setCalories(result.calories ? result.calories.toString() : '0');
      setProtein(result.protein_g ? result.protein_g.toString() : '0');
      setCarb(result.carb_g ? result.carb_g.toString() : '0');
      setFat(result.fat_g ? result.fat_g.toString() : '0');
    }
  }, [result]);

  const handleSave = () => {
    if (!foodName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên món ăn');
      return;
    }

    const numCalories = parseFloat(calories) || 0;
    const numWeight = parseFloat(weightGrams) || 0;

    if (numCalories < 0 || numWeight < 0) {
      Alert.alert('Lỗi', 'Giá trị dinh dưỡng hoặc khối lượng không được là số âm');
      return;
    }

    onConfirmSave({
      food_name: foodName.trim(),
      portion_grams: numWeight,
      calories: numCalories,
      protein_g: parseFloat(protein) || 0,
      carb_g: parseFloat(carb) || 0,
      fat_g: parseFloat(fat) || 0,
      meal_type: mealType,
      recognition_id: result?.recognition_id,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingTitle}>Miu miu đang phân tích bữa ăn...</Text>
              <Text style={styles.loadingSubtitle}>Đang nhận diện hình ảnh & tính toán dinh dưỡng ✨</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Kết quả phân tích AI</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Preview Image */}
              {imageUri ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                </View>
              ) : null}

              {/* Confidence Badge */}
              {result?.confidence ? (
                <View style={styles.confidenceBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.confidenceText}>
                    Độ tin cậy nhận diện: {Math.round(result.confidence * 100)}%
                  </Text>
                </View>
              ) : null}

              {/* Form inputs */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tên món ăn</Text>
                <TextInput
                  style={styles.input}
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="Tên món ăn..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Meal Type selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Bữa ăn</Text>
                <View style={styles.mealTypeRow}>
                  {[
                    { key: 'breakfast', label: 'Bữa sáng' },
                    { key: 'lunch', label: 'Bữa trưa' },
                    { key: 'dinner', label: 'Bữa tối' },
                    { key: 'snack', label: 'Bữa phụ' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.mealTypeChip,
                        mealType === item.key && styles.mealTypeChipActive,
                      ]}
                      onPress={() => setMealType(item.key as MealType)}
                    >
                      <Text
                        style={[
                          styles.mealTypeChipText,
                          mealType === item.key && styles.mealTypeChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Weight & Calories Grid */}
              <View style={styles.row}>
                <View style={[styles.formGroup, styles.half]}>
                  <Text style={styles.label}>Khối lượng (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={weightGrams}
                    onChangeText={setWeightGrams}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, styles.half]}>
                  <Text style={styles.label}>Năng lượng (kcal)</Text>
                  <TextInput
                    style={[styles.input, { color: '#D97706', fontWeight: '700' }]}
                    value={calories}
                    onChangeText={setCalories}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Macros Breakdown Grid */}
              <Text style={styles.sectionHeader}>Thành phần dinh dưỡng (g)</Text>
              <View style={styles.row}>
                <View style={[styles.formGroup, styles.third]}>
                  <Text style={styles.macroLabel}>Protein (Đạm)</Text>
                  <TextInput
                    style={styles.input}
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, styles.third]}>
                  <Text style={styles.macroLabel}>Carbs (Đường)</Text>
                  <TextInput
                    style={styles.input}
                    value={carb}
                    onChangeText={setCarb}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, styles.third]}>
                  <Text style={styles.macroLabel}>Fat (Béo)</Text>
                  <TextInput
                    style={styles.input}
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Lưu bữa ăn</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  imageWrapper: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  confidenceText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    marginLeft: 4,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  mealTypeChipActive: {
    backgroundColor: '#059669',
  },
  mealTypeChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  mealTypeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  third: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
