export interface IngredientItem {
  id?: string;
  food_item_id?: string;
  ingredient_name?: string;
  name: string;
  quantity?: number;
  amount: number; // Base amount per 1 serving
  unit: string;
  icon_url?: string;
  image_url?: string;
}

export interface RecipeStep {
  step_number: number;
  title?: string;
  instruction?: string;
  description?: string;
  image_url?: string | null;
}

export interface NutritionFacts {
  energy_kcal?: number;
  calories: number;
  protein_g: number;
  carbohydrate_g?: number;
  carb_g: number;
  fat_g: number;
  glycemic_load: number; // GL index (e.g., 5)
  // Macro breakdowns
  saturated_fat_g: number;
  trans_fat_g: number;
  unsaturated_fat_g: number;
  fiber_g: number;
  cholesterol_mg: number;
  sodium_mg: number;
  // Vitamins
  vitamin_a_ug?: number;
  vitamin_a_mcg?: number;
  vitamin_e_mg: number;
  vitamin_k_ug?: number;
  vitamin_k_mcg?: number;
  vitamin_c_mg: number;
  folic_acid_ug?: number;
  folic_acid_mcg?: number;
  vitamin_b12_ug?: number;
  vitamin_b12_mcg?: number;
  // Minerals
  calcium_mg: number;
  iron_mg: number;
  zinc_mg: number;
  magnesium_mg: number;
  potassium_mg: number;
  phosphorus_mg: number;
}

export interface RecipeReview {
  id?: string;
  _id?: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  quick_tags?: string[];
  comment: string;
  created_at?: string;
}

export interface Recipe {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  image_url?: string;
  cover_image_url: string;
  is_private?: boolean;
  source_type?: 'system' | 'community';
  created_by_user_id?: any;
  status?: string;
  author?: {
    user_id?: string;
    name: string;
    avatar_url: string;
  };
  prep_time_minutes?: number;
  prep_time_min: number;
  cook_time_minutes?: number;
  cook_time_min: number;
  servings: number; // Default servings (e.g. 1)
  calories_per_serving?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  avg_rating?: number;
  comment_count?: number;
  rating: number;
  rating_count: number;
  saved_count: number;
  ingredients: IngredientItem[];
  steps: RecipeStep[];
  nutrition_facts: NutritionFacts;
  reviews: RecipeReview[];
  created_at?: string;
  updated_at?: string;
}

export interface AddGroceryPayload {
  recipe_id: string;
  servings: number;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
}
