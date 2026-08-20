import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';
import { FoodItem } from '@/types/plan.types';

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

      const resData: FoodListResponse = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.items || [];
      }
      return [];
    } catch (error) {
      console.warn('Error fetching food items:', error);
      return [];
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
        return resData.data.item || null;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching food item details:', error);
      return null;
    }
  },
};
