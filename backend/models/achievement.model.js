const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '🏆',
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
    },
    condition: {
      type: {
        type: String,
        enum: [
          'points',
          'posts',
          'comments',
          'likes_received',
          'streak',
          'friends',
          'meal_logs',
          'distinct_meal_days',
          'recipes',
          'unlocked_badges',
        ],
        required: true,
      },
      threshold: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'achievements',
  }
);

module.exports = mongoose.model('Achievement', achievementSchema);

