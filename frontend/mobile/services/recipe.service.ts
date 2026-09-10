import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';
import { Recipe, UserCollection } from '@/types/plan.types';

const SAVED_RECIPES_STORAGE_KEY = '@nutrition_app:saved_recipes';
const SAVED_INITIALIZED_KEY = '@nutrition_app:saved_initialized';

export const DEFAULT_SAVED_RECIPES: Recipe[] = [
  {
    _id: 'recipe-0',
    title: 'Lẩu cá tôm',
    description: 'Lẩu hải sản chua cay thơm nồng với cá tươi và tôm sú, nước dùng đậm vị lá chanh và sả ớt, giàu đạm và vitamin.',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624',
    prep_time_minutes: 20,
    cook_time_minutes: 25,
    servings: 2,
    calories_per_serving: 477.6,
    protein_g: 38.0,
    carb_g: 22.0,
    fat_g: 14.5,
    source_type: 'system',
    ingredients: [
      { ingredient_name: 'Cá hồi / cá lăng', quantity: 250, unit: 'g' },
      { ingredient_name: 'Tôm sú tươi', quantity: 200, unit: 'g' },
      { ingredient_name: 'Cà chua, dứa', quantity: 150, unit: 'g' },
      { ingredient_name: 'Lá chanh, sả, ớt', quantity: 30, unit: 'g' },
      { ingredient_name: 'Nấm rơm, bắp ngọt', quantity: 100, unit: 'g' },
      { ingredient_name: 'Rau muống, hoa chuối', quantity: 150, unit: 'g' },
      { ingredient_name: 'Nước hầm xương', quantity: 800, unit: 'ml' },
    ],
  },
  {
    _id: 'recipe-salad-ca-hoi',
    title: 'Salad cá hồi bơ sáp mè rang',
    description: 'Sự kết hợp hoàn hảo giữa chất béo tốt Omega-3 từ cá hồi, quả bơ và rau củ tươi mát.',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    servings: 1,
    calories_per_serving: 420.0,
    protein_g: 28.5,
    carb_g: 16.0,
    fat_g: 24.0,
    source_type: 'community',
    ingredients: [
      { ingredient_name: 'Cá hồi tươi phi lê', quantity: 120, unit: 'g' },
      { ingredient_name: 'Quả bơ sáp', quantity: 0.5, unit: 'quả' },
      { ingredient_name: 'Xà lách, cà chua bi', quantity: 150, unit: 'g' },
    ],
  },
  {
    _id: 'recipe-uc-ga-ap-chao',
    title: 'Ức gà áp chảo sốt chanh leo kèm quinoa',
    description: 'Thịt ức gà mềm ngọt mọng nước cùng hạt diêm mạch giàu đạm thực vật.',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    servings: 1,
    calories_per_serving: 460.0,
    protein_g: 42.0,
    carb_g: 45.0,
    fat_g: 9.5,
    source_type: 'system',
    ingredients: [
      { ingredient_name: 'Ức gà phi lê', quantity: 150, unit: 'g' },
      { ingredient_name: 'Hạt quinoa', quantity: 100, unit: 'g' },
    ],
  },
  {
    _id: 'recipe-overnight-oats',
    title: 'Yến mạch ngâm qua đêm chuối hạt chia',
    description: 'Bữa sáng tiện lợi chuẩn bị từ tối hôm trước, dồi dào chất xơ beta-glucan giúp no lâu.',
    image_url: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc',
    prep_time_minutes: 5,
    cook_time_minutes: 0,
    servings: 1,
    calories_per_serving: 310.0,
    protein_g: 11.5,
    carb_g: 52.0,
    fat_g: 6.2,
    source_type: 'system',
    ingredients: [
      { ingredient_name: 'Yến mạch cán dẹt', quantity: 40, unit: 'g' },
      { ingredient_name: 'Sữa hạnh nhân', quantity: 120, unit: 'ml' },
      { ingredient_name: 'Chuối chín', quantity: 1, unit: 'quả' },
    ],
  },
];

export interface RecipeListResponse {
  success: boolean;
  data: {
    items: Recipe[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface ToggleSaveResponse {
  success: boolean;
  message?: string;
  data?: {
    isSaved: boolean;
    collection: UserCollection;
  };
}

export const recipeService = {
  /**
   * Fetch recipes from database with search and tab support
   */
  async getRecipes(params?: {
    search?: string;
    tab?: 'recipes' | 'collections';
    limit?: number;
    page?: number;
  }): Promise<Recipe[]> {
    try {
      // If collections tab requested, return user's saved recipes
      if (params?.tab === 'collections') {
        const saved = await this.getSavedRecipes();
        if (params?.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          return saved.filter((r) => r.title.toLowerCase().includes(q));
        }
        return saved;
      }

      const token = await getAuthToken();
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.tab) queryParams.append('tab', params.tab);
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.page) queryParams.append('page', String(params.page));

      const url = `${API_BASE_URL}/recipes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData: RecipeListResponse = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.items || [];
      }
      return [];
    } catch (error) {
      console.warn('Error fetching recipes:', error);
      return [];
    }
  },

  /**
   * Fetch recipe by ID
   */
  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.recipe || null;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching recipe details:', error);
      return null;
    }
  },

  /**
   * Fetch user's collections from backend
   */
  async getUserCollections(): Promise<UserCollection[]> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/recipes/collections/my`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.collections || [];
      }
      return [];
    } catch (error) {
      console.warn('Error fetching user collections:', error);
      return [];
    }
  },

