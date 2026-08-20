import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, ActivityLog } from '@/types/activity.types';

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (e) {
    return null;
  }
};

export const activityService = {
  /**
   * Get standard activity list
   */
  async getActivities(params?: { search?: string; category?: string }): Promise<Activity[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.category && params.category !== 'Tất cả') query.append('category', params.category);

      const response = await fetch(`${API_BASE_URL}/activities?${query.toString()}`);
      const resData = await response.json();

      if (response.ok && resData.success) {
        return resData.data.activities || [];
      }
      return [];
    } catch (error) {
      console.warn('Error fetching activities:', error);
      return [];
    }
  },

  /**
   * Get activity logs for a specific date
   */
  async getActivityLogs(date?: string): Promise<ActivityLog[]> {
    try {
      const token = await getAuthToken();
      const query = new URLSearchParams();
      if (date) query.append('date', date);

      const response = await fetch(`${API_BASE_URL}/activities/logs?${query.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        return resData.data.logs || [];
      }
      return [];
    } catch (error) {
      console.warn('Error fetching activity logs:', error);
      return [];
    }
  },

  /**
   * Add a new activity log
   */
  async addActivityLog(data: {
    activity_id?: string | null;
    custom_activity_name?: string | null;
    duration_minutes: number;
    calories_burned?: number;
    logged_at?: string;
  }): Promise<ActivityLog | null> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/activities/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        return resData.data.log;
      }
      throw new Error(resData.message || 'Lỗi khi thêm hoạt động');
    } catch (error) {
      console.warn('Error adding activity log:', error);
      throw error;
    }
  },

  /**
   * Delete an activity log by ID
   */
  async deleteActivityLog(logId: string): Promise<boolean> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/activities/logs/${logId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData = await response.json();
      return response.ok && resData.success;
    } catch (error) {
      console.warn('Error deleting activity log:', error);
      return false;
    }
  },
};
