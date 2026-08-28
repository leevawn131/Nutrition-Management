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
  updated_at?: string | null;
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
  avg_rating?: number;
  comment_count?: number;
  source_type: "system" | "community";
  created_by_user_id?:
    | {
        _id: string;
        full_name?: string;
        email: string;
        role: string;
      }
    | string
    | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  nutrition_facts?: RecipeNutritionFacts | null;
}

export interface RecipeListParams {
  page?: number;
  limit?: number;
  search?: string;
  source_type?: string;
  status?: string;
}

export interface RecipeListResponse {
  success: boolean;
  message?: string;
  data: {
    recipes: Recipe[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface RecipeDetailResponse {
  success: boolean;
  message?: string;
  data: {
    recipe: Recipe;
  };
}

export interface CreateRecipePayload {
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
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  nutrition_facts?: RecipeNutritionFacts | null;
}

export type UpdateRecipePayload = Partial<CreateRecipePayload>;

export interface MutateRecipeResponse {
  success: boolean;
  message: string;
  data?: {
    recipe: Recipe;
  };
}
