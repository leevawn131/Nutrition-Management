export interface IngredientItem {
  id?: string;
  food_item_id?: string;
  name: string;
  amount: number; // Base amount per 1 serving
  unit: string;
  icon_url?: string;
}

export interface RecipeStep {
  step_number: number;
  title?: string;
  description: string;
}

export interface NutritionFacts {
  calories: number;
  protein_g: number;
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
  vitamin_a_ug: number;
  vitamin_e_mg: number;
  vitamin_k_ug: number;
  vitamin_c_mg: number;
  folic_acid_ug: number;
  vitamin_b12_ug: number;
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
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  quick_tags: string[];
  comment: string;
  created_at?: string;
}

export interface Recipe {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  cover_image_url: string;
  is_private?: boolean;
  author: {
    name: string;
    avatar_url: string;
  };
  prep_time_min: number;
  cook_time_min: number;
  servings: number; // Default servings (e.g. 1)
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
