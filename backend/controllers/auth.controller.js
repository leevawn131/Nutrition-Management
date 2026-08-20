const authService = require('../services/auth.service');

/**
 * Handle user registration request
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const user = await authService.registerUser({ email, password });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
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

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email đã tồn tại trong hệ thống',
      });
    }

    console.error('Unhandled registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle user login request
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const user = await authService.getCurrentUser(userId);

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin người dùng thành công',
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

    console.error('Unhandled getMe error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle user logout request
 * POST /api/auth/logout
 * Protected by authMiddleware
 */
const logout = async (req, res) => {
  try {
    const result = await authService.logoutUser();

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled logout error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle password change for authenticated user
 * PUT /api/auth/change-password
 * Protected by authMiddleware
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { current_password, new_password } = req.body || {};

    const result = await authService.changePassword(userId, { current_password, new_password });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled changePassword error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle forgot password request
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    const result = await authService.forgotPassword({ email });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled forgotPassword error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle reset password request
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body || {};

    const result = await authService.resetPassword({ token, new_password });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled resetPassword error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle email verification request
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body || {};

    const result = await authService.verifyEmail({ token });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled verifyEmail error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Handle resend verification email request
 * POST /api/auth/resend-verification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body || {};

    const result = await authService.resendVerification({ email });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled resendVerification error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
