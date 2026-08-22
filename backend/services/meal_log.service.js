const MealLog = require('../models/meal_log.model');
const MealPlan = require('../models/meal_plan.model');
const ActivityLog = require('../models/activity_log.model');
const User = require('../models/user.model');
const FoodItem = require('../models/food_item.model');
const mongoose = require('mongoose');

/**
 * Helper to parse date string (YYYY-MM-DD or ISO) into UTC start and end bounds
 */
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

class MealLogService {
  /**
   * Create a new meal log
   * @param {string} userId
   * @param {Object} logData
   * @returns {Promise<Object>}
   */
  async createMealLog(userId, logData) {
    if (!userId) {
      throw new Error('User ID không hợp lệ');
    }

    const {
      food_item_id,
      input_method = 'text',
      source_image_url,
      description_text,
      portion_label,
      portion_grams,
      calories,
      protein_g = 0,
      carb_g = 0,
      fat_g = 0,
      meal_type,
      logged_at,
      recognition_summary,
    } = logData;

    if (!meal_type || !['breakfast', 'lunch', 'dinner', 'snack'].includes(meal_type)) {
      throw new Error('meal_type không hợp lệ (chỉ nhận: breakfast, lunch, dinner, snack)');
    }

    let parsedCalories = Number(calories);
    let parsedProtein = Number(protein_g) || 0;
    let parsedCarb = Number(carb_g) || 0;
    let parsedFat = Number(fat_g) || 0;

    let validFoodItemId = null;
    if (food_item_id && mongoose.Types.ObjectId.isValid(food_item_id)) {
      validFoodItemId = food_item_id;
      if (isNaN(parsedCalories) || parsedCalories <= 0) {
        const food = await FoodItem.findById(food_item_id).lean();
        if (food) {
          const grams = Number(portion_grams) || 100;
          parsedCalories = Math.round((food.calories_per_100g * grams) / 100);
          parsedProtein = Math.round(((food.protein_per_100g || 0) * grams) / 100);
          parsedCarb = Math.round(((food.carb_per_100g || 0) * grams) / 100);
          parsedFat = Math.round(((food.fat_per_100g || 0) * grams) / 100);
        }
      }
    }

    if (isNaN(parsedCalories) || parsedCalories < 0) {
      throw new Error('Calo (calories) là bắt buộc và phải là số >= 0');
    }

    let parsedLoggedAt = new Date();
    if (logged_at) {
      parsedLoggedAt = new Date(logged_at);
      if (isNaN(parsedLoggedAt.getTime())) {
        parsedLoggedAt = new Date();
      }
    }

    const newLog = await MealLog.create({
      user_id: userId,
      food_item_id: validFoodItemId,
      input_method,
      source_image_url: source_image_url || null,
      description_text: description_text || null,
      portion_label: portion_label || null,
      portion_grams: portion_grams ? Number(portion_grams) : null,
      calories: parsedCalories,
      protein_g: parsedProtein,
      carb_g: parsedCarb,
      fat_g: parsedFat,
      meal_type,
      logged_at: parsedLoggedAt,
      created_at: new Date(),
      recognition_summary: recognition_summary || null,
    });

    const populated = await MealLog.findById(newLog._id).populate('food_item_id').lean();
    return populated;
  }

  /**
   * Get meal logs for a user (by date or range)
   * @param {string} userId
   * @param {Object} queryOptions
   * @returns {Promise<Array>}
   */
  async getMealLogs(userId, { date, startDate, endDate, meal_type }) {
    const query = {};
    if (userId) {
      query.user_id = userId;
    }

    if (meal_type) {
      query.meal_type = meal_type;
    }

    if (startDate && endDate) {
      const { start } = parseDateBounds(startDate);
      const { end } = parseDateBounds(endDate);
      query.logged_at = { $gte: start, $lte: end };
    } else if (date) {
      const { start, end } = parseDateBounds(date);
      query.logged_at = { $gte: start, $lte: end };
    }

    const logs = await MealLog.find(query)
      .populate('food_item_id')
      .sort({ logged_at: 1, created_at: 1 })
      .lean();

    return logs;
  }

