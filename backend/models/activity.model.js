const mongoose = require('mongoose');

/**
 * Activity Schema - Module C: Hoạt động thể chất
 * Source of truth: database/mongodb-setup.js
 */
const activitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên hoạt động không được để trống'],
      trim: true,
    },
    met_value: {
      type: Number,
      required: [true, 'Chỉ số MET không được để trống'],
      min: 0,
    },
    category: {
      type: String,
      trim: true,
      default: 'Tập luyện',
    },
    created_by_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

activitySchema.index({ category: 1 });
activitySchema.index({ name: 'text' });

const Activity = mongoose.model('Activity', activitySchema, 'activities');

module.exports = Activity;
