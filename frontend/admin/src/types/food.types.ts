export interface Food {
  _id: string;
  name: string;
  name_en?: string | null;
  category?: string | null;
  calories_per_100g: number;
  protein_per_100g?: number | null;
  carb_per_100g?: number | null;
  fat_per_100g?: number | null;
  image_url?: string | null;
  is_verified: boolean;
  aliases?: string[];
  created_by_admin_id?: string | null;
  created_at: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FoodListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  is_verified?: string;
}

export interface FoodListResponse {
  success: boolean;
  data: {
    foods: Food[];
    pagination: Pagination;
  };
}

export interface FoodDetailResponse {
  success: boolean;
  data: {
    food: Food;
  };
}

export interface CreateFoodPayload {
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
}

export type UpdateFoodPayload = Partial<CreateFoodPayload>;

export interface MutateFoodResponse {
  success: boolean;
  message: string;
  data?: {
    food: Food;
  };
}
