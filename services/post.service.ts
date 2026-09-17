import { API_BASE_URL } from '@/constants/api';
import { Post, CreatePostPayload } from '@/types/post.types';

export const postService = {
  /**
   * Tạo bài viết mới / Chia sẻ bữa ăn lên MXH
   */
  async createPost(token: string, payload: CreatePostPayload): Promise<{ success: boolean; data: Post }> {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đăng bài viết');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi postService createPost:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách bài viết trên Bảng tin Cộng đồng (Explore)
   */
  async getPosts(
    token?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data: Post[]; pagination?: any }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/posts?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải danh sách bài viết');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi postService getPosts:', error);
      throw error;
    }
  },
};
