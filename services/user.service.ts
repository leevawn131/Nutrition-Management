import { API_BASE_URL } from '@/constants/api';
import { User } from '@/types/auth.types';

export interface HealthMetrics {
  bmi?: number;
  bmr?: number;
  tdee?: number;
  maintenanceCalories?: number;
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface HealthResponse {
  success: boolean;
  data: {
    health: HealthMetrics;
  };
}

/**
 * Service to fetch Module A Profile and Health data
 */
export const userService = {
  /**
   * Fetch current user profile
   */
  async getProfile(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: ProfileResponse = await response.json();
      if (response.ok && data.success) {
        return data.data.user;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching user profile:', error);
      return null;
    }
  },

  /**
   * Fetch calculated current health metrics
   */
  async getHealthMetrics(token: string): Promise<HealthMetrics | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/health/current`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: HealthResponse = await response.json();
      if (response.ok && data.success && data.data) {
        return data.data.health;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching health metrics:', error);
      return null;
    }
  },
};
