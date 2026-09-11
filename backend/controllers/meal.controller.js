const mealService = require('../services/meal.service');

const mealController = {
  /**
   * POST /api/meals/analyze-image
   * Analyze uploaded image file via Gemini AI
   */
  async analyzeImage(req, res) {
    try {
      let imageBuffer;
      let mimeType = 'image/jpeg';
      const descriptionText = req.body.description_text;

      if (req.file) {
        imageBuffer = req.file.buffer;
        mimeType = req.file.mimetype || mimeType;
      } else if (req.body && req.body.image_base64) {
        let base64Data = req.body.image_base64;
        if (base64Data.includes(',')) {
          const parts = base64Data.split(',');
          base64Data = parts[1];
          const match = parts[0].match(/:(.*?);/);
          if (match) mimeType = match[1];
        }
        if (req.body.mimeType) {
          mimeType = req.body.mimeType;
        }
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng tải lên một tệp ảnh món ăn hoặc dữ liệu base64',
        });
      }

      const userId = req.user.id;

      const result = await mealService.analyzeMealImage({
        userId,
        imageBuffer,
        mimeType,
        descriptionText,
      });

      return res.status(200).json({
        success: true,
        message: 'Nhận diện món ăn từ ảnh thành công',
        data: result,
      });
    } catch (error) {
      console.error('Lỗi controller analyzeImage:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi phân tích ảnh',
      });
    }
  },

  /**
   * POST /api/meals/analyze-text
   * Analyze text description of meal
   */
  async analyzeText(req, res) {
    try {
      const userId = req.user.id;
      const { description_text } = req.body;

      if (!description_text || !description_text.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mô tả bữa ăn',
        });
      }

      const result = await mealService.analyzeMealText({
        userId,
        textDescription: description_text,
      });

      return res.status(200).json({
        success: true,
        message: 'Phân tích mô tả bữa ăn thành công',
        data: result,
      });
    } catch (error) {
      console.error('Lỗi controller analyzeText:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi phân tích mô tả bữa ăn',
      });
    }
  },

  /**
   * POST /api/meals/calculate-ingredients
   * Preview nutrition calculation for ingredients
   */
  async calculateIngredients(req, res) {
    try {
      const { ingredients } = req.body;
      const calculated = await mealService.calculateIngredientsNutrition(ingredients);

      return res.status(200).json({
        success: true,
        message: 'Tính toán dinh dưỡng thành công',
        data: calculated,
      });
    } catch (error) {
      console.error('Lỗi controller calculateIngredients:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi tính toán dinh dưỡng nguyên liệu',
      });
    }
  },

  /**
   * POST /api/meals
   * Save a meal log (Manual or AI confirmed)
   */
  async createMealLog(req, res) {
    try {
      const userId = req.user.id;
      const {
        food_item_id,
        input_method,
        source_image_url,
        description_text,
        portion_label,
        portion_grams,
        calories,
        protein_g,
        carb_g,
        fat_g,
        meal_type,
        logged_at,
        recognition_summary,
        ingredients,
      } = req.body;

      const mealLog = await mealService.createMealLog({
        userId,
        food_item_id,
        input_method: input_method || 'manual',
        source_image_url,
        description_text,
        portion_label,
        portion_grams,
        calories,
        protein_g,
        carb_g,
        fat_g,
        meal_type: meal_type || 'lunch',
        logged_at,
        recognition_summary,
        ingredients,
      });

      return res.status(201).json({
        success: true,
        message: 'Ghi nhận bữa ăn thành công',
        data: mealLog,
      });
    } catch (error) {
      console.error('Lỗi controller createMealLog:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi lưu bữa ăn',
      });
    }
  },

  /**
   * GET /api/meals
   * Retrieve list of logged meals
   */
  async getMealLogs(req, res) {
    try {
      const userId = req.user.id;
      const { date } = req.query;

      const logs = await mealService.getUserMealLogs(userId, date);

      return res.status(200).json({
        success: true,
        message: 'Lấy nhật ký bữa ăn thành công',
        data: logs,
      });
    } catch (error) {
      console.error('Lỗi controller getMealLogs:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi lấy nhật ký bữa ăn',
      });
    }
  },
};

module.exports = mealController;
