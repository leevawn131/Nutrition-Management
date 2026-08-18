import { API_BASE_URL } from '@/constants/api';
import { LoginResponse, RegisterResponse, User } from '@/types/auth.types';

/**
 * Service to interact with Backend Authentication API
 */
export const authService = {
  /**
   * Log in an existing user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
      }

      return data;
    } catch (error: any) {
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
      throw error;
    }
  },

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      }

      return data;
    } catch (error: any) {
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
      throw error;
    }
  },

  /**
   * Fetch current authenticated user
   */
  async getMe(token: string): Promise<{ success: boolean; data: { user: User } }> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Phiên đăng nhập đã hết hạn.');
    }

    return data;
  },
};
