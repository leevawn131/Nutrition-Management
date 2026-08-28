import { Recipe } from "./recipe.types";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealPlanTemplateItem {
  meal_type: MealType;
  recipe_id: Recipe | string;
}

export interface MealPlanTemplate {
  _id: string;
  name: string;
  description?: string | null;
  created_by_admin_id?:
    | {
        _id: string;
        full_name?: string;
        email: string;
        role: string;
      }
    | string
    | null;
  items?: MealPlanTemplateItem[];
  item_count?: number;
}

export interface MealPlanTemplateListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface MealPlanTemplateListResponse {
  success: boolean;
  message?: string;
  data: {
    templates: MealPlanTemplate[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface MealPlanTemplateDetailResponse {
  success: boolean;
  message?: string;
  data: {
    template: MealPlanTemplate;
  };
}

export interface CreateMealPlanTemplatePayload {
  name: string;
  description?: string | null;
  items?: {
    meal_type: MealType;
    recipe_id: string;
  }[];
}

export type UpdateMealPlanTemplatePayload =
  Partial<CreateMealPlanTemplatePayload>;

export interface MutateMealPlanTemplateResponse {
  success: boolean;
  message: string;
  data?: {
    template: MealPlanTemplate;
  };
}
