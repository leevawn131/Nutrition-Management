import { apiClient } from './api';
import {
  LoginResponse,
  MeResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
} from '../types/auth.types';

export const authService = {
  /**
   * Log in to admin portal
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe(): Promise<MeResponse> {
    const response = await apiClient.get<MeResponse>('/auth/me');
    return response.data;
  },

  /**
   * Change password for current authenticated admin
   */
  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResponse> {
    const response = await apiClient.put<ChangePasswordResponse>(
      '/auth/change-password',
      payload,
    );
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },
};
