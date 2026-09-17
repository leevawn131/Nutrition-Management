const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: [true, 'conversation_id is required'],
    },
    client_message_id: {
      type: String,
      default: null,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: [true, 'sender is required'],
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      default: 'assistant',
    },
    content: {
      type: String,
      required: [true, 'content is required'],
    },
    ui_type: {
      type: String,
      enum: [
        'text',
        'choice',
        'number',
        'confirm',
        'action',
        'recipe_list',
        'recipe_detail',
        'meal_plan_preview',
        'result',
        null,
      ],
      default: null,
    },
    ui_payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    suggested_action_type: {
      type: String,
      default: null,
    },
    suggested_action_payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'chat_messages',
  }
);

chatMessageSchema.index({ conversation_id: 1, created_at: 1 });
chatMessageSchema.index({ conversation_id: 1, client_message_id: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
