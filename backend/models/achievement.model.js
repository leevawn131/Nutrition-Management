const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh hiệu không được để trống'],
      unique: true,
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
    tier: {
      type: String,
      enum: ['Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương'],
      default: 'Đồng',
    },
    category: {
      type: String,
      enum: ['Khám phá', 'Ghi chép', 'Thói quen', 'Nấu nướng', 'Cộng đồng', 'Sức khoẻ'],
      default: 'Khám phá',
    },
    reward_points: {
      type: Number,
      default: 50,
      min: 0,
    },
    condition: {
      type: {
        type: String,
        enum: [
          'points',
          'streak',
          'posts',
          'comments',
          'likes_received',
          'friends',
          'meal_logs',
          'distinct_meal_days',
          'recipes',
          'unlocked_badges',
          'custom',
        ],
        required: [true, 'Loại điều kiện là bắt buộc'],
      },
      threshold: {
        type: Number,
        required: [true, 'Ngưỡng điều kiện là bắt buộc'],
        min: 0,
        default: 1,
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'achievements',
  }
);

achievementSchema.index({ name: 1 });
achievementSchema.index({ 'condition.type': 1 });

const Achievement =
  mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema, 'achievements');

module.exports = Achievement;
