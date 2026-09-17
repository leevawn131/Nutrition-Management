import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from './storage.service';
import { PostItem, PostComment, SearchTab } from '@/types/post.types';

class PostService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Fetch Social Feed Posts
   */
  async getFeed(page = 1, limit = 20): Promise<PostItem[]> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/posts/feed?page=${page}&limit=${limit}`, {
        headers,
      });
      const data = await res.json();
      if (data.success) {
        return data.data || [];
      }
      return [];
    } catch (err) {
      console.log('Lỗi lấy feed bài viết:', err);
      return [];
    }
  }

  /**
   * Fetch My Posts or Specific User's Posts
   */
  async getMyPosts(userId?: string): Promise<PostItem[]> {
    try {
      const headers = await this.getAuthHeaders();
      const url = userId
        ? `${API_BASE_URL}/posts/user/${userId}`
        : `${API_BASE_URL}/posts/my-posts`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        return data.data || [];
      }
      return [];
    } catch (err) {
      console.log('Lỗi lấy bài viết cá nhân:', err);
      return [];
    }
  }

  /**
   * Create New Post
   */
  async createPost(payload: { content?: string; recipe_id?: string; images?: string[] }): Promise<PostItem | null> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Lỗi tạo bài viết');
    } catch (err: any) {
      console.log('Lỗi createPost:', err);
      throw err;
    }
  }

  /**
   * Toggle Like Post
   */
  async toggleLike(postId: string): Promise<{ is_liked: boolean; like_count: number }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Lỗi thích bài viết');
    } catch (err: any) {
      console.log('Lỗi toggleLike:', err);
      throw err;
    }
  }

  /**
   * Report Post
   */
  async reportPost(postId: string, reason?: string): Promise<{ message: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/posts/${postId}/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        return { message: data.message };
      }
      throw new Error(data.message || 'Lỗi báo cáo bài viết');
    } catch (err: any) {
      console.log('Lỗi reportPost:', err);
      throw err;
    }
  }

  /**
   * Get Comments for Post
   */
  async getComments(postId: string): Promise<PostComment[]> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        headers,
      });
      const data = await res.json();
      if (data.success) {
        return data.data || [];
      }
      return [];
    } catch (err) {
      console.log('Lỗi lấy bình luận:', err);
      return [];
    }
  }

  /**
   * Add Comment to Post
   */
  async addComment(postId: string, content: string): Promise<PostComment[]> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        return data.data || [];
      }
      throw new Error(data.message || 'Không thể bình luận bài viết này');
    } catch (err: any) {
      console.log('Lỗi addComment:', err);
      throw err;
    }
  }

  /**
   * Explore Search Across 4 Tabs
   */
  async search(q: string, tab: SearchTab): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(
        `${API_BASE_URL}/search?q=${encodeURIComponent(q)}&tab=${encodeURIComponent(tab)}`,
        { headers }
      );
      const data = await res.json();
      if (data.success) {
        return data.data || [];
      }
      return [];
    } catch (err) {
      console.log('Lỗi search:', err);
      return [];
    }
  }
}

export const postService = new PostService();
