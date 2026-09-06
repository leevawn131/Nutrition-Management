import { API_BASE_URL } from '@/constants/api';
import { AddGroceryPayload, Recipe } from '@/types/recipe.types';

export const recipeService = {
  /**
   * Fetch all recipes
   */
  async getAllRecipes(): Promise<{ success: boolean; data: Recipe[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải danh sách món ăn');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi recipeService getAllRecipes:', error);
      return { success: false, data: [] };
    }
  },

  /**
   * Fetch recipe by ID or slug
   */
  async getRecipeById(id: string): Promise<{ success: boolean; data: Recipe }> {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải chi tiết món ăn');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi recipeService getRecipeById:', error);
      throw error;
    }
  },

  /**
   * Add ingredients to user shopping list
   */
  async addFromRecipe(token: string | null, payload: AddGroceryPayload): Promise<{ success: boolean; message: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
   * Submit review and rating for recipe
   */
  async submitReview(
    token: string | null,
    recipeId: string,
    payload: { rating: number; quick_tags: string[]; comment: string }
  ): Promise<{ success: boolean; data: Recipe }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
   * Create new custom recipe
   */
  async createRecipe(token: string | null, payload: any): Promise<{ success: boolean; data: Recipe }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Non-JSON response from server:', text);
        throw new Error(`Máy chủ trả về lỗi (${response.status}). Vui lòng thử lại.`);
      }

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
   * Update existing custom recipe
   */
  async updateRecipe(token: string | null, id: string, payload: any): Promise<{ success: boolean; data: Recipe }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Non-JSON response from server:', text);
        throw new Error(`Máy chủ trả về lỗi (${response.status}). Vui lòng thử lại.`);
      }

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
   * Delete custom recipe
   */
  async deleteRecipe(token: string | null, id: string): Promise<{ success: boolean; message: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
   * Search food items database for ingredients picker
   */
  async searchFoods(query: string = ''): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/foods?q=${encodeURIComponent(query)}&category=ingredient`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể tìm kiếm món ăn');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi recipeService searchFoods:', error);
      return { success: false, data: [] };
    }
  },
};
