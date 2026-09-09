const MealLog = require('../models/meal_log.model');
const RecognitionHistory = require('../models/recognition_history.model');
const FoodItem = require('../models/food_item.model');
const geminiService = require('./gemini.service');

class MealService {
  /**
   * Analyze image with AI and store recognition history
   * @param {Object} params
   * @param {string} params.userId
   * @param {Buffer} params.imageBuffer
   * @param {string} params.mimeType
   * @param {string} [params.descriptionText]
   */
  async analyzeMealImage({ userId, imageBuffer, mimeType, descriptionText }) {
    // 1. Call Gemini AI Service
    const aiResult = await geminiService.analyzeFoodImage(imageBuffer, mimeType);

    // 2. Save entry to recognition_history
    const historyDoc = new RecognitionHistory({
      user_id: userId,
      source_type: 'image',
      raw_input: descriptionText || 'Upload ảnh món ăn',
      predicted_label: aiResult.food_name,
      confidence: aiResult.confidence,
      ai_model: 'gemini-1.5-flash',
      raw_response: aiResult.raw_response,
      created_at: new Date(),
    });

    await historyDoc.save();

    return {
      recognition_id: historyDoc._id,
      food_name: aiResult.food_name,
      estimated_weight_g: aiResult.estimated_weight_g,
      calories: aiResult.calories,
      protein_g: aiResult.protein_g,
      carb_g: aiResult.carb_g,
      fat_g: aiResult.fat_g,
      confidence: aiResult.confidence,
    };
  }

  /**
   * Analyze meal text description
   */
  async analyzeMealText({ userId, textDescription }) {
    const aiResult = await geminiService.analyzeFoodText(textDescription);

    const historyDoc = new RecognitionHistory({
      user_id: userId,
      source_type: 'text',
      raw_input: textDescription,
      predicted_label: aiResult.food_name,
      confidence: aiResult.confidence,
      ai_model: 'gemini-1.5-flash',
      raw_response: aiResult.raw_response,
      created_at: new Date(),
    });

    await historyDoc.save();

    return {
      recognition_id: historyDoc._id,
      food_name: aiResult.food_name,
      estimated_weight_g: aiResult.estimated_weight_g,
      calories: aiResult.calories,
      protein_g: aiResult.protein_g,
      carb_g: aiResult.carb_g,
      fat_g: aiResult.fat_g,
      confidence: aiResult.confidence,
    };
  }

  /**
   * Calculate macros for multi-ingredient home cooking meals
   * @param {Array<{food_item_id: string, weight_g: number}>} ingredients
   */
  async calculateIngredientsNutrition(ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return { calories: 0, protein_g: 0, carb_g: 0, fat_g: 0, total_grams: 0 };
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarb = 0;
    let totalFat = 0;
    let totalGrams = 0;

    for (const item of ingredients) {
      if (!item.food_item_id || !item.weight_g) continue;
      try {
        const food = await FoodItem.findOne({ _id: item.food_item_id }).lean();
        if (!food) continue;

        const weight = Number(item.weight_g) || 0;
        const factor = weight / 100;

        totalCalories += (food.calories_per_100g || 0) * factor;
        totalProtein += (food.protein_per_100g || 0) * factor;
        totalCarb += (food.carb_per_100g || 0) * factor;
        totalFat += (food.fat_per_100g || 0) * factor;
        totalGrams += weight;
      } catch (err) {
        console.error('Lỗi calculateIngredientsNutrition item:', item, err);
      }
    }

    return {
      calories: Math.round(totalCalories * 10) / 10,
      protein_g: Math.round(totalProtein * 10) / 10,
      carb_g: Math.round(totalCarb * 10) / 10,
      fat_g: Math.round(totalFat * 10) / 10,
      total_grams: Math.round(totalGrams * 10) / 10,
    };
  }

  /**
   * Log meal entry to database
   */
  async createMealLog({
    userId,
    food_item_id,
    input_method = 'manual',
    source_image_url,
    description_text,
    portion_label,
    portion_grams,
    calories,
    protein_g,
    carb_g,
    fat_g,
    meal_type = 'lunch',
    logged_at,
    recognition_summary,
    ingredients,
  }) {
    const mongoose = require('mongoose');

    // If ingredients are provided (Home Cooking), compute nutrition totals
    let finalCalories = calories;
    let finalProtein = protein_g;
    let finalCarb = carb_g;
    let finalFat = fat_g;
    let finalGrams = portion_grams;

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const calculated = await this.calculateIngredientsNutrition(ingredients);
      if (calculated.calories > 0 || calculated.total_grams > 0) {
        finalCalories = calculated.calories;
        finalProtein = calculated.protein_g;
        finalCarb = calculated.carb_g;
        finalFat = calculated.fat_g;
        finalGrams = calculated.total_grams;
      }
    }

    const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);
    const defaultDesc = description_text || (Array.isArray(ingredients) && ingredients.length > 0 ? `Bữa ăn tự nấu (${ingredients.length} món/nguyên liệu)` : 'Bữa ăn');

    const mealLog = new MealLog({
      user_id: userId,
      food_item_id: isValidObjectId(food_item_id) ? food_item_id : null,
      input_method,
      source_image_url: source_image_url || null,
      description_text: defaultDesc,
      portion_label: portion_label || null,
      portion_grams: finalGrams || null,
      calories: Number(finalCalories) || 0,
      protein_g: Number(finalProtein) || 0,
      carb_g: Number(finalCarb) || 0,
      fat_g: Number(finalFat) || 0,
      meal_type,
      logged_at: logged_at ? new Date(logged_at) : new Date(),
      created_at: new Date(),
      recognition_summary: recognition_summary || null,
    });

    await mealLog.save();

    // If recognition_id is linked, update recognition_history record
    if (recognition_summary && recognition_summary.recognition_id) {
      await RecognitionHistory.findByIdAndUpdate(recognition_summary.recognition_id, {
        meal_log_id: mealLog._id,
        corrected_label: recognition_summary.corrected_label || null,
      });
    }

    return mealLog;
  }

  /**
   * Get user meal logs for specific date or history
   */
  async getUserMealLogs(userId, dateStr) {
    let dateFilter = {};
    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      dateFilter = {
        user_id: userId,
        logged_at: { $gte: startOfDay, $lte: endOfDay },
      };
    } else {
      dateFilter = { user_id: userId };
    }

    const logs = await MealLog.find(dateFilter)
      .populate('food_item_id')
      .sort({ logged_at: -1 })
      .lean();

    return logs;
  }
}

module.exports = new MealService();
