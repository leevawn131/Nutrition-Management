import { API_BASE_URL } from '@/constants/api';
import { FoodItem, FoodSearchResponse } from '@/types/food.types';

export const foodService = {
  /**
   * Search foods catalog by query string and optional category
   */
  async searchFoods(query: string = '', category: string = '', page: number = 1, limit: number = 20): Promise<FoodSearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (query) queryParams.append('q', query);
      if (category) queryParams.append('category', category);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const response = await fetch(`${API_BASE_URL}/foods?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi tìm kiếm món ăn');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi foodService searchFoods:', error);
      throw error;
    }
  },

  /**
   * Get single food item detail
   */
  async getFoodById(id: string): Promise<{ success: boolean; data: FoodItem }> {
    try {
      const response = await fetch(`${API_BASE_URL}/foods/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không tìm thấy thông tin món ăn');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi foodService getFoodById:', error);
      throw error;
    }
  },
};
