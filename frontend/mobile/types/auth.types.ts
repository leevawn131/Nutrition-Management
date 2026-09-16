export interface User {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  full_name?: string | null;
  avatar_url?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  date_of_birth?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  goal?: 'lose' | 'maintain' | 'gain' | null;
  target_calories?: number | null;
  target_protein_g?: number | null;
  target_carb_g?: number | null;
  target_fat_g?: number | null;
  food_preferences?: {
    preference_type: 'diet_type' | 'allergy' | 'favorite' | 'dislike';
    value: string;
  }[];
  points?: number;
  rank?: string;
  achievements?: string[];
  friends?: string[];
  streak?: {
    current_streak?: number;
    longest_streak?: number;
    last_success_date?: string | null;
  };
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}

export interface AuthErrorResponse {
  success: false;
  message: string;
}
