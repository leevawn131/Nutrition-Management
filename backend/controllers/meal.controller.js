const mealService = require('../services/meal.service');

const mealController = {
  /**
   * POST /api/meals/analyze-image
   * Analyze uploaded image file via Gemini AI
   */
  async analyzeImage(req, res) {
    try {
      console.log('[mealController.analyzeImage] Received request, body keys:', Object.keys(req.body || {}), 'hasFile:', !!req.file, 'user:', req.user && req.user.id);
      let imagesList = [];
      const descriptionText = req.body ? req.body.description_text : '';

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        imagesList = req.files.map((file) => ({
          buffer: file.buffer,
          mimeType: file.mimetype || 'image/jpeg',
        }));
      } else if (req.file) {
        imagesList = [
          {
            buffer: req.file.buffer,
            mimeType: req.file.mimetype || 'image/jpeg',
          },
        ];
      } else if (
        req.body &&
        req.body.images_base64 &&
        Array.isArray(req.body.images_base64) &&
        req.body.images_base64.length > 0
      ) {
        imagesList = req.body.images_base64.map((item) => {
          let b64 = typeof item === 'string' ? item : item.data || '';
          let itemMime = typeof item === 'object' && item.mimeType ? item.mimeType : 'image/jpeg';
          if (b64.includes(',')) {
            const parts = b64.split(',');
            b64 = parts[1];
            const match = parts[0].match(/:(.*?);/);
            if (match) itemMime = match[1];
          }
          return {
            buffer: Buffer.from(b64, 'base64'),
            mimeType: itemMime,
          };
        });
      } else if (req.body && req.body.image_base64) {
        let base64Data = req.body.image_base64;
        let mimeType = req.body.mimeType || 'image/jpeg';
        if (base64Data.includes(',')) {
          const parts = base64Data.split(',');
          base64Data = parts[1];
          const match = parts[0].match(/:(.*?);/);
          if (match) mimeType = match[1];
        }
        imagesList = [
          {
            buffer: Buffer.from(base64Data, 'base64'),
            mimeType,
          },
        ];
      } else {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng tải lên ảnh món ăn hoặc dữ liệu base64',
        });
      }

      const userId = req.user.id;

      const result = await mealService.analyzeMealImage({
        userId,
        imageBuffer: imagesList.length === 1 ? imagesList[0].buffer : imagesList,
        mimeType: imagesList[0].mimeType,
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
   * POST /api/meals/transcribe-voice
   * Transcribe audio to Vietnamese text
   */
  async transcribeVoice(req, res) {
    try {
      let audioBuffer = null;
      let mimeType = 'audio/m4a';

      if (req.file) {
        audioBuffer = req.file.buffer;
        mimeType = req.file.mimetype || mimeType;
      } else if (req.body && req.body.audio_base64) {
        let base64Data = req.body.audio_base64;
        if (base64Data.includes(',')) {
          const parts = base64Data.split(',');
          base64Data = parts[1];
          const match = parts[0].match(/:(.*?);/);
          if (match) mimeType = match[1];
        }
        if (req.body.mimeType) mimeType = req.body.mimeType;
        audioBuffer = Buffer.from(base64Data, 'base64');
      }

      if (!audioBuffer) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng tải lên tệp âm thanh hoặc audio_base64',
        });
      }

      const result = await mealService.transcribeVoice({ audioBuffer, mimeType });

      return res.status(200).json({
        success: true,
        message: 'Chuyển đổi giọng nói thành văn bản thành công',
        data: result,
      });
    } catch (error) {
      console.error('Lỗi controller transcribeVoice:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi nhận diện giọng nói',
      });
    }
  },

  /**
   * POST /api/meals/analyze-voice
   * Analyze audio or voice transcript using Gemini AI
   */
  async analyzeVoice(req, res) {
    try {
      let audioBuffer = null;
      let mimeType = 'audio/m4a';
      const transcriptText = req.body ? (req.body.transcript_text || req.body.description_text) : '';

      if (req.file) {
        audioBuffer = req.file.buffer;
        mimeType = req.file.mimetype || mimeType;
      } else if (req.body && req.body.audio_base64) {
        let base64Data = req.body.audio_base64;
        if (base64Data.includes(',')) {
          const parts = base64Data.split(',');
          base64Data = parts[1];
          const match = parts[0].match(/:(.*?);/);
          if (match) mimeType = match[1];
        }
        if (req.body.mimeType) mimeType = req.body.mimeType;
        audioBuffer = Buffer.from(base64Data, 'base64');
      }

      if (!audioBuffer && (!transcriptText || !transcriptText.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tệp âm thanh ghi âm hoặc nội dung giọng nói',
        });
      }

      const userId = req.user.id;

      const result = await mealService.analyzeMealVoice({
        userId,
        audioBuffer,
        mimeType,
        transcriptText: transcriptText ? transcriptText.trim() : '',
      });

      return res.status(200).json({
        success: true,
        message: 'Phân tích dinh dưỡng từ giọng nói thành công',
        data: result,
      });
    } catch (error) {
      console.error('Lỗi controller analyzeVoice:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi phân tích giọng nói',
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

  /**
   * PUT /api/meals/:id
   * Update portion grams and nutrition for logged meal
   */
  async updateMealLog(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      const updated = await mealService.updateMealLog(userId, id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật bữa ăn thành công',
        data: updated,
      });
    } catch (error) {
      console.error('Lỗi controller updateMealLog:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi cập nhật bữa ăn',
      });
    }
  },

  /**
   * DELETE /api/meals/:id
   * Delete meal log
   */
  async deleteMealLog(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await mealService.deleteMealLog(userId, id);

      return res.status(200).json({
        success: true,
        message: 'Xóa bữa ăn thành công',
      });
    } catch (error) {
      console.error('Lỗi controller deleteMealLog:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi xóa bữa ăn',
      });
    }
  },
};

module.exports = mealController;
