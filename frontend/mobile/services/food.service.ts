import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';
import { FoodItem } from '@/types/plan.types';
import { FoodSearchResponse } from '@/types/food.types';

export interface FoodListResponse {
  success: boolean;
  data: {
    items: FoodItem[];
    total: number;
    page: number;
    limit: number;
  };
}

export const foodService = {
  /**
   * Fetch list of food items / ingredients from database
   */
  async getFoodItems(params?: { search?: string; category?: string; limit?: number; page?: number }): Promise<FoodItem[]> {
    try {
      const token = await getAuthToken();
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.page) queryParams.append('page', String(params.page));

      const url = `${API_BASE_URL}/foods${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
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
      return [];
    } catch (error) {
      console.warn('Error fetching food items:', error);
      return [];
    }
  },

  /**
   * Search foods catalog by query string and optional category (used by Sang's screens)
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

      const items = Array.isArray(data.data) ? data.data : (data.items || []);

      return {
        success: data.success,
        message: data.message || '',
        data: items,
        pagination: data.pagination || {
          total: items.length,
          page,
          limit,
          totalPages: 1,
        },
      };
    } catch (error: any) {
      console.error('Lỗi foodService searchFoods:', error);
      throw error;
    }
  },

  /**
   * Fetch food item by ID
   */
  async getFoodItemById(id: string): Promise<FoodItem | null> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/foods/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.item || resData.data || null;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching food item details:', error);
      return null;
    }
  },

  /**
   * Get single food item detail (used by Sang's screens)
   */
  async getFoodById(id: string): Promise<{ success: boolean; data: any }> {
    const item = await this.getFoodItemById(id);
    if (!item) {
      throw new Error('Không tìm thấy thông tin món ăn');
    }
    return { success: true, data: item };
  },
};