  /**
   * Get all saved recipes (merged from local storage and backend collections)
   */
  async getSavedRecipes(): Promise<Recipe[]> {
    try {
      // 1. Get from local storage
      const raw = await AsyncStorage.getItem(SAVED_RECIPES_STORAGE_KEY);
      const isInitialized = await AsyncStorage.getItem(SAVED_INITIALIZED_KEY);

      let localSaved: Recipe[] = raw ? JSON.parse(raw) : [];

      // If first run and empty, initialize with default favorites so user always has data
      if (!isInitialized && localSaved.length === 0) {
        localSaved = DEFAULT_SAVED_RECIPES;
        await AsyncStorage.setItem(SAVED_RECIPES_STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_RECIPES));
        await AsyncStorage.setItem(SAVED_INITIALIZED_KEY, 'true');
      }

      // 2. Fetch from backend in background to merge if any
      const collections = await this.getUserCollections();
      const serverSaved: Recipe[] = [];
      collections.forEach((c) => {
        if (Array.isArray(c.recipes)) {
          c.recipes.forEach((r) => serverSaved.push(r));
        }
      });

      // Merge by title or _id
      const mergedMap = new Map<string, Recipe>();
      localSaved.forEach((r) => mergedMap.set(r._id || r.title, r));
      serverSaved.forEach((r) => mergedMap.set(r._id || r.title, r));

      const finalSaved = Array.from(mergedMap.values());
      return finalSaved;
    } catch (error) {
      console.warn('Error reading saved recipes:', error);
      return DEFAULT_SAVED_RECIPES;
    }
  },

  /**
   * Check if a recipe is saved
   */
  async isRecipeSaved(recipeIdOrTitle: string): Promise<boolean> {
    try {
      if (!recipeIdOrTitle) return false;
      const saved = await this.getSavedRecipes();
      return saved.some(
        (r) => r._id === recipeIdOrTitle || r.title.trim().toLowerCase() === recipeIdOrTitle.trim().toLowerCase()
      );
    } catch (error) {
      return false;
    }
  },

  /**
   * Toggle save recipe
   */
  async toggleSaveRecipe(
    recipe: Partial<Recipe> & { title: string }
  ): Promise<{ isSaved: boolean; allSaved: Recipe[] }> {
    try {
      const saved = await this.getSavedRecipes();
      const existingIdx = saved.findIndex(
        (r) =>
          (recipe._id && r._id === recipe._id) ||
          r.title.trim().toLowerCase() === recipe.title.trim().toLowerCase()
      );

      let nextIsSaved = false;
      let nextSaved: Recipe[] = [];

      if (existingIdx >= 0) {
        // Remove
        nextSaved = saved.filter((_, idx) => idx !== existingIdx);
        nextIsSaved = false;
      } else {
        // Add
        const newRecipeItem: Recipe = {
          _id: recipe._id || `saved-${Date.now()}`,
          title: recipe.title,
          description: recipe.description || null,
          image_url: recipe.image_url || null,
          prep_time_minutes: recipe.prep_time_minutes || 15,
          cook_time_minutes: recipe.cook_time_minutes || 20,
          servings: recipe.servings || 1,
          calories_per_serving: recipe.calories_per_serving || 350,
          protein_g: recipe.protein_g || 20,
          carb_g: recipe.carb_g || 30,
          fat_g: recipe.fat_g || 10,
          source_type: recipe.source_type || 'system',
          ingredients: recipe.ingredients || [],
          steps: recipe.steps || [],
          created_at: new Date().toISOString(),
        };
        nextSaved = [newRecipeItem, ...saved];
        nextIsSaved = true;
      }

      await AsyncStorage.setItem(SAVED_RECIPES_STORAGE_KEY, JSON.stringify(nextSaved));
      await AsyncStorage.setItem(SAVED_INITIALIZED_KEY, 'true');

      // Attempt backend sync if real ID exists and is valid ObjectId
      if (recipe._id && recipe._id.length === 24) {
        const token = await getAuthToken();
        fetch(`${API_BASE_URL}/recipes/${recipe._id}/toggle-save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ collectionName: 'Món ăn yêu thích' }),
        }).catch((err) => console.warn('Background sync save recipe failed:', err));
      }

      return {
        isSaved: nextIsSaved,
        allSaved: nextSaved,
      };
    } catch (error) {
      console.warn('Error toggling save recipe:', error);
      return { isSaved: false, allSaved: [] };
    }
  },

  /**
   * Remove a recipe from saved recipes
   */
  async removeSavedRecipe(recipeIdOrTitle: string): Promise<Recipe[]> {
    try {
      const saved = await this.getSavedRecipes();
      const updated = saved.filter(
        (r) => r._id !== recipeIdOrTitle && r.title.trim().toLowerCase() !== recipeIdOrTitle.trim().toLowerCase()
      );
      await AsyncStorage.setItem(SAVED_RECIPES_STORAGE_KEY, JSON.stringify(updated));
      await AsyncStorage.setItem(SAVED_INITIALIZED_KEY, 'true');
      return updated;
    } catch (error) {
      console.warn('Error removing saved recipe:', error);
      return [];
    }
  },
};
