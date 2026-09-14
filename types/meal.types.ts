export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type InputMethod = 'photo' | 'gallery' | 'text' | 'manual';

export interface AIRecognitionResult {
  recognition_id?: string;
  food_name: string;
  estimated_weight_g: number;
  estimated_eaten_weight_g?: number;
  consumption_pct?: number;
  container_size?: 'small' | 'medium' | 'large' | 'extra_large';
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  confidence: number;
  glycemic_load?: number;
  image_quality?: 'good' | 'fair' | 'poor';
  quality_warning?: string;
  nutrition_source?: 'ai_vision' | 'label' | 'database';
  quantity_uncertain?: boolean;
  hidden_base_food?: boolean;
  fried_food?: boolean;
  is_beverage?: boolean;
  has_bones?: boolean;
  sugar_level?: string;
  dishes?: DishItem[];
  ingredients?: Array<{
    food_item_id?: string;
    name: string;
    quantity?: number;
    portion_g?: number;
    estimated_weight_g?: number;
    calories?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    source?: 'visible' | 'inferred' | 'user_added';
  }>;
  toppings?: Array<{
    name: string;
    calories?: number;
  }>;
  alternatives?: Array<{
    name: string;
    confidence: number;
  }>;
}

export interface MicronutrientInfo {
  fiber_g?: number;
  sodium_mg?: number;
  potassium_mg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  vitamin_a_mcg?: number;
  vitamin_c_mg?: number;
  vitamin_d_mcg?: number;
  zinc_mg?: number;
  magnesium_mg?: number;
}

export interface DishIngredient {
  food_item_id?: string;
  name: string;
  quantity?: number;
  portion_g?: number;
  estimated_weight_g?: number;
  calories?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  micronutrients?: MicronutrientInfo;
  source?: 'visible' | 'inferred' | 'user_added';
}

export interface DishItem {
  id?: string;
  name: string;
  estimated_weight_g?: number;
  calories?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  micronutrients?: MicronutrientInfo;
  ingredients: DishIngredient[];
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
