import {
  ActivityDetailResponse,
  ActivityListParams,
  ActivityListResponse,
  CreateActivityPayload,
  MutateActivityResponse,
  UpdateActivityPayload,
} from "../types/activity.types";
import { apiClient } from "./api";

export const adminActivityService = {
  /**
   * Lấy danh sách hoạt động thể chất (phân trang, tìm kiếm, lọc danh mục)
   */
  async getActivities(params: ActivityListParams = {}): Promise<ActivityListResponse> {
    const response = await apiClient.get<ActivityListResponse>("/admin/activities", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.search && params.search.trim() ? { search: params.search.trim() } : {}),
        ...(params.category && params.category !== "all" ? { category: params.category } : {}),
      },
    });
    return response.data;
  },

  /**
   * Lấy chi tiết hoạt động theo ID
   */
  async getActivityById(id: string): Promise<ActivityDetailResponse> {
    const response = await apiClient.get<ActivityDetailResponse>(`/admin/activities/${id}`);
    return response.data;
  },

  /**
   * Tạo mới hoạt động thể chất
   */
  async createActivity(payload: CreateActivityPayload): Promise<MutateActivityResponse> {
    const response = await apiClient.post<MutateActivityResponse>("/admin/activities", payload);
    return response.data;
  },

  /**
   * Cập nhật thông tin hoạt động
   */
  async updateActivity(id: string, payload: UpdateActivityPayload): Promise<MutateActivityResponse> {
    const response = await apiClient.put<MutateActivityResponse>(`/admin/activities/${id}`, payload);
    return response.data;
  },

  /**
   * Xóa một hoạt động
   */
  async deleteActivity(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/admin/activities/${id}`
    );
    return response.data;
  },
};
