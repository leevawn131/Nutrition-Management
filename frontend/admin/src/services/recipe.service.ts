import {
  CreateRecipePayload,
  MutateRecipeResponse,
  RecipeDetailResponse,
  RecipeListParams,
  RecipeListResponse,
  UpdateRecipePayload,
} from "../types/recipe.types";
import { apiClient } from "./api";

export const adminRecipeService = {
  /**
   * Lấy danh sách công thức phân trang, tìm kiếm và lọc
   */
  async getRecipes(params: RecipeListParams = {}): Promise<RecipeListResponse> {
    const response = await apiClient.get<RecipeListResponse>("/admin/recipes", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.search && params.search.trim()
          ? { search: params.search.trim() }
          : {}),
        ...(params.source_type && params.source_type !== "all"
          ? { source_type: params.source_type }
          : {}),
        ...(params.status && params.status !== "all"
          ? { status: params.status }
          : {}),
      },
    });
    return response.data;
  },

  /**
   * Lấy chi tiết công thức theo ID
   */
  async getRecipeById(id: string): Promise<RecipeDetailResponse> {
    const response = await apiClient.get<RecipeDetailResponse>(
      `/admin/recipes/${id}`,
    );
    return response.data;
  },

  /**
   * Tạo công thức hệ thống mới
   */
  async createRecipe(
    payload: CreateRecipePayload,
  ): Promise<MutateRecipeResponse> {
    const response = await apiClient.post<MutateRecipeResponse>(
      "/admin/recipes",
      payload,
    );
    return response.data;
  },

  /**
   * Cập nhật công thức món ăn
   */
  async updateRecipe(
    id: string,
    payload: UpdateRecipePayload,
  ): Promise<MutateRecipeResponse> {
    const response = await apiClient.put<MutateRecipeResponse>(
      `/admin/recipes/${id}`,
      payload,
    );
    return response.data;
  },

  /**
   * Phê duyệt hoặc từ chối công thức cộng đồng
   */
  async updateRecipeStatus(
    id: string,
    status: "approved" | "rejected",
  ): Promise<MutateRecipeResponse> {
    const response = await apiClient.put<MutateRecipeResponse>(
      `/admin/recipes/${id}/status`,
      { status },
    );
    return response.data;
  },

  /**
   * Xóa cứng công thức (kèm kiểm tra ràng buộc)
   */
  async deleteRecipe(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/admin/recipes/${id}`);
    return response.data;
  },
};
