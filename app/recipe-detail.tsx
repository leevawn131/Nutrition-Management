import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddCommentSheet } from '@/components/plan/add-comment-sheet';
import { CookingStepsModal } from '@/components/plan/cooking-steps-modal';
import { GroceryCartModal } from '@/components/plan/grocery-cart-modal';
import { recipeService } from '@/services/recipe.service';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    imageUrl?: string;
    category?: string;
    mealType?: string;
    calories?: string;
    protein?: string;
    carb?: string;
    fat?: string;
  }>();

  const [isSaved, setIsSaved] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showCookingStepsModal, setShowCookingStepsModal] = useState(false);
  const [showAddCommentSheet, setShowAddCommentSheet] = useState(false);
  const [commentCountState, setCommentCountState] = useState(6);

  const itemName = params.title || 'Lẩu cá tôm';
  const itemImage =
    params.imageUrl || 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624';
  const categoryName = params.category || 'Lẩu';
  const mealTypeName = params.mealType || 'Bữa tối';

  const itemCalories = Number(params.calories || 477.6);
  const itemProtein = Number(params.protein || 38.0);
  const itemCarb = Number(params.carb || 22.0);
  const itemFat = Number(params.fat || 14.5);

  const caloriePercent = 32;
  const proteinPercent = 32;
  const carbPercent = 11;
  const fatPercent = 26;

  const authorName = 'the Meal Chef';
  const authorInitials = 'TC';

  const prepTime = 20;
  const cookTime = 25;
  const servings = 2;
  const description =
    'Lẩu hải sản chua cay thơm nồng với cá tươi và tôm sú, nước dùng đậm vị lá chanh và sả ớt, giàu đạm và vitamin.';

  const ingredients = [
    { ingredient_name: 'Cá hồi / cá lăng', quantity: 250, unit: 'g' },
    { ingredient_name: 'Tôm sú tươi', quantity: 200, unit: 'g' },
    { ingredient_name: 'Cà chua, dứa', quantity: 150, unit: 'g' },
    { ingredient_name: 'Lá chanh, sả, ớt', quantity: 30, unit: 'g' },
    { ingredient_name: 'Nấm rơm, bắp ngọt', quantity: 100, unit: 'g' },
    { ingredient_name: 'Rau muống, hoa chuối', quantity: 150, unit: 'g' },
    { ingredient_name: 'Nước hầm xương', quantity: 800, unit: 'ml' },
  ];

  const steps = [
    { step_number: 1, instruction: 'Sơ chế cá cắt khúc vừa ăn, tôm rửa sạch để ráo. Rửa sạch các loại rau và nấm ăn kèm.' },
    { step_number: 2, instruction: 'Phi thơm sả, ớt băm, xào cà chua và dứa cho ra màu đẹp. Đổ nước hầm xương vào đun sôi, thêm lá chanh vò nhẹ.' },
    { step_number: 3, instruction: 'Nêm nếm gia vị lẩu chua cay vừa ăn. Cho cá và tôm vào nấu chín tới. Thưởng thức nóng kèm rau tươi và bún!' },
  ];

  const ratingText = '--';

  React.useEffect(() => {
    async function checkSavedState() {
      const saved = await recipeService.isRecipeSaved(params.id || itemName);
      setIsSaved(saved);
    }
    checkSavedState();
  }, [params.id, itemName]);

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert(`Đã sao chép liên kết chia sẻ món "${itemName}"!`);
        }
      } else {
        await Share.share({
          message: `Khám phá công thức món "${itemName}" thơm ngon bổ dưỡng trên Nutrition Management!`,
          title: itemName,
        });
      }
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleToggleSave = async () => {
    try {
      const result = await recipeService.toggleSaveRecipe({
        _id: params.id,
        title: itemName,
        image_url: itemImage,
        prep_time_minutes: prepTime,
        cook_time_minutes: cookTime,
        servings,
        calories_per_serving: itemCalories,
        protein_g: itemProtein,
        carb_g: itemCarb,
        fat_g: itemFat,
        ingredients,
        steps,
        description,
      });

      setIsSaved(result.isSaved);
      const msg = result.isSaved
        ? `Đã lưu công thức "${itemName}" vào bộ sưu tập "Món ăn yêu thích"!`
        : `Đã bỏ lưu công thức "${itemName}".`;

      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Bộ sưu tập', msg);
      }
    } catch (error) {
      console.warn('Error toggling save recipe:', error);
    }
  };

  const handleAddToCart = () => {
    setShowGroceryModal(true);
  };

  const handleOpenVideo = () => {
    setShowCookingStepsModal(true);
  };

  const handleOpenComments = () => {
    setShowAddCommentSheet(true);
  };

  const handleCommentSubmit = (_text: string) => {
    setCommentCountState((prev) => prev + 1);
  };

  const toggleIngredientCheck = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <View style={styles.detailRoot}>
      {/* Floating Top Navigation Header */}
      <SafeAreaView edges={['top']} style={styles.floatingHeaderSafeArea}>
        <View style={styles.floatingHeaderRow}>
          <TouchableOpacity
            style={styles.headerCircleButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityLabel="Quay lại">
            <Ionicons name="arrow-back" size={22} color="#10294B" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {itemName}
          </Text>

          <TouchableOpacity
            style={styles.headerCircleButton}
            onPress={handleShare}
            activeOpacity={0.8}
            accessibilityLabel="Chia sẻ món ăn">
            <Ionicons name="paper-plane-outline" size={20} color="#10294B" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.detailScrollView}
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Banner Image */}
        <View style={styles.heroImageWrapper}>
          <Image source={{ uri: itemImage }} style={styles.heroImage} resizeMode="cover" />
        </View>

        {/* Floating Info Card overlapping the hero image */}
        <View style={styles.floatingInfoCard}>
          {/* Badges Row: Red (Category) | Teal (Meal Type) | Blue (+10) */}
          <View style={styles.cardTagsRow}>
            <View style={[styles.tagPill, styles.tagPillRed]}>
              <Text style={styles.tagPillText}>{categoryName}</Text>
            </View>

            <View style={[styles.tagPill, styles.tagPillTeal]}>
              <Text style={styles.tagPillText}>{mealTypeName}</Text>
            </View>

            <View style={[styles.tagPill, styles.tagPillBlue]}>
              <Text style={styles.tagPillText}>{+10}</Text>
            </View>
          </View>

          {/* Dish Title */}
          <Text style={styles.cardTitle}>{itemName}</Text>

          {/* Chef Author Line */}
          <View style={styles.authorRow}>
            <Text style={styles.authorBy}>by</Text>
            <View style={styles.authorAvatarBadge}>
              <Text style={styles.authorAvatarText}>{authorInitials}</Text>
            </View>
            <Text style={styles.authorName}>{authorName}</Text>
          </View>

          {/* Rating & Reviews Line */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingGroup}>
              <Text style={styles.ratingText}>{ratingText}</Text>
              <Ionicons name="star" size={16} color="#F59E0B" style={styles.starIcon} />
              <Text style={styles.ratingCount}>({ratingText})</Text>
            </View>

            <View style={styles.commentGroup}>
              <Ionicons name="chatbubble" size={16} color="#3B82F6" />
              <Text style={styles.commentCount}>({commentCountState})</Text>
            </View>
          </View>
        </View>

        {/* Detailed Content Body */}
        <View style={styles.cardBodyContent}>
          {/* Description */}
          <Text style={styles.recipeDescription}>{description}</Text>

          {/* Quick Meta Row */}
          <View style={styles.quickMetaCard}>
            <View style={styles.quickMetaItem}>
              <Ionicons name="time-outline" size={20} color="#49C99B" />
              <Text style={styles.quickMetaValue}>{prepTime + cookTime} phút</Text>
              <Text style={styles.quickMetaLabel}>Thời gian nấu</Text>
            </View>

            <View style={styles.quickMetaDivider} />

            <View style={styles.quickMetaItem}>
              <Ionicons name="people-outline" size={20} color="#3B82F6" />
              <Text style={styles.quickMetaValue}>{servings} phần</Text>
              <Text style={styles.quickMetaLabel}>Khẩu phần</Text>
            </View>

            <View style={styles.quickMetaDivider} />

            <View style={styles.quickMetaItem}>
              <MaterialCommunityIcons name="fire" size={22} color="#EF5350" />
              <Text style={styles.quickMetaValue}>
                {itemCalories % 1 === 0 ? itemCalories : itemCalories.toFixed(1)}
              </Text>
              <Text style={styles.quickMetaLabel}>kcal / phần</Text>
            </View>
          </View>

          {/* Nutrition Breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Thành phần dinh dưỡng</Text>
            <Text style={styles.sectionSubheading}>
              Tỷ lệ phần trăm tính trên mục tiêu nhu cầu hàng ngày của bạn
            </Text>

            {/* Calories */}
            <View style={styles.nutrientItemRow}>
              <Text style={styles.nutrientItemLabel}>Calories</Text>
              <View style={styles.nutrientItemRight}>
                <Text style={styles.nutrientItemValue}>
                  {itemCalories.toFixed(1)} kcal{' '}
                  <Text style={styles.nutrientItemPercent}>({caloriePercent}%)</Text>
                </Text>
                <View style={styles.nutrientItemTrack}>
                  <View
                    style={[
                      styles.nutrientItemFill,
                      { width: `${Math.min(100, caloriePercent)}%`, backgroundColor: '#49C99B' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Protein */}
            <View style={styles.nutrientItemRow}>
              <Text style={styles.nutrientItemLabel}>Chất đạm (Protein)</Text>
              <View style={styles.nutrientItemRight}>
                <Text style={styles.nutrientItemValue}>
                  {itemProtein.toFixed(1)}g{' '}
                  <Text style={styles.nutrientItemPercent}>({proteinPercent}%)</Text>
                </Text>
                <View style={styles.nutrientItemTrack}>
                  <View
                    style={[
                      styles.nutrientItemFill,
                      { width: `${Math.min(100, proteinPercent)}%`, backgroundColor: '#38BDF8' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Carb */}
            <View style={styles.nutrientItemRow}>
              <Text style={styles.nutrientItemLabel}>Đường bột (Carbohydrate)</Text>
              <View style={styles.nutrientItemRight}>
                <Text style={styles.nutrientItemValue}>
                  {itemCarb.toFixed(1)}g{' '}
                  <Text style={styles.nutrientItemPercent}>({carbPercent}%)</Text>
                </Text>
                <View style={styles.nutrientItemTrack}>
                  <View
                    style={[
                      styles.nutrientItemFill,
                      { width: `${Math.min(100, carbPercent)}%`, backgroundColor: '#F59E0B' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Fat */}
            <View style={styles.nutrientItemRow}>
              <Text style={styles.nutrientItemLabel}>Chất béo (Fat)</Text>
              <View style={styles.nutrientItemRight}>
                <Text style={styles.nutrientItemValue}>
                  {itemFat.toFixed(1)}g{' '}
                  <Text style={styles.nutrientItemPercent}>({fatPercent}%)</Text>
                </Text>
                <View style={styles.nutrientItemTrack}>
                  <View
                    style={[
                      styles.nutrientItemFill,
                      { width: `${Math.min(100, fatPercent)}%`, backgroundColor: '#FB7185' },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeading}>Nguyên liệu ({ingredients.length})</Text>
              <TouchableOpacity onPress={handleAddToCart} activeOpacity={0.7}>
                <Text style={styles.sectionActionText}>+ Đi chợ</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ingredientsBox}>
              {ingredients.map((ing, idx) => {
                const isChecked = Boolean(checkedIngredients[idx]);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.ingredientCheckRow}
                    onPress={() => toggleIngredientCheck(idx)}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isChecked ? '#49C99B' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.ingredientCheckName,
                        isChecked && styles.ingredientCheckNameDone,
                      ]}>
                      {ing.ingredient_name}
                    </Text>
                    {ing.quantity ? (
                      <Text style={styles.ingredientCheckQty}>
                        {ing.quantity} {ing.unit || ''}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Cooking Steps Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Cách chế biến</Text>
            <View style={styles.stepsBox}>
              {steps.map((st, idx) => (
                <View key={idx} style={styles.stepItemCard}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{st.step_number || idx + 1}</Text>
                  </View>
                  <Text style={styles.stepBodyText}>{st.instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Bar matching screenshot */}
      <View style={styles.bottomActionBar}>
        {/* Button 1: Green Circle - Shopping Cart */}
        <TouchableOpacity
          style={[styles.circleActionBtn, { backgroundColor: '#49C99B' }]}
          onPress={handleAddToCart}
          activeOpacity={0.8}
          accessibilityLabel="Thêm vào danh sách đi chợ">
          <Ionicons name="cart" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Button 2: Blue Circle - Video/Play */}
        <TouchableOpacity
          style={[styles.circleActionBtn, { backgroundColor: '#3B82F6' }]}
          onPress={handleOpenVideo}
          activeOpacity={0.8}
          accessibilityLabel="Xem các bước nấu">
          <Ionicons name="play" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Button 3: Orange Circle - Comments/Notes */}
        <TouchableOpacity
          style={[styles.circleActionBtn, { backgroundColor: '#F59E0B' }]}
          onPress={handleOpenComments}
          activeOpacity={0.8}
          accessibilityLabel="Thêm bình luận">
          <MaterialCommunityIcons name="comment-text-multiple" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Button 4: Green Pill Button - "Lưu lại" with Bookmark icon */}
        <TouchableOpacity
          style={[styles.savePillBtn, isSaved && styles.savePillBtnSaved]}
          onPress={handleToggleSave}
          activeOpacity={0.85}
          accessibilityLabel="Lưu công thức">
          <Text style={styles.savePillBtnText}>{isSaved ? 'Đã lưu' : 'Lưu lại'}</Text>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 1. Modal Thêm nguyên liệu vào giỏ (Green button) */}
      <GroceryCartModal
        visible={showGroceryModal}
        recipeTitle={itemName}
        recipeIngredients={ingredients}
        onClose={() => setShowGroceryModal(false)}
      />

      {/* 2. Modal Các bước nấu (Blue button) */}
      <CookingStepsModal
        visible={showCookingStepsModal}
        onClose={() => setShowCookingStepsModal(false)}
      />

      {/* 3. Sheet Thêm bình luận (Yellow button) */}
      <AddCommentSheet
        visible={showAddCommentSheet}
        onClose={() => setShowAddCommentSheet(false)}
        onSubmit={handleCommentSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  detailRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  floatingHeaderSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  floatingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10294B',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    paddingBottom: 110,
  },
  heroImageWrapper: {
    width: '100%',
    height: 380,
    backgroundColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  floatingInfoCard: {
    marginTop: -80,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPillRed: {
    backgroundColor: '#EF5350',
  },
  tagPillTeal: {
    backgroundColor: '#49C99B',
  },
  tagPillBlue: {
    backgroundColor: '#3B82F6',
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10294B',
    textAlign: 'center',
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  authorBy: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#64748B',
  },
  authorAvatarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 4,
  },
  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10294B',
  },
  starIcon: {
    marginHorizontal: 1,
  },
  ratingCount: {
    fontSize: 13,
    color: '#94A3B8',
  },
  commentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  cardBodyContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  recipeDescription: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 18,
  },
  quickMetaCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickMetaValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10294B',
    marginTop: 4,
    marginBottom: 2,
  },
  quickMetaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  quickMetaDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 4,
  },
  sectionSubheading: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#49C99B',
  },
  nutrientItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  nutrientItemLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#334155',
  },
  nutrientItemRight: {
    alignItems: 'flex-end',
  },
  nutrientItemValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#10294B',
    marginBottom: 4,
  },
  nutrientItemPercent: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
  },
  nutrientItemTrack: {
    width: 90,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  nutrientItemFill: {
    height: '100%',
    borderRadius: 3,
  },
  ingredientsBox: {
    gap: 12,
  },
  ingredientCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  ingredientCheckName: {
    flex: 1,
    fontSize: 14.5,
    color: '#1E293B',
    fontWeight: '500',
  },
  ingredientCheckNameDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  ingredientCheckQty: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  stepsBox: {
    gap: 14,
  },
  stepItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#49C99B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  stepBodyText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#334155',
  },

  // Bottom Fixed Bar
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  circleActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  savePillBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#49C99B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#49C99B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  savePillBtnSaved: {
    backgroundColor: '#059669',
  },
  savePillBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
