import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthToken } from '../../services/storage.service';
import { API_BASE_URL } from '../../constants/api';

export default function IngredientDetailScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          console.error("No token found");
          setLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/recipes/ingredient/${encodeURIComponent(name as string)}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Error fetching ingredient detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [name]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Đang tra cứu thông tin AI...</Text>
      </SafeAreaView>
    );
  }

  const ingredient = data?.ingredient || {
    name: name,
    description: 'Đang cập nhật thông tin',
    nutrition_per_100g: {}
  };
  const recipes = data?.related_recipes || [];
  const nutrition = ingredient.nutrition_per_100g || {};

  const calculateDV = (value: number, dailyTarget: number) => {
    if (!value || !dailyTarget) return '0%';
    return `${((value / dailyTarget) * 100).toFixed(1)}%`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F2644" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin nguyên liệu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ingredient Header */}
        <View style={styles.ingredientHeader}>
          <View style={styles.imageContainer}>
            {/* Dùng ảnh placeholder tạm thời */}
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3143/3143645.png' }} 
              style={styles.ingredientImage} 
            />
          </View>
          <View style={styles.ingredientTitleContainer}>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            <Text style={styles.ingredientDesc} numberOfLines={3}>{ingredient.description}</Text>
          </View>
        </View>

        {/* Nutrition Table */}
        <View style={styles.nutritionSection}>
          <View style={styles.nutritionHeaderRow}>
            <Text style={styles.nutritionHeaderLeft}>Nutrient per 100 gram</Text>
            <Text style={styles.nutritionHeaderRight}>% DV</Text>
          </View>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Năng lượng</Text>
            <Text style={styles.nutritionValue}>{nutrition.energy_kcal || 0} Calo</Text>
            <Text style={styles.nutritionDV}>{calculateDV(nutrition.energy_kcal, 2000)}</Text>
          </View>
          
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Chất đạm</Text>
            <Text style={styles.nutritionValue}>{nutrition.protein_g || 0} g</Text>
            <Text style={styles.nutritionDV}>{calculateDV(nutrition.protein_g, 50)}</Text>
          </View>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Chất béo</Text>
            <Text style={styles.nutritionValue}>{nutrition.fat_g || 0} g</Text>
            <Text style={styles.nutritionDV}>{calculateDV(nutrition.fat_g, 70)}</Text>
          </View>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Canxi</Text>
            <Text style={styles.nutritionValue}>{nutrition.calcium_mg || 0} mg</Text>
            <Text style={styles.nutritionDV}>{calculateDV(nutrition.calcium_mg, 1000)}</Text>
          </View>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Phốt pho</Text>
            <Text style={styles.nutritionValue}>{nutrition.phosphorus_mg || 0} mg</Text>
            <Text style={styles.nutritionDV}>{calculateDV(nutrition.phosphorus_mg, 700)}</Text>
          </View>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Sắt</Text>
            <Text style={styles.nutritionValue}>{nutrition.iron_mg || 0} mg</Text>
            <Text style={styles.nutritionDV}>{calculateDV(nutrition.iron_mg, 18)}</Text>
          </View>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Vitamin D</Text>
            <Text style={styles.nutritionValue}>{nutrition.vitamin_d_ug || 0} ug</Text>
            <Text style={styles.nutritionDV}>{calculateDV(nutrition.vitamin_d_ug, 20)}</Text>
          </View>
        </View>

        {/* Related Recipes */}
        {recipes.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text style={styles.relatedTitle}>Nấu gì với {ingredient.name}</Text>
              <TouchableOpacity style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
              {recipes.map((r: any) => (
                <TouchableOpacity 
                  key={r._id} 
                  style={styles.recipeCard}
                  onPress={() => router.push(`/recipe/${r._id}` as any)}
                >
                  <Image source={{ uri: r.image_url || 'https://via.placeholder.com/150' }} style={styles.recipeImage} />
                  <View style={styles.recipeBadge}>
                    <Text style={styles.recipeBadgeText}>{r.calories_per_serving ? Math.round(r.calories_per_serving) : 0} kcal</Text>
                  </View>
                  <Text style={styles.recipeTitle} numberOfLines={1}>{r.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Empty space for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="basket-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>Thêm nguyên liệu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F2644',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  ingredientHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ingredientImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  ingredientTitleContainer: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 6,
  },
  ingredientDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  nutritionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  nutritionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutritionHeaderLeft: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2644',
  },
  nutritionHeaderRight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2644',
    width: 60,
    textAlign: 'right',
  },
  nutritionRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    alignItems: 'center',
  },
  nutritionLabel: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
  },
  nutritionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F2644',
    marginRight: 16,
  },
  nutritionDV: {
    fontSize: 15,
    color: '#94A3B8',
    width: 60,
    textAlign: 'right',
  },
  relatedSection: {
    paddingTop: 24,
  },
  relatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F2644',
  },
  seeAllBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F2644',
  },
  relatedScroll: {
    paddingLeft: 16,
  },
  recipeCard: {
    width: 160,
    marginRight: 16,
  },
  recipeImage: {
    width: 160,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  recipeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recipeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F2644',
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F2644',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32, // for safe area
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addButton: {
    backgroundColor: '#34D399',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
