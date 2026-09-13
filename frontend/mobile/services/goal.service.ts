import { API_BASE_URL } from '@/constants/api';
import { User } from '@/types/auth.types';

export interface GoalRecommendationRequest {
  goal: 'lose' | 'maintain' | 'gain';
  target_weight?: number;
  target_duration_weeks?: number;
}

export interface GoalRecommendationData {
  goal: string;
  recommendedTargetCalories: number;
  targetWeightKg?: number;
  targetDurationWeeks?: number;
  weeklyWeightChangeKg?: number;
  dailyCalorieAdjustment?: number;
  tdee: number;
}

export interface GoalConfirmRequest {
  goal: 'lose' | 'maintain' | 'gain';
  target_weight?: number;
  target_duration_weeks?: number;
  target_calories: number;
}

export interface GoalRecommendationResponse {
  success: boolean;
  message?: string;
  data: {
    recommendation: GoalRecommendationData;
  };
}

export interface GoalConfirmResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}

export const goalService = {
  /**
   * Request recommended target calories from backend
   */
  async recommendGoal(
    token: string,
    payload: GoalRecommendationRequest
  ): Promise<GoalRecommendationData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/recommend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: GoalRecommendationResponse = await response.json();
      if (response.ok && data.success && data.data) {
        return data.data.recommendation;
      }
      console.warn('recommendGoal API response not ok:', data);
      return null;
    } catch (error) {
      console.warn('Error in recommendGoal API:', error);
      return null;
    }
  },

  /**
   * Confirm and save the goal + target calories
   */
  async confirmGoal(token: string, payload: GoalConfirmRequest): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/confirm`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: GoalConfirmResponse = await response.json();
      if (response.ok && data.success && data.data) {
        return data.data.user;
      }
      console.warn('confirmGoal API response not ok:', data);
      return null;
    } catch (error) {
      console.warn('Error in confirmGoal API:', error);
      return null;
    }
  },
};
