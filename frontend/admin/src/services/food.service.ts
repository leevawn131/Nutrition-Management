import { apiClient } from "./api";
import {
  FoodListParams,
  FoodListResponse,
  FoodDetailResponse,
  CreateFoodPayload,
  UpdateFoodPayload,
  MutateFoodResponse,
} from "../types/food.types";

export const adminFoodService = {
  /**
   * Fetch paginated list of foods with search, category, and verification filter
   */
  async getFoods(params: FoodListParams = {}): Promise<FoodListResponse> {
    const response = await apiClient.get<FoodListResponse>("/admin/foods", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.search && params.search.trim()
          ? { search: params.search.trim() }
          : {}),
        ...(params.category && params.category !== "all"
          ? { category: params.category }
          : {}),
        ...(params.is_verified && params.is_verified !== "all"
          ? { is_verified: params.is_verified }
          : {}),
      },
    });
    return response.data;
  },

  /**
   * Fetch single food detail by ID
   */
  async getFoodById(id: string): Promise<FoodDetailResponse> {
    const response = await apiClient.get<FoodDetailResponse>(
      `/admin/foods/${id}`,
    );
    return response.data;
  },

  /**
   * Create a new food item
   */
  async createFood(payload: CreateFoodPayload): Promise<MutateFoodResponse> {
    const response = await apiClient.post<MutateFoodResponse>(
      "/admin/foods",
      payload,
    );
    return response.data;
  },

  /**
   * Update an existing food item
   */
  async updateFood(
    id: string,
    payload: UpdateFoodPayload,
  ): Promise<MutateFoodResponse> {
    const response = await apiClient.put<MutateFoodResponse>(
      `/admin/foods/${id}`,
      payload,
    );
    return response.data;
  },

  /**
   * Delete a food item (hard delete with server-side reference check)
   */
  async deleteFood(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/admin/foods/${id}`);
    return response.data;
  },
};
