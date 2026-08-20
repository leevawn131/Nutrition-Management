const mongoose = require('mongoose');

/**
 * ActivityLog Schema - Module C: Hoạt động thể chất
 * Source of truth: database/mongodb-setup.js
 */
const activityLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id is required'],
    },
    activity_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      default: null,
    },
    custom_activity_name: {
      type: String,
      trim: true,
      default: null,
    },
    duration_minutes: {
      type: Number,
      required: [true, 'duration_minutes is required'],
      min: 1,
    },
    calories_burned: {
      type: Number,
      required: [true, 'calories_burned is required'],
      min: 0,
    },
    logged_at: {
      type: Date,
      required: [true, 'logged_at is required'],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

activityLogSchema.index({ user_id: 1, logged_at: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema, 'activity_logs');

module.exports = ActivityLog;
