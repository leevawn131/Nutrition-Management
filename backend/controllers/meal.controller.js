const visionService = require('../services/vision.service');
const mealService = require('../services/meal.service');

/**
 * Phân tích ảnh món ăn bằng AI
 * Trả về danh sách món, gram ước tính và các chỉ số dinh dưỡng (map từ DB)
 */
const analyzeMealImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { image_url, base64_image } = req.body;

    if (!image_url && !base64_image) {
      return res.status(400).json({ error: 'Cần cung cấp image_url hoặc base64_image' });
    }

    // 1. Gọi Vision Service
    const aiResult = await visionService.analyzeMealImage(userId, image_url, base64_image);
    
    // 2. Map với Food Database để tính calo chuẩn
    const mappedFoods = await Promise.all(
      aiResult.foods.map(async (aiFood) => {
        const foodDb = await mealService.getFoodNutritionByName(aiFood.name);
        
        let nutrition = { 
          calories: aiFood.calories || 0, 
          protein_g: aiFood.protein_g || 0, 
          carb_g: aiFood.carb_g || 0, 
          fat_g: aiFood.fat_g || 0 
        };
        let foodItemId = null;
        
        // Nếu DB có sẵn món này, thì dùng định mức chuẩn của DB để tính toán lại chính xác hơn
        if (foodDb) {
          foodItemId = foodDb._id;
          nutrition = mealService.calculateNutrition(foodDb, aiFood.estimated_grams);
        }

        // Nếu DB chưa có, tự động tạo một Unknown Food log để quản trị viên có thể thêm vào DB sau này
        // (Có thể bỏ qua bước này nếu không cần thiết, ở đây ta ưu tiên xài kết quả AI)

        return {
          food_item_id: foodItemId,
          name: aiFood.name, // Giữ tên gốc của AI hoặc tên gốc của user
          portion_grams: aiFood.estimated_grams,
          confidence: aiFood.confidence,
          calories: nutrition.calories,
          protein_g: nutrition.protein_g,
          carb_g: nutrition.carb_g,
          fat_g: nutrition.fat_g,
          glycemic_index: aiFood.glycemic_index || null,
          glycemic_load: aiFood.glycemic_load || null,
        };
      })
    );

    res.status(200).json({
      recognition_id: aiResult.recognition_id,
      foods: mappedFoods
    });

  } catch (error) {
    console.error('analyzeMealImage error:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi xử lý hình ảnh' });
  }
};

/**
 * Lưu danh sách các món đã xác nhận thành Meal Logs
 */
const saveMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmed_foods, meal_type, source_image_url, recognition_id, description } = req.body;

    if (!confirmed_foods || !Array.isArray(confirmed_foods) || confirmed_foods.length === 0) {
      return res.status(400).json({ error: 'Danh sách món ăn xác nhận không hợp lệ' });
    }
    if (!meal_type) {
      return res.status(400).json({ error: 'Thiếu meal_type (breakfast, lunch, dinner, snack)' });
    }

    const savedLogs = await mealService.saveMealLogs(
      userId,
      confirmed_foods,
      meal_type,
      source_image_url,
      recognition_id,
      description
    );

    res.status(201).json({
      message: 'Đã lưu bữa ăn thành công',
      count: savedLogs.length,
      logs: savedLogs
    });

  } catch (error) {
    console.error('saveMeal error:', error);
    res.status(500).json({ error: 'Lỗi khi lưu bữa ăn' });
  }
};

/**
 * Phân tích mô tả bữa ăn bằng văn bản
 */
const analyzeMealText = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Cần cung cấp đoạn văn bản mô tả bữa ăn' });
    }

    // 1. Gọi Vision Service (dùng text thay vì ảnh)
    const aiResult = await visionService.analyzeMealText(userId, text);
    
    // 2. Map với Food Database để tính calo chuẩn
    const mappedFoods = await Promise.all(
      aiResult.foods.map(async (aiFood) => {
        const foodDb = await mealService.getFoodNutritionByName(aiFood.name);
        
        let nutrition = { 
          calories: aiFood.calories || 0, 
          protein_g: aiFood.protein_g || 0, 
          carb_g: aiFood.carb_g || 0, 
          fat_g: aiFood.fat_g || 0 
        };
        let foodItemId = null;
        
        if (foodDb) {
          foodItemId = foodDb._id;
          nutrition = mealService.calculateNutrition(foodDb, aiFood.estimated_grams);
        }

        return {
          food_item_id: foodItemId,
          name: aiFood.name,
          portion_grams: aiFood.estimated_grams,
          confidence: aiFood.confidence,
          calories: nutrition.calories,
          protein_g: nutrition.protein_g,
          carb_g: nutrition.carb_g,
          fat_g: nutrition.fat_g,
          glycemic_index: aiFood.glycemic_index || null,
          glycemic_load: aiFood.glycemic_load || null,
        };
      })
    );

    res.status(200).json({
      recognition_id: aiResult.recognition_id,
      foods: mappedFoods
    });

  } catch (error) {
    console.error('analyzeMealText error:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi phân tích văn bản' });
  }
};

module.exports = {
  analyzeMealImage,
  analyzeMealText,
  saveMeal
};
