import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';
import { MealPlanItem, MealType } from '@/types/plan.types';

export interface MealPlansResponse {
  success: boolean;
  data: {
    plans: MealPlanItem[];
  };
}

export interface AddMealPlanPayload {
  plan_date: string;
  meal_type: MealType;
  recipe_id?: string | null;
  food_item_id?: string | null;
  source?: 'template' | 'recipe' | 'ingredient' | 'manual';
}

export const mealPlanService = {
  /**
   * Fetch planned meals for a given date or range
   */
  async getMealPlans(dateOrOptions: string | { date?: string; startDate?: string; endDate?: string }): Promise<MealPlanItem[]> {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams();

      if (typeof dateOrOptions === 'string') {
        params.append('date', dateOrOptions);
      } else {
        if (dateOrOptions.date) params.append('date', dateOrOptions.date);
        if (dateOrOptions.startDate) params.append('startDate', dateOrOptions.startDate);
        if (dateOrOptions.endDate) params.append('endDate', dateOrOptions.endDate);
      }

      const url = `${API_BASE_URL}/meal-plans?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData: MealPlansResponse = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.plans || [];
      }
      return [];
    } catch (error) {
      console.warn('Error fetching meal plans:', error);
      return [];
    }
  },

  /**
   * Add a recipe or food item to meal plan
   */
  async addMealPlanItem(payload: AddMealPlanPayload): Promise<MealPlanItem | null> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/meal-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.plan;
      }
      return null;
    } catch (error) {
      console.warn('Error adding meal plan item:', error);
      return null;
    }
  },

  /**
   * Toggle is_logged state for a meal plan item
   */
  async toggleMealPlanLog(planId: string, isLogged: boolean): Promise<MealPlanItem | null> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/meal-plans/${planId}/log`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_logged: isLogged }),
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.plan;
      }
      return null;
    } catch (error) {
      console.warn('Error toggling meal plan log:', error);
      return null;
    }
  },

  /**
   * Delete a meal plan item by ID
   */
  async deleteMealPlanItem(planId: string): Promise<boolean> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/meal-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      return response.ok && resData.success;
    } catch (error) {
      console.warn('Error deleting meal plan item:', error);
      return false;
    }
  },
};
