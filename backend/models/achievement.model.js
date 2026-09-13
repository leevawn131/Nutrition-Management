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
    condition: {
      type: {
        type: String,
        enum: ['points', 'posts', 'comments', 'likes_received', 'streak', 'friends'],
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
