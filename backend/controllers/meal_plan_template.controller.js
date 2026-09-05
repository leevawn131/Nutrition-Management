const mealPlanTemplateService = require('../services/meal_plan_template.service');
const User = require('../models/user.model');

const getEffectiveUserId = async (req) => {
  if (req.user && req.user.id) {
    const userExists = await User.findById(req.user.id).lean();
    if (userExists) {
      return req.user.id;
    }
  }
  const firstUser = await User.findOne({ role: 'user' }).lean();
  return firstUser ? firstUser._id.toString() : null;
};

/**
 * GET /api/meal-plan-templates
 * Lấy danh sách thực đơn mẫu
 */
const getTemplates = async (req, res) => {
  try {
    const { search } = req.query;
    const templates = await mealPlanTemplateService.getTemplates({ search });

    return res.status(200).json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    console.error('Error in getTemplates:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thực đơn mẫu',
    });
  }
};

/**
 * GET /api/meal-plan-templates/:id
 * Lấy chi tiết thực đơn mẫu
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await mealPlanTemplateService.getTemplateById(id);

    return res.status(200).json({
      success: true,
      data: { template },
    });
  } catch (error) {
    console.error('Error in getTemplateById:', error.message);
    return res.status(404).json({
      success: false,
      message: error.message || 'Không tìm thấy thực đơn mẫu',
    });
  }
};

/**
 * POST /api/meal-plan-templates/:id/apply
 * Áp dụng thực đơn mẫu vào kế hoạch của người dùng
 */
const applyTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetDate } = req.body;
    const userId = await getEffectiveUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy người dùng hợp lệ để áp dụng thực đơn',
      });
    }

    const createdPlans = await mealPlanTemplateService.applyTemplate(userId, id, { targetDate });

    return res.status(201).json({
      success: true,
      message: 'Áp dụng thực đơn mẫu thành công',
      data: { plans: createdPlans },
    });
  } catch (error) {
    console.error('Error in applyTemplate:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi áp dụng thực đơn mẫu',
    });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  applyTemplate,
};
