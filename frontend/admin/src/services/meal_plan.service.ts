import { apiClient } from "./api";
import {
  MealPlanTemplateListParams,
  MealPlanTemplateListResponse,
  MealPlanTemplateDetailResponse,
  CreateMealPlanTemplatePayload,
  UpdateMealPlanTemplatePayload,
  MutateMealPlanTemplateResponse,
} from "../types/meal_plan.types";

export const adminMealPlanTemplateService = {
  /**
   * Lấy danh sách thực đơn mẫu phân trang và tìm kiếm
   */
  async getTemplates(
    params: MealPlanTemplateListParams = {},
  ): Promise<MealPlanTemplateListResponse> {
    const response = await apiClient.get<MealPlanTemplateListResponse>(
      "/admin/meal-plan-templates",
      {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && params.search.trim()
            ? { search: params.search.trim() }
            : {}),
        },
      },
    );
    return response.data;
  },

  /**
   * Lấy chi tiết thực đơn mẫu theo ID kèm populate món ăn
   */
  async getTemplateById(id: string): Promise<MealPlanTemplateDetailResponse> {
    const response = await apiClient.get<MealPlanTemplateDetailResponse>(
      `/admin/meal-plan-templates/${id}`,
    );
    return response.data;
  },

  /**
   * Tạo thực đơn mẫu mới
   */
  async createTemplate(
    payload: CreateMealPlanTemplatePayload,
  ): Promise<MutateMealPlanTemplateResponse> {
    const response = await apiClient.post<MutateMealPlanTemplateResponse>(
      "/admin/meal-plan-templates",
      payload,
    );
    return response.data;
  },

  /**
   * Cập nhật thực đơn mẫu
   */
  async updateTemplate(
    id: string,
    payload: UpdateMealPlanTemplatePayload,
  ): Promise<MutateMealPlanTemplateResponse> {
    const response = await apiClient.put<MutateMealPlanTemplateResponse>(
      `/admin/meal-plan-templates/${id}`,
      payload,
    );
    return response.data;
  },

  /**
   * Xóa thực đơn mẫu
   */
  async deleteTemplate(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/admin/meal-plan-templates/${id}`);
    return response.data;
  },
};
