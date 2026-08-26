import { API_BASE_URL } from '@/constants/api';
import { AnalyzeMealResponse, SaveMealData } from '@/types/meal.types';

export const mealService = {
  /**
   * Send base64 image to AI Vision for analysis
   */
  async analyzeMealImage(base64Image: string, token: string): Promise<AnalyzeMealResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ base64_image: base64Image }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi phân tích hình ảnh');
      }

      return data;
    } catch (error: any) {
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.');
      }
      throw error;
    }
  },

  /**
   * Send text description to AI for analysis
   */
  async analyzeMealText(text: string, token: string): Promise<AnalyzeMealResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi phân tích văn bản');
      }

      return data;
    } catch (error: any) {
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.');
      }
      throw error;
    }
  },

  /**
   * Save confirmed meal logs to database
   */
  async saveMealLogs(mealData: SaveMealData, token: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mealData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi lưu bữa ăn');
      }

      return data;
    } catch (error: any) {
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.');
      }
      throw error;
    }
  },
};
