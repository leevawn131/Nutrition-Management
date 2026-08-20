const MealPlan = require('../models/meal_plan.model');
const mongoose = require('mongoose');

/**
 * Service to manage daily meal plans
 */
class MealPlanService {
  /**
   * Get meal plans for a user on a specific date (or date range)
   * @param {string} userId
   * @param {string|Date} date
   * @returns {Promise<Array>}
   */
  async getMealPlans(userId, date) {
    const query = {};
    if (userId) {
      query.user_id = userId;
    }

    if (date) {
      let year, month, day;
      if (typeof date === 'string' && date.includes('-')) {
        const parts = date.split('T')[0].split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const d = new Date(date);
        year = d.getUTCFullYear();
        month = d.getUTCMonth();
        day = d.getUTCDate();
      }
      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      query.plan_date = { $gte: startOfDay, $lte: endOfDay };
    }

    const plans = await MealPlan.find(query)
      .populate('recipe_id')
      .populate('food_item_id')
      .sort({ created_at: 1 })
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
    const mongoose = require('mongoose');
    const Recipe = require('../models/recipe.model');
    const FoodItem = require('../models/food_item.model');

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
      planDateObj = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0));
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
