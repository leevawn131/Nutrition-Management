import { API_BASE_URL } from '@/constants/api';
import { clearAuthData, getAuthToken } from '@/services/storage.service';
import {
    ChatConversationSummary,
    ChatInput,
    ChatMessage,
    ChatSendResponse,
} from '@/types/chat.types';

async function throwChatResponseError(response: Response, fallbackMessage: string): Promise<never> {
  const errJson = await response.json().catch(() => ({}));
  if (response.status === 401) {
    await clearAuthData();
    const error = new Error(errJson.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    error.name = 'AuthExpiredError';
    throw error;
  }
  throw new Error(errJson.message || fallbackMessage);
}

export const chatService = {
  /**
   * Send a message to AI Chatbot via Shared Chat Contract POST /api/chat/messages
   */
  async sendMessage(params: {
    conversation_id?: string | null;
    client_message_id?: string;
    input: ChatInput;
  }): Promise<ChatSendResponse> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: params.conversation_id || null,
        client_message_id: params.client_message_id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        input: params.input,
      }),
    });

    if (!response.ok) {
      await throwChatResponseError(response, `Lỗi kết nối máy chủ (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Get active conversation with message history
   */
  async getActiveConversation(): Promise<{
    conversation: ChatConversationSummary;
    messages: ChatMessage[];
  }> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat/conversations/active`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      await throwChatResponseError(response, 'Không thể lấy cuộc trò chuyện');
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Reset / start fresh conversation
   */
  async resetConversation(): Promise<ChatSendResponse> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat/conversations/reset`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      await throwChatResponseError(response, 'Không thể làm mới cuộc trò chuyện');
    }

    return await response.json();
  },

  /**
   * Get list of all past conversations
   */
  async getConversations(): Promise<ChatConversationSummary[]> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      await throwChatResponseError(response, 'Không thể lấy danh sách cuộc trò chuyện');
    }

    const json = await response.json();
    return json.data || [];
  },

  /**
   * Get specific conversation by ID
   */
  async getConversationById(id: string): Promise<{
    conversation: ChatConversationSummary;
    messages: ChatMessage[];
  }> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat/conversations/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      await throwChatResponseError(response, 'Không thể tải cuộc trò chuyện');
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Delete a conversation by ID
   */
  async deleteConversation(id: string): Promise<{ success: boolean; message?: string }> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat/conversations/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      await throwChatResponseError(response, 'Không thể xóa cuộc trò chuyện');
    }

    return await response.json();
  },
};
