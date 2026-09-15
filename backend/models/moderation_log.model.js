const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'admin_id là bắt buộc'],
    },
    target_type: {
      type: String,
      enum: ['post', 'recipe'],
      required: [true, 'target_type là bắt buộc'],
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'target_id là bắt buộc'],
    },
    action: {
      type: String,
      enum: ['approve', 'reject', 'hide', 'delete'],
      required: [true, 'action là bắt buộc'],
    },
    reason: {
      type: String,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'moderation_logs',
  }
);

moderationLogSchema.index({ target_type: 1, target_id: 1 });
moderationLogSchema.index({ admin_id: 1, created_at: -1 });

const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);

module.exports = ModerationLog;
