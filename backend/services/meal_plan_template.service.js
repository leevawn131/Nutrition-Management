const MealPlanTemplate = require('../models/meal_plan_template.model');
const MealPlan = require('../models/meal_plan.model');
const Recipe = require('../models/recipe.model');
const FoodItem = require('../models/food_item.model');
const mongoose = require('mongoose');

class MealPlanTemplateService {
  /**
   * Lấy danh sách thực đơn mẫu
   * @param {Object} query - { search }
   * @returns {Promise<Array>}
   */
  async getTemplates({ search } = {}) {
    const filter = {};
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const templates = await MealPlanTemplate.find(filter)
      .populate({
        path: 'items.recipe_id',
        select: 'title description image_url calories_per_serving protein_g carb_g fat_g cook_time_minutes prep_time_minutes ingredients',
      })
      .populate({
        path: 'items.food_item_id',
        select: 'name calories_per_100g protein_per_100g carb_per_100g fat_per_100g image_url',
      })
      .sort({ created_at: -1 })
      .lean();

    // Tính toán thông tin tổng dinh dưỡng
    return templates.map((template) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarb = 0;
      let totalFat = 0;

      if (Array.isArray(template.items)) {
        template.items.forEach((item) => {
          if (item.recipe_id) {
            totalCalories += item.recipe_id.calories_per_serving || 0;
            totalProtein += item.recipe_id.protein_g || 0;
            totalCarb += item.recipe_id.carb_g || 0;
            totalFat += item.recipe_id.fat_g || 0;
          } else if (item.food_item_id) {
            totalCalories += item.food_item_id.calories_per_100g || 0;
            totalProtein += item.food_item_id.protein_per_100g || 0;
            totalCarb += item.food_item_id.carb_per_100g || 0;
            totalFat += item.food_item_id.fat_per_100g || 0;
          }
        });
      }

      return {
        ...template,
        total_calories: Math.round(totalCalories),
        total_protein_g: Math.round(totalProtein * 10) / 10,
        total_carb_g: Math.round(totalCarb * 10) / 10,
        total_fat_g: Math.round(totalFat * 10) / 10,
      };
    });
  }

  /**
   * Lấy chi tiết thực đơn mẫu theo ID
   * @param {string} templateId
   * @returns {Promise<Object>}
   */
  async getTemplateById(templateId) {
    if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
      throw new Error('ID thực đơn mẫu không hợp lệ');
    }

    const template = await MealPlanTemplate.findById(templateId)
      .populate({
        path: 'items.recipe_id',
      })
      .populate({
        path: 'items.food_item_id',
      })
      .lean();

    if (!template) {
      throw new Error('Không tìm thấy thực đơn mẫu');
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarb = 0;
    let totalFat = 0;

    if (Array.isArray(template.items)) {
      template.items.forEach((item) => {
        if (item.recipe_id) {
          totalCalories += item.recipe_id.calories_per_serving || 0;
          totalProtein += item.recipe_id.protein_g || 0;
          totalCarb += item.recipe_id.carb_g || 0;
          totalFat += item.recipe_id.fat_g || 0;
        } else if (item.food_item_id) {
          totalCalories += item.food_item_id.calories_per_100g || 0;
          totalProtein += item.food_item_id.protein_per_100g || 0;
          totalCarb += item.food_item_id.carb_per_100g || 0;
          totalFat += item.food_item_id.fat_per_100g || 0;
        }
      });
    }

    return {
      ...template,
      total_calories: Math.round(totalCalories),
      total_protein_g: Math.round(totalProtein * 10) / 10,
      total_carb_g: Math.round(totalCarb * 10) / 10,
      total_fat_g: Math.round(totalFat * 10) / 10,
    };
  }

  /**
   * Áp dụng thực đơn mẫu vào kế hoạch của người dùng
   * @param {string} userId
   * @param {string} templateId
   * @param {Object} options - { targetDate }
   * @returns {Promise<Array>}
   */
  async applyTemplate(userId, templateId, { targetDate } = {}) {
    if (!userId) {
      throw new Error('userId là bắt buộc');
    }

    const template = await this.getTemplateById(templateId);
    if (!template || !template.items || template.items.length === 0) {
      throw new Error('Thực đơn mẫu không có món ăn để áp dụng');
    }

    const baseDateStr = targetDate || new Date().toISOString().split('T')[0];
    let baseDate;
    if (baseDateStr.includes('-')) {
      const parts = baseDateStr.split('T')[0].split('-');
      baseDate = new Date(
        Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0)
      );
    } else {
      baseDate = new Date(baseDateStr);
    }

    const createdPlans = [];

    for (const item of template.items) {
      const dayOffset = (item.day_number && item.day_number > 1) ? item.day_number - 1 : 0;
      const planDate = new Date(baseDate);
      planDate.setDate(planDate.getDate() + dayOffset);

      const newPlan = await MealPlan.create({
        user_id: userId,
        plan_date: planDate,
        meal_type: item.meal_type,
        recipe_id: item.recipe_id ? (item.recipe_id._id || item.recipe_id) : null,
        food_item_id: item.food_item_id ? (item.food_item_id._id || item.food_item_id) : null,
        source: 'template',
        is_logged: false,
      });

      createdPlans.push(newPlan);
    }

    return createdPlans;
  }
}

module.exports = new MealPlanTemplateService();
