const { updateStreak } = require('../services/gamification.service');
const User = require('../models/user.model');

// Middleware cập nhật streak cho user khi có request được xác thực
const updateUserStreak = async (req, res, next) => {
  const userId = req.user?.id || req.user?._id;
  if (userId) {
    try {
      await updateStreak(userId);
    } catch (error) {
      console.error('Streak update error:', error.message || error);
      // Không chặn request nếu lỗi streak
    }
  }
  next();
};

module.exports = { updateUserStreak };
