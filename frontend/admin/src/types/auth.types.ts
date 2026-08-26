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
  activity_level?: string | null;
  goal?: string | null;
  target_calories?: number | null;
  target_protein_g?: number | null;
  target_carb_g?: number | null;
  target_fat_g?: number | null;
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

export interface MeResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}
