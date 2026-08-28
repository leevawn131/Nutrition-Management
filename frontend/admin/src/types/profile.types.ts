import { User } from './auth.types';

export interface UpdateProfilePayload {
  full_name?: string | null;
  avatar_url?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  date_of_birth?: string | null;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}
