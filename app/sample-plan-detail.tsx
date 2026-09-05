import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { groceryService } from '@/services/grocery.service';
import { mealPlanTemplateService } from '@/services/meal_plan_template.service';
import { MealPlanTemplate, MealPlanTemplateItem, MealType, Recipe, RecipeIngredient } from '@/types/plan.types';

const { width } = Dimensions.get('window');

const MEAL_SECTIONS: { key: MealType; title: string }[] = [
  { key: 'breakfast', title: 'Bữa sáng' },
  { key: 'lunch', title: 'Bữa trưa' },
  { key: 'snack', title: 'Đồ ăn thêm trong ngày' },
  { key: 'dinner', title: 'Bữa tối' },
];

function formatYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function SamplePlanDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [template, setTemplate] = useState<MealPlanTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [nutritionModalVisible, setNutritionModalVisible] = useState(false);
  const [ingredientsModalVisible, setIngredientsModalVisible] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(formatYYYYMMDD(new Date()));
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      if (params.id) {
        const data = await mealPlanTemplateService.getTemplateById(params.id);
        setTemplate(data);
      } else {
        const list = await mealPlanTemplateService.getTemplates();
        setTemplate(list[0] || null);
      }
      setLoading(false);
    }
    loadTemplate();
  }, [params.id]);

  // Group items by meal_type
  const groupedItems = useMemo(() => {
    const map: Record<MealType, MealPlanTemplateItem[]> = {
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: [],
    };

    if (template && Array.isArray(template.items)) {
      template.items.forEach((item) => {
        if (map[item.meal_type]) {
          map[item.meal_type].push(item);
        }
      });
    }
    return map;
  }, [template]);

  // All ingredients in this template
  const allIngredients = useMemo(() => {
    const list: { name: string; quantity: string; recipeName: string }[] = [];
    if (template && Array.isArray(template.items)) {
      template.items.forEach((item) => {
        const recipe = typeof item.recipe_id === 'object' ? item.recipe_id : null;
        if (recipe && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach((ing: RecipeIngredient) => {
            list.push({
              name: ing.ingredient_name,
              quantity: ing.quantity ? `${ing.quantity} ${ing.unit || ''}`.trim() : 'Định lượng vừa đủ',
              recipeName: recipe.title,
            });
          });
        }
      });
    }
    return list;
  }, [template]);

  // Add all ingredients to grocery cart
  const handleAddAllToGrocery = async () => {
    if (allIngredients.length === 0) {
      Alert.alert('Thông báo', 'Không có nguyên liệu nào để thêm vào giỏ đi chợ.');
      return;
    }

    try {
      const groceryPayload = allIngredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: '',
        category: 'Thực đơn mẫu',
        recipe_name: ing.recipeName,
        checked: false,
      }));

      await groceryService.addIngredients(groceryPayload);
      Alert.alert(
        'Thành công! 🛒',
        `Đã thêm ${allIngredients.length} nguyên liệu từ thực đơn vào Giỏ đi chợ của bạn.`,
        [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Xem giỏ hàng', onPress: () => router.push('/grocery-cart' as any) },
        ]
      );
      setIngredientsModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm nguyên liệu vào giỏ đi chợ.');
    }
  };

  // Apply template to user's meal plan
  const handleConfirmApply = async () => {
    if (!template) return;
    setApplying(true);
    try {
      const success = await mealPlanTemplateService.applyTemplate(template._id, selectedDate);
      setApplyModalVisible(false);
      if (success) {
        Alert.alert(
          'Áp dụng thành công! 🎉',
          `Thực đơn "${template.name}" đã được lên lịch vào ngày ${selectedDate}.`,
          [
            {
              text: 'Xem kế hoạch',
              onPress: () => {
                router.replace('/plan' as any);
              },
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', 'Không thể áp dụng thực đơn mẫu. Vui lòng thử lại sau.');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi áp dụng thực đơn mẫu.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Đang tải chi tiết thực đơn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!template) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Không tìm thấy thông tin thực đơn</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backHomeBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const durationText = `${template.duration_days || 1} ngày`;

  // Total macro percentages
  const totalMacrosGrams = (template.total_protein_g || 0) + (template.total_carb_g || 0) + (template.total_fat_g || 0);
  const proteinPct = totalMacrosGrams > 0 ? Math.round(((template.total_protein_g || 0) / totalMacrosGrams) * 100) : 30;
  const carbPct = totalMacrosGrams > 0 ? Math.round(((template.total_carb_g || 0) / totalMacrosGrams) * 100) : 50;
  const fatPct = totalMacrosGrams > 0 ? 100 - proteinPct - carbPct : 20;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#334155" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {template.name}
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Image Banner */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri:
                template.image_url ||
                'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=1000&q=80',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.durationBadge}>
            <Text style={styles.durationBadgeText}>{durationText}</Text>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.infoSection}>
          <Text style={styles.templateTitle}>{template.name}</Text>
          <Text style={styles.templateDescription}>
            {template.description ||
              'Thực đơn được thiết kế với sự kết hợp hài hòa giữa các nhóm chất dinh dưỡng cần thiết, giúp cung cấp năng lượng dồi dào và duy trì sức khỏe tối ưu.'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Categorized Meals List */}
        <View style={styles.mealsContainer}>
          {MEAL_SECTIONS.map((section) => {
            const items = groupedItems[section.key];
            if (!items || items.length === 0) return null;

            return (
              <View key={section.key} style={styles.mealSection}>
                <Text style={styles.mealSectionTitle}>{section.title}</Text>

                {items.map((item, idx) => {
                  const recipe = typeof item.recipe_id === 'object' ? (item.recipe_id as Recipe) : null;
                  const food = typeof item.food_item_id === 'object' ? item.food_item_id : null;

                  const isSnack = section.key === 'snack';
                  const title = recipe?.title || food?.name || 'Món ăn dinh dưỡng';
                  const imageUrl =
                    recipe?.image_url ||
                    food?.image_url ||
                    (isSnack
                      ? 'https://images.unsplash.com/photo-1488477181946-6428a0291777'
                      : 'https://images.unsplash.com/photo-1547592180-85f173990554');

                  const cookTime = (recipe?.prep_time_minutes || 0) + (recipe?.cook_time_minutes || 0) || 20;
                  const ingredientCount = recipe?.ingredients?.length || 5;
                  const quantityText = item.quantity_text || (isSnack ? '30 g' : null);

                  return (
                    <TouchableOpacity
                      key={item._id || idx}
                      style={[styles.dishCard, isSnack && styles.dishCardSnack]}
                      activeOpacity={recipe ? 0.75 : 1}
                      onPress={() => {
                        if (recipe && recipe._id && !recipe._id.startsWith('recipe-bot') && !recipe._id.startsWith('recipe-chao')) {
                          router.push({
                            pathname: '/recipe-detail' as any,
                            params: { id: recipe._id },
                          });
                        }
                      }}>
                      {/* Dish Image */}
                      {isSnack ? (
                        <View style={styles.snackImageWrapper}>
                          <Image source={{ uri: imageUrl }} style={styles.snackImage} resizeMode="cover" />
                        </View>
                      ) : (
                        <View style={styles.dishImageWrapper}>
                          <Image source={{ uri: imageUrl }} style={styles.dishImage} resizeMode="cover" />
                        </View>
                      )}

                      {/* Dish Info */}
                      <View style={styles.dishInfo}>
                        <Text style={styles.dishTitle} numberOfLines={2}>
                          {title}
                        </Text>
                        {isSnack && quantityText ? (
                          <Text style={styles.snackQuantityText}>{quantityText}</Text>
                        ) : (
                          <View style={styles.dishMetaRow}>
                            <View style={styles.metaItem}>
                              <Ionicons name="time-outline" size={15} color="#64748B" />
                              <Text style={styles.metaText}>{cookTime} phút</Text>
                            </View>
                            <Text style={styles.metaDot}>•</Text>
                            <View style={styles.metaItem}>
                              <MaterialCommunityIcons name="fruit-pear" size={15} color="#64748B" />
                              <Text style={styles.metaText}>{ingredientCount} nguyên liệu</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {/* Button 1: Orange Bar Chart (Nutrition Breakdown Modal) */}
        <TouchableOpacity
          style={[styles.roundActionBtn, styles.orangeBtn]}
          activeOpacity={0.8}
          onPress={() => setNutritionModalVisible(true)}>
          <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Button 2: Blue Note / List (Ingredients Modal) */}
        <TouchableOpacity
          style={[styles.roundActionBtn, styles.blueBtn]}
          activeOpacity={0.8}
          onPress={() => setIngredientsModalVisible(true)}>
          <MaterialCommunityIcons name="notebook-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Button 3: Green Apply Pill Button */}
        <TouchableOpacity
          style={styles.applyBtn}
          activeOpacity={0.85}
          onPress={() => setApplyModalVisible(true)}>
          <Text style={styles.applyBtnText}>Áp dụng</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Modal Tổng quan Dinh Dưỡng */}
      <Modal
        visible={nutritionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNutritionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconWrap, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="stats-chart" size={20} color="#F97316" />
                </View>
                <Text style={styles.modalTitle}>Tổng quan Dinh dưỡng</Text>
              </View>
              <TouchableOpacity onPress={() => setNutritionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Total Calories Banner */}
              <View style={styles.calorieBanner}>
                <Text style={styles.calorieBannerLabel}>Tổng năng lượng cả ngày</Text>
                <View style={styles.calorieBannerValueRow}>
                  <Text style={styles.calorieBannerNumber}>{template.total_calories || 680}</Text>
                  <Text style={styles.calorieBannerUnit}>kcal</Text>
                </View>
              </View>

              {/* Macro Bar */}
              <View style={styles.macroBarContainer}>
                <View style={styles.macroBarTrack}>
                  <View style={[styles.macroBarSeg, { width: `${carbPct}%`, backgroundColor: '#38BDF8' }]} />
                  <View style={[styles.macroBarSeg, { width: `${proteinPct}%`, backgroundColor: '#F43F5E' }]} />
                  <View style={[styles.macroBarSeg, { width: `${fatPct}%`, backgroundColor: '#FBBF24' }]} />
                </View>
              </View>

              {/* 3 Macro Cards */}
              <View style={styles.macroGrid}>
                <View style={[styles.macroCard, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}>
                  <Text style={[styles.macroCardLabel, { color: '#0284C7' }]}>Carb (Tinh bột)</Text>
                  <Text style={styles.macroCardValue}>{template.total_carb_g || 78}g</Text>
                  <Text style={styles.macroCardPct}>{carbPct}%</Text>
                </View>

                <View style={[styles.macroCard, { borderColor: '#FECDD3', backgroundColor: '#FFF1F2' }]}>
                  <Text style={[styles.macroCardLabel, { color: '#E11D48' }]}>Protein (Đạm)</Text>
                  <Text style={styles.macroCardValue}>{template.total_protein_g || 32.5}g</Text>
                  <Text style={styles.macroCardPct}>{proteinPct}%</Text>
                </View>

                <View style={[styles.macroCard, { borderColor: '#FEF08A', backgroundColor: '#FEFCE8' }]}>
                  <Text style={[styles.macroCardLabel, { color: '#D97706' }]}>Fat (Chất béo)</Text>
                  <Text style={styles.macroCardValue}>{template.total_fat_g || 24.5}g</Text>
                  <Text style={styles.macroCardPct}>{fatPct}%</Text>
                </View>
              </View>

              {/* Tips & Nutrition Notes */}
              <View style={styles.nutritionTipBox}>
                <Ionicons name="sparkles" size={18} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={styles.nutritionTipText}>
                  Thực đơn này được thiết kế cân đối theo tiêu chuẩn viện dinh dưỡng, cung cấp đầy đủ các nhóm vi chất và năng lượng cần thiết.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setNutritionModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. Modal Danh sách Nguyên liệu & Đi chợ */}
      <Modal
        visible={ingredientsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIngredientsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconWrap, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="format-list-checks" size={20} color="#2563EB" />
                </View>
                <Text style={styles.modalTitle}>Nguyên liệu cần chuẩn bị</Text>
              </View>
              <TouchableOpacity onPress={() => setIngredientsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.ingredientsListScroll} showsVerticalScrollIndicator={false}>
              {allIngredients.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B' }}>Đang cập nhật danh sách nguyên liệu...</Text>
                </View>
              ) : (
                allIngredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingredientRow}>
                    <View style={styles.ingredientBullet} />
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{ing.name}</Text>
                      <Text style={styles.ingredientRecipeSub}>Dùng cho: {ing.recipeName}</Text>
                    </View>
                    <Text style={styles.ingredientQuantity}>{ing.quantity}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Add to grocery button */}
            <TouchableOpacity
              style={styles.addToGroceryBtn}
              activeOpacity={0.85}
              onPress={handleAddAllToGrocery}>
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.addToGroceryBtnText}>Thêm tất cả vào Giỏ đi chợ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Modal Áp dụng Kế Hoạch (Chọn ngày) */}
      <Modal
        visible={applyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setApplyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 420 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconWrap, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="calendar-outline" size={20} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Áp dụng thực đơn</Text>
              </View>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.applyPromptText}>
              Chọn ngày bắt đầu để lên lịch các bữa ăn trong "{template.name}":
            </Text>

            {/* Quick date selector buttons */}
            <View style={styles.datePickerRow}>
              {[
                { label: 'Hôm nay', date: formatYYYYMMDD(new Date()) },
                {
                  label: 'Ngày mai',
                  date: formatYYYYMMDD(new Date(Date.now() + 24 * 60 * 60 * 1000)),
                },
                {
                  label: 'Ngày kia',
                  date: formatYYYYMMDD(new Date(Date.now() + 48 * 60 * 60 * 1000)),
                },
              ].map((item) => {
                const isSelected = selectedDate === item.date;
                return (
                  <TouchableOpacity
                    key={item.date}
                    style={[styles.dateChoiceBtn, isSelected && styles.dateChoiceBtnActive]}
                    onPress={() => setSelectedDate(item.date)}>
                    <Text style={[styles.dateChoiceLabel, isSelected && styles.dateChoiceLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.dateChoiceValue, isSelected && styles.dateChoiceValueActive]}>
                      {item.date.split('-').slice(1).reverse().join('/')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.applyConfirmBox}>
              <Ionicons name="information-circle-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.applyConfirmText}>
                Hệ thống sẽ tự động thêm {template.items?.length || 4} món ăn vào các bữa trong ngày {selectedDate}.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmApplyBtn, applying && { opacity: 0.7 }]}
              disabled={applying}
              activeOpacity={0.85}
              onPress={handleConfirmApply}>
              {applying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmApplyBtnText}>Xác nhận áp dụng</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    marginRight: 12,
  },
  backCircle: {
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
    flex: 1,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    top: 14,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  durationBadgeText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  templateTitle: {
    fontSize: 18.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 25,
  },
  templateDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  mealsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dishCardSnack: {
    alignItems: 'center',
  },
  dishImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginRight: 14,
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  snackImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: '#FEF08A',
    padding: 3,
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#FACC15',
  },
  snackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  dishInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  dishTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 21,
  },
  snackQuantityText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  dishMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  metaDot: {
    marginHorizontal: 8,
    color: '#94A3B8',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  roundActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  orangeBtn: {
    backgroundColor: '#F97316',
  },
  blueBtn: {
    backgroundColor: '#3B82F6',
  },
  applyBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 16,
  },
  backHomeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#10B981',
    borderRadius: 10,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  calorieBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calorieBannerLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  calorieBannerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calorieBannerNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  calorieBannerUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 4,
  },
  macroBarContainer: {
    marginBottom: 16,
  },
  macroBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  macroBarSeg: {
    height: '100%',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  macroCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroCardLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  macroCardPct: {
    fontSize: 12,
    color: '#64748B',
  },
  nutritionTipBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
    alignItems: 'center',
  },
  nutritionTipText: {
    flex: 1,
    fontSize: 12.5,
    color: '#065F46',
    lineHeight: 18,
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  ingredientsListScroll: {
    maxHeight: 320,
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 10,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  ingredientRecipeSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  ingredientQuantity: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  addToGroceryBtn: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToGroceryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  applyPromptText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  dateChoiceBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  dateChoiceBtnActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  dateChoiceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  dateChoiceLabelActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  dateChoiceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  dateChoiceValueActive: {
    color: '#10B981',
  },
  applyConfirmBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 18,
    alignItems: 'center',
  },
  applyConfirmText: {
    flex: 1,
    fontSize: 12.5,
    color: '#166534',
    lineHeight: 18,
  },
  confirmApplyBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmApplyBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