  /**
   * Get daily nutrition summary & comparison with user goals
   * @param {string} userId
   * @param {string|Date} date
   * @returns {Promise<Object>}
   */
  async getDailySummary(userId, date) {
    const dateStr = date || new Date().toISOString().split('T')[0];
    const { start, end } = parseDateBounds(dateStr);

    const [logs, user, activityLogs, plannedMeals] = await Promise.all([
      MealLog.find({ user_id: userId, logged_at: { $gte: start, $lte: end } })
        .populate('food_item_id')
        .lean(),
      User.findById(userId).lean(),
      ActivityLog.find({ user_id: userId, logged_at: { $gte: start, $lte: end } }).lean(),
      MealPlan.find({ user_id: userId, plan_date: { $gte: start, $lte: end } }).lean(),
    ]);

    // Aggregate consumed
    let consumedCalories = 0;
    let consumedProtein = 0;
    let consumedCarb = 0;
    let consumedFat = 0;

    const mealsByType = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    logs.forEach((log) => {
      consumedCalories += log.calories || 0;
      consumedProtein += log.protein_g || 0;
      consumedCarb += log.carb_g || 0;
      consumedFat += log.fat_g || 0;

      if (mealsByType[log.meal_type]) {
        mealsByType[log.meal_type].push(log);
      }
    });

    // Aggregate burned calories
    let burnedCalories = 0;
    let burnedMinutes = 0;
    activityLogs.forEach((act) => {
      burnedCalories += act.calories_burned || 0;
      burnedMinutes += act.duration_minutes || 0;
    });

    // Targets from user profile (fallback to defaults if not set)
    const targetCalories = (user && user.target_calories) || 2000;
    const targetProtein = (user && user.target_protein_g) || Math.round((targetCalories * 0.25) / 4);
    const targetCarb = (user && user.target_carb_g) || Math.round((targetCalories * 0.5) / 4);
    const targetFat = (user && user.target_fat_g) || Math.round((targetCalories * 0.25) / 9);

    // Meal completion (how many types of 4 meals logged)
    const loggedMealTypesCount = Object.keys(mealsByType).filter(
      (type) => mealsByType[type].length > 0
    ).length;

    // Planned items completed
    const totalPlanned = plannedMeals.length;
    const completedPlanned = plannedMeals.filter((p) => p.is_logged).length;
    const planCompletionPercent =
      totalPlanned > 0 ? Math.round((completedPlanned / totalPlanned) * 100) : 0;

    return {
      date: dateStr,
      consumed: {
        calories: Math.round(consumedCalories),
        protein_g: Math.round(consumedProtein * 10) / 10,
        carb_g: Math.round(consumedCarb * 10) / 10,
        fat_g: Math.round(consumedFat * 10) / 10,
      },
      targets: {
        calories: targetCalories,
        protein_g: targetProtein,
        carb_g: targetCarb,
        fat_g: targetFat,
      },
      remaining: {
        calories: Math.max(0, targetCalories - consumedCalories),
        protein_g: Math.max(0, targetProtein - consumedProtein),
        carb_g: Math.max(0, targetCarb - consumedCarb),
        fat_g: Math.max(0, targetFat - consumedFat),
      },
      percentages: {
        calories: targetCalories > 0 ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100)) : 0,
        protein: targetProtein > 0 ? Math.min(100, Math.round((consumedProtein / targetProtein) * 100)) : 0,
        carb: targetCarb > 0 ? Math.min(100, Math.round((consumedCarb / targetCarb) * 100)) : 0,
        fat: targetFat > 0 ? Math.min(100, Math.round((consumedFat / targetFat) * 100)) : 0,
      },
      burned: {
        calories: Math.round(burnedCalories),
        minutes: burnedMinutes,
      },
      mealsByType,
      mealLogsCount: logs.length,
      loggedMealTypesCount,
      plannedCount: totalPlanned,
      completedPlannedCount: completedPlanned,
      planCompletionPercent,
    };
  }

  /**
   * Get periodic aggregated statistics (e.g. 7 or 30 days)
   * @param {string} userId
   * @param {Object} options - { rangeDays = 7, endDate }
   * @returns {Promise<Object>}
   */
  async getStatistics(userId, { rangeDays = 7, endDate = new Date() } = {}) {
    const numDays = Number(rangeDays) || 7;
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - numDays + 1);

    const { start: startUTC } = parseDateBounds(start.toISOString().split('T')[0]);
    const { end: endUTC } = parseDateBounds(end.toISOString().split('T')[0]);

    const [logs, activityLogs, plannedMeals, user] = await Promise.all([
      MealLog.find({ user_id: userId, logged_at: { $gte: startUTC, $lte: endUTC } }).lean(),
      ActivityLog.find({ user_id: userId, logged_at: { $gte: startUTC, $lte: endUTC } }).lean(),
      MealPlan.find({ user_id: userId, plan_date: { $gte: startUTC, $lte: endUTC } }).lean(),
      User.findById(userId).lean(),
    ]);

    const targetCalories = (user && user.target_calories) || 2000;

    // Build day-by-day mapping
    const daysData = [];
    let activeDaysCount = 0;
    let loggedDaysCount = 0;
    let totalPlannedAll = 0;
    let completedPlannedAll = 0;

    for (let i = 0; i < numDays; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + i);
      const dateStr = currentDay.toISOString().split('T')[0];
      const { start: dStart, end: dEnd } = parseDateBounds(dateStr);

      const dayLogs = logs.filter(
        (l) => new Date(l.logged_at) >= dStart && new Date(l.logged_at) <= dEnd
      );
      const dayActivities = activityLogs.filter(
        (a) => new Date(a.logged_at) >= dStart && new Date(a.logged_at) <= dEnd
      );
      const dayPlans = plannedMeals.filter(
        (p) => new Date(p.plan_date) >= dStart && new Date(p.plan_date) <= dEnd
      );

      const dayCaloriesConsumed = dayLogs.reduce((sum, l) => sum + (l.calories || 0), 0);
      const dayCaloriesBurned = dayActivities.reduce((sum, a) => sum + (a.calories_burned || 0), 0);
      const dayDurationMinutes = dayActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

      const hasActivity = dayActivities.length > 0;
      const hasMeal = dayLogs.length > 0;
      if (hasActivity || hasMeal) activeDaysCount++;
      if (hasMeal) loggedDaysCount++;

      const plannedCount = dayPlans.length;
      const completedCount = dayPlans.filter((p) => p.is_logged).length;
      totalPlannedAll += plannedCount;
      completedPlannedAll += completedCount;

      daysData.push({
        date: dateStr,
        dayOfWeek: currentDay.toLocaleDateString('vi-VN', { weekday: 'short' }),
        caloriesConsumed: Math.round(dayCaloriesConsumed),
        caloriesBurned: Math.round(dayCaloriesBurned),
        durationMinutes: dayDurationMinutes,
        mealLogsCount: dayLogs.length,
        hasActivity,
        hasMeal,
        plannedCount,
        completedCount,
        completionRate: plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0,
      });
    }

    const overallPlanCompletion =
      totalPlannedAll > 0 ? Math.round((completedPlannedAll / totalPlannedAll) * 100) : 0;

    return {
      rangeDays: numDays,
      activeDaysCount,
      loggedDaysCount,
      totalPlannedCount: totalPlannedAll,
      completedPlannedCount: completedPlannedAll,
      planCompletionPercent: overallPlanCompletion,
      targetCalories,
      days: daysData,
    };
  }

  /**
   * Delete a meal log
   * @param {string} userId
   * @param {string} logId
   * @returns {Promise<boolean>}
   */
  async deleteMealLog(userId, logId) {
    if (!logId) return false;
    const query = { _id: logId };
    if (userId) {
      query.user_id = userId;
    }
    const result = await MealLog.findOneAndDelete(query);
    return Boolean(result);
  }
}

module.exports = new MealLogService();
