const User = require('../models/user.model');

// @desc    Lấy bảng xếp hạng theo điểm
// @route   GET /api/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const leaderboard = await User.find()
      .select('full_name email avatar_url points rank streak achievements')
      .sort({ points: -1 })
      .limit(limit)
      .populate('achievements', 'name icon');

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};
