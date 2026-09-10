const User = require('../models/user.model');
const healthService = require('../services/health.service');
const goalService = require('../services/goal.service');

/**
 * Check if the user has all required physical profile metrics
 * @param {Object} user
 */
const validateUserPhysicalProfile = (user) => {
  const missingFields = [];
  if (!user.gender) missingFields.push('giới tính (gender)');
  if (!user.date_of_birth) missingFields.push('ngày sinh (date_of_birth)');
  if (!user.height_cm) missingFields.push('chiều cao (height_cm)');
  if (!user.weight_kg) missingFields.push('cân nặng (weight_kg)');
  if (!user.activity_level) missingFields.push('mức độ vận động (activity_level)');

  if (missingFields.length > 0) {
    const error = new Error(
      `Hồ sơ chưa đầy đủ thông tin để tính toán mục tiêu dinh dưỡng. Vui lòng bổ sung: ${missingFields.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }
};

/**
 * POST /api/goal/recommend
 * Calculate recommended target calories for a goal without saving to DB
 */
const recommendGoal = async (req, res) => {
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

    // 1. Check profile completeness
    validateUserPhysicalProfile(user);

    // 2. Calculate current health & TDEE
    const health = healthService.calculateHealthMetrics({
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      height_cm: user.height_cm,
      weight_kg: user.weight_kg,
      activity_level: user.activity_level,
    });

    const { goal, target_weight, target_duration_weeks } = req.body || {};

    // 3. Calculate goal recommendation using pure goal service
    const recommendation = goalService.calculateGoalRecommendation({
      goal,
      current_weight: user.weight_kg,
      target_weight,
      target_duration_weeks,
      tdee: health.tdee,
    });

    // 4. Return recommendation with TDEE for transparency
    return res.status(200).json({
      success: true,
      data: {
        recommendation: {
          ...recommendation,
          tdee: health.tdee,
        },
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Unhandled recommendGoal error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

/**
 * PUT /api/goal/confirm
 * Recalculate server-side, verify client submission, and save confirmed goal + target calories
 */
const confirmGoal = async (req, res) => {
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

    // 1. Check profile completeness
    validateUserPhysicalProfile(user);

    // 2. Recalculate health & TDEE
    const health = healthService.calculateHealthMetrics({
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      height_cm: user.height_cm,
      weight_kg: user.weight_kg,
      activity_level: user.activity_level,
    });

    const { goal, target_weight, target_duration_weeks, target_calories } = req.body || {};

    if (
      target_calories === undefined ||
      target_calories === null ||
      typeof target_calories !== 'number' ||
      isNaN(target_calories)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Mục tiêu calo (target_calories) là bắt buộc và phải là số',
      });
    }

    // 3. Recalculate goal recommendation server-side
    const recommendation = goalService.calculateGoalRecommendation({
      goal,
      current_weight: user.weight_kg,
      target_weight,
      target_duration_weeks,
      tdee: health.tdee,
    });

    // 4. Verify client submitted target_calories against server calculated recommendation (allow small float tolerance of 1.0 kcal)
    const diff = Math.abs(target_calories - recommendation.recommendedTargetCalories);
    if (diff > 1.0) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị target_calories không khớp với kết quả tính toán khuyến nghị của hệ thống',
      });
    }

    // 5. Update goal, target_calories, and macro targets in users collection
    user.goal = goal;
    user.target_calories = Math.round(recommendation.recommendedTargetCalories);
    user.target_protein_g = req.body.target_protein_g !== undefined && req.body.target_protein_g !== null
      ? req.body.target_protein_g
      : (recommendation.macros && recommendation.macros.targetProteinG);
    user.target_carb_g = req.body.target_carb_g !== undefined && req.body.target_carb_g !== null
      ? req.body.target_carb_g
      : (recommendation.macros && recommendation.macros.targetCarbG);
    user.target_fat_g = req.body.target_fat_g !== undefined && req.body.target_fat_g !== null
      ? req.body.target_fat_g
      : (recommendation.macros && recommendation.macros.targetFatG);

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Xác nhận và lưu mục tiêu dinh dưỡng thành công',
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

    console.error('Unhandled confirmGoal error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
  }
};

module.exports = {
  recommendGoal,
  confirmGoal,
};
