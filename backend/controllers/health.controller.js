const User = require('../models/user.model');
const healthService = require('../services/health.service');

/**
 * Get current health metrics for authenticated user
 * GET /api/health/current
 */
const getCurrentHealth = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin xác thực',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    // Check for missing required profile fields before calculation
    const missingFields = [];
    if (!user.gender) missingFields.push('giới tính (gender)');
    if (!user.date_of_birth) missingFields.push('ngày sinh (date_of_birth)');
    if (!user.height_cm) missingFields.push('chiều cao (height_cm)');
    if (!user.weight_kg) missingFields.push('cân nặng (weight_kg)');
    if (!user.activity_level) missingFields.push('mức độ vận động (activity_level)');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Hồ sơ chưa đầy đủ thông tin để tính toán chỉ số sức khỏe. Vui lòng bổ sung: ${missingFields.join(', ')}`,
      });
    }

    // Perform calculation using pure health service
    const health = healthService.calculateHealthMetrics({
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      height_cm: user.height_cm,
      weight_kg: user.weight_kg,
      activity_level: user.activity_level,
    });

    return res.status(200).json({
      success: true,
      data: {
        health,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled getCurrentHealth error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

module.exports = {
  getCurrentHealth,
};
