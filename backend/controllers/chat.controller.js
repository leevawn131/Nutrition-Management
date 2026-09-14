const chatWorkflowService = require('../services/chat_workflow.service');
const ChatConversation = require('../models/chat_conversation.model');
const ChatMessage = require('../models/chat_message.model');
const User = require('../models/user.model');

const getEffectiveUserId = async (req) => {
  if (req.user && (req.user.id || req.user._id)) {
    return req.user.id || req.user._id;
  }
  const firstUser = await User.findOne({ role: 'user' }).lean();
  return firstUser ? firstUser._id.toString() : null;
};

/**
 * POST /api/chat/messages
 * Shared Chat Contract according to specification
 */
const postMessage = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu đăng nhập để sử dụng tính năng Chatbot',
      });
    }

    const { conversation_id, client_message_id, input } = req.body;

    if (!input || !input.type) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào (input.type) là bắt buộc',
      });
    }

    const responseData = await chatWorkflowService.processMessage(userId, {
      conversation_id,
      client_message_id,
      input,
    });

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in postMessage:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xử lý tin nhắn Chatbot',
    });
  }
};

/**
 * GET /api/chat/conversations/active
 * Lấy phiên hội thoại gần nhất hoặc tạo mới
 */
const getActiveConversation = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    let conversation = await ChatConversation.findOne({ user_id: userId })
      .sort({ updated_at: -1 })
      .lean();

    if (!conversation) {
      conversation = await ChatConversation.create({
        user_id: userId,
        title: 'AI Assistant',
        current_flow: 'general',
        current_step: 'entry',
        status: 'collecting',
        context_data: {},
      });
    }

    const messages = await ChatMessage.find({ conversation_id: conversation._id })
      .sort({ created_at: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        conversation,
        messages: messages.map((m) => ({
          id: m._id.toString(),
          role: m.role || (m.sender === 'ai' ? 'assistant' : 'user'),
          content: m.content,
          ui: m.ui_type ? { type: m.ui_type, payload: m.ui_payload } : null,
          created_at: new Date(m.created_at).toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error in getActiveConversation:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/chat/conversations/reset
 * Bắt đầu một phiên hội thoại mới hoàn toàn
 */
const resetConversation = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const newConversation = await ChatConversation.create({
      user_id: userId,
      title: 'AI Assistant',
      current_flow: 'general',
      current_step: 'entry',
      status: 'collecting',
      context_data: {},
    });

    // Tạo tin nhắn chào mừng ban đầu
    const initialAiMsg = await ChatMessage.create({
      conversation_id: newConversation._id,
      sender: 'ai',
      role: 'assistant',
      content: 'Xin chào! Mình là AI Assistant - Trợ lý dinh dưỡng và thể chất của bạn. Hôm nay bạn cần hỗ trợ gì nào?',
      ui_type: 'choice',
      ui_payload: {
        title: 'Chọn tính năng bạn cần:',
        choices: [
          { label: '🍲 Tìm công thức nấu ăn', value: 'Tìm công thức nấu ăn' },
          { label: '📅 Lập kế hoạch bữa ăn', value: 'Lập kế hoạch bữa ăn' },
          { label: '🎯 Thiết lập mục tiêu dinh dưỡng', value: 'Thiết lập mục tiêu dinh dưỡng' },
          { label: '🏃 Luyện tập & vận động', value: 'Luyện tập & vận động' },
        ],
      },
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: {
        conversation_id: newConversation._id.toString(),
        message: {
          id: initialAiMsg._id.toString(),
          role: 'assistant',
          content: initialAiMsg.content,
          created_at: initialAiMsg.created_at.toISOString(),
        },
        ui: {
          type: initialAiMsg.ui_type,
          payload: initialAiMsg.ui_payload,
        },
        state: {
          flow: 'general',
          step: 'entry',
          status: 'collecting',
        },
      },
    });
  } catch (error) {
    console.error('Error in resetConversation:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/chat/conversations
 * Lấy danh sách lịch sử các cuộc trò chuyện của người dùng
 */
const getConversationsList = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const conversations = await ChatConversation.find({ user_id: userId })
      .sort({ updated_at: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Error in getConversationsList:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/chat/conversations/:id
 * Lấy chi tiết một cuộc trò chuyện và danh sách tin nhắn theo ID
 */
const getConversationById = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const { id } = req.params;
    const conversation = await ChatConversation.findOne({ _id: id, user_id: userId }).lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const messages = await ChatMessage.find({ conversation_id: conversation._id })
      .sort({ created_at: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        conversation,
        messages: messages.map((m) => ({
          id: m._id.toString(),
          role: m.role || (m.sender === 'ai' ? 'assistant' : 'user'),
          content: m.content,
          ui: m.ui_type ? { type: m.ui_type, payload: m.ui_payload } : null,
          created_at: new Date(m.created_at).toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error in getConversationById:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/chat/conversations/:id
 * Xóa một cuộc trò chuyện trong lịch sử
 */
const deleteConversation = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const { id } = req.params;
    const conversation = await ChatConversation.findOneAndDelete({ _id: id, user_id: userId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });
    }

    await ChatMessage.deleteMany({ conversation_id: id });

    return res.status(200).json({
      success: true,
      message: 'Đã xóa cuộc trò chuyện thành công',
    });
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  postMessage,
  getActiveConversation,
  resetConversation,
  getConversationsList,
  getConversationById,
  deleteConversation,
};
