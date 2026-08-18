import { API_BASE_URL } from '@/constants/api';
import { LoginResponse, RegisterResponse, User } from '@/types/auth.types';

const AUTH_REQUEST_TIMEOUT_MS = 10000;

function createRequestTimeoutController() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  return { controller, timeoutId };
}

/**
 * Service to interact with Backend Authentication API
 */
export const authService = {
  /**
   * Log in an existing user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const { controller, timeoutId } = createRequestTimeoutController();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
      }

      return data;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(
          `Yeu cau dang nhap qua thoi gian (${AUTH_REQUEST_TIMEOUT_MS / 1000}s). Kiem tra backend tai ${API_BASE_URL}.`
        );
      }
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error(
          `Khong the ket noi den may chu (${API_BASE_URL}). Vui long kiem tra API URL va ket noi mang.`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<RegisterResponse> {
    const { controller, timeoutId } = createRequestTimeoutController();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      }

      return data;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(
          `Yeu cau dang ky qua thoi gian (${AUTH_REQUEST_TIMEOUT_MS / 1000}s). Kiem tra backend tai ${API_BASE_URL}.`
        );
      }
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error(
          `Khong the ket noi den may chu (${API_BASE_URL}). Vui long kiem tra API URL va ket noi mang.`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
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
