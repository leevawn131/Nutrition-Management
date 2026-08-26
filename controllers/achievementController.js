const Achievement = require('../models/Achievement');
const User = require('../models/User');

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
    const user = await User.findById(req.user._id).populate('achievements');
    res.json(user.achievements);
  } catch (error) {
    next(error);
  }
};