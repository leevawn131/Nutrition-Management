export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface RecipeIngredient {
  ingredient_name: string;
  quantity?: number | null;
  unit?: string | null;
}

export interface RecipeStep {
  step_number: number;
  instruction: string;
}

export interface RecipeNutritionFacts {
  energy_kcal?: number | null;
  protein_g?: number | null;
  carbohydrate_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  saturated_fat_g?: number | null;
  trans_fat_g?: number | null;
  unsaturated_fat_g?: number | null;
  cholesterol_mg?: number | null;
  salt_g?: number | null;
  sodium_mg?: number | null;
  glycemic_load?: number | null;
  vitamin_a_mcg?: number | null;
  vitamin_d_mcg?: number | null;
  vitamin_e_mg?: number | null;
  vitamin_k_mcg?: number | null;
  vitamin_c_mg?: number | null;
  vitamin_b12_mcg?: number | null;
  folic_acid_mcg?: number | null;
  calcium_mg?: number | null;
  iron_mg?: number | null;
  zinc_mg?: number | null;
  magnesium_mg?: number | null;
  potassium_mg?: number | null;
  phosphorus_mg?: number | null;
}

export interface Recipe {
  _id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  servings: number;
  calories_per_serving?: number | null;
  protein_g?: number | null;
  carb_g?: number | null;
  fat_g?: number | null;
  avg_rating?: number | null;
  comment_count?: number | null;
  source_type: 'system' | 'community';
  status?: 'pending' | 'approved' | 'rejected';
  ingredients: RecipeIngredient[];
  steps?: RecipeStep[];
  nutrition_facts?: RecipeNutritionFacts | null;
  created_at?: string;
}

export interface FoodItem {
  _id: string;
  name: string;
  name_en?: string | null;
  category?: string | null;
  calories_per_100g: number;
  protein_per_100g?: number | null;
  carb_per_100g?: number | null;
  fat_per_100g?: number | null;
  image_url?: string | null;
  is_verified?: boolean;
  aliases?: string[];
  created_at?: string;
}

export interface MealPlanItem {
  _id: string;
  user_id?: string;
  plan_date: string;
  meal_type: MealType;
  recipe_id?: Recipe | string | null;
  food_item_id?: FoodItem | string | null;
  source: 'template' | 'recipe' | 'ingredient' | 'manual';
  is_logged?: boolean;
  created_at?: string;
}

export interface UserCollectionItem {
  item_type: 'post' | 'recipe';
  item_id: string;
  added_at: string;
}

export interface UserCollection {
  _id: string;
  user_id: string;
  name: string;
  items: UserCollectionItem[];
  created_at?: string;
}
