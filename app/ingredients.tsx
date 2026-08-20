import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { foodService } from '@/services/food.service';
import { mealPlanService } from '@/services/meal_plan.service';
import { FoodItem, MealType } from '@/types/plan.types';

// Fallback ingredients if database is empty/offline
const FALLBACK_FOODS: FoodItem[] = [
  {
    _id: 'food-1',
    name: 'Sữa bột gầy có bổ sung Vitamin A và D',
    name_en: 'Milk, dry, nonfat, regular, with added vitamin A and vitamin D',
    category: 'Sữa & Sản phẩm từ sữa',
    calories_per_100g: 359,
    protein_per_100g: 36.2,
    carb_per_100g: 52.0,
    fat_per_100g: 0.8,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
  },
  {
    _id: 'food-2',
    name: 'Sữa chua trái cây ít béo giàu đạm bổ sung Vitamin D',
    name_en: 'Yogurt, fruit, low fat, 10 grams protein per 8 ounce, fortified with vitamin D',
    category: 'Sữa chua & Tráng miệng',
    calories_per_100g: 95,
    protein_per_100g: 4.4,
    carb_per_100g: 17.5,
    fat_per_100g: 1.1,
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777',
  },
  {
    _id: 'food-3',
    name: 'Sữa đậu nành không béo, bổ sung Canxi và vitamin A, D',
    name_en: 'Soymilk (all flavors), nonfat, with added calcium, vitamins A and D',
    category: 'Sữa hạt & Đậu',
    calories_per_100g: 33,
    protein_per_100g: 2.9,
    carb_per_100g: 4.1,
    fat_per_100g: 0.2,
    image_url: 'https://images.unsplash.com/photo-1564844536311-de546a28c87d',
  },
  {
    _id: 'food-4',
    name: 'Sữa bột gầy hòa tan không bổ sung vitamin A và D',
    name_en: 'Milk, dry, nonfat, instant, without added vitamin A and vitamin D',
    category: 'Sữa & Sản phẩm từ sữa',
    calories_per_100g: 357,
    protein_per_100g: 35.1,
    carb_per_100g: 52.2,
    fat_per_100g: 0.7,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
  },
  {
    _id: 'food-5',
    name: 'Bơ thực vật dạng thanh, (60% béo, có muối, bổ sung Vitamin D)',
    name_en: 'Margarine-like, vegetable oil spread, 60% fat, stick, with salt, with added vitamin D',
    category: 'Bơ & Chất béo',
    calories_per_100g: 535,
    protein_per_100g: 0.2,
    carb_per_100g: 0.5,
    fat_per_100g: 60.0,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d',
  },
  {
    _id: 'food-6',
    name: 'Bơ thực vật dạng thanh có muối, (80% chất béo, bổ sung Vitamin D)',
    name_en: 'Margarine, regular, 80% fat, composite, stick, with salt, with added vitamin D',
    category: 'Bơ & Chất béo',
    calories_per_100g: 717,
    protein_per_100g: 0.9,
    carb_per_100g: 0.9,
    fat_per_100g: 80.5,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d',
  },
  {
    _id: 'food-7',
    name: 'Ức gà phi lê tươi',
    name_en: 'Fresh chicken breast fillet, raw',
    category: 'Thịt & Gia cầm',
    calories_per_100g: 165,
    protein_per_100g: 31.0,
    carb_per_100g: 0.0,
    fat_per_100g: 3.6,
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
  },
  {
    _id: 'food-8',
    name: 'Cá hồi tươi phi lê',
    name_en: 'Fresh Atlantic salmon fillet',
    category: 'Hải sản',
    calories_per_100g: 208,
    protein_per_100g: 20.4,
    carb_per_100g: 0.0,
    fat_per_100g: 13.4,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
  },
];

// Helper to get pastel avatar color & icon based on item name
const getAvatarStyle = (name: string, index: number) => {
  const lower = name.toLowerCase();
  if (lower.includes('bơ')) {
    return { bg: '#E0F7FA', iconColor: '#00838F', icon: 'cube-outline' };
  }
  if (lower.includes('đậu nành') || lower.includes('hạt')) {
    return { bg: '#DCFCE7', iconColor: '#16A34A', icon: 'food-variant' };
  }
  if (lower.includes('sữa chua')) {
    return { bg: '#E0F2FE', iconColor: '#0284C7', icon: 'cup-water' };
  }
  if (lower.includes('sữa bột') || lower.includes('sữa')) {
    return { bg: '#FEF3C7', iconColor: '#D97706', icon: 'bowl-mix-outline' };
  }
  if (lower.includes('gà') || lower.includes('thịt')) {
    return { bg: '#FFE4E6', iconColor: '#E11D48', icon: 'food-drumstick-outline' };
  }
  if (lower.includes('cá') || lower.includes('hải sản')) {
    return { bg: '#E0F2FE', iconColor: '#0284C7', icon: 'fish' };
  }
  const colors = [
    { bg: '#FEF3C7', iconColor: '#D97706', icon: 'food-apple-outline' },
    { bg: '#E0F2FE', iconColor: '#0284C7', icon: 'food-apple-outline' },
    { bg: '#DCFCE7', iconColor: '#16A34A', icon: 'food-apple-outline' },
    { bg: '#E0F7FA', iconColor: '#00838F', icon: 'food-apple-outline' },
  ];
  return colors[index % colors.length];
};

