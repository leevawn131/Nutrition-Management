import {
  MutateUnidentifiedFoodResponse,
  NewFoodPayload,
  UnidentifiedFoodDetailResponse,
  UnidentifiedFoodListParams,
  UnidentifiedFoodListResponse,
} from "../types/unidentified_food.types";
import { apiClient } from "./api";

export const adminUnidentifiedFoodService = {
  /**
   * Lấy danh sách phân trang các món ăn chưa xác định
   */
  async getUnidentifiedFoods(
    params: UnidentifiedFoodListParams = {},
  ): Promise<UnidentifiedFoodListResponse> {
    const response = await apiClient.get<UnidentifiedFoodListResponse>(
      "/admin/unidentified-foods",
      { params },
    );
    return response.data;
  },

  /**
   * Lấy chi tiết 1 bản ghi món ăn chưa xác định
   */
  async getUnidentifiedFoodById(
    id: string,
  ): Promise<UnidentifiedFoodDetailResponse> {
    const response = await apiClient.get<UnidentifiedFoodDetailResponse>(
      `/admin/unidentified-foods/${id}`,
    );
    return response.data;
  },

  /**
   * Chuẩn hóa bằng cách gán một món ăn đã có sẵn trong từ điển
   */
  async resolveWithExistingFood(
    id: string,
    foodItemId: string,
  ): Promise<MutateUnidentifiedFoodResponse> {
    const response = await apiClient.put<MutateUnidentifiedFoodResponse>(
      `/admin/unidentified-foods/${id}/resolve`,
      { food_item_id: foodItemId },
    );
    return response.data;
  },

  /**
   * Chuẩn hóa bằng cách tạo một món ăn mới và liên kết
   */
  async resolveWithNewFood(
    id: string,
    newFood: NewFoodPayload,
  ): Promise<MutateUnidentifiedFoodResponse> {
    const response = await apiClient.put<MutateUnidentifiedFoodResponse>(
      `/admin/unidentified-foods/${id}/resolve`,
      { new_food: newFood },
    );
    return response.data;
  },

  /**
   * Xóa bản ghi báo cáo món ăn chưa xác định (áp dụng cho spam / ảnh không hợp lệ)
   */
  async deleteUnidentifiedFood(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/admin/unidentified-foods/${id}`);
    return response.data;
  },
};
