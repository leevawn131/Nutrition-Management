import { apiClient } from './api';
import {
  Timeframe,
  OverviewReportResponse,
  UserReportsResponse,
  FoodReportsResponse,
  RecipeReportsResponse,
} from '../types/report.types';

export const adminReportService = {
  /**
   * Lấy số liệu KPI tổng quan hệ thống
   */
  async getOverview(): Promise<OverviewReportResponse> {
    const response = await apiClient.get<OverviewReportResponse>('/admin/reports/overview');
    return response.data;
  },

  /**
   * Lấy báo cáo phân tích người dùng theo khung thời gian
   */
  async getUserReports(timeframe: Timeframe = '30d'): Promise<UserReportsResponse> {
    const response = await apiClient.get<UserReportsResponse>('/admin/reports/users', {
      params: { timeframe },
    });
    return response.data;
  },

  /**
   * Lấy báo cáo cơ sở dữ liệu thực phẩm & tình trạng xác thực
   */
  async getFoodReports(): Promise<FoodReportsResponse> {
    const response = await apiClient.get<FoodReportsResponse>('/admin/reports/foods');
    return response.data;
  },

  /**
   * Lấy báo cáo công thức & thực đơn mẫu
   */
  async getRecipeReports(): Promise<RecipeReportsResponse> {
    const response = await apiClient.get<RecipeReportsResponse>('/admin/reports/recipes');
    return response.data;
  },
};
