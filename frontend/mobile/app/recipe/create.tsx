import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { recipeService } from '@/services/recipe.service';
import { getAuthToken } from '@/services/storage.service';
import { calculateRecipeNutritionFromIngredients } from '@/constants/foodDatabase';

interface IngredientItem {
  food_item_id?: string;
  name: string;
  amount: number;
  unit: string;
  icon_url?: string;
  image_url?: string;
}

interface StepItem {
  step_number: number;
  title?: string;
  description: string;
  image_url?: string;
}

export default function CreateRecipeScreen() {
  const router = useRouter();

  // Wizard Step State (1: Basic, 2: Ingredients, 3: Steps, 4: Review, 5: Success)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [prepTime, setPrepTime] = useState<string>('');
  const [cookTime, setCookTime] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false); // false = Công khai

  // Servings & Ingredients (Step 2)
  const [servings, setServings] = useState<number>(1);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);

  // Ingredient Search Modal State
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [foodResults, setFoodResults] = useState<any[]>([]);
  const [searchingFoods, setSearchingFoods] = useState<boolean>(false);

  // Steps State (Step 3)
  const [steps, setSteps] = useState<StepItem[]>([
    { step_number: 1, description: '', image_url: '' },
    { step_number: 2, description: '', image_url: '' },
  ]);

  // Image Picker Modal State
  const [showImagePickerModal, setShowImagePickerModal] = useState<boolean>(false);
  const [activeStepImageIndex, setActiveStepImageIndex] = useState<number | null>(null);

  // Created Recipe Result for Success Screen
  const [createdRecipe, setCreatedRecipe] = useState<any>(null);

  // Fetch foods on search query change
  useEffect(() => {
    if (showSearchModal) {
      const timer = setTimeout(() => {
        handleSearchFoods(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, showSearchModal]);

  const DEFAULT_RAW_INGREDIENTS = [
    { _id: 'ing_ucga', name: 'Ức gà / Thịt gà thô', category: 'Thịt & Gia cầm', calories_per_100g: 165, protein_per_100g: 31, carb_per_100g: 0, fat_per_100g: 3.6, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200' },
    { _id: 'ing_thitbo', name: 'Thịt bò nạc thô', category: 'Thịt & Gia cầm', calories_per_100g: 250, protein_per_100g: 26, carb_per_100g: 0, fat_per_100g: 15, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200' },
    { _id: 'ing_thitlon', name: 'Thịt lợn nạc', category: 'Thịt & Gia cầm', calories_per_100g: 143, protein_per_100g: 20.3, carb_per_100g: 0, fat_per_100g: 6.2, image_url: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=200' },
    { _id: 'ing_cahoi', name: 'Cá hồi tươi', category: 'Hải sản', calories_per_100g: 208, protein_per_100g: 20, carb_per_100g: 0, fat_per_100g: 13, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200' },
    { _id: 'ing_trung', name: 'Trứng gà tươi', category: 'Trứng & Sữa', calories_per_100g: 155, protein_per_100g: 13, carb_per_100g: 1.1, fat_per_100g: 11, image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200' },
    { _id: 'ing_banhpho', name: 'Bánh phở tươi', category: 'Tinh bột', calories_per_100g: 140, protein_per_100g: 2.2, carb_per_100g: 31, fat_per_100g: 0.3, image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200' },
    { _id: 'ing_raubina', name: 'Rau bina / Cải bó xôi', category: 'Rau củ', calories_per_100g: 23, protein_per_100g: 2.9, carb_per_100g: 3.6, fat_per_100g: 0.4, image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200' },
    { _id: 'ing_hanhla', name: 'Hành lá', category: 'Rau củ', calories_per_100g: 32, protein_per_100g: 1.8, carb_per_100g: 7.3, fat_per_100g: 0.2, image_url: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=200' },
    { _id: 'ing_toi', name: 'Tỏi củ', category: 'Gia vị', calories_per_100g: 149, protein_per_100g: 6.4, carb_per_100g: 33, fat_per_100g: 0.5, image_url: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=200' },
    { _id: 'ing_nuocmam', name: 'Nước mắm', category: 'Gia vị', calories_per_100g: 35, protein_per_100g: 5.1, carb_per_100g: 3.6, fat_per_100g: 0, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200' },
  ];

  const handleSearchFoods = async (q: string) => {
    setSearchingFoods(true);
    try {
      const res = await recipeService.searchFoods(q);
      let list = Array.isArray(res?.data) ? res.data : (res as any)?.foods || (res as any)?.data?.foods || [];
      if (!list || list.length === 0) {
        const qLower = (q || '').toLowerCase().trim();
        list = DEFAULT_RAW_INGREDIENTS.filter(r => !qLower || r.name.toLowerCase().includes(qLower));
      }
      setFoodResults(list);
    } catch (e) {
      console.error('Error searching foods:', e);
      setFoodResults(DEFAULT_RAW_INGREDIENTS);
    } finally {
      setSearchingFoods(false);
    }
  };

  // Compress image on Web using HTML5 Canvas
  const compressImageUri = (uri: string): Promise<string> => {
    if (Platform.OS !== 'web' || !uri || !uri.startsWith('data:image')) {
      return Promise.resolve(uri);
    }
    return new Promise(resolve => {
      const img = new (window as any).Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        } else {
          resolve(uri);
        }
      };
      img.onerror = () => resolve(uri);
      img.src = uri;
    });
  };

  // Pick Cover or Step Image from Gallery
  const handlePickImage = async () => {
    setShowImagePickerModal(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập ảnh để chọn ảnh món ăn.');
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
        const asset = result.assets[0];
        const rawUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        const compressed = await compressImageUri(rawUri);
        if (activeStepImageIndex !== null) {
          setSteps(prev => {
            const next = [...prev];
            next[activeStepImageIndex].image_url = compressed;
            return next;
          });
          setActiveStepImageIndex(null);
        } else {
          setCoverImage(compressed);
        }
      }
    } catch (e) {
      console.error('Error picking image:', e);
    }
  };

  // Take Cover or Step Image with Camera
  const handleCameraImage = async () => {
    setShowImagePickerModal(false);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập camera để chụp ảnh món ăn.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.3,
        base64: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const rawUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        const compressed = await compressImageUri(rawUri);
        if (activeStepImageIndex !== null) {
          setSteps(prev => {
            const next = [...prev];
            next[activeStepImageIndex].image_url = compressed;
            return next;
          });
          setActiveStepImageIndex(null);
        } else {
          setCoverImage(compressed);
        }
      }
    } catch (e) {
      console.error('Error taking camera image:', e);
    }
  };

  // Add Food Item to Ingredients
  const handleSelectFoodItem = (food: any) => {
    const newItem: IngredientItem = {
      food_item_id: food._id,
      name: food.name,
      amount: 100,
      unit: 'g',
      image_url: food.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200',
    };

    setIngredients(prev => [...prev, newItem]);
    setShowSearchModal(false);
    setSearchQuery('');

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  // Add Custom Typed Ingredient Name
  const handleAddCustomIngredient = (customName: string) => {
    if (!customName.trim()) return;
    const newItem: IngredientItem = {
      name: customName.trim(),
      amount: 100,
      unit: 'g',
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200',
    };

    setIngredients(prev => [...prev, newItem]);
    setShowSearchModal(false);
    setSearchQuery('');

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  // Update Ingredient amount or unit
  const handleUpdateIngredient = (index: number, field: 'amount' | 'unit', value: any) => {
    setIngredients(prev => {
      const next = [...prev];
      if (field === 'amount') {
        next[index].amount = Math.max(1, Number(value) || 0);
      } else {
        next[index].unit = value;
      }
      return next;
    });
  };

  // Remove Ingredient
  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, idx) => idx !== index));
  };

  // Add Step
  const handleAddStep = () => {
    setSteps(prev => [
      ...prev,
      { step_number: prev.length + 1, description: '', image_url: '' },
    ]);
  };

  // Update Step description
  const handleUpdateStep = (index: number, text: string) => {
    setSteps(prev => {
      const next = [...prev];
      next[index].description = text;
      return next;
    });
  };

  // Validate Step 1
  const handleNextStep1 = () => {
    if (!title.trim()) {
      const msg = 'Vui lòng nhập tên món ăn.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Thiếu thông tin', msg);
      return;
    }
    setCurrentStep(2);
  };

  // Validate Step 2
  const handleNextStep2 = () => {
    if (ingredients.length === 0) {
      const msg = 'Vui lòng thêm ít nhất 1 nguyên liệu cho món ăn.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Thiếu nguyên liệu', msg);
      return;
    }
    setCurrentStep(3);
  };

  // Validate Step 3
  const handleNextStep3 = () => {
    const validSteps = steps.filter(s => s.description.trim() !== '');
    if (validSteps.length === 0) {
      const msg = 'Vui lòng nhập hướng dẫn cho ít nhất 1 bước thực hiện.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Thiếu hướng dẫn', msg);
      return;
    }
    setCurrentStep(4);
  };

  // Submit Recipe (Step 4 -> Step 5)
  const handleSubmitRecipe = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const finalCover = coverImage
        ? await compressImageUri(coverImage)
        : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';

      const payload = {
        title: title.trim() || 'Món ăn mới',
        description: description.trim() || 'Công thức tự tạo',
        prep_time_minutes: Number(prepTime) || 15,
        prep_time_min: Number(prepTime) || 15,
        cook_time_minutes: Number(cookTime) || 20,
        cook_time_min: Number(cookTime) || 20,
        servings: servings || 1,
        is_private: isPrivate,
        image_url: finalCover,
        cover_image_url: finalCover,
        ingredients: ingredients.length > 0 ? ingredients.map(ing => ({
          food_item_id: ing.food_item_id,
          ingredient_name: ing.name,
          name: ing.name,
          quantity: Number(ing.amount) || 100,
          amount: Number(ing.amount) || 100,
          unit: ing.unit || 'g',
        })) : [{ ingredient_name: 'Nguyên liệu mặc định', name: 'Nguyên liệu mặc định', quantity: 100, amount: 100, unit: 'g' }],
        steps: steps
          .filter(s => s.description.trim() !== '')
          .map((s, idx) => ({
            step_number: idx + 1,
            title: `Bước ${idx + 1}`,
            instruction: s.description.trim(),
            description: s.description.trim(),
          })),
      };

      if (payload.steps.length === 0) {
        payload.steps = [{ step_number: 1, title: 'Bước 1', instruction: 'Chế biến món ăn theo khẩu vị.', description: 'Chế biến món ăn theo khẩu vị.' }];
      }

      console.log('Submitting recipe payload:', payload);
      const res = await recipeService.createRecipe(token, payload);
      
      if (res && (res.success || res.data)) {
        const recipeData = res.data || res;
        setCreatedRecipe(recipeData);
        setCurrentStep(5); // Go to Success screen!
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }
      } else {
        const errMsg = 'Không thể lưu công thức món ăn.';
        if (Platform.OS === 'web') alert(errMsg);
        else Alert.alert('Lỗi', errMsg);
      }
    } catch (e: any) {
      console.error('Error submitting recipe:', e);
      const errMsg = e.message || 'Đã có lỗi xảy ra khi tạo món ăn.';
      if (Platform.OS === 'web') {
        alert('Lỗi tạo món ăn: ' + errMsg);
      } else {
        Alert.alert('Lỗi tạo món ăn', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate Progress percentage bar
  const getProgressWidth = () => {
    switch (currentStep) {
      case 1:
        return '25%';
      case 2:
        return '50%';
      case 3:
        return '75%';
      case 4:
        return '100%';
      default:
        return '100%';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        
        {/* HEADER BAR (Hidden on Success Screen) */}
        {currentStep <= 4 && (
          <View style={styles.topHeader}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => {
                  if (currentStep > 1) {
                    setCurrentStep(prev => prev - 1);
                  } else {
                    router.back();
                  }
                }}
                style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Tạo món ăn của bạn</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* TOP PROGRESS LINE */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: getProgressWidth() }]} />
            </View>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          
          {/* ================= STEP 1: BASIC INFO & IMAGE ================= */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              {/* Tiêu đề */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Tiêu đề <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.inputBox}
                  placeholder="Tên món ăn"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={text => setTitle(text.slice(0, 50))}
                  maxLength={50}
                />
                <Text style={styles.charCounter}>{title.length} / 50</Text>
              </View>

              {/* Ảnh món ăn */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Ảnh món ăn <Text style={styles.requiredStar}>*</Text>
                </Text>

                <TouchableOpacity
                  style={styles.imagePickerBox}
                  onPress={() => setShowImagePickerModal(true)}
                  activeOpacity={0.8}>
                  {coverImage ? (
                    <Image source={{ uri: coverImage }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="camera-outline" size={32} color="#64748B" />
                      <Text style={styles.imagePickerText}>Thêm ảnh</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Mô tả */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mô tả</Text>
                <TextInput
                  style={[styles.inputBox, styles.multilineInput]}
                  placeholder="Mô tả về món ăn của bạn..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={text => setDescription(text.slice(0, 250))}
                  multiline
                  numberOfLines={4}
                  maxLength={250}
                  textAlignVertical="top"
                />
                <Text style={styles.charCounter}>{description.length} / 250</Text>
              </View>

              {/* Thời gian chuẩn bị & nấu */}
              <View style={styles.timeRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Thời gian chuẩn bị</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.suffixInput}
                      placeholder=""
                      keyboardType="numeric"
                      value={prepTime}
                      onChangeText={setPrepTime}
                    />
                    <Text style={styles.suffixText}>phút</Text>
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Thời gian nấu</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.suffixInput}
                      placeholder=""
                      keyboardType="numeric"
                      value={cookTime}
                      onChangeText={setCookTime}
                    />
                    <Text style={styles.suffixText}>phút</Text>
                  </View>
                </View>
              </View>

              {/* Sự riêng tư */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Sự riêng tư</Text>
                <TouchableOpacity
                  style={styles.privacyOptionBox}
                  onPress={() => setIsPrivate(false)}
                  activeOpacity={0.8}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.privacyTitle}>Công khai</Text>
                    <Text style={styles.privacyDesc}>Mọi người có thể xem món ăn của bạn</Text>
                  </View>
                  <Ionicons
                    name={!isPrivate ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={!isPrivate ? '#10B981' : '#CBD5E1'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.privacyOptionBox, { marginTop: 10 }]}
                  onPress={() => setIsPrivate(true)}
                  activeOpacity={0.8}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.privacyTitle}>Cá nhân</Text>
                    <Text style={styles.privacyDesc}>Chỉ mình bạn có thể xem món ăn này</Text>
                  </View>
                  <Ionicons
                    name={isPrivate ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isPrivate ? '#10B981' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================= STEP 2: INGREDIENTS & SERVINGS ================= */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              {/* Khẩu phần Stepper */}
              <View style={styles.servingsHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Khẩu phần</Text>
                  <Text style={styles.sectionSubtext}>(số lượng người dùng)</Text>
                </View>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setServings(prev => Math.max(1, prev - 1))}>
                    <Text style={styles.stepperText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{servings}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setServings(prev => prev + 1)}>
                    <Text style={styles.stepperText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Danh sách nguyên liệu */}
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionHeading}>Danh sách nguyên liệu</Text>
                <Text style={styles.sectionSubtext}>
                  Ấn thêm vào danh sách và vuốt trái để xóa nguyên liệu
                </Text>

                {/* Ingredients List */}
                {ingredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingredientRowCard}>
                    <Image
                      source={{
                        uri:
                          ing.image_url ||
                          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200',
                      }}
                      style={styles.ingredientThumb}
                    />
                    <Text style={styles.ingredientNameText} numberOfLines={2}>
                      {ing.name}
                    </Text>

                    <View style={styles.ingredientInputsRow}>
                      <TextInput
                        style={styles.amountInput}
                        keyboardType="numeric"
                        value={String(ing.amount)}
                        onChangeText={val => handleUpdateIngredient(idx, 'amount', val)}
                      />
                      <View style={styles.unitBadge}>
                        <Text style={styles.unitText}>{ing.unit}</Text>
                        <Ionicons name="swap-vertical" size={12} color="#64748B" />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(idx)}
                      style={styles.deleteIngBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Ingredient Button */}
                <TouchableOpacity
                  style={styles.addIngredientPill}
                  onPress={() => {
                    setShowSearchModal(true);
                    handleSearchFoods('');
                  }}>
                  <Text style={styles.addIngredientText}>+ Thêm nguyên liệu</Text>
                </TouchableOpacity>

                <Text style={styles.helperTextBottom}>
                  Hãy tính toán lượng nguyên liệu dựa trên số lượng khẩu phần
                </Text>
              </View>
            </View>
          )}

          {/* ================= STEP 3: COOKING STEPS ================= */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              {steps.map((st, idx) => (
                <View key={idx} style={styles.stepCardItem}>
                  <Text style={styles.stepTitleHeader}>Bước 0{idx + 1}</Text>

                  <Text style={styles.fieldLabel}>Mô tả</Text>
                  <TextInput
                    style={[styles.inputBox, styles.multilineInput, { minHeight: 90 }]}
                    placeholder="Nhập hướng dẫn cho từng bước..."
                    placeholderTextColor="#94A3B8"
                    value={st.description}
                    onChangeText={text => handleUpdateStep(idx, text)}
                    multiline
                    textAlignVertical="top"
                  />

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Ảnh/videos</Text>
                  {st.image_url ? (
                    <View style={styles.stepImagePreviewWrapper}>
                      <Image source={{ uri: st.image_url }} style={styles.stepImagePreview} />
                      <View style={styles.stepImageActionsRow}>
                        <TouchableOpacity
                          style={styles.stepImageActionBtn}
                          onPress={() => {
                            setActiveStepImageIndex(idx);
                            setShowImagePickerModal(true);
                          }}>
                          <Feather name="edit-3" size={14} color="#334155" />
                          <Text style={styles.stepImageActionText}>Đổi ảnh</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.stepImageActionBtn, { backgroundColor: '#FEE2E2' }]}
                          onPress={() => {
                            setSteps(prev => {
                              const next = [...prev];
                              next[idx].image_url = '';
                              return next;
                            });
                          }}>
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          <Text style={[styles.stepImageActionText, { color: '#EF4444' }]}>Xóa</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.stepMediaBox}
                      onPress={() => {
                        setActiveStepImageIndex(idx);
                        setShowImagePickerModal(true);
                      }}>
                      <Ionicons name="camera-outline" size={24} color="#64748B" />
                      <Text style={styles.stepMediaText}>Thêm ảnh/video</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addStepButton} onPress={handleAddStep}>
                <Text style={styles.addStepButtonText}>Thêm bước hướng dẫn</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================= STEP 4: REVIEW SUMMARY ================= */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              {/* Title & Description Edit Block */}
              <View style={styles.reviewHeaderBlock}>
                <View style={styles.reviewRowSpace}>
                  <Text style={styles.reviewRecipeTitle}>{title || 'Tên món ăn'}</Text>
                  <TouchableOpacity onPress={() => setCurrentStep(1)}>
                    <Feather name="edit-3" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.reviewRecipeDesc}>{description || 'Không có mô tả'}</Text>
              </View>

              {/* Cover Image Block */}
              {coverImage ? (
                <View style={styles.reviewImageBlock}>
                  <Image source={{ uri: coverImage }} style={styles.reviewCoverImg} />
                  <TouchableOpacity
                    style={styles.editImgCircleBtn}
                    onPress={() => setCurrentStep(1)}>
                    <Feather name="edit-3" size={16} color="#334155" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Specs List */}
              <View style={styles.reviewSpecsList}>
                <View style={styles.reviewSpecRow}>
                  <View>
                    <Text style={styles.reviewSpecLabel}>Thời gian chuẩn bị</Text>
                    <Text style={styles.reviewSpecValue}>{prepTime || '15'} phút</Text>
                  </View>
                  <TouchableOpacity onPress={() => setCurrentStep(1)}>
                    <Feather name="edit-3" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.reviewSpecRow}>
                  <View>
                    <Text style={styles.reviewSpecLabel}>Thời gian nấu</Text>
                    <Text style={styles.reviewSpecValue}>{cookTime || '20'} phút</Text>
                  </View>
                  <TouchableOpacity onPress={() => setCurrentStep(1)}>
                    <Feather name="edit-3" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.reviewSpecRow}>
                  <View>
                    <Text style={styles.reviewSpecLabel}>Chia sẻ</Text>
                    <Text style={styles.reviewSpecValue}>
                      {!isPrivate ? 'Công khai' : 'Cá nhân'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setCurrentStep(1)}>
                    <Feather name="edit-3" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nutrition Summary Block */}
              {(() => {
                const computedNutr = calculateRecipeNutritionFromIngredients(ingredients, servings);
                return (
                  <View style={[styles.reviewSectionBlock, { marginTop: 20 }]}>
                    <Text style={styles.reviewSectionTitle}>Tổng quan dinh dưỡng (Mỗi khẩu phần)</Text>
                    <Text style={styles.reviewSubLabel}>Tính toán chính xác từ {ingredients.length} nguyên liệu</Text>

                    <View style={styles.reviewNutritionGrid}>
                      <View style={[styles.reviewNutrItem, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.reviewNutrVal, { color: '#D97706' }]}>{computedNutr.calories}</Text>
                        <Text style={styles.reviewNutrLbl}>Calo (kcal)</Text>
                      </View>
                      <View style={[styles.reviewNutrItem, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.reviewNutrVal, { color: '#0284C7' }]}>{computedNutr.protein_g}g</Text>
                        <Text style={styles.reviewNutrLbl}>Đạm (Protein)</Text>
                      </View>
                      <View style={[styles.reviewNutrItem, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.reviewNutrVal, { color: '#15803D' }]}>{computedNutr.carb_g}g</Text>
                        <Text style={styles.reviewNutrLbl}>Đường bột</Text>
                      </View>
                      <View style={[styles.reviewNutrItem, { backgroundColor: '#F3E8FF' }]}>
                        <Text style={[styles.reviewNutrVal, { color: '#7E22CE' }]}>{computedNutr.fat_g}g</Text>
                        <Text style={styles.reviewNutrLbl}>Chất béo</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Ingredients Summary Block */}
              <View style={[styles.reviewSectionBlock, { marginTop: 24 }]}>
                <View style={styles.reviewRowSpace}>
                  <Text style={styles.reviewSectionTitle}>Nguyên liệu</Text>
                  <TouchableOpacity onPress={() => setCurrentStep(2)}>
                    <Feather name="edit-3" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.reviewSubLabel}>Dành cho: {servings} khẩu phần</Text>

                {ingredients.map((ing, idx) => (
                  <View key={idx} style={styles.reviewIngCardRow}>
                    <Image
                      source={{
                        uri:
                          ing.image_url ||
                          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200',
                      }}
                      style={styles.reviewIngThumb}
                    />
                    <Text style={styles.reviewIngNameText} numberOfLines={2}>
                      {ing.name}
                    </Text>
                    <Text style={styles.reviewIngAmountText}>
                      {ing.amount} {ing.unit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Cooking Steps Summary Block */}
              <View style={[styles.reviewSectionBlock, { marginTop: 24 }]}>
                <View style={styles.reviewRowSpace}>
                  <Text style={styles.reviewSectionTitle}>Hướng dẫn thực hiện</Text>
                  <TouchableOpacity onPress={() => setCurrentStep(3)}>
                    <Feather name="edit-3" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {steps
                  .filter(s => s.description.trim() !== '')
                  .map((st, idx) => (
                    <View key={idx} style={styles.reviewStepBlockItem}>
                      <View style={styles.stepBadgeTag}>
                        <Text style={styles.stepBadgeTagText}>Bước {idx + 1}</Text>
                      </View>
                      <Text style={styles.reviewStepDescText}>{st.description}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* ================= STEP 5: SUCCESS STATE ================= */}
          {currentStep === 5 && createdRecipe && (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={48} color="#FFFFFF" />
              </View>

              <Text style={styles.successTitleText}>Lưu thành công</Text>

              {/* Created Dish Card Preview */}
              <View style={styles.successDishCard}>
                <Image
                  source={{ uri: createdRecipe.cover_image_url }}
                  style={styles.successDishImg}
                />
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={styles.successDishTitle}>{createdRecipe.title}</Text>
                  <Text style={styles.successDishDate}>
                    {new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>

                  <TouchableOpacity style={styles.shareButton}>
                    <Feather name="upload" size={16} color="#334155" />
                    <Text style={styles.shareButtonText}>Chia sẻ</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Action Buttons */}
              <View style={styles.successBottomRow}>
                <TouchableOpacity
                  style={styles.homeReturnBtn}
                  onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.homeReturnBtnText}>Quay về trang chủ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewRecipeBtn}
                  onPress={() => router.replace(`/recipe/${createdRecipe._id}` as any)}>
                  <Text style={styles.viewRecipeBtnText}>Xem công thức</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* BOTTOM NAVIGATION BUTTONS (Step 1-4) */}
        {currentStep <= 4 && (
          <View style={styles.bottomNavContainer}>
            <TouchableOpacity
              style={styles.backPillBtn}
              onPress={() => {
                if (currentStep > 1) {
                  setCurrentStep(prev => prev - 1);
                } else {
                  router.back();
                }
              }}>
              <Text style={styles.backPillBtnText}>Quay lại</Text>
            </TouchableOpacity>

            {currentStep < 4 ? (
              <TouchableOpacity
                style={styles.nextPillBtn}
                onPress={() => {
                  if (currentStep === 1) handleNextStep1();
                  else if (currentStep === 2) handleNextStep2();
                  else if (currentStep === 3) handleNextStep3();
                }}>
                <Text style={styles.nextPillBtnText}>Tiếp theo →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.nextPillBtn}
                onPress={handleSubmitRecipe}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextPillBtnText}>Hoàn thành</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================= SEARCH INGREDIENTS BOTTOM SHEET MODAL ================= */}
        <Modal
          visible={showSearchModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSearchModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHeaderHandle} />

              <Text style={styles.sheetTitle}>Thêm nguyên liệu</Text>

              <View style={styles.modalSearchBox}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Nhập tên nguyên liệu hoặc tìm kiếm..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              {searchingFoods ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <ActivityIndicator color="#10B981" size="large" />
                </View>
              ) : (
                <FlatList
                  data={foodResults}
                  keyExtractor={(item, index) => item._id || String(index)}
                  contentContainerStyle={{ paddingBottom: 30 }}
                  ListHeaderComponent={() =>
                    searchQuery.trim().length > 0 ? (
                      <TouchableOpacity
                        style={styles.addCustomIngRow}
                        onPress={() => handleAddCustomIngredient(searchQuery)}>
                        <View style={styles.addCustomIngCircle}>
                          <Ionicons name="add" size={18} color="#10B981" />
                        </View>
                        <Text style={styles.addCustomIngText}>
                          Thêm nguyên liệu mới: "{searchQuery.trim()}"
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.foodSearchRow}
                      onPress={() => handleSelectFoodItem(item)}>
                      <Image
                        source={{
                          uri:
                            item.image_url ||
                            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200',
                        }}
                        style={styles.foodSearchThumb}
                      />
                      <Text style={styles.foodSearchTitle}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* ================= IMAGE PICKER BOTTOM SHEET MODAL ================= */}
        <Modal
          visible={showImagePickerModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowImagePickerModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowImagePickerModal(false)}>
            <View style={styles.pickerSheetContainer}>
              <TouchableOpacity style={styles.pickerOptionRow} onPress={handleCameraImage}>
                <Ionicons name="camera-outline" size={22} color="#1E293B" />
                <Text style={styles.pickerOptionText}>Chụp ảnh</Text>
              </TouchableOpacity>

              <View style={styles.sheetDivider} />

              <TouchableOpacity style={styles.pickerOptionRow} onPress={handlePickImage}>
                <Ionicons name="images-outline" size={22} color="#1E293B" />
                <Text style={styles.pickerOptionText}>Chọn ảnh từ thư viện</Text>
              </TouchableOpacity>

              <View style={styles.sheetDivider} />

              <TouchableOpacity
                style={styles.pickerCancelRow}
                onPress={() => setShowImagePickerModal(false)}>
                <Text style={styles.pickerCancelText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  stepContainer: {
    paddingTop: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: 110,
  },
  charCounter: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  imagePickerBox: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 14,
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  suffixInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  suffixText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  privacyOptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  privacyDesc: {
    fontSize: 12.5,
    color: '#64748B',
  },
  servingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtext: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 16,
  },
  ingredientRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
    gap: 10,
  },
  ingredientThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  ingredientNameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  ingredientInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountInput: {
    width: 50,
    height: 38,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 38,
    gap: 4,
  },
  unitText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  deleteIngBtn: {
    padding: 6,
  },
  addIngredientPill: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIngredientText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  helperTextBottom: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  stepCardItem: {
    marginBottom: 24,
  },
  stepTitleHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  stepMediaBox: {
    height: 100,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepMediaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  addStepButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  addStepButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#334155',
  },
  reviewHeaderBlock: {
    marginBottom: 16,
  },
  reviewRowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewRecipeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewRecipeDesc: {
    fontSize: 14,
    color: '#475569',
  },
  reviewImageBlock: {
    position: 'relative',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  reviewCoverImg: {
    width: '100%',
    height: '100%',
  },
  editImgCircleBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSpecsList: {
    gap: 14,
    marginBottom: 24,
  },
  reviewSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewSpecLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  reviewSpecValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  reviewSectionBlock: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 16,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewSubLabel: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 10,
  },
  reviewIngCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  reviewIngThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewIngNameText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  reviewIngAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  reviewStepBlockItem: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  stepBadgeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  stepBadgeTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  reviewStepDescText: {
    fontSize: 14.5,
    color: '#1E293B',
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 30,
  },
  successDishCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 40,
  },
  successDishImg: {
    width: '100%',
    height: 180,
  },
  successDishTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  successDishDate: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  successBottomRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  homeReturnBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  homeReturnBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  viewRecipeBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  viewRecipeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backPillBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  backPillBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#334155',
  },
  nextPillBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  nextPillBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  sheetHeaderHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  foodSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
  },
  foodSearchThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  foodSearchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  addCustomIngRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
  },
  addCustomIngCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomIngText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    flex: 1,
  },
  pickerSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  pickerCancelRow: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  stepImagePreviewWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepImagePreview: {
    width: '100%',
    height: 160,
  },
  stepImageActionsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 8,
    gap: 8,
    justifyContent: 'flex-end',
  },
  stepImageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    gap: 4,
  },
  stepImageActionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  reviewNutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  reviewNutrItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewNutrVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  reviewNutrLbl: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
});
