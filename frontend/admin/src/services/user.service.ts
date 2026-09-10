import { apiClient } from './api';
import { User } from '../types/auth.types';

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: Pagination;
  };
}

export interface GetUserDetailResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface UpdateRoleResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export const adminUserService = {
  /**
   * Fetch paginated list of users with search and role filter
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  } = {}): Promise<GetUsersResponse> {
    const response = await apiClient.get<GetUsersResponse>('/admin/users', {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.search ? { search: params.search.trim() } : {}),
        ...(params.role && params.role !== 'all' ? { role: params.role } : {}),
      },
    });
    return response.data;
  },

  /**
   * Fetch single user detail by ID
   */
  async getUserById(id: string): Promise<GetUserDetailResponse> {
    const response = await apiClient.get<GetUserDetailResponse>(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Update user role (promote to admin or demote to user)
   */
  async updateUserRole(id: string, role: 'user' | 'admin'): Promise<UpdateRoleResponse> {
    const response = await apiClient.put<UpdateRoleResponse>(`/admin/users/${id}/role`, {
      role,
    });
    return response.data;
  },
};
