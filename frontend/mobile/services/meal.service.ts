import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '@/constants/api';
import { AIRecognitionResult, MealLogPayload, MealLogResponse } from '@/types/meal.types';

export const mealService = {
  /**
   * Upload image file to backend AI vision endpoint via base64 JSON payload
   */
  async analyzeImage(
    token: string,
    imageUri: string,
    mimeType: string = 'image/jpeg',
    descriptionText?: string
  ): Promise<{ success: boolean; data: AIRecognitionResult }> {
    try {
      let base64Image = '';

      if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || result;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const response = await fetch(`${API_BASE_URL}/meals/analyze-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Image,
          mimeType: mimeType || 'image/jpeg',
          description_text: descriptionText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi nhận diện ảnh món ăn');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi mealService analyzeImage:', error);
      throw error;
    }
  },

  /**
   * Analyze text description of meal using AI
   */
  async analyzeText(
    token: string,
    descriptionText: string
  ): Promise<{ success: boolean; data: AIRecognitionResult }> {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/analyze-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description_text: descriptionText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi phân tích mô tả bữa ăn');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi mealService analyzeText:', error);
      throw error;
    }
  },

  /**
   * Create meal log entry in MongoDB
   */
  async logMeal(token: string, payload: MealLogPayload): Promise<MealLogResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/meals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ghi nhận bữa ăn không thành công');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi mealService logMeal:', error);
      throw error;
    }
  },

  /**
   * Fetch daily logged meals for user
   */
  async getMealLogs(token: string, date?: string): Promise<{ success: boolean; data: any[] }> {
    try {
      const queryStr = date ? `?date=${date}` : '';
      const response = await fetch(`${API_BASE_URL}/meals${queryStr}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi tải nhật ký bữa ăn');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi mealService getMealLogs:', error);
      throw error;
    }
  },
};
