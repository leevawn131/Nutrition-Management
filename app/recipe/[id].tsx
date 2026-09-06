import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { recipeService } from '@/services/recipe.service';
import { Recipe, IngredientItem } from '@/types/recipe.types';
import { getAuthToken } from '@/services/storage.service';
import { calculateRecipeNutritionFromIngredients } from '@/constants/foodDatabase';
import { StepByStepCookingModal } from '@/components/recipe/StepByStepCookingModal';

const { width } = Dimensions.get('window');

const QUICK_TAGS = [
  'Ngon xuất sắc',
  'Ngọt',
  'Cay',
  'Nhạt',
  'Mềm ẩm',
  'Khô',
  'Giòn',
  'Tươi',
  'Dễ làm',
  'Phù hợp cho trẻ em',
  'Làm dưới 30 phút',
];

export default function RecipeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const recipeId = params.id || 'thit-nac-rim';
  const insets = useSafeAreaInsets();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recipe' | 'nutrition' | 'comments'>('recipe');

  // Dynamic Servings state
  const [servings, setServings] = useState(1);

  // Review & Rating State
  const [userRating, setUserRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Ngon xuất sắc']);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // GL explanation modal
  const [glModalVisible, setGlModalVisible] = useState(false);

  // Cooking mode modal
  const [cookingModeVisible, setCookingModeVisible] = useState(false);
  const [userAuthToken, setUserAuthToken] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!recipe) return;
    setIsDeleting(true);
    try {
      const token = await getAuthToken();
      await recipeService.deleteRecipe(token, recipe._id);
      setShowDeleteModal(false);
      const msg = 'Đã xóa công thức món ăn thành công! 🗑️';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Thành công', msg);
      router.back();
    } catch (e: any) {
      console.error('Error deleting recipe:', e);
      const errMsg = e.message || 'Không thể xóa công thức món ăn này.';
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Lỗi', errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchRecipeData();
    getAuthToken().then(setUserAuthToken);
  }, [recipeId]);

  const fetchRecipeData = async () => {
    setIsLoading(true);
    try {
      const response = await recipeService.getRecipeById(recipeId);
      if (response && response.data) {
        setRecipe(response.data);
        setServings(response.data.servings || 1);
      }
    } catch (error: any) {
      console.error('Error fetching recipe detail:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải thông tin món ăn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServingChange = (delta: number) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setServings((prev) => Math.max(1, prev + delta));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddGrocery = async () => {
    if (!recipe) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }

    try {
      const token = await getAuthToken();
      const scaledIngredients = recipe.ingredients.map((item) => ({
        name: item.name,
        amount: Number((item.amount * servings).toFixed(1)),
        unit: item.unit,
      }));

      await recipeService.addFromRecipe(token, {
        recipe_id: recipe._id,
        servings,
        ingredients: scaledIngredients,
      });

      Alert.alert(
        'Thành công 🎉',
        `Đã thêm ${scaledIngredients.length} nguyên liệu (${servings} khẩu phần) vào Danh sách mua sắm của bạn!`
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể thêm nguyên liệu vào danh sách mua sắm.');
    }
  };

  const handleSubmitReview = async () => {
    if (!recipe) return;
    setIsSubmittingReview(true);

    try {
      const token = await getAuthToken();
      const response = await recipeService.submitReview(token, recipe._id, {
        rating: userRating,
        quick_tags: selectedTags,
        comment: commentText.trim(),
      });

      if (response && response.data) {
        setRecipe(response.data);
        setCommentText('');
        Alert.alert('Đánh giá thành công 🌟', 'Cảm ơn bạn đã chia sẻ cảm nhận về món ăn!');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi đánh giá.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const toggleBookmark = () => {
    setIsSaved(!isSaved);
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    Alert.alert(
      isSaved ? 'Đã bỏ lưu' : 'Đã lưu món ăn 🔖',
      isSaved
        ? 'Món ăn đã được xóa khỏi bộ sưu tập của bạn.'
        : 'Món ăn đã được lưu vào bộ sưu tập cá nhân!'
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải chi tiết món ăn...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy món ăn!</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Dynamic calculations based on servings
  const baseServings = recipe.servings || 1;
  const scaleRatio = servings / baseServings;

  const computedNutrition = calculateRecipeNutritionFromIngredients(recipe.ingredients || [], servings);

  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;

  const activeNutrition = hasIngredients
    ? computedNutrition
    : (recipe.nutrition_facts && recipe.nutrition_facts.calories)
    ? {
        calories: Math.round(recipe.nutrition_facts.calories * scaleRatio),
        protein_g: Number((recipe.nutrition_facts.protein_g * scaleRatio).toFixed(1)),
        carb_g: Number((recipe.nutrition_facts.carb_g * scaleRatio).toFixed(1)),
        fat_g: Number((recipe.nutrition_facts.fat_g * scaleRatio).toFixed(1)),
        saturated_fat_g: Number(((recipe.nutrition_facts.saturated_fat_g || 0) * scaleRatio).toFixed(1)),
        trans_fat_g: Number(((recipe.nutrition_facts.trans_fat_g || 0) * scaleRatio).toFixed(1)),
        unsaturated_fat_g: Number(((recipe.nutrition_facts.unsaturated_fat_g || 0) * scaleRatio).toFixed(1)),
        fiber_g: Number(((recipe.nutrition_facts.fiber_g || 0) * scaleRatio).toFixed(1)),
        cholesterol_mg: Math.round((recipe.nutrition_facts.cholesterol_mg || 0) * scaleRatio),
        sodium_mg: Math.round((recipe.nutrition_facts.sodium_mg || 0) * scaleRatio),
        vitamin_a_ug: Math.round((recipe.nutrition_facts.vitamin_a_ug || 0) * scaleRatio),
        vitamin_c_mg: Math.round((recipe.nutrition_facts.vitamin_c_mg || 0) * scaleRatio),
        vitamin_e_mg: Number(((recipe.nutrition_facts.vitamin_e_mg || 0) * scaleRatio).toFixed(1)),
        vitamin_k_ug: Math.round((recipe.nutrition_facts.vitamin_k_ug || 0) * scaleRatio),
        folic_acid_ug: Math.round((recipe.nutrition_facts.folic_acid_ug || 0) * scaleRatio),
        vitamin_b12_ug: Number(((recipe.nutrition_facts.vitamin_b12_ug || 0) * scaleRatio).toFixed(1)),
        calcium_mg: Math.round((recipe.nutrition_facts.calcium_mg || 0) * scaleRatio),
        iron_mg: Number(((recipe.nutrition_facts.iron_mg || 0) * scaleRatio).toFixed(1)),
        zinc_mg: Number(((recipe.nutrition_facts.zinc_mg || 0) * scaleRatio).toFixed(1)),
        magnesium_mg: Math.round((recipe.nutrition_facts.magnesium_mg || 0) * scaleRatio),
        potassium_mg: Math.round((recipe.nutrition_facts.potassium_mg || 0) * scaleRatio),
        phosphorus_mg: Math.round((recipe.nutrition_facts.phosphorus_mg || 0) * scaleRatio),
        glycemic_load: Number(((recipe.nutrition_facts.glycemic_load || 0) * scaleRatio).toFixed(1)),
      }
    : computedNutrition;

  const totalCalories = activeNutrition.calories;
  const totalProtein = activeNutrition.protein_g;
  const totalCarb = activeNutrition.carb_g;
  const totalFat = activeNutrition.fat_g;
  const glIndex = activeNutrition.glycemic_load;

  const proteinDV = Math.round((totalProtein / 50) * 100);
  const carbDV = Math.round((totalCarb / 275) * 100);
  const fatDV = Math.round((totalFat / 78) * 100);

  return (
    <View style={styles.container}>
      {/* Fixed Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.topBarContainer}>
          <TouchableOpacity style={styles.circularBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitleText} numberOfLines={1}>
            {recipe.title}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {/* Eye / Overview Button */}
            <TouchableOpacity
              style={styles.circularBtn}
              onPress={() => router.push(`/recipe/overview/${recipe._id}` as any)}>
              <Ionicons name="eye-outline" size={18} color="#0F172A" />
            </TouchableOpacity>

            {/* Edit Button */}
            <TouchableOpacity
              style={styles.circularBtn}
              onPress={() => router.push(`/recipe/edit/${recipe._id}` as any)}>
              <Ionicons name="create-outline" size={18} color="#0F172A" />
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.circularBtn, { backgroundColor: '#FEE2E2' }]}
              onPress={() => setShowDeleteModal(true)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Image & Parallax Card */}
        <View style={styles.coverImageContainer}>
          <Image
            source={{
              uri:
                recipe.cover_image_url &&
                !recipe.cover_image_url.startsWith('file://') &&
                !recipe.cover_image_url.startsWith('blob:')
                  ? recipe.cover_image_url
                  : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />

          {/* Author Floating Card (Screenshot 4) */}
          <View style={styles.authorCard}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{recipe.category || 'Món chính'}</Text>
            </View>

            <Text style={styles.recipeTitleLarge}>{recipe.title}</Text>

            <View style={styles.authorRow}>
              <Text style={styles.byText}>by </Text>
              <Image
                source={{ uri: recipe.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
                style={styles.authorAvatar}
              />
              <Text style={styles.authorNameText}>{recipe.author?.name || 'Kiều Trang'}</Text>
            </View>

            <View style={styles.ratingStatsRow}>
              <Text style={styles.starText}>-- ⭐ (--)</Text>
              <View style={styles.savedBadge}>
                <Ionicons name="bookmark-outline" size={14} color="#2563EB" />
                <Text style={styles.savedCountText}>({recipe.saved_count || 19})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3-Tab Navigation Bar */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'recipe' && styles.activeTabButton]}
            onPress={() => setActiveTab('recipe')}>
            <Text style={[styles.tabText, activeTab === 'recipe' && styles.activeTabText]}>Công thức</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'nutrition' && styles.activeTabButton]}
            onPress={() => setActiveTab('nutrition')}>
            <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>Dinh Dưỡng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'comments' && styles.activeTabButton]}
            onPress={() => setActiveTab('comments')}>
            <Text style={[styles.tabText, activeTab === 'comments' && styles.activeTabText]}>Bình luận</Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: CÔNG THỨC */}
        {activeTab === 'recipe' && (
          <View style={styles.tabContentSection}>
            {/* Time Metadata */}
            <View style={styles.timeMetadataRow}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.timeMetaText}>
                Chuẩn bị: <Text style={styles.boldTime}>{recipe.prep_time_min} min</Text>  Thời gian:{' '}
                <Text style={styles.boldTime}>{recipe.cook_time_min} min</Text>
              </Text>
            </View>

            {/* Ingredients Header & Dynamic Servings Counter */}
            <Text style={styles.sectionHeaderTitle}>Nguyên liệu</Text>
            <View style={styles.servingsControlRow}>
              <TouchableOpacity style={styles.servingCircleBtnRed} onPress={() => handleServingChange(-1)}>
                <Ionicons name="remove" size={18} color="#DC2626" />
              </TouchableOpacity>
              <Text style={styles.servingsCountText}>{servings} khẩu phần</Text>
              <TouchableOpacity style={styles.servingCircleBtnGreen} onPress={() => handleServingChange(1)}>
                <Ionicons name="add" size={18} color="#10B981" />
              </TouchableOpacity>
            </View>

            {/* Dynamic Scaled Ingredients List */}
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((item, index) => {
                const scaledAmount = Number((item.amount * scaleRatio).toFixed(1));
                return (
                  <View key={index} style={styles.ingredientRow}>
                    <View style={styles.ingredientIconCircle}>
                      <Text style={{ fontSize: 18 }}>{item.icon_url || '🥗'}</Text>
                    </View>

                    <Text style={styles.ingredientText}>
                      <Text style={styles.ingredientAmountBold}>{scaledAmount} {item.unit} </Text>
                      {item.name}
                    </Text>

                    <TouchableOpacity
                      style={styles.infoIconBtn}
                      onPress={() =>
                        router.push(
                          `/ingredient/${item.food_item_id || 'thit-bo-xay'}?name=${encodeURIComponent(
                            item.name
                          )}` as any
                        )
                      }>
                      <Ionicons name="information-circle-outline" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Step-by-Step Cooking Instructions */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Các bước thực hiện</Text>
            <View style={styles.stepsList}>
              {recipe.steps.map((step, index) => (
                <View key={index} style={styles.stepItemCard}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>Bước {step.step_number}</Text>
                  </View>
                  {step.title ? <Text style={styles.stepTitleText}>{step.title}</Text> : null}
                  <Text style={styles.stepDescText}>{step.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: DINH DƯỠNG */}
        {activeTab === 'nutrition' && (
          <View style={styles.tabContentSection}>
            <Text style={styles.sectionHeaderTitle}>Tổng quan dinh dưỡng</Text>
            <Text style={styles.subtextNotice}>
              Tỷ lệ phần trăm được tính theo mức năng lượng khuyến nghị riêng của bạn.
            </Text>

            {/* Total Energy Center */}
            <View style={styles.totalEnergyCenterCard}>
              <Text style={styles.totalEnergyLabel}>Tổng năng lượng</Text>
              <Text style={styles.totalEnergyValue}>{totalCalories} kcal</Text>
            </View>

            {/* 3 Circular Rings (%DV of Daily Target) */}
            <View style={styles.ringsRow}>
              {/* Đạm */}
              <View style={styles.ringItemCol}>
                <View style={[styles.outerRing, { borderColor: '#10B981' }]}>
                  <Text style={styles.ringPercentText}>{proteinDV}%</Text>
                </View>
                <Text style={styles.ringLabelText}>Đạm {totalProtein}g</Text>
              </View>

              {/* Tinh bột */}
              <View style={styles.ringItemCol}>
                <View style={[styles.outerRing, { borderColor: '#CBD5E1' }]}>
                  <Text style={styles.ringPercentText}>{carbDV}%</Text>
                </View>
                <Text style={styles.ringLabelText}>Tinh bột {totalCarb}g</Text>
              </View>

              {/* Chất béo */}
              <View style={styles.ringItemCol}>
                <View style={[styles.outerRing, { borderColor: '#34D399' }]}>
                  <Text style={styles.ringPercentText}>{fatDV}%</Text>
                </View>
                <Text style={styles.ringLabelText}>Chất béo {totalFat}g</Text>
              </View>
            </View>

            {/* Glycemic Load (GL) Index Bar */}
            <View style={styles.glSectionCard}>
              <Text style={styles.glTitleText}>
                Chỉ số tải đường huyết (Glycemic Load index): <Text style={styles.glBoldVal}>{glIndex}</Text>
              </Text>

              {/* GL Bar (0-10 Green, 10-20 Yellow, 20+ Red) */}
              <View style={styles.glBarContainer}>
                <View style={[styles.glPointerMarker, { left: `${Math.min(100, (glIndex / 25) * 100)}%` }]}>
                  <Ionicons name="caret-down" size={14} color="#10B981" />
                </View>

                <View style={styles.glColorScaleBar}>
                  <View style={[styles.glSegment, { backgroundColor: '#34D399', flex: 10 }]} />
                  <View style={[styles.glSegment, { backgroundColor: '#FBBF24', flex: 10 }]} />
                  <View style={[styles.glSegment, { backgroundColor: '#F87171', flex: 10 }]} />
                </View>

                <View style={styles.glScaleLabelsRow}>
                  <Text style={styles.glScaleLabel}>10</Text>
                  <Text style={styles.glScaleLabel}>20</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.whatIsGlBtn} onPress={() => setGlModalVisible(true)}>
                <Text style={styles.whatIsGlBtnText}>What is Glycemic Load (GL)?</Text>
              </TouchableOpacity>
            </View>

            {/* Detailed Grouped Nutrition List (Screenshots 1 & 2) */}
            <View style={styles.nutritionGroupContainer}>
              <Text style={styles.groupHeaderTitle}>Giá trị dinh dưỡng mỗi khẩu phần</Text>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Năng lượng</Text>
                <Text style={styles.nutriValueBold}>{totalCalories} Calo</Text>
              </View>

              <Text style={[styles.groupHeaderTitle, { marginTop: 18 }]}>Chất sinh năng lượng</Text>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Chất đạm</Text>
                <Text style={styles.nutriValueBold}>{totalProtein} g</Text>
              </View>

              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Chất béo</Text>
                <Text style={styles.nutriValueBold}>{totalFat} g</Text>
              </View>
              <View style={styles.subNutritionRow}>
                <Text style={styles.subNutriLabel}>Chất béo bão hòa</Text>
                <Text style={styles.subNutriValue}>{activeNutrition.saturated_fat_g} g</Text>
              </View>
              <View style={styles.subNutritionRow}>
                <Text style={styles.subNutriLabel}>Chất béo chuyển hóa</Text>
                <Text style={styles.subNutriValue}>{activeNutrition.trans_fat_g} g</Text>
              </View>
              <View style={styles.subNutritionRow}>
                <Text style={styles.subNutriLabel}>Chất béo không bão hòa</Text>
                <Text style={styles.subNutriValue}>{activeNutrition.unsaturated_fat_g} g</Text>
              </View>

              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Chất bột đường</Text>
                <Text style={styles.nutriValueBold}>{totalCarb} g</Text>
              </View>

              <Text style={[styles.groupHeaderTitle, { marginTop: 18 }]}>Chất cần theo dõi</Text>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Chất xơ</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.fiber_g} g</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Cholesterol</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.cholesterol_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Muối</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.sodium_mg} mg</Text>
              </View>

              <Text style={[styles.groupHeaderTitle, { marginTop: 18 }]}>Vitamin</Text>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Vitamin A</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.vitamin_a_ug} ug</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Vitamin E</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.vitamin_e_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Vitamin K</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.vitamin_k_ug} ug</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Vitamin C</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.vitamin_c_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Acid Folic</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.folic_acid_ug} ug</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Vitamin B12</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.vitamin_b12_ug} ug</Text>
              </View>

              <Text style={[styles.groupHeaderTitle, { marginTop: 18 }]}>Khoáng chất</Text>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Canxi</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.calcium_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Sắt</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.iron_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Kẽm</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.zinc_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Magie</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.magnesium_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Kali</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.potassium_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Natri</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.sodium_mg} mg</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutriLabel}>Phospho</Text>
                <Text style={styles.nutriValueBold}>{activeNutrition.phosphorus_mg} mg</Text>
              </View>
            </View>

            {/* Legal Disclaimer Footer */}
            <Text style={styles.disclaimerText}>
              Tuyên bố miễn trừ trách nhiệm: Tất cả thông tin và công cụ được trình bày và viết trên trang này chỉ nhằm
              mục đích cung cấp thông tin. Nếu bạn có bất kỳ thắc mắc hoặc lo lắng nào về sức khỏe của mình, vui lòng
              tham khảo ý kiến bác sĩ hoặc chuyên gia chăm sóc sức khỏe.
            </Text>
          </View>
        )}

        {/* TAB 3: BÌNH LUẬN */}
        {activeTab === 'comments' && (
          <View style={styles.tabContentSection}>
            {/* Rating Summary Header */}
            <View style={styles.ratingOverviewRow}>
              <Text style={styles.overallRatingScore}>5</Text>
              <View style={styles.starsWrapper}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={16} color="#F59E0B" />
                ))}
              </View>
              <Text style={styles.ratingCountSub}>2 ratings</Text>
            </View>
            <View style={styles.excellentBadgePill}>
              <Text style={styles.excellentBadgeText}>Ngon xuất sắc</Text>
            </View>

            {/* Add Review Box */}
            <View style={styles.reviewFormCard}>
              <Text style={styles.reviewFormTitle}>Đánh giá của bạn</Text>

              {/* Star Picker */}
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                    <Ionicons
                      name={star <= userRating ? 'star' : 'star-outline'}
                      size={28}
                      color="#F59E0B"
                      style={{ marginRight: 6 }}
                    />
                  </TouchableOpacity>
                ))}

                <View style={styles.confirmToggleRow}>
                  <TouchableOpacity style={styles.cancelBtnCircle}>
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.checkBtnCircle}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Feedback Tags */}
              <View style={styles.tagsCloudContainer}>
                {QUICK_TAGS.map((tag, idx) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                      onPress={() => toggleTag(tag)}>
                      <Text style={[styles.tagChipText, isSelected && styles.tagChipTextSelected]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comment Input */}
              <TextInput
                style={styles.commentInput}
                placeholder="Viết nhận xét của bạn..."
                placeholderTextColor="#94A3B8"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />

              <TouchableOpacity
                style={[styles.submitReviewBtn, isSubmittingReview && { opacity: 0.7 }]}
                onPress={handleSubmitReview}
                disabled={isSubmittingReview}>
                {isSubmittingReview ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>Gửi đánh giá</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Reviews List */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 20 }]}>Bình luận từ cộng đồng</Text>
            <View style={styles.reviewsListContainer}>
              {recipe.reviews && recipe.reviews.length > 0 ? (
                recipe.reviews.map((rev, i) => (
                  <View key={i} style={styles.reviewItemCard}>
                    <View style={styles.reviewUserRow}>
                      <Image
                        source={{ uri: rev.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
                        style={styles.reviewAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewUserName}>{rev.user_name}</Text>
                        <View style={styles.starRowSmall}>
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Ionicons
                              key={st}
                              name={st <= rev.rating ? 'star' : 'star-outline'}
                              size={12}
                              color="#F59E0B"
                            />
                          ))}
                        </View>
                      </View>
                    </View>

                    {rev.quick_tags && rev.quick_tags.length > 0 && (
                      <View style={styles.reviewTagsRow}>
                        {rev.quick_tags.map((t, ti) => (
                          <View key={ti} style={styles.miniTagBadge}>
                            <Text style={styles.miniTagText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.reviewCommentBody}>{rev.comment}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyReviewText}>Chưa có bình luận nào. Hãy là người đầu tiên đánh giá!</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Action Bar (Persistent at bottom of screen) */}
      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* 🛒 Green Cart Button */}
        <TouchableOpacity style={styles.bottomCartBtn} onPress={handleAddGrocery} activeOpacity={0.85}>
          <Ionicons name="cart" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 🎥 Blue Video/Play Button (Step-by-Step Cooking Mode) */}
        <TouchableOpacity style={styles.bottomVideoBtn} onPress={() => setCookingModeVisible(true)}>
          <Ionicons name="play" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 🟧 Orange Chat Button */}
        <TouchableOpacity style={styles.bottomChatBtn} onPress={() => Alert.alert('Hỏi AI', 'Hỏi trợ lý dinh dưỡng về món ăn này!')}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 🟢 Green Save/Bookmark Button */}
        <TouchableOpacity
          style={[styles.bottomSaveBtn, isSaved && styles.bottomSaveBtnActive]}
          onPress={toggleBookmark}
          activeOpacity={0.85}>
          <Text style={styles.bottomSaveBtnText}>{isSaved ? 'Đã lưu' : 'Lưu lại'}</Text>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* GL Explanation Modal */}
      <Modal transparent visible={glModalVisible} animationType="fade" onRequestClose={() => setGlModalVisible(false)}>
        <View style={styles.glModalOverlay}>
          <View style={styles.glModalContent}>
            <Text style={styles.glModalTitle}>Chỉ số Tải đường huyết (GL) là gì?</Text>
            <Text style={styles.glModalBody}>
              Glycemic Load (GL) phản ánh lượng đường thực tế nạp vào máu dựa trên khẩu phần ăn của bạn:{'\n\n'}
              • <Text style={{ fontWeight: '700', color: '#10B981' }}>0 - 10 (Thấp)</Text>: An toàn, không gây biến động đường huyết.{'\n'}
              • <Text style={{ fontWeight: '700', color: '#F59E0B' }}>11 - 19 (Trung bình)</Text>: Cần theo dõi khi dùng nhiều.{'\n'}
              • <Text style={{ fontWeight: '700', color: '#EF4444' }}>20+ (Cao)</Text>: Dễ làm tăng đường huyết nhanh chóng.
            </Text>
            <TouchableOpacity style={styles.closeGlModalBtn} onPress={() => setGlModalVisible(false)}>
              <Text style={styles.closeGlModalBtnText}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal (Issue #4) */}
      <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalBox}>
            <Ionicons name="trash-bin-outline" size={48} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
            <Text style={styles.deleteModalBody}>
              Bạn có chắc chắn muốn xóa công thức này?
            </Text>
            <View style={styles.deleteModalActionsRow}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}>
                <Text style={styles.deleteCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleDeleteConfirm}
                disabled={isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Xóa</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Step-by-Step Cooking Mode Modal (ISSUE #7) */}
      <StepByStepCookingModal
        visible={cookingModeVisible}
        onClose={() => setCookingModeVisible(false)}
        recipe={recipe}
        userToken={userAuthToken}
        onReviewSubmitted={(updatedRecipe) => {
          setRecipe(updatedRecipe);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
  backHomeBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  topBarContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  circularBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  coverImageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  authorCard: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  recipeTitleLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  byText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  authorNameText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  ratingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedCountText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 54,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#10B981',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#10B981',
    fontWeight: '700',
  },
  tabContentSection: {
    padding: 20,
  },
  timeMetadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  timeMetaText: {
    fontSize: 13.5,
    color: '#64748B',
  },
  boldTime: {
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  servingsControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  servingCircleBtnRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  servingCircleBtnGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  servingsCountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ingredientIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14.5,
    color: '#334155',
  },
  ingredientAmountBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  infoIconBtn: {
    padding: 4,
  },
  stepsList: {
    gap: 14,
  },
  stepItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stepNumberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  stepNumberText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  stepTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  stepDescText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  subtextNotice: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  totalEnergyCenterCard: {
    alignItems: 'center',
    marginVertical: 12,
  },
  totalEnergyLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  totalEnergyValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  ringItemCol: {
    alignItems: 'center',
  },
  outerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ringPercentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  ringLabelText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  glSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  glTitleText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
  },
  glBoldVal: {
    fontWeight: '800',
    color: '#0F172A',
  },
  glBarContainer: {
    position: 'relative',
    marginVertical: 10,
  },
  glPointerMarker: {
    position: 'absolute',
    top: -14,
    marginLeft: -7,
  },
  glColorScaleBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  glSegment: {
    height: '100%',
  },
  glScaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '33%',
    marginTop: 4,
  },
  glScaleLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  whatIsGlBtn: {
    alignSelf: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  whatIsGlBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  nutritionGroupContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  groupHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  nutriLabel: {
    fontSize: 14,
    color: '#334155',
  },
  nutriValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subNutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingLeft: 16,
  },
  subNutriLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  subNutriValue: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 20,
    lineHeight: 16,
    textAlign: 'justify',
  },
  ratingOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  overallRatingScore: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  starsWrapper: {
    flexDirection: 'row',
  },
  ratingCountSub: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  excellentBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  excellentBadgeText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  reviewFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  reviewFormTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  starPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  confirmToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsCloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagChipSelected: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tagChipText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  tagChipTextSelected: {
    color: '#059669',
    fontWeight: '700',
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitReviewBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  reviewsListContainer: {
    gap: 12,
  },
  reviewItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  starRowSmall: {
    flexDirection: 'row',
    marginTop: 2,
  },
  reviewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  miniTagBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 11.5,
    color: '#475569',
  },
  reviewCommentBody: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 18,
  },
  emptyReviewText: {
    fontSize: 13.5,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bottomCartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomVideoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSaveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#34D399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSaveBtnActive: {
    backgroundColor: '#059669',
  },
  bottomSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  glModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  glModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  glModalBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
  },
  closeGlModalBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeGlModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalBody: {
    fontSize: 14.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteModalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteCancelText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
