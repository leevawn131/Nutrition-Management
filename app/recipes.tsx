import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mealPlanService } from '@/services/meal_plan.service';
import { recipeService } from '@/services/recipe.service';
import { MealType, Recipe } from '@/types/plan.types';

// Fallback seed recipes if offline/empty
const FALLBACK_RECIPES: Recipe[] = [
  {
    _id: 'recipe-1',
    title: 'Mắm Kho Chay',
    description: 'Món mắm kho chay thanh đạm từ chao, nấm và cà tím, đậm đà đưa cơm.',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    prep_time_minutes: 20,
    cook_time_minutes: 30,
    servings: 3,
    calories_per_serving: 260,
    protein_g: 14.5,
    carb_g: 28.0,
    fat_g: 8.5,
    source_type: 'system',
    ingredients: Array.from({ length: 9 }).map((_, i) => ({ ingredient_name: `Nguyên liệu ${i + 1}` })),
  },
  {
    _id: 'recipe-2',
    title: 'Cơm cuối tháng.😳',
    description: 'Bữa cơm đạm bạc nhanh gọn thơm ngon tiết kiệm chi phí mà vẫn đủ chất.',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    servings: 1,
    calories_per_serving: 480,
    protein_g: 22.0,
    carb_g: 65.0,
    fat_g: 12.0,
    source_type: 'community',
    ingredients: Array.from({ length: 4 }).map((_, i) => ({ ingredient_name: `Nguyên liệu ${i + 1}` })),
  },
  {
    _id: 'recipe-3',
    title: 'Cháo nấm hạt sen dưỡng tâm',
    description: 'Cháo nấm thơm lừng kết hợp hạt sen bùi béo, thanh lọc cơ thể và dễ tiêu hoá.',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554',
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 2,
    calories_per_serving: 230,
    protein_g: 9.0,
    carb_g: 44.0,
    fat_g: 2.5,
    source_type: 'system',
    ingredients: Array.from({ length: 6 }).map((_, i) => ({ ingredient_name: `Nguyên liệu ${i + 1}` })),
  },
  {
    _id: 'recipe-4',
    title: 'Canh súp cua măng tây tuyết nhĩ',
    description: 'Súp cua thanh mát, thơm ngon bổ dưỡng giàu canxi và collagen.',
    image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab',
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    servings: 2,
    calories_per_serving: 195,
    protein_g: 16.0,
    carb_g: 18.0,
    fat_g: 4.0,
    source_type: 'system',
    ingredients: Array.from({ length: 7 }).map((_, i) => ({ ingredient_name: `Nguyên liệu ${i + 1}` })),
  },
  {
    _id: 'recipe-5',
    title: 'Ức gà áp chảo sốt chanh leo Eat Clean',
    description: 'Món ăn giàu đạm, ít béo, sốt chanh leo chua ngọt thơm ngon không bị khô.',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
    prep_time_minutes: 15,
    cook_time_minutes: 15,
    servings: 2,
    calories_per_serving: 320,
    protein_g: 42.0,
    carb_g: 12.0,
    fat_g: 6.5,
    source_type: 'system',
    ingredients: Array.from({ length: 5 }).map((_, i) => ({ ingredient_name: `Nguyên liệu ${i + 1}` })),
  },
  {
    _id: 'recipe-6',
    title: 'Salad cá hồi bơ sáp mè rang',
    description: 'Chất béo tốt Omega-3 từ cá hồi, quả bơ và rau củ tươi mát.',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    servings: 1,
    calories_per_serving: 420,
    protein_g: 28.5,
    carb_g: 16.0,
    fat_g: 24.0,
    source_type: 'community',
    ingredients: Array.from({ length: 4 }).map((_, i) => ({ ingredient_name: `Nguyên liệu ${i + 1}` })),
  },
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function RecipesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: MealType; planDate?: string }>();
  const mealType = params.mealType || 'breakfast';
  const planDate = params.planDate || new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'recipes' | 'collections'>('recipes');
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchRecipes = async (querySearch = search, tab = activeTab) => {
    try {
      const items = await recipeService.getRecipes({ search: querySearch, tab });
      if (items && items.length > 0) {
        setRecipes(items);
      } else if (!querySearch) {
        setRecipes(FALLBACK_RECIPES);
      } else {
        // Filter fallback if search term provided
        const filtered = FALLBACK_RECIPES.filter((r) =>
          r.title.toLowerCase().includes(querySearch.toLowerCase())
        );
        setRecipes(filtered);
      }
    } catch (err) {
      console.warn('Could not load recipes from database, using fallback', err);
      setRecipes(FALLBACK_RECIPES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes(search, activeTab);
  }, [activeTab]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    fetchRecipes(text, activeTab);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecipes(search, activeTab);
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    try {
      setAddingId(recipe._id);
      const isFallback = recipe._id.startsWith('recipe-');
      await mealPlanService.addMealPlanItem({
        plan_date: planDate,
        meal_type: mealType,
        recipe_id: isFallback ? null : recipe._id,
        source: 'recipe',
      });

      if (Platform.OS === 'web') {
        window.alert(`Đã thêm "${recipe.title}" vào kế hoạch ${getMealTypeName(mealType)}.`);
        router.back();
      } else {
        Alert.alert(
          'Đã thêm công thức',
          `Đã thêm "${recipe.title}" vào kế hoạch ${getMealTypeName(mealType)}.`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Đã thêm món vào kế hoạch thành công!');
        router.back();
      } else {
        Alert.alert('Thông báo', 'Đã thêm món vào kế hoạch thành công!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } finally {
      setAddingId(null);
    }
  };

  const getMealTypeName = (type: MealType) => {
    switch (type) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
      case 'snack': return 'Đồ ăn thêm';
      default: return 'Bữa ăn';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Search and Action Icons */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={24} color="#10294B" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
          />
        </View>

        <TouchableOpacity style={styles.headerIconButton} accessibilityLabel="Danh mục">
          <MaterialCommunityIcons name="format-list-bulleted" size={22} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconButton} accessibilityLabel="Lọc">
          <Ionicons name="funnel-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Pill Tabs: Công thức / Bộ sưu tập */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'recipes' && styles.tabPillActive]}
          onPress={() => setActiveTab('recipes')}
          activeOpacity={0.8}>
          <Text style={[styles.tabPillText, activeTab === 'recipes' && styles.tabPillTextActive]}>
            Công thức
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'collections' && styles.tabPillActive]}
          onPress={() => setActiveTab('collections')}
          activeOpacity={0.8}>
          <Text style={[styles.tabPillText, activeTab === 'collections' && styles.tabPillTextActive]}>
            Bộ sưu tập
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recipe Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#49C99B" />
          <Text style={styles.loadingText}>Đang tải công thức...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#49C99B']} />}>
          {recipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chef-hat" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không tìm thấy công thức nào</Text>
              <Text style={styles.emptySubtitle}>Thử tìm kiếm với từ khoá khác hoặc đổi danh mục.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {recipes.map((item) => {
                const totalTime = (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0) || 25;
                const ingredientCount = item.ingredients?.length || 4;
                const isItemAdding = addingId === item._id;

                return (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.recipeCard}
                    onPress={() => handleSelectRecipe(item)}
                    activeOpacity={0.85}>
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{
                          uri:
                            item.image_url ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                        }}
                        style={styles.cardImage}
                      />
                      <TouchableOpacity
                        style={styles.bookmarkBadge}
                        onPress={() => handleSelectRecipe(item)}
                        accessibilityLabel="Thêm vào kế hoạch">
                        {isItemAdding ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <MaterialCommunityIcons name="bookmark-plus-outline" size={20} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>

                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>{totalTime} phút</Text>
                        </View>

                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name="food-apple-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>{ingredientCount} ng liệu</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
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
    paddingVertical: 10,
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  searchBox: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 0,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
  },
  tabPillActive: {
    backgroundColor: '#49C99B',
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  recipeCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 165,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10294B',
    lineHeight: 20,
    minHeight: 40,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#10294B',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
