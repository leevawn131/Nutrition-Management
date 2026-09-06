import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import { AIRecognitionResult, MealLogPayload, MealLogResponse } from '@/types/meal.types';

export const mealService = {
  /**
   * Upload image file to backend AI vision endpoint
   */
  async analyzeImage(
    token: string,
    imageUri: string,
    mimeType: string = 'image/jpeg',
    descriptionText?: string
  ): Promise<{ success: boolean; data: AIRecognitionResult }> {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'meal_photo.jpg';

      if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: mimeType });
        formData.append('image', file);
      } else {
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type: mimeType,
        } as any);
      }

      if (descriptionText) {
        formData.append('description_text', descriptionText);
      }

      const response = await fetch(`${API_BASE_URL}/meals/analyze-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type is auto set by fetch with FormData
        },
        body: formData,
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
