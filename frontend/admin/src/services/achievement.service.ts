import {
  AchievementDetailResponse,
  AchievementListParams,
  AchievementListResponse,
  CreateAchievementPayload,
  MutateAchievementResponse,
  UpdateAchievementPayload,
} from "../types/achievement.types";
import { apiClient } from "./api";

export const adminAchievementService = {
  /**
   * Lấy danh sách danh hiệu (phân trang, tìm kiếm, lọc theo loại điều kiện)
   */
  async getAchievements(params: AchievementListParams = {}): Promise<AchievementListResponse> {
    const response = await apiClient.get<AchievementListResponse>("/admin/achievements", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.search && params.search.trim() ? { search: params.search.trim() } : {}),
        ...(params.condition_type && params.condition_type !== "all"
          ? { condition_type: params.condition_type }
          : {}),
      },
    });
    return response.data;
  },

  /**
   * Lấy chi tiết danh hiệu theo ID
   */
  async getAchievementById(id: string): Promise<AchievementDetailResponse> {
    const response = await apiClient.get<AchievementDetailResponse>(`/admin/achievements/${id}`);
    return response.data;
  },

  /**
   * Tạo mới danh hiệu
   */
  async createAchievement(payload: CreateAchievementPayload): Promise<MutateAchievementResponse> {
    const response = await apiClient.post<MutateAchievementResponse>("/admin/achievements", payload);
    return response.data;
  },

  /**
   * Cập nhật thông tin danh hiệu
   */
  async updateAchievement(
    id: string,
    payload: UpdateAchievementPayload
  ): Promise<MutateAchievementResponse> {
    const response = await apiClient.put<MutateAchievementResponse>(
      `/admin/achievements/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * Xóa một danh hiệu
   */
  async deleteAchievement(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/admin/achievements/${id}`
    );
    return response.data;
  },
};
