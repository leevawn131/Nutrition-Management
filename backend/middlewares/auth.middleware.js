const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Validates Bearer token in Authorization header
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực trong tiêu đề yêu cầu',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Định dạng token không hợp lệ (yêu cầu Bearer token)',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token || !token.trim()) {
      return res.status(401).json({
        success: false,
        message: 'Token xác thực không được để trống',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Lỗi cấu hình xác thực máy chủ',
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Token không chứa thông tin định danh hợp lệ',
      });
    }

    // Attach authenticated user id to req.user
    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token xác thực không hợp lệ',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Xác thực không thành công',
    });
  }
};

module.exports = authMiddleware;
