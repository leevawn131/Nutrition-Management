import { Food } from "./food.types";

export interface ReporterSummary {
  _id: string;
  full_name?: string | null;
  email: string;
}

export interface UnidentifiedFood {
  _id: string;
  image_url: string | null;
  name_guess: string | null;
  status: "pending" | "resolved";
  reported_by: ReporterSummary | null;
  resolved_food_item: Food | null;
  created_at: string;
}

export interface UnidentifiedFoodPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnidentifiedFoodSummary {
  total: number;
  pending: number;
  resolved: number;
}

export interface UnidentifiedFoodListParams {
  status?: "pending" | "resolved" | "all";
  search?: string;
  page?: number;
  limit?: number;
}

export interface UnidentifiedFoodListResponse {
  success: boolean;
  message?: string;
  data: {
    items: UnidentifiedFood[];
    pagination: UnidentifiedFoodPagination;
    summary: UnidentifiedFoodSummary;
  };
}

export interface UnidentifiedFoodDetailResponse {
  success: boolean;
  message?: string;
  data: {
    item: UnidentifiedFood;
  };
}

export interface ResolveWithExistingPayload {
  food_item_id: string;
}

export interface NewFoodPayload {
  name: string;
  name_en?: string | null;
  category?: string | null;
  calories_per_100g: number;
  protein_per_100g?: number | null;
  carb_per_100g?: number | null;
  fat_per_100g?: number | null;
  aliases?: string[];
  image_url?: string | null;
}

export interface ResolveWithNewFoodPayload {
  new_food: NewFoodPayload;
}

export interface MutateUnidentifiedFoodResponse {
  success: boolean;
  message: string;
  data?: {
    item: UnidentifiedFood;
  };
}
