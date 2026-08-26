const { updateStreak } = require('../services/gamificationService');

// Middleware này sẽ được áp dụng cho các route có xác thực
exports.updateUserStreak = async (req, res, next) => {
  // Chỉ cập nhật streak nếu request đi qua protect middleware
  if (req.user && req.user._id) {
    try {
      await updateStreak(req.user._id);
      // Cập nhật lại req.user với streak mới
      const User = require('../models/User');
      req.user = await User.findById(req.user._id);
    } catch (error) {
      console.error('Streak update error:', error);
      // Không chặn request nếu lỗi streak
    }
  }
  next();
};