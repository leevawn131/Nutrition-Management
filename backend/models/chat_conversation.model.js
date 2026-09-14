const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id is required'],
    },
    title: {
      type: String,
      default: 'Cuộc trò chuyện mới',
      trim: true,
    },
    current_flow: {
      type: String,
      enum: ['general', 'recipe', 'meal_plan', 'goal', 'exercise', 'health'],
      default: 'general',
    },
    current_step: {
      type: String,
      default: 'entry',
    },
    status: {
      type: String,
      enum: ['collecting', 'processing', 'waiting_confirmation', 'completed', 'cancelled', 'error'],
      default: 'collecting',
    },
    context_data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'chat_conversations',
  }
);

chatConversationSchema.index({ user_id: 1, created_at: -1 });

const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);

module.exports = ChatConversation;
