import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';
import { DailySummary, MealLog, PeriodStatistics } from '@/types/meal_log.types';
import { MealType } from '@/types/plan.types';

export interface CreateMealLogPayload {
  food_item_id?: string | null;
  input_method?: 'photo' | 'gallery' | 'text';
  source_image_url?: string | null;
  description_text?: string | null;
  portion_label?: 'small' | 'medium' | 'large' | null;
  portion_grams?: number | null;
  calories: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  meal_type: MealType;
  logged_at?: string;
}

export const mealLogService = {
  /**
   * Get meal logs (single date or range)
   */
  async getMealLogs(options?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    meal_type?: MealType;
  }): Promise<MealLog[]> {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams();
      if (options?.date) params.append('date', options.date);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      if (options?.meal_type) params.append('meal_type', options.meal_type);

      const url = `${API_BASE_URL}/meal-logs?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.logs || [];
      }
      return [];
    } catch (error) {
      console.warn('Error fetching meal logs:', error);
      return [];
    }
  },

  /**
   * Get daily summary and comparison vs target
   */
  async getDailySummary(dateStr?: string): Promise<DailySummary | null> {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams();
      if (dateStr) params.append('date', dateStr);

      const url = `${API_BASE_URL}/meal-logs/summary?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.summary || null;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching daily nutrition summary:', error);
      return null;
    }
  },

  /**
   * Get period statistics (e.g. 7 or 30 days)
   */
  async getStatistics(rangeDays: number = 7, endDate?: string): Promise<PeriodStatistics | null> {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({ rangeDays: String(rangeDays) });
      if (endDate) params.append('endDate', endDate);

      const url = `${API_BASE_URL}/meal-logs/statistics?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.statistics || null;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching statistics:', error);
      return null;
    }
  },

  /**
   * Create a new meal log
   */
  async createMealLog(payload: CreateMealLogPayload): Promise<MealLog | null> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/meal-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data) {
        return resData.data.log;
      }
      return null;
    } catch (error) {
      console.warn('Error creating meal log:', error);
      return null;
    }
  },

  /**
   * Delete a meal log by ID
   */
  async deleteMealLog(logId: string): Promise<boolean> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/meal-logs/${logId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      return response.ok && resData.success;
    } catch (error) {
      console.warn('Error deleting meal log:', error);
      return false;
    }
  },
};
