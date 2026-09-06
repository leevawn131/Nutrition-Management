export interface FoodItem {
  _id: string;
  name: string;
  name_en?: string | null;
  category?: string | null;
  calories_per_100g: number;
  protein_per_100g?: number;
  carb_per_100g?: number;
  fat_per_100g?: number;
  image_url?: string | null;
  is_verified?: boolean;
  aliases?: string[];
  created_at?: string;
}

export interface FoodSearchResponse {
  success: boolean;
  message: string;
  data: FoodItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
