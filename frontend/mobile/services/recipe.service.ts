import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';
import { Recipe, UserCollection } from '@/types/plan.types';
import { AddGroceryPayload, Recipe as SangRecipe } from '@/types/recipe.types';

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
      { ingredient_name: 'Xà lách Romaine, cà chua bi', quantity: 100, unit: 'g' },
      { ingredient_name: 'Sốt mè rang Kewpie', quantity: 20, unit: 'g' },
    ],
  },
];

export const recipeService = {
  /**
   * Fetch recipes list from backend
   */
  async getRecipes(params?: { search?: string; tab?: string; limit?: number; page?: number }): Promise<Recipe[]> {
    try {
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

      const resData = await response.json();
      if (response.ok && resData.success) {
        if (Array.isArray(resData.data)) return resData.data;
        if (resData.data && Array.isArray(resData.data.items)) return resData.data.items;
        if (Array.isArray(resData.items)) return resData.items;
      }
      return DEFAULT_SAVED_RECIPES;
    } catch (error) {
      console.warn('Error fetching recipes:', error);
      return DEFAULT_SAVED_RECIPES;
    }
  },

  /**
   * Alias for getAllRecipes
   */
  async getAllRecipes(): Promise<Recipe[]> {
    return this.getRecipes();
  },

  /**
   * Fetch a single recipe details
   */
  async getRecipeById(id: string): Promise<any> {
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
      if (response.ok && resData.success) {
        return resData.data?.recipe || resData.data;
      }

      const localFound = DEFAULT_SAVED_RECIPES.find((r) => r._id === id);
      return localFound || null;
    } catch (error) {
      console.warn('Error fetching recipe detail:', error);
      return DEFAULT_SAVED_RECIPES.find((r) => r._id === id) || null;
    }
  },

  /**
   * Fetch current user recipe collections
   */
  async getMyCollections(): Promise<UserCollection[]> {
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
      console.warn('Error fetching collections:', error);
      return [];
    }
  },

  /**
   * Check if a recipe is saved in user's saved list
   */
  async isRecipeSaved(recipeId: string): Promise<boolean> {
    try {
      const saved = await this.getSavedRecipes();
      return saved.some((r) => r._id === recipeId);
    } catch (error) {
      return false;
    }
  },

  /**
   * Retrieve all saved recipes from local storage (with default seed)
   */
  async getSavedRecipes(): Promise<Recipe[]> {
    try {
      const raw = await AsyncStorage.getItem(SAVED_RECIPES_STORAGE_KEY);
      const isInitialized = await AsyncStorage.getItem(SAVED_INITIALIZED_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      if (!isInitialized) {
        await AsyncStorage.setItem(SAVED_RECIPES_STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_RECIPES));
        await AsyncStorage.setItem(SAVED_INITIALIZED_KEY, 'true');
        return DEFAULT_SAVED_RECIPES;
      }

      return [];
    } catch (error) {
      console.warn('Error reading saved recipes:', error);
      return DEFAULT_SAVED_RECIPES;
    }
  },

  /**
   * Toggle save/bookmark recipe
   */
  async toggleSaveRecipe(recipe: Recipe, collectionName = 'Món ăn yêu thích'): Promise<{ isSaved: boolean; allSaved: Recipe[] }> {
    try {
      const saved = await this.getSavedRecipes();
      const existsIndex = saved.findIndex(
        (r) =>
          (r._id && recipe._id && r._id === recipe._id) ||
          (r.title && recipe.title && r.title.trim().toLowerCase() === recipe.title.trim().toLowerCase())
      );

      let nextSaved: Recipe[] = [];
      let nextIsSaved = false;

      if (existsIndex > -1) {
        nextSaved = saved.filter((_, idx) => idx !== existsIndex);
        nextIsSaved = false;
      } else {
        const newRecipeItem: Recipe = {
          ...recipe,
          _id: recipe._id || `recipe-${Date.now()}`,
          title: recipe.title || 'Món ăn mới',
          description: recipe.description || '',
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

      if (recipe._id && recipe._id.length === 24) {
        const token = await getAuthToken();
        fetch(`${API_BASE_URL}/recipes/${recipe._id}/toggle-save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ collectionName }),
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

  /**
   * Add ingredients to user shopping list (Sang's method)
   */
  async addFromRecipe(token: string | null, payload: AddGroceryPayload): Promise<{ success: boolean; message: string }> {
    try {
      const activeToken = token || (await getAuthToken());
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/grocery/add-from-recipe`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể thêm vào danh sách mua sắm');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi recipeService addFromRecipe:', error);
      throw error;
    }
  },

  /**
   * Submit review and rating for recipe (Sang's method)
   */
  async submitReview(
    token: string | null,
    recipeId: string,
    payload: { rating: number; quick_tags: string[]; comment: string }
  ): Promise<{ success: boolean; data: any }> {
    try {
      const activeToken = token || (await getAuthToken());
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi bình luận');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi recipeService submitReview:', error);
      throw error;
    }
  },

  /**
   * Create new custom recipe (Sang's method)
   */
  async createRecipe(token: string | null, payload: any): Promise<{ success: boolean; data: any }> {
    try {
      const activeToken = token || (await getAuthToken());
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể tạo công thức món ăn');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi recipeService createRecipe:', error);
      throw error;
    }
  },

  /**
   * Update existing custom recipe (Sang's method)
   */
  async updateRecipe(token: string | null, id: string, payload: any): Promise<{ success: boolean; data: any }> {
    try {
      const activeToken = token || (await getAuthToken());
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể cập nhật công thức món ăn');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi recipeService updateRecipe:', error);
      throw error;
    }
  },

  /**
   * Delete custom recipe (Sang's method)
   */
  async deleteRecipe(token: string | null, id: string): Promise<{ success: boolean; message: string }> {
    try {
      const activeToken = token || (await getAuthToken());
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể xóa công thức món ăn');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi recipeService deleteRecipe:', error);
      throw error;
    }
  },

  /**
   * Search food items database for ingredients picker (Sang's method)
   */
  async searchFoods(query: string = ''): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/foods?q=${encodeURIComponent(query)}&category=ingredient`);
      const data = await response.json();
      if (!response.ok) {
        return { success: false, data: [] };
      }
      return { success: true, data: Array.isArray(data.data) ? data.data : [] };
    } catch (error: any) {
      console.error('Lỗi recipeService searchFoods:', error);
      return { success: false, data: [] };
    }
  },
};
