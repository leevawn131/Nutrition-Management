const MealPlan = require('../models/meal_plan.model');
const MealLog = require('../models/meal_log.model');
const Recipe = require('../models/recipe.model');
const FoodItem = require('../models/food_item.model');
const mongoose = require('mongoose');

const parseDateBounds = (dateStr) => {
  let year, month, day;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    const d = new Date(dateStr);
    year = d.getUTCFullYear();
    month = d.getUTCMonth();
    day = d.getUTCDate();
  }
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  return { start, end };
};

/**
 * Service to manage daily meal plans
 */
class MealPlanService {
  /**
   * Get meal plans for a user on a specific date (or date range)
   * @param {string} userId
   * @param {string|Object} options - date string or { date, startDate, endDate }
   * @returns {Promise<Array>}
   */
  async getMealPlans(userId, options) {
    const query = {};
    if (userId) {
      query.user_id = userId;
    }

    let date = typeof options === 'string' ? options : options?.date;
    let startDate = typeof options === 'object' ? options?.startDate : null;
    let endDate = typeof options === 'object' ? options?.endDate : null;

    if (startDate && endDate) {
      const { start } = parseDateBounds(startDate);
      const { end } = parseDateBounds(endDate);
      query.plan_date = { $gte: start, $lte: end };
    } else if (date) {
      const { start, end } = parseDateBounds(date);
      query.plan_date = { $gte: start, $lte: end };
    }

    const plans = await MealPlan.find(query)
      .populate('recipe_id')
      .populate('food_item_id')
      .sort({ plan_date: 1, created_at: 1 })
      .lean();

    return plans;
  }

  /**
   * Add a new item (recipe or food item/ingredient) to the meal plan
   * @param {string} userId
   * @param {Object} planData
   * @returns {Promise<Object>}
   */
  async addMealPlanItem(userId, { plan_date, meal_type, recipe_id, food_item_id, source }) {
    if (!plan_date) {
      throw new Error('plan_date is required');
    }
    if (!meal_type || !['breakfast', 'lunch', 'dinner', 'snack'].includes(meal_type)) {
      throw new Error('meal_type must be one of breakfast, lunch, dinner, snack');
    }

    let validRecipeId = recipe_id;
    if (validRecipeId && !mongoose.Types.ObjectId.isValid(validRecipeId)) {
      const firstRecipe = await Recipe.findOne().lean();
      validRecipeId = firstRecipe ? firstRecipe._id : null;
    }

    let validFoodItemId = food_item_id;
    if (validFoodItemId && !mongoose.Types.ObjectId.isValid(validFoodItemId)) {
      const firstFood = await FoodItem.findOne().lean();
      validFoodItemId = firstFood ? firstFood._id : null;
    }

    if (!validRecipeId && !validFoodItemId) {
      const fallbackRecipe = await Recipe.findOne().lean();
      if (fallbackRecipe) {
        validRecipeId = fallbackRecipe._id;
      }
    }

    const determinedSource = source || (validRecipeId ? 'recipe' : 'ingredient');

    let planDateObj;
    if (typeof plan_date === 'string' && plan_date.includes('-')) {
      const parts = plan_date.split('T')[0].split('-');
      planDateObj = new Date(
        Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0)
      );
    } else {
      planDateObj = new Date(plan_date);
    }

    const newPlan = await MealPlan.create({
      user_id: userId,
      plan_date: planDateObj,
      meal_type,
      recipe_id: validRecipeId || null,
      food_item_id: validFoodItemId || null,
      source: determinedSource,
      is_logged: false,
    });

    const populated = await MealPlan.findById(newPlan._id)
      .populate('recipe_id')
      .populate('food_item_id')
      .lean();

    return populated;
  }

  /**
   * Toggle is_logged status for a meal plan item and synchronize with meal_logs
   * @param {string} userId
   * @param {string} planId
   * @param {boolean} isLogged
   * @returns {Promise<Object>}
   */
  async toggleLogMealPlan(userId, planId, isLogged) {
    if (!planId) {
      throw new Error('planId is required');
    }

    const plan = await MealPlan.findById(planId).populate('recipe_id').populate('food_item_id');
    if (!plan) {
      throw new Error('Không tìm thấy mục kế hoạch');
    }

    plan.is_logged = Boolean(isLogged);
    await plan.save();

    // If marked as logged, ensure a corresponding meal_log entry exists
    if (plan.is_logged) {
      let calories = 0;
      let protein_g = 0;
      let carb_g = 0;
      let fat_g = 0;
      let description_text = 'Món ăn từ kế hoạch';
      let food_item_id = null;

      if (plan.recipe_id) {
        const recipe = plan.recipe_id;
        calories = recipe.calories_per_serving || 0;
        protein_g = recipe.protein_g || 0;
        carb_g = recipe.carb_g || 0;
        fat_g = recipe.fat_g || 0;
        description_text = recipe.title;
      } else if (plan.food_item_id) {
        const food = plan.food_item_id;
        calories = food.calories_per_100g || 0;
        protein_g = food.protein_per_100g || 0;
        carb_g = food.carb_per_100g || 0;
        fat_g = food.fat_per_100g || 0;
        description_text = food.name;
        food_item_id = food._id;
      }

      await MealLog.create({
        user_id: userId,
        food_item_id,
        input_method: 'text',
        description_text: `[Kế hoạch] ${description_text}`,
        calories: Math.round(calories),
        protein_g: Math.round(protein_g * 10) / 10,
        carb_g: Math.round(carb_g * 10) / 10,
        fat_g: Math.round(fat_g * 10) / 10,
        meal_type: plan.meal_type,
        logged_at: plan.plan_date,
        created_at: new Date(),
      });
    }

    const populated = await MealPlan.findById(plan._id)
      .populate('recipe_id')
      .populate('food_item_id')
      .lean();

    return populated;
  }

  /**
   * Delete a meal plan item by ID
   * @param {string} userId
   * @param {string} planId
   * @returns {Promise<boolean>}
   */
  async deleteMealPlanItem(userId, planId) {
    if (!planId) return false;
    const result = await MealPlan.findByIdAndDelete(planId);
    return Boolean(result);
  }
}

module.exports = new MealPlanService();
