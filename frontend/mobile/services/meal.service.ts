import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '@/constants/api';
import { AIRecognitionResult, MealLogPayload, MealLogResponse } from '@/types/meal.types';

// Helper to convert URI to base64
async function getBase64FromUri(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
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
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
}

export const mealService = {
  /**
   * Upload image file(s) to backend AI vision endpoint
   */
  async analyzeImage(
    token: string,
    imageInput: string | Array<{ uri: string; mimeType?: string }>,
    mimeType: string = 'image/jpeg',
    descriptionText?: string
  ): Promise<{ success: boolean; data: AIRecognitionResult }> {
    try {
      let bodyPayload: any = {
        description_text: descriptionText,
      };

      if (Array.isArray(imageInput)) {
        const imagesBase64 = await Promise.all(
          imageInput.map(async (item) => {
            const b64 = await getBase64FromUri(item.uri);
            return {
              data: b64,
              mimeType: item.mimeType || 'image/jpeg',
            };
          })
        );
        bodyPayload.images_base64 = imagesBase64;
      } else {
        const base64Image = await getBase64FromUri(imageInput);
        bodyPayload.image_base64 = base64Image;
        bodyPayload.mimeType = mimeType || 'image/jpeg';
      }

      const response = await fetch(`${API_BASE_URL}/meals/analyze-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
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
   * Transcribe voice recording audio to text
   */
  async transcribeVoice(
    token: string,
    params: {
      audioUri?: string;
      audioBase64?: string;
      mimeType?: string;
    }
  ): Promise<{ success: boolean; data: { transcription: string } }> {
    try {
      let base64Audio = params.audioBase64 || '';
      const mimeType = params.mimeType || 'audio/m4a';

      if (!base64Audio && params.audioUri) {
        if (Platform.OS === 'web') {
          const res = await fetch(params.audioUri);
          const blob = await res.blob();
          base64Audio = await new Promise<string>((resolve, reject) => {
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
          base64Audio = await FileSystem.readAsStringAsync(params.audioUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      }

      const response = await fetch(`${API_BASE_URL}/meals/transcribe-voice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_base64: base64Audio,
          mimeType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi nhận dạng giọng nói');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi mealService transcribeVoice:', error);
      throw error;
    }
  },

  /**
   * Analyze food voice recording or transcript text using AI
   */
  async analyzeVoice(
    token: string,
    params: {
      audioUri?: string;
      audioBase64?: string;
      mimeType?: string;
      transcriptText?: string;
    }
  ): Promise<{ success: boolean; data: AIRecognitionResult }> {
    try {
      let base64Audio = params.audioBase64 || '';
      const mimeType = params.mimeType || 'audio/m4a';

      if (!base64Audio && params.audioUri) {
        if (Platform.OS === 'web') {
          const res = await fetch(params.audioUri);
          const blob = await res.blob();
          base64Audio = await new Promise<string>((resolve, reject) => {
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
          base64Audio = await FileSystem.readAsStringAsync(params.audioUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      }

      const response = await fetch(`${API_BASE_URL}/meals/analyze-voice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_base64: base64Audio || undefined,
          mimeType: base64Audio ? mimeType : undefined,
          transcript_text: params.transcriptText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi phân tích dinh dưỡng giọng nói');
      }
      return data;
    } catch (error: any) {
      console.error('Lỗi mealService analyzeVoice:', error);
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

  /**
   * Cập nhật định lượng và dinh dưỡng bữa ăn đã lưu
   */
  async updateMealLog(
    token: string,
    mealId: string,
    payload: {
      portion_grams?: number;
      calories?: number;
      protein_g?: number;
      carb_g?: number;
      fat_g?: number;
      meal_type?: string;
      logged_at?: string;
      description_text?: string;
    }
  ): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi cập nhật bữa ăn');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi mealService updateMealLog:', error);
      throw error;
    }
  },

  /**
   * Xóa bữa ăn
   */
  async deleteMealLog(token: string, mealId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi xóa bữa ăn');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi mealService deleteMealLog:', error);
      throw error;
    }
  },
};
