const userService = require('../services/user.service');

/**
 * Handle GET /api/profile
 * Get current authenticated user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const user = await userService.getUserProfile(userId);

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled getProfile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle PUT /api/profile
 * Update current authenticated user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const updatedUser = await userService.updateUserProfile(userId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin hồ sơ thành công',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    console.error('Unhandled updateProfile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