export default function IngredientsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: MealType; planDate?: string }>();
  const mealType = params.mealType || 'breakfast';
  const planDate = params.planDate || new Date().toISOString().split('T')[0];

  const [search, setSearch] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFoods = async (querySearch = search) => {
    try {
      const items = await foodService.getFoodItems({ search: querySearch });
      if (items && items.length > 0) {
        setFoods(items);
      } else if (!querySearch) {
        setFoods(FALLBACK_FOODS);
      } else {
        const filtered = FALLBACK_FOODS.filter(
          (f) =>
            f.name.toLowerCase().includes(querySearch.toLowerCase()) ||
            (f.name_en && f.name_en.toLowerCase().includes(querySearch.toLowerCase()))
        );
        setFoods(filtered);
      }
    } catch (error) {
      console.warn('Could not fetch food items from database, using fallback', error);
      setFoods(FALLBACK_FOODS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFoods(search);
  }, []);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    fetchFoods(text);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFoods(search);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddSelected = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Chưa chọn nguyên liệu', 'Vui lòng nhấn vào nguyên liệu để chọn trước khi thêm.');
      return;
    }

    try {
      setIsSubmitting(true);
      for (const id of selectedIds) {
        const isFallback = id.startsWith('food-');
        await mealPlanService.addMealPlanItem({
          plan_date: planDate,
          meal_type: mealType,
          food_item_id: isFallback ? null : id,
          source: 'ingredient',
        });
      }

      Alert.alert(
        'Thành công',
        `Đã thêm ${selectedIds.length} nguyên liệu vào kế hoạch.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Thông báo', 'Đã thêm nguyên liệu vào kế hoạch thành công!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFoodItem = ({ item, index }: { item: FoodItem; index: number }) => {
    const isSelected = selectedIds.includes(item._id);
    const avatarStyle = getAvatarStyle(item.name, index);

    return (
      <TouchableOpacity
        style={[styles.foodRow, isSelected && styles.foodRowSelected]}
        onPress={() => toggleSelect(item._id)}
        activeOpacity={0.7}>
        <View style={[styles.avatarWrapper, { backgroundColor: avatarStyle.bg }]}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.avatarImage} />
          ) : (
            <MaterialCommunityIcons
              name={avatarStyle.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={24}
              color={avatarStyle.iconColor}
            />
          )}
          {isSelected && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.foodTextContainer}>
          <Text style={styles.foodTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.foodSubtitle} numberOfLines={2}>
            {item.name_en || `${item.calories_per_100g} kcal / 100g · ${item.category || 'Nguyên liệu'}`}
          </Text>
        </View>

        <View style={styles.selectAction}>
          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={24} color="#10294B" />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm nguyên liệu</Text>
        <TouchableOpacity style={styles.filterButton} accessibilityLabel="Lọc nguyên liệu">
          <Ionicons name="funnel-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* List of Ingredients */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#49C99B" />
          <Text style={styles.loadingText}>Đang tải danh sách nguyên liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item._id}
          renderItem={renderFoodItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#49C99B']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="food-apple-outline" size={48} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>
                {search ? 'Không tìm thấy nguyên liệu' : 'Chưa có nguyên liệu nào'}
              </Text>
              <Text style={styles.emptyText}>Thử tìm kiếm với từ khoá khác.</Text>
            </View>
          }
        />
      )}

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addButton, selectedIds.length === 0 && styles.addButtonDisabled]}
          onPress={handleAddSelected}
          disabled={isSubmitting || selectedIds.length === 0}
          activeOpacity={0.85}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="shopping-outline" size={22} color="#FFFFFF" />
              <Text style={styles.addButtonText}>
                {selectedIds.length > 0
                  ? `Thêm ${selectedIds.length} nguyên liệu`
                  : 'Chọn nguyên liệu để thêm'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#10294B',
    textAlign: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#10294B',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 14,
  },
  foodRowSelected: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#49C99B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodTextContainer: {
    flex: 1,
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10294B',
    lineHeight: 22,
    marginBottom: 4,
  },
  foodSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94A3B8',
  },
  selectAction: {
    paddingLeft: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#49C99B',
    borderColor: '#49C99B',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#10294B',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  addButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#49C99B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
