const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['meal_logged', 'activity_reminder', 'meal_reminder', 'streak', 'exceed_calories'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    reference_type: {
      type: String,
      default: null,
    },
    reference_id: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'notifications',
  }
);

notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
