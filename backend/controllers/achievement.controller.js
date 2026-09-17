const Achievement = require('../models/achievement.model');
const User = require('../models/user.model');

// @desc    Lấy danh sách tất cả thành tựu
// @route   GET /api/achievements
// @access  Public
exports.getAllAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find();
    res.json(achievements);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thành tựu của user hiện tại
// @route   GET /api/achievements/me
// @access  Private
exports.getMyAchievements = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId).populate('achievements');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.achievements || []);
  } catch (error) {
    next(error);
  }
};
