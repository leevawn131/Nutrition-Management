const authService = require('../services/auth.service');

/**
 * Handle user registration request
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await authService.registerUser({ email, password });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        user,
      },
    });
  } catch (error) {
    // Handled known business/validation error with status code
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Mongoose schema validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    // Duplicate key error from MongoDB (e.g. race condition on email index)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email đã tồn tại trong hệ thống',
      });
    }

    // Generic internal server error (avoid exposing raw db/stack details)
    console.error('Unhandled registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

module.exports = {
  register,
};
