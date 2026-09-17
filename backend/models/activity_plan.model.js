const mongoose = require('mongoose');

const activityPlanSchema = new mongoose.Schema(
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
    activity_name: {
      type: String,
      required: [true, 'activity_name is required'],
      trim: true,
    },
    plan_date: {
      type: Date,
      required: [true, 'plan_date is required'],
    },
    start_time: {
      type: String,
      default: null,
    },
    duration_minutes: {
      type: Number,
      default: null,
      min: 0,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'activity_plans',
  }
);

activityPlanSchema.index({ user_id: 1, plan_date: 1 });

const ActivityPlan = mongoose.model('ActivityPlan', activityPlanSchema);

module.exports = ActivityPlan;
