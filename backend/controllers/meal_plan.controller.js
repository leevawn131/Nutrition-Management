const mealPlanService = require('../services/meal_plan.service');
const User = require('../models/user.model');

/**
 * Helper to get active user ID from request or fallback to first user in database
 */
const getEffectiveUserId = async (req) => {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  const firstUser = await User.findOne({ role: 'user' }).lean();
  return firstUser ? firstUser._id.toString() : null;
};

/**
 * GET /api/meal-plans
 * Get meal plans for a specific date or date range
 */
const getMealPlans = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const userId = await getEffectiveUserId(req);
    console.log(`[API GET /api/meal-plans] userId: ${userId}, query:`, { date, startDate, endDate });
    const plans = await mealPlanService.getMealPlans(userId, { date, startDate, endDate });
    console.log(`[API GET /api/meal-plans] Returned ${plans.length} plans for userId ${userId}`);

    return res.status(200).json({
      success: true,
      data: { plans },
    });
  } catch (error) {
    console.error('Error in getMealPlans:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách kế hoạch bữa ăn',
    });
  }
};

/**
 * POST /api/meal-plans
 * Add an item (recipe or ingredient) to the meal plan
 */
const addMealPlanItem = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    console.log(`[API POST /api/meal-plans] userId: ${userId}, body:`, req.body);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy người dùng hợp lệ để lưu kế hoạch',
      });
    }

    const { plan_date, meal_type, recipe_id, food_item_id, source } = req.body;
    const plan = await mealPlanService.addMealPlanItem(userId, {
      plan_date,
      meal_type,
      recipe_id,
      food_item_id,
      source,
    });
    console.log(`[API POST /api/meal-plans] Created plan ID: ${plan ? plan._id : null}`);

    return res.status(201).json({
      success: true,
      message: 'Thêm vào kế hoạch bữa ăn thành công',
      data: { plan },
    });
  } catch (error) {
    console.error('Error in addMealPlanItem:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi thêm vào kế hoạch bữa ăn',
    });
  }
};

/**
 * PUT /api/meal-plans/:id/log
 * Toggle is_logged state for a meal plan item
 */
const toggleLogMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_logged } = req.body;
    const userId = await getEffectiveUserId(req);

    const updatedPlan = await mealPlanService.toggleLogMealPlan(userId, id, is_logged);

    return res.status(200).json({
      success: true,
      message: is_logged ? 'Đã đánh dấu món ăn đã hoàn thành' : 'Đã bỏ đánh dấu món ăn',
      data: { plan: updatedPlan },
    });
  } catch (error) {
    console.error('Error in toggleLogMealPlan:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật trạng thái kế hoạch',
    });
  }
};

/**
 * DELETE /api/meal-plans/:id
 * Remove an item from the meal plan
 */
const deleteMealPlanItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getEffectiveUserId(req);
    const deleted = await mealPlanService.deleteMealPlanItem(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mục kế hoạch cần xoá',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xoá món khỏi kế hoạch thành công',
    });
  } catch (error) {
    console.error('Error in deleteMealPlanItem:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xoá mục kế hoạch',
    });
  }
};

module.exports = {
  getMealPlans,
  addMealPlanItem,
  toggleLogMealPlan,
  deleteMealPlanItem,
};
