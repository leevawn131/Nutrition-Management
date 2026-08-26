const MealLog = require('../models/meal_log.model');
const FoodItem = require('../models/food_item.model');
const RecognitionHistory = require('../models/recognition_history.model');

/**
 * Tra cứu thông tin dinh dưỡng của một món ăn bằng tên.
 * Nếu không tìm thấy, hệ thống có thể tạo món tạm (UnidentifiedFood) - phần này có thể phát triển sau.
 */
const getFoodNutritionByName = async (foodName) => {
  // Tìm kiếm text index (cần cài đặt text index trong schema) hoặc regex
  // Đơn giản hóa: dùng Regex không phân biệt hoa thường
  const food = await FoodItem.findOne({ 
    $or: [
      { name: { $regex: new RegExp(foodName, 'i') } },
      { aliases: { $regex: new RegExp(foodName, 'i') } }
    ]
  });
  
  return food;
};

/**
 * Lưu các món ăn đã được người dùng xác nhận vào meal_logs.
 * Mỗi món ăn sẽ là một bản ghi MealLog riêng biệt.
 * 
 * @param {string} userId - ID người dùng
 * @param {Array} confirmedFoods - Mảng các món ăn: [{ food_item_id, name, portion_grams, calories, protein_g, carb_g, fat_g, recognition_summary }]
 * @param {string} mealType - breakfast, lunch, dinner, snack
 * @param {string} sourceImageUrl - URL ảnh bữa ăn
 * @param {string} recognitionId - ID của phiên nhận diện AI (nếu có)
 * @param {string} description - Mô tả chung về bữa ăn
 */
const saveMealLogs = async (userId, confirmedFoods, mealType, sourceImageUrl, recognitionId, description) => {
  const loggedAt = new Date(); // Chung 1 thời điểm để nhóm lại dễ dàng
  
  const mealLogsToInsert = confirmedFoods.map(food => {
    // Nếu user có nhập mô tả chung, ghép chung vào. Nếu không thì dùng tên món AI/User nhập.
    const customDescription = description ? `${description} - ${food.name}` : food.name;
    
    return {
      user_id: userId,
      food_item_id: food.food_item_id || null, // Có thể null nếu user tự gõ tên món mà chưa có trong DB
      input_method: sourceImageUrl ? 'photo' : 'text',
      source_image_url: sourceImageUrl || null,
      description_text: customDescription, 
      portion_grams: food.portion_grams,
      calories: food.calories,
      protein_g: food.protein_g || 0,
      carb_g: food.carb_g || 0,
      fat_g: food.fat_g || 0,
      meal_type: mealType,
      logged_at: loggedAt,
      recognition_summary: food.recognition_summary || null
    };
  });

  const result = await MealLog.insertMany(mealLogsToInsert);
  
  // Cập nhật lại recognition_history nếu có, gán meal_log_id bằng id của phần tử đầu tiên (đại diện)
  if (recognitionId && result.length > 0) {
    await RecognitionHistory.findByIdAndUpdate(recognitionId, {
      meal_log_id: result[0]._id 
    });
  }

  return result;
};

/**
 * Tính toán dinh dưỡng dựa trên gram và food_item gốc
 */
const calculateNutrition = (foodItem, grams) => {
  const ratio = grams / 100;
  return {
    calories: Math.round(foodItem.calories_per_100g * ratio),
    protein_g: foodItem.protein_per_100g ? Number((foodItem.protein_per_100g * ratio).toFixed(1)) : 0,
    carb_g: foodItem.carb_per_100g ? Number((foodItem.carb_per_100g * ratio).toFixed(1)) : 0,
    fat_g: foodItem.fat_per_100g ? Number((foodItem.fat_per_100g * ratio).toFixed(1)) : 0,
  };
};

module.exports = {
  getFoodNutritionByName,
  saveMealLogs,
  calculateNutrition
};
