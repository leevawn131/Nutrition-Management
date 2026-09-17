const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh hiệu không được để trống'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Mô tả danh hiệu không được để trống'],
      trim: true,
    },
    icon: {
      type: String,
      default: '🏆',
      trim: true,
    },
    condition: {
      type: {
        type: String,
        enum: ['points', 'streak', 'posts', 'comments', 'likes_received', 'friends', 'custom'],
        required: [true, 'Loại điều kiện là bắt buộc'],
      },
      threshold: {
        type: Number,
        required: [true, 'Ngưỡng điều kiện là bắt buộc'],
        min: 0,
        default: 1,
      },
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'achievements',
    timestamps: false,
    versionKey: false,
  }
);

achievementSchema.index({ name: 1 });
achievementSchema.index({ 'condition.type': 1 });

const Achievement =
  mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema, 'achievements');

module.exports = Achievement;
