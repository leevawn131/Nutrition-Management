const User = require('../models/user.model');

/**
 * Admin Authorization Middleware
 * Must be executed AFTER authMiddleware
 * Ensures the authenticated requester has role === 'admin'
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu xác thực không hợp lệ. Vui lòng đăng nhập lại.',
      });
    }

    // Authoritatively query user from database to verify role
    const user = await User.findById(userId).select('role email full_name');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản người dùng không tồn tại hoặc đã bị xóa.',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Từ chối truy cập: Bạn không có quyền quản trị viên (Admin).',
      });
    }

    // Attach verified admin user object to request
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Lỗi trong adminMiddleware:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra quyền quản trị.',
    });
  }
};

module.exports = adminMiddleware;
