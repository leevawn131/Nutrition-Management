export interface AIAnalyzedFood {
  food_item_id: string;
  name: string;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  glycemic_index?: number;
  glycemic_load?: number;
  estimated_grams: number;
  confidence: number;
  image_url?: string;
  category?: string;
}

export interface AnalyzeMealResponse {
  recognition_id: string;
  foods: AIAnalyzedFood[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface SaveMealData {
  confirmed_foods: AIAnalyzedFood[];
  meal_type: MealType;
  source_image_url: string;
  recognition_id: string;
  description?: string;
}
