export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type InputMethod = 'photo' | 'gallery' | 'text' | 'manual';

export interface AIRecognitionResult {
  recognition_id?: string;
  food_name: string;
  estimated_weight_g: number;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  confidence: number;
  glycemic_load?: number;
  ingredients?: Array<{
    name: string;
    estimated_weight_g: number;
  }>;
}

export interface IngredientInput {
  food_item_id: string;
  weight_g: number;
  name?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carb_per_100g?: number;
  fat_per_100g?: number;
}

export interface MealLogPayload {
  food_item_id?: string;
  input_method: InputMethod;
  source_image_url?: string;
  description_text?: string;
  portion_label?: 'small' | 'medium' | 'large' | null;
  portion_grams?: number;
  calories: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  meal_type: MealType;
  logged_at?: string;
  recognition_summary?: {
    recognition_id?: string;
    predicted_label?: string;
    confidence?: number;
    corrected_label?: string;
  };
  ingredients?: IngredientInput[];
}

export interface MealLogResponse {
  success: boolean;
  message: string;
  data: any;
}
