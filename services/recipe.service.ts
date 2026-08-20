import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';
import { Recipe, UserCollection } from '@/types/plan.types';

export interface RecipeListResponse {
  success: boolean;
  data: {
    items: Recipe[];
    total: number;
    page: number;
    limit: number;
  };
}

export const recipeService = {
  /**
   * Fetch recipes from database with search and tab support
   */
  async getRecipes(params?: { search?: string; tab?: 'recipes' | 'collections'; limit?: number; page?: number }): Promise<Recipe[]> {
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
   * Fetch user's collections
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
};
