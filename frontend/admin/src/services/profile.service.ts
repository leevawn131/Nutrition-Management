import { apiClient } from './api';
import { UpdateProfilePayload, ProfileResponse } from '../types/profile.types';

export const profileService = {
  /**
   * Lấy thông tin hồ sơ người dùng / admin hiện tại
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>('/profile');
    return response.data;
  },

  /**
   * Cập nhật thông tin hồ sơ (Chỉ cho phép full_name, avatar_url, gender, date_of_birth)
   */
  async updateProfile(
    payload: UpdateProfilePayload,
  ): Promise<ProfileResponse> {
    const response = await apiClient.put<ProfileResponse>('/profile', payload);
    return response.data;
  },
};
