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
  async analyzeMealImage({ userId, imageBuffer, mimeType = 'image/jpeg', descriptionText }) {
    // 1. Call Gemini AI Service
    const aiResult = await geminiService.analyzeFoodImage(imageBuffer, mimeType, descriptionText);

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
      estimated_eaten_weight_g: aiResult.estimated_eaten_weight_g,
      consumption_pct: aiResult.consumption_pct,
      container_size: aiResult.container_size,
      calories: aiResult.calories,
      protein_g: aiResult.protein_g,
      carb_g: aiResult.carb_g,
      fat_g: aiResult.fat_g,
      glycemic_load: aiResult.glycemic_load,
      confidence: aiResult.confidence,
      image_quality: aiResult.image_quality,
      quality_warning: aiResult.quality_warning,
      nutrition_source: aiResult.nutrition_source,
      quantity_uncertain: aiResult.quantity_uncertain,
      hidden_base_food: aiResult.hidden_base_food,
      fried_food: aiResult.fried_food,
      is_beverage: aiResult.is_beverage,
      has_bones: aiResult.has_bones,
      sugar_level: aiResult.sugar_level,
      default_ice_pct: aiResult.default_ice_pct,
      dishes: aiResult.dishes || [],
      ingredients: aiResult.ingredients || [],
      toppings: aiResult.toppings || [],
      alternatives: aiResult.alternatives || [],
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
      estimated_eaten_weight_g: aiResult.estimated_eaten_weight_g,
      consumption_pct: aiResult.consumption_pct,
      container_size: aiResult.container_size,
      calories: aiResult.calories,
      protein_g: aiResult.protein_g,
      carb_g: aiResult.carb_g,
      fat_g: aiResult.fat_g,
      glycemic_load: aiResult.glycemic_load,
      confidence: aiResult.confidence,
      image_quality: aiResult.image_quality,
      quality_warning: aiResult.quality_warning,
      nutrition_source: aiResult.nutrition_source,
      quantity_uncertain: aiResult.quantity_uncertain,
      hidden_base_food: aiResult.hidden_base_food,
      fried_food: aiResult.fried_food,
      is_beverage: aiResult.is_beverage,
      has_bones: aiResult.has_bones,
      sugar_level: aiResult.sugar_level,
      default_ice_pct: aiResult.default_ice_pct,
      ingredients: aiResult.ingredients || [],
      toppings: aiResult.toppings || [],
      alternatives: aiResult.alternatives || [],
    };
  }

  /**
   * Transcribe voice recording audio to Vietnamese text
   */
  async transcribeVoice({ audioBuffer, mimeType }) {
    return await geminiService.transcribeAudio(audioBuffer, mimeType);
  }

  /**
   * Analyze food voice recording or transcript
   */
  async analyzeMealVoice({ userId, audioBuffer, mimeType, transcriptText }) {
    const aiResult = await geminiService.analyzeFoodVoice(audioBuffer, mimeType, transcriptText);

    const historyDoc = new RecognitionHistory({
      user_id: userId,
      source_type: 'voice',
      raw_input: aiResult.transcription || transcriptText || 'Ghi âm bữa ăn',
      predicted_label: aiResult.food_name,
      confidence: aiResult.confidence,
      ai_model: 'gemini-1.5-flash',
      raw_response: aiResult.raw_response,
      created_at: new Date(),
    });

    await historyDoc.save();

    return {
      recognition_id: historyDoc._id,
      transcription: aiResult.transcription || transcriptText || '',
      food_name: aiResult.food_name,
      estimated_weight_g: aiResult.estimated_weight_g,
      estimated_eaten_weight_g: aiResult.estimated_eaten_weight_g,
      consumption_pct: aiResult.consumption_pct,
      container_size: aiResult.container_size,
      calories: aiResult.calories,
      protein_g: aiResult.protein_g,
      carb_g: aiResult.carb_g,
      fat_g: aiResult.fat_g,
      glycemic_load: aiResult.glycemic_load,
      confidence: aiResult.confidence,
      image_quality: aiResult.image_quality,
      quality_warning: aiResult.quality_warning,
      nutrition_source: 'voice_ai',
      quantity_uncertain: aiResult.quantity_uncertain,
      hidden_base_food: aiResult.hidden_base_food,
      fried_food: aiResult.fried_food,
      is_beverage: aiResult.is_beverage,
      has_bones: aiResult.has_bones,
      sugar_level: aiResult.sugar_level,
      default_ice_pct: aiResult.default_ice_pct,
      dishes: aiResult.dishes || [],
      ingredients: aiResult.ingredients || [],
      toppings: aiResult.toppings || [],
      alternatives: aiResult.alternatives || [],
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
        let food = null;
        if (FoodItem.collection) {
          food = await FoodItem.collection.findOne({ _id: item.food_item_id });
        }
        if (!food) {
          food = await FoodItem.findOne({ _id: item.food_item_id }).lean();
        }
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

  /**
   * Cập nhật thông tin định lượng và dinh dưỡng bữa ăn sau khi đã ghi nhận
   */
  async updateMealLog(userId, mealId, updateData) {
    const meal = await MealLog.findOne({ _id: mealId, user_id: userId });
    if (!meal) {
      throw new Error('Không tìm thấy bữa ăn hoặc bạn không có quyền chỉnh sửa');
    }

    const {
      portion_grams,
      calories,
      protein_g,
      carb_g,
      fat_g,
      meal_type,
      logged_at,
      description_text,
    } = updateData;

    if (portion_grams !== undefined) meal.portion_grams = Number(portion_grams);
    if (calories !== undefined) meal.calories = Number(calories);
    if (protein_g !== undefined) meal.protein_g = Number(protein_g);
    if (carb_g !== undefined) meal.carb_g = Number(carb_g);
    if (fat_g !== undefined) meal.fat_g = Number(fat_g);
    if (meal_type) meal.meal_type = meal_type;
    if (logged_at) meal.logged_at = new Date(logged_at);
    if (description_text !== undefined) meal.description_text = description_text;

    await meal.save();
    return await MealLog.findById(meal._id).populate('food_item_id').lean();
  }

  /**
   * Xóa bữa ăn
   */
  async deleteMealLog(userId, mealId) {
    const result = await MealLog.findOneAndDelete({ _id: mealId, user_id: userId });
    if (!result) {
      throw new Error('Không tìm thấy bữa ăn hoặc bạn không có quyền xóa');
    }
    return result;
  }
}

module.exports = new MealService();
