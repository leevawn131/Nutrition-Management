import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { recipeService } from '@/services/recipe.service';
import { Recipe } from '@/types/recipe.types';

const { width, height } = Dimensions.get('window');

import { calculateRecipeNutritionFromIngredients } from '@/constants/foodDatabase';

export default function RecipeOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const recipeId = params.id || 'thit-nac-rim';
  const insets = useSafeAreaInsets();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRecipeData();
  }, [recipeId]);

  const fetchRecipeData = async () => {
    setLoading(true);
    try {
      const res = await recipeService.getRecipeById(recipeId);
      if (res && res.data) {
        setRecipe(res.data);
      }
    } catch (e) {
      console.error('Error loading recipe overview:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !recipe) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải tổng quan món ăn...</Text>
      </View>
    );
  }

  const {
    title,
    description,
    cover_image_url,
    category,
    prep_time_min = 10,
    cook_time_min = 15,
    ingredients = [],
    steps = [],
    rating = 5.0,
    rating_count = 0,
    nutrition_facts,
    servings = 1,
  } = recipe;

  const computedNutrition = calculateRecipeNutritionFromIngredients(ingredients, servings);

  const calories = nutrition_facts?.calories || computedNutrition.calories;
  const protein_g = nutrition_facts?.protein_g || computedNutrition.protein_g;
  const carb_g = nutrition_facts?.carb_g || computedNutrition.carb_g;
  const fat_g = nutrition_facts?.fat_g || computedNutrition.fat_g;

  // Calorie calculation factors: Protein = 4, Carb = 4, Fat = 9
  const proteinCal = protein_g * 4;
  const carbCal = carb_g * 4;
  const fatCal = fat_g * 9;
  const totalCalCalculated = proteinCal + carbCal + fatCal || calories;

  const proteinPct = Number(((proteinCal / totalCalCalculated) * 100).toFixed(1));
  const carbPct = Number(((carbCal / totalCalCalculated) * 100).toFixed(1));
  const fatPct = Number(((fatCal / totalCalCalculated) * 100).toFixed(1));

  const totalTime = prep_time_min + cook_time_min;
  const stepsCount = steps.length || 4;
  const ingredientsCount = ingredients.length || 9;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri:
            cover_image_url &&
            !cover_image_url.startsWith('file://') &&
            !cover_image_url.startsWith('blob:')
              ? cover_image_url
              : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        }}
        style={styles.imageBackground}
        resizeMode="cover">
        {/* Dark Gradient Overlay for readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.gradientOverlay}>
          {/* Top Header */}
          <SafeAreaView style={styles.headerSafeArea}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#1E293B" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Bottom Content Area */}
          <View style={[styles.bottomContent, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
            {/* Title & Description */}
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.descriptionText} numberOfLines={3}>
              {description ||
                `${title} - món ăn đầy đủ dinh dưỡng, sự kết hợp hoàn hảo giữa các nguyên liệu tươi ngon cho bữa ăn gia đình.`}
            </Text>

            {/* Category Badges */}
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.badgeText}>Bữa tối</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.badgeText}>Bữa trưa</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.badgeText}>+1</Text>
              </View>
            </View>

            {/* Macro Ring Chart & Legend */}
            <View style={styles.macroChartRow}>
              {/* Ring Chart Container */}
              <View style={styles.ringChartOuter}>
                <View style={styles.ringChartInner}>
                  <Text style={styles.caloriesNumber}>{calories}</Text>
                  <Text style={styles.caloriesLabel}>Calo</Text>
                </View>
              </View>

              {/* Macro Breakdown Legend */}
              <View style={styles.macroLegendColumn}>
                {/* Protein */}
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>
                    Chất đạm: <Text style={styles.boldText}>{proteinPct}%</Text> ({protein_g}g)
                  </Text>
                </View>

                {/* Carb */}
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>
                    Tinh bột: <Text style={styles.boldText}>{carbPct}%</Text> ({carb_g}g)
                  </Text>
                </View>

                {/* Fat */}
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>
                    Chất béo: <Text style={styles.boldText}>{fatPct}%</Text> ({fat_g}g)
                  </Text>
                </View>
              </View>
            </View>

            {/* Meta Info Bar (Steps, Cook Time, Ingredients) */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="document-text-outline" size={18} color="#CBD5E1" />
                <Text style={styles.metaText}>{stepsCount} bước</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color="#CBD5E1" />
                <Text style={styles.metaText}>{totalTime} phút</Text>
              </View>

              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="food-apple-outline" size={18} color="#CBD5E1" />
                <Text style={styles.metaText}>{ingredientsCount} nguyên liệu</Text>
              </View>
            </View>

            {/* Ratings & Action Buttons Footer */}
            <View style={styles.footerRow}>
              {/* Star Rating */}
              <View style={styles.ratingContainer}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={16}
                      color={star <= Math.round(rating) ? '#FFFFFF' : '#64748B'}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  --- ({rating_count > 0 ? `${rating_count} đánh giá` : '--- đánh giá'})
                </Text>
              </View>

              {/* Action Icons Right */}
              <View style={styles.actionButtonsRow}>
                {/* Share Icon */}
                <TouchableOpacity style={styles.actionIconButton}>
                  <Feather name="upload" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Add / View Detail Icon */}
                <TouchableOpacity
                  style={styles.actionIconButtonColumn}
                  onPress={() => router.push(`/recipe/${recipe._id}` as any)}>
                  <Ionicons name="add-circle-outline" size={26} color="#FFFFFF" />
                  <Text style={styles.actionIconLabel}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 15,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSafeArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomContent: {
    paddingHorizontal: 20,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 32,
  },
  descriptionText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  macroChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 20,
  },
  ringChartOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#3B82F6',
    borderTopColor: '#10B981',
    borderRightColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  ringChartInner: {
    alignItems: 'center',
  },
  caloriesNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  caloriesLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: -2,
  },
  macroLegendColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#E2E8F0',
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconButtonColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 2,
  },
});
