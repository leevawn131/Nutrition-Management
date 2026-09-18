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

/**
 * GET /api/goal/adherence
 * Retrieve goal maintenance progress and suggested plan adjustment
 */
const getGoalAdherence = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin xác thực',
      });
    }

    const { days = 7 } = req.query;
    const adherence = await goalService.calculateGoalAdherence(userId, { rangeDays: Number(days) });

    return res.status(200).json({
      success: true,
      data: adherence,
    });
  } catch (error) {
    console.error('Error in getGoalAdherence:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi tải tiến độ duy trì mục tiêu',
    });
  }
};

/**
 * POST /api/goal/apply-to-plan
 * Save goal metrics and apply to meal plans
 */
const applyGoalToPlan = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin xác thực',
      });
    }

    const result = await goalService.applyGoalToMealPlan(userId, req.body || {});

    return res.status(200).json({
      success: true,
      message: 'Áp dụng mục tiêu vào kế hoạch dinh dưỡng thành công',
      data: result,
    });
  } catch (error) {
    console.error('Error in applyGoalToPlan:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi áp dụng mục tiêu vào kế hoạch',
    });
  }
};

/**
 * POST /api/goal/adherence/confirm-adjustment
 * Confirm user choice when over 3 days off-track (accept suggestion or keep current)
 */
const confirmAdherenceAdjustment = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin xác thực',
      });
    }

    const { action, new_target_calories, template_id } = req.body || {};
    const result = await goalService.confirmAdherenceAdjustment(userId, {
      action: action || 'keep_current',
      new_target_calories,
      template_id,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error('Error in confirmAdherenceAdjustment:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi xác nhận điều chỉnh kế hoạch',
    });
  }
};

/**
 * POST /api/goal/adherence/simulate
 * Inject mock data to simulate different adherence scenarios
 */
const simulateAdherenceScenario = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin xác thực',
      });
    }

    const { scenario = 'consecutive_over' } = req.body || {};
    const result = await goalService.simulateGoalAdherenceScenario(userId, scenario);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error('Error in simulateAdherenceScenario:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi mô phỏng kịch bản tuân thủ',
    });
  }
};

/**
 * POST /api/goal/meal-analysis/ai
 * Generate on-demand clinical AI nutrition advice for a specific day using Gemini 3.5 Flash
 */
const getAIMealAnalysis = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin xác thực',
      });
    }

    const { date } = req.body || {};
    const result = await goalService.generateAIMealAnalysis(userId, date);

    return res.status(200).json({
      success: true,
      message: 'Đã tạo phân tích dinh dưỡng AI thành công',
      data: result,
    });
  } catch (error) {
    console.error('Error in getAIMealAnalysis:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo phân tích dinh dưỡng AI',
    });
  }
};

/**
 * POST /api/goal/ai-chat
 * Pure Conversational AI Consultation for goal setting / adjustment using Gemini 3.5 Flash
 */
const chatGoalConsultation = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin xác thực',
      });
    }

    const User = require('../models/user.model');
    const geminiService = require('../services/gemini.service');
    const healthService = require('../services/health.service');
    const goalService = require('../services/goal.service');

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    // Health metrics
    let healthMetrics = {};
    try {
      healthMetrics = healthService.calculateHealthMetrics({
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        activity_level: user.activity_level,
      });
    } catch (e) {
      healthMetrics = {
        bmi: 22,
        bmr: 1500,
        tdee: 2000,
      };
    }

    // Recent adherence summary
    let recentAdherence = { summary: 'Đang theo dõi' };
    try {
      const adherence = await goalService.calculateGoalAdherence(userId, { rangeDays: 7 });
      recentAdherence = {
        adherenceRate: adherence.adherenceRate,
        currentStreak: adherence.currentOnTrackStreak,
        deviatedDays: adherence.consecutiveDeviatedDays,
        summary: `Tỷ lệ theo kế hoạch: ${adherence.adherenceRate}%. Chuỗi đúng hạn: ${adherence.currentOnTrackStreak} ngày. Lệch: ${adherence.consecutiveDeviatedDays} ngày liên tiếp.`,
      };
    } catch (e) {
      // safe fallback
    }

    const { messages = [], userMessage = '' } = req.body || {};

    const aiResult = await geminiService.chatGoalConsultation({
      user,
      healthMetrics,
      recentAdherence,
      conversationHistory: messages,
      userMessage,
    });

    return res.status(200).json({
      success: true,
      data: aiResult,
    });
  } catch (error) {
    console.error('Error in chatGoalConsultation:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi trò chuyện với Trợ lý AI',
    });
  }
};

module.exports = {
  recommendGoal,
  confirmGoal,
  getGoalAdherence,
  applyGoalToPlan,
  confirmAdherenceAdjustment,
  simulateAdherenceScenario,
  getAIMealAnalysis,
  chatGoalConsultation,
};

