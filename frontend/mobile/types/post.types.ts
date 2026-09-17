export type SearchTab = 'recipes' | 'ingredients' | 'posts' | 'users';

export interface UserAuthor {
  id: string;
  _id?: string;
  full_name: string;
  avatar_url?: string | null;
  email?: string;
}

export interface AttachedRecipe {
  id: string;
  _id?: string;
  title: string;
  image_url?: string | null;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
  ingredient_count?: number;
  calories_per_serving?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  ingredients?: Array<{
    ingredient_name: string;
    quantity?: number;
    unit?: string;
  }>;
  steps?: Array<{
    step_number: number;
    instruction: string;
  }>;
}

export interface PostItem {
  id: string;
  _id: string;
  user: UserAuthor;
  content: string;
  images: string[];
  recipe?: AttachedRecipe | null;
  recipe_id?: string | null;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  status: 'visible' | 'hidden' | 'pending';
  created_at: string;
}

export interface PostComment {
  id: string;
  _id: string;
  user: UserAuthor;
  content: string;
  rating?: number | null;
  created_at: string;
}

export interface RecipeSearchResult {
  id: string;
  _id: string;
  title: string;
  description?: string;
  image_url?: string | null;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
  ingredient_count?: number;
  calories_per_serving?: number;
  avg_rating?: number;
}

export interface IngredientSearchResult {
  id: string;
  _id: string;
  name: string;
  name_en?: string | null;
  category?: string | null;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carb_per_100g?: number;
  fat_per_100g?: number;
  image_url?: string | null;
}
