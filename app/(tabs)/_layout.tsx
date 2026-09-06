import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { QuickActionsModal } from '@/components/home/quick-actions-modal';
import { MealScanModal } from '@/components/meal/MealScanModal';
import { PhotoConfirmModal } from '@/components/meal/PhotoConfirmModal';
import { AnalysisLoadingModal } from '@/components/meal/AnalysisLoadingModal';
import { NutritionAnalysisResultModal } from '@/components/meal/NutritionAnalysisResultModal';
import { ManualMealLogModal } from '@/components/meal/ManualMealLogModal';
import { mealService } from '@/services/meal.service';
import { getAuthToken } from '@/services/storage.service';
import { AIRecognitionResult, MealType, IngredientInput } from '@/types/meal.types';

export default function TabLayout() {
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [mealScanVisible, setMealScanVisible] = useState(false);
  const [photoConfirmVisible, setPhotoConfirmVisible] = useState(false);
  const [analysisLoadingVisible, setAnalysisLoadingVisible] = useState(false);
  const [nutritionResultVisible, setNutritionResultVisible] = useState(false);
  const [manualLogVisible, setManualLogVisible] = useState(false);

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [aiResult, setAiResult] = useState<AIRecognitionResult | null>(null);

  const handleOpenQuickActions = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    setQuickActionsVisible(true);
  };

  const handleOpenMealScan = () => {
    setQuickActionsVisible(false);
    setMealScanVisible(true);
  };

  // Step 1: Image selected from Camera or Gallery -> Open PhotoConfirmModal (Screenshot 3)
  const handleImageSelected = (imageUri: string, mimeType: string) => {
    setSelectedImageUri(imageUri);
    setSelectedMimeType(mimeType);
    setPhotoConfirmVisible(true);
  };

  // Step 2: User confirms photo & description -> Start Analysis Loading (Screenshot 4) -> Call Gemini API
  const handleAnalyzePhoto = async (descriptionText: string) => {
    if (!selectedImageUri) return;
    setPhotoConfirmVisible(false);
    setAnalysisLoadingVisible(true);
    setAiResult(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để sử dụng tính năng nhận diện AI.');
        setAnalysisLoadingVisible(false);
        return;
      }

      const response = await mealService.analyzeImage(
        token,
        selectedImageUri,
        selectedMimeType,
        descriptionText
      );

      setAiResult(response.data);
      setAnalysisLoadingVisible(false);
      // Step 3: Open Nutrition Analysis Result Screen (Screenshots 1 & 2)
      setNutritionResultVisible(true);
    } catch (error: any) {
      setAnalysisLoadingVisible(false);
      Alert.alert('Lỗi nhận diện AI', error.message || 'Không thể kết nối đến server AI.');
    }
  };

  // Handle direct text description analysis
  const handleTextDescriptionSelected = async (descriptionText: string) => {
    setSelectedImageUri(null);
    setAnalysisLoadingVisible(true);
    setAiResult(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để sử dụng tính năng phân tích AI.');
        setAnalysisLoadingVisible(false);
        return;
      }

      const response = await mealService.analyzeText(token, descriptionText);
      setAiResult(response.data);
      setAnalysisLoadingVisible(false);
      setNutritionResultVisible(true);
    } catch (error: any) {
      setAnalysisLoadingVisible(false);
      Alert.alert('Lỗi phân tích AI', error.message || 'Không thể phân tích mô tả bữa ăn.');
    }
  };

  // Save AI confirmed meal log to MongoDB
  const handleSaveAISuggestedMeal = async (data: {
    food_name: string;
    portion_grams: number;
    calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
    meal_type: MealType;
    recognition_id?: string;
  }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để lưu bữa ăn.');
        return;
      }

      await mealService.logMeal(token, {
        input_method: selectedImageUri ? 'photo' : 'text',
        source_image_url: selectedImageUri || undefined,
        description_text: data.food_name,
        portion_grams: data.portion_grams,
        calories: data.calories,
        protein_g: data.protein_g,
        carb_g: data.carb_g,
        fat_g: data.fat_g,
        meal_type: data.meal_type,
        recognition_summary: {
          recognition_id: data.recognition_id,
          predicted_label: aiResult?.food_name,
          confidence: aiResult?.confidence,
          corrected_label: data.food_name,
        },
      });

      setNutritionResultVisible(false);
      Alert.alert('Thành công 🎉', `Đã lưu bữa ăn "${data.food_name}" (${data.calories} kcal) vào nhật ký!`);
    } catch (error: any) {
      Alert.alert('Lỗi lưu bữa ăn', error.message || 'Không thể lưu bữa ăn vào nhật ký.');
    }
  };

  // Save Manual / Home Cooking meal log
  const handleSaveManualMeal = async (data: {
    meal_type: MealType;
    ingredients: IngredientInput[];
    totalCalories: number;
    totalProtein: number;
    totalCarb: number;
    totalFat: number;
  }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để lưu bữa ăn.');
        return;
      }

      await mealService.logMeal(token, {
        input_method: 'manual',
        meal_type: data.meal_type,
        calories: data.totalCalories,
        protein_g: data.totalProtein,
        carb_g: data.totalCarb,
        fat_g: data.totalFat,
        ingredients: data.ingredients,
      });

      setManualLogVisible(false);
      Alert.alert('Thành công 🎉', `Đã lưu bữa ăn tự nấu (${data.totalCalories} kcal) vào nhật ký!`);
    } catch (error: any) {
      Alert.alert('Lỗi lưu bữa ăn', error.message || 'Không thể lưu bữa ăn tự nấu.');
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10B981',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}>
        
        {/* Tab 1: Trang chủ */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Tab 2: Sức khỏe */}
        <Tabs.Screen
          name="health"
          options={{
            title: 'Sức khỏe',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'pulse' : 'pulse-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Tab 3 (Center Action Button): Quick Actions */}
        <Tabs.Screen
          name="quick-actions-stub"
          options={{
            title: '',
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.centerButtonContainer}
                onPress={handleOpenQuickActions}
                activeOpacity={0.88}
                accessibilityLabel="Mở tác vụ nhanh">
                <View style={styles.centerButton}>
                  <MaterialCommunityIcons name="grid-large" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handleOpenQuickActions();
            },
          }}
        />

        {/* Tab 4: Nhật ký */}
        <Tabs.Screen
          name="diary"
          options={{
            title: 'Nhật ký',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Tab 5: Khám phá */}
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Khám phá',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* QUICK ACTIONS BOTTOM SHEET MODAL */}
      <QuickActionsModal
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
        onOpenMealScan={handleOpenMealScan}
      />

      {/* MEAL SCAN SELECTION MODAL */}
      <MealScanModal
        visible={mealScanVisible}
        onClose={() => setMealScanVisible(false)}
        onImageSelected={handleImageSelected}
        onTextDescriptionSelected={handleTextDescriptionSelected}
        onManualCookingSelected={() => setManualLogVisible(true)}
      />

      {/* STEP 1: PHOTO CONFIRMATION MODAL (Screenshot 3) */}
      <PhotoConfirmModal
        visible={photoConfirmVisible}
        imageUri={selectedImageUri}
        onClose={() => setPhotoConfirmVisible(false)}
        onAnalyze={handleAnalyzePhoto}
      />

      {/* STEP 2: ANALYSIS LOADING POPUP (Screenshot 4) */}
      <AnalysisLoadingModal visible={analysisLoadingVisible} />

      {/* STEP 3: DETAILED NUTRITION ANALYSIS RESULT MODAL (Screenshots 1 & 2) */}
      <NutritionAnalysisResultModal
        visible={nutritionResultVisible}
        imageUri={selectedImageUri}
        result={aiResult}
        onClose={() => setNutritionResultVisible(false)}
        onConfirmSave={handleSaveAISuggestedMeal}
      />

      {/* MANUAL / HOME COOKING MEAL LOG MODAL */}
      <ManualMealLogModal
        visible={manualLogVisible}
        onClose={() => setManualLogVisible(false)}
        onConfirmSave={handleSaveManualMeal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 86 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  centerButtonContainer: {
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
