import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { recipeService } from '@/services/recipe.service';
import { getAuthToken } from '@/services/storage.service';

interface IngredientInput {
  food_item_id?: string;
  name: string;
  amount: string;
  unit: string;
  icon_url?: string;
}

interface StepInput {
  step_number: number;
  title: string;
  description: string;
}

export default function EditRecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const recipeId = params.id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingRecipe, setFetchingRecipe] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('15');
  const [cookTime, setCookTime] = useState('20');
  const [servings, setServings] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Ingredients & Steps
  const [ingredients, setIngredients] = useState<IngredientInput[]>([]);
  const [steps, setSteps] = useState<StepInput[]>([]);

  // Modals & Search
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (recipeId) {
      loadOriginalRecipe();
    }
  }, [recipeId]);

  const loadOriginalRecipe = async () => {
    setFetchingRecipe(true);
    try {
      const res = await recipeService.getRecipeById(recipeId!);
      if (res && res.data) {
        const r = res.data;
        setTitle(r.title || '');
        setDescription(r.description || '');
        setPrepTime(String(r.prep_time_min || 15));
        setCookTime(String(r.cook_time_min || 20));
        setServings(r.servings || 1);
        setIsPrivate(Boolean(r.is_private));
        setCoverImage(r.cover_image_url || null);

        if (r.ingredients && r.ingredients.length > 0) {
          setIngredients(
            r.ingredients.map((ing: any) => ({
              food_item_id: ing.food_item_id,
              name: ing.name,
              amount: String(ing.amount || 100),
              unit: ing.unit || 'g',
              icon_url: ing.icon_url,
            }))
          );
        } else {
          setIngredients([{ name: 'Thịt bò', amount: '200', unit: 'g' }]);
        }

        if (r.steps && r.steps.length > 0) {
          setSteps(
            r.steps.map((st: any, idx: number) => ({
              step_number: idx + 1,
              title: st.title || `Bước ${idx + 1}`,
              description: st.description || st,
            }))
          );
        } else {
          setSteps([{ step_number: 1, title: 'Bước 1', description: 'Sơ chế nguyên liệu' }]);
        }
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tải dữ liệu món ăn để chỉnh sửa');
    } finally {
      setFetchingRecipe(false);
    }
  };

  // Image Helper
  const compressImageUri = (uri: string): Promise<string> => {
    if (Platform.OS !== 'web' || !uri || !uri.startsWith('data:image')) {
      return Promise.resolve(uri);
    }
    return new Promise(resolve => {
      const img = new (window as any).Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxDim = 600;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        } else {
          resolve(uri);
        }
      };
      img.onerror = () => resolve(uri);
      img.src = uri;
    });
  };

  const handlePickImage = async () => {
    setShowImagePickerModal(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.3,
        base64: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const rawUri = result.assets[0].base64
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
        const compressed = await compressImageUri(rawUri);
        setCoverImage(compressed);
      }
    } catch (e) {
      console.error('Error picking image:', e);
    }
  };

  // Ingredient Helpers
  const handleAddIngredient = (item?: any) => {
    if (item) {
      setIngredients([
        ...ingredients,
        {
          food_item_id: item._id,
          name: item.name,
          amount: '100',
          unit: 'g',
          icon_url: item.icon_url || '🥩',
        },
      ]);
      setShowFoodSearchModal(false);
      setSearchQuery('');
    } else {
      setIngredients([...ingredients, { name: '', amount: '100', unit: 'g' }]);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: keyof IngredientInput, value: string) => {
    const next = [...ingredients];
    next[index] = { ...next[index], [field]: value };
    setIngredients(next);
  };

  // Step Helpers
  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        step_number: steps.length + 1,
        title: `Bước ${steps.length + 1}`,
        description: '',
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    const filtered = steps.filter((_, i) => i !== index);
    setSteps(filtered.map((s, idx) => ({ ...s, step_number: idx + 1, title: `Bước ${idx + 1}` })));
  };

  const handleUpdateStep = (index: number, description: string) => {
    const next = [...steps];
    next[index] = { ...next[index], description };
    setSteps(next);
  };

  // Submit Updated Recipe
  const handleSubmitUpdate = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const finalCover = coverImage ? await compressImageUri(coverImage) : undefined;

      const payload = {
        title: title.trim(),
        description: description.trim(),
        prep_time_min: Number(prepTime) || 15,
        cook_time_min: Number(cookTime) || 20,
        servings: servings || 1,
        is_private: isPrivate,
        cover_image_url: finalCover,
        ingredients: ingredients
          .filter(ing => ing.name.trim() !== '')
          .map(ing => ({
            food_item_id: ing.food_item_id,
            name: ing.name.trim(),
            amount: Number(ing.amount) || 100,
            unit: ing.unit || 'g',
          })),
        steps: steps
          .filter(s => s.description.trim() !== '')
          .map((s, idx) => ({
            step_number: idx + 1,
            title: `Bước ${idx + 1}`,
            description: s.description.trim(),
          })),
      };

      await recipeService.updateRecipe(token, recipeId!, payload);

      const msg = 'Cập nhật công thức món ăn thành công! 🎉';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Thành công', msg);

      router.replace(`/recipe/${recipeId}` as any);
    } catch (e: any) {
      console.error('Lỗi khi cập nhật công thức:', e);
      const errMsg = e.message || 'Không thể cập nhật món ăn';
      if (Platform.OS === 'web') alert(`Lỗi: ${errMsg}`);
      else Alert.alert('Lỗi', errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingRecipe) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải dữ liệu công thức...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa công thức</Text>
        <TouchableOpacity style={styles.submitHeaderBtn} onPress={handleSubmitUpdate} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text style={styles.submitHeaderBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Progress Steps Header */}
      <View style={styles.stepProgressBar}>
        {[1, 2, 3, 4].map(step => (
          <TouchableOpacity
            key={step}
            style={[styles.stepItem, currentStep === step && styles.stepItemActive]}
            onPress={() => setCurrentStep(step)}>
            <Text style={[styles.stepNumber, currentStep === step && styles.stepNumberActive]}>
              {step}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

              {/* Cover Image Picker */}
              <TouchableOpacity
                style={styles.imagePickerBox}
                onPress={() => setShowImagePickerModal(true)}>
                {coverImage ? (
                  <Image source={{ uri: coverImage }} style={styles.coverImagePreview} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="camera-outline" size={36} color="#94A3B8" />
                    <Text style={styles.imagePickerText}>Chọn ảnh món ăn</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Title Input */}
              <Text style={styles.inputLabel}>Tên món ăn *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="VD: Thịt nạc rim mắm"
                placeholderTextColor="#94A3B8"
              />

              {/* Description Input */}
              <Text style={styles.inputLabel}>Mô tả ngắn món ăn</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả hương vị, đặc điểm món ăn..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />

              {/* Times & Servings */}
              <View style={styles.rowTwoCols}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Chuẩn bị (Phút)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={prepTime}
                    onChangeText={setPrepTime}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Nấu (Phút)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={cookTime}
                    onChangeText={setCookTime}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.nextStepBtn} onPress={() => setCurrentStep(2)}>
                <Text style={styles.nextStepBtnText}>Tiếp theo: Nguyên liệu</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Ingredients */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>Nguyên liệu chế biến</Text>

              {ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingredientRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 2 }]}
                    value={ing.name}
                    onChangeText={txt => handleUpdateIngredient(idx, 'name', txt)}
                    placeholder="Tên nguyên liệu"
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={ing.amount}
                    onChangeText={txt => handleUpdateIngredient(idx, 'amount', txt)}
                    keyboardType="numeric"
                    placeholder="Số lượng"
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={ing.unit}
                    onChangeText={txt => handleUpdateIngredient(idx, 'unit', txt)}
                    placeholder="Đơn vị (g)"
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity
                    style={styles.deleteRowBtn}
                    onPress={() => handleRemoveIngredient(idx)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addIngBtn} onPress={() => handleAddIngredient()}>
                <Ionicons name="add" size={20} color="#10B981" />
                <Text style={styles.addIngBtnText}>Thêm nguyên liệu mới</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextStepBtn} onPress={() => setCurrentStep(3)}>
                <Text style={styles.nextStepBtnText}>Tiếp theo: Bước làm</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Steps */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>Các bước thực hiện</Text>

              {steps.map((st, idx) => (
                <View key={idx} style={styles.stepCard}>
                  <View style={styles.stepCardHeader}>
                    <Text style={styles.stepCardTitle}>Bước {idx + 1}</Text>
                    {steps.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveStep(idx)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={st.description}
                    onChangeText={txt => handleUpdateStep(idx, txt)}
                    placeholder="Mô tả chi tiết cách thực hiện bước này..."
                    placeholderTextColor="#94A3B8"
                    multiline
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.addIngBtn} onPress={handleAddStep}>
                <Ionicons name="add" size={20} color="#10B981" />
                <Text style={styles.addIngBtnText}>Thêm bước tiếp theo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextStepBtn} onPress={() => setCurrentStep(4)}>
                <Text style={styles.nextStepBtnText}>Xem lại & Hoàn thành</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Review & Submit */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>Xác nhận chỉnh sửa</Text>

              <View style={styles.reviewSummaryCard}>
                <Text style={styles.reviewTitle}>{title || 'Món ăn mới'}</Text>
                <Text style={styles.reviewSubtitle}>
                  {prepTime} phút chuẩn bị • {cookTime} phút nấu • {ingredients.length} nguyên liệu
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.nextStepBtn, { backgroundColor: '#10B981' }]}
                onPress={handleSubmitUpdate}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.nextStepBtnText}> Cập nhật công thức</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <Modal visible={showImagePickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Chọn ảnh món ăn</Text>
            <TouchableOpacity style={styles.modalOption} onPress={handlePickImage}>
              <Ionicons name="images-outline" size={22} color="#10B981" />
              <Text style={styles.modalOptionText}>Chọn từ thư viện ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowImagePickerModal(false)}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 15,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  submitHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#10B981',
  },
  submitHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepProgressBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepItemActive: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  stepContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  imagePickerBox: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  coverImagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    color: '#64748B',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteRowBtn: {
    padding: 8,
  },
  addIngBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    gap: 6,
  },
  addIngBtnText: {
    color: '#10B981',
    fontWeight: '700',
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  nextStepBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  nextStepBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewSummaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  reviewSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  modalCancelText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
