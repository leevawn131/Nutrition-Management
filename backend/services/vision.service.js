const { GoogleGenerativeAI } = require('@google/generative-ai');
const RecognitionHistory = require('../models/recognition_history.model');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Phân tích ảnh bữa ăn bằng Google Gemini Vision
 * Trả về danh sách các món ăn, lượng gram ước tính và lưu lịch sử nhận diện
 */
const analyzeMealImage = async (userId, imageUrl, base64Image) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env của Backend. Vui lòng thêm key để AI hoạt động.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `
      Bạn là một chuyên gia dinh dưỡng. Hãy phân tích hình ảnh bữa ăn này và nhận diện các món ăn có trong đó.
      Trọng lượng phải hợp lý với 1 khẩu phần ăn thực tế.
      Trả về kết quả DƯỚI DẠNG JSON với cấu trúc chính xác như sau, không có markdown hay văn bản thừa:
      {
        "foods": [
          {
            "name": "Tên món ăn tiếng Việt (ví dụ: Cơm trắng)",
            "estimated_grams": <số gram ước tính, ví dụ: 200>,
            "calories": <tổng calo ước tính cho số gram này>,
            "protein_g": <số gram protein ước tính>,
            "carb_g": <số gram carb ước tính>,
            "fat_g": <số gram fat ước tính>,
            "glycemic_index": <chỉ số đường huyết GI ước tính (0-100), ví dụ: 73>,
            "glycemic_load": <tải lượng đường huyết GL ước tính, ví dụ: 25>,
            "confidence": <độ tự tin từ 0.0 đến 1.0, ví dụ: 0.95>
          }
        ]
      }
    `;

    // Chuẩn bị payload hình ảnh
    let imageParts = [];
    if (base64Image) {
      // Base64 string format: "data:image/jpeg;base64,/9j/4AAQSk..."
      const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));
      const base64Data = base64Image.split(',')[1];
      
      imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || 'image/jpeg',
          },
        },
      ];
    } else {
      throw new Error('Hiện tại chỉ hỗ trợ phân tích qua base64Image');
    }

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let textResult = response.text();
    
    // Clean up potential markdown formatting from Gemini response
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(textResult);
    } catch (parseError) {
      throw new Error('AI trả về định dạng không hợp lệ');
    }

    if (!parsedData.foods || !Array.isArray(parsedData.foods)) {
      throw new Error('Cấu trúc JSON từ AI không chứa mảng "foods"');
    }

    // Lưu lịch sử nhận diện
    const history = new RecognitionHistory({
      user_id: userId,
      source_type: 'image',
      raw_input: imageUrl || 'base64_image',
      predicted_label: parsedData.foods.map(f => f.name).join(', '), // Gom các tên món ăn lại
      confidence: parsedData.foods.length > 0 ? parsedData.foods[0].confidence : 0,
      ai_model: 'gemini-3.5-flash',
      raw_response: parsedData,
    });
    await history.save();

    return {
      recognition_id: history._id,
      foods: parsedData.foods,
    };
  } catch (error) {
    console.error('Lỗi trong vision.service analyzeMealImage:', error);
    throw error;
  }
};

/**
 * Phân tích bữa ăn từ văn bản mô tả bằng AI
 */
const analyzeMealText = async (userId, text) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env của Backend. Vui lòng thêm key để AI hoạt động.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `
      Bạn là một chuyên gia dinh dưỡng. Dưới đây là mô tả bữa ăn của người dùng: "${text}".
      Hãy phân tích đoạn văn bản này, nhận diện các món ăn có trong đó.
      Trọng lượng phải hợp lý với 1 khẩu phần ăn thực tế được mô tả.
      Trả về kết quả DƯỚI DẠNG JSON với cấu trúc chính xác như sau, không có markdown hay văn bản thừa:
      {
        "foods": [
          {
            "name": "Tên món ăn tiếng Việt (ví dụ: Cơm trắng)",
            "estimated_grams": <số gram ước tính, ví dụ: 200>,
            "calories": <tổng calo ước tính cho số gram này>,
            "protein_g": <số gram protein ước tính>,
            "carb_g": <số gram carb ước tính>,
            "fat_g": <số gram fat ước tính>,
            "glycemic_index": <chỉ số đường huyết GI ước tính (0-100), ví dụ: 73>,
            "glycemic_load": <tải lượng đường huyết GL ước tính, ví dụ: 25>,
            "confidence": <độ tự tin từ 0.0 đến 1.0, ví dụ: 0.95>
          }
        ]
      }
    `;

    const result = await model.generateContent([prompt]);
    
    // 3. Xử lý chuỗi JSON an toàn
    let rawText = result.response.text().trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.substring(7);
      if (rawText.endsWith('```')) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
    } else if (rawText.startsWith('```')) {
      rawText = rawText.substring(3);
      if (rawText.endsWith('```')) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
    }
    
    const parsedData = JSON.parse(rawText.trim());

    if (!parsedData.foods || !Array.isArray(parsedData.foods)) {
      throw new Error('Định dạng phản hồi từ AI không hợp lệ');
    }

    // 4. Lưu lịch sử nhận diện
    const history = new RecognitionHistory({
      user_id: userId,
      source_type: 'text',
      raw_input: text,
      predicted_label: parsedData.foods.map(f => f.name).join(', '), // Gom các tên món ăn lại
      confidence: parsedData.foods.length > 0 ? parsedData.foods[0].confidence : 0,
      ai_model: 'gemini-3.5-flash',
      raw_response: parsedData,
    });
    await history.save();

    return {
      recognition_id: history._id,
      foods: parsedData.foods,
    };
  } catch (error) {
    console.error('Lỗi trong vision.service analyzeMealText:', error);
    throw error;
  }
};

/**
 * Phân tích dinh dưỡng của một công thức dựa trên nguyên liệu
 */
const analyzeRecipeNutrition = async (ingredients, servings) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    // Tạo chuỗi mô tả nguyên liệu
    const ingredientsText = ingredients.map(ing => `${ing.ingredient_name}: ${ing.quantity} ${ing.unit}`).join(', ');

    const prompt = `
      Bạn là một chuyên gia dinh dưỡng. Dưới đây là danh sách nguyên liệu của một công thức nấu ăn:
      ${ingredientsText}
      Số khẩu phần (servings): ${servings}.

      Nhiệm vụ của bạn:
      1. Ước tính calo, đạm, đường, béo cho TỪNG nguyên liệu dựa trên định lượng được cung cấp.
      2. Tính TỔNG toàn bộ calo và vi lượng (vitamin, khoáng chất, GI, GL) cho cả công thức, SAU ĐÓ CHIA CHO số khẩu phần (${servings}) để ra giá trị cho 1 khẩu phần (1 serving).

      Trả về kết quả DƯỚI DẠNG JSON CHUẨN XÁC với cấu trúc sau, không có markdown hay văn bản thừa:
      {
        "total_nutrition_per_serving": {
          "energy_kcal": <số>,
          "protein_g": <số>,
          "carbohydrate_g": <số>,
          "fat_g": <số>,
          "saturated_fat_g": <số>,
          "trans_fat_g": <số>,
          "unsaturated_fat_g": <số>,
          "fiber_g": <số>,
          "cholesterol_mg": <số>,
          "sodium_mg": <số>,
          "glycemic_load": <số>,
          "vitamin_a_mcg": <số>,
          "vitamin_c_mg": <số>,
          "vitamin_e_mg": <số>,
          "calcium_mg": <số>,
          "iron_mg": <số>,
          "magnesium_mg": <số>,
          "potassium_mg": <số>,
          "phosphorus_mg": <số>
        },
        "ingredients_breakdown": [
          {
            "ingredient_name": "Tên nguyên liệu tương ứng",
            "calories": <calo của riêng nguyên liệu này>,
            "protein_g": <protein của riêng nguyên liệu này>,
            "carb_g": <carb của riêng nguyên liệu này>,
            "fat_g": <fat của riêng nguyên liệu này>
          }
        ]
      }
    `;

    const result = await model.generateContent([prompt]);
    let rawText = result.response.text().trim();
    if (rawText.startsWith('\`\`\`json')) {
      rawText = rawText.substring(7);
      if (rawText.endsWith('\`\`\`')) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
    } else if (rawText.startsWith('\`\`\`')) {
      rawText = rawText.substring(3);
      if (rawText.endsWith('\`\`\`')) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
    }
    
    const parsedData = JSON.parse(rawText.trim());
    return parsedData;
  } catch (error) {
    console.error('Lỗi trong vision.service analyzeRecipeNutrition:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết thông tin và vi chất của 1 nguyên liệu (per 100g)
 */
const getIngredientDetail = async (ingredientName) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `
      Bạn là một chuyên gia dinh dưỡng. Hãy cung cấp thông tin chi tiết cho nguyên liệu sau: "${ingredientName}".
      
      Nhiệm vụ của bạn:
      1. Viết một đoạn mô tả ngắn (1-2 câu) về nguyên liệu này.
      2. Tính toán hoặc ước tính các thành phần dinh dưỡng cho đúng 100 gram nguyên liệu này.
      3. Trả về kết quả DƯỚI DẠNG JSON CHUẨN XÁC với cấu trúc sau, không có markdown hay văn bản thừa:
      {
        "name": "Tên chuẩn của nguyên liệu (ví dụ: Cá rô phi)",
        "description": "Mô tả ngắn về nguyên liệu này",
        "nutrition_per_100g": {
          "energy_kcal": <số>,
          "protein_g": <số>,
          "fat_g": <số>,
          "calcium_mg": <số>,
          "phosphorus_mg": <số>,
          "iron_mg": <số>,
          "vitamin_d_ug": <số>
        }
      }
    `;

    const result = await model.generateContent([prompt]);
    let rawText = result.response.text().trim();
    if (rawText.startsWith('\`\`\`json')) {
      rawText = rawText.substring(7);
      if (rawText.endsWith('\`\`\`')) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
    } else if (rawText.startsWith('\`\`\`')) {
      rawText = rawText.substring(3);
      if (rawText.endsWith('\`\`\`')) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
    }
    
    const parsedData = JSON.parse(rawText.trim());
    return parsedData;
  } catch (error) {
    console.error('Lỗi trong vision.service getIngredientDetail:', error);
    throw error;
  }
};

module.exports = {
  analyzeMealImage,
  analyzeMealText,
  analyzeRecipeNutrition,
  getIngredientDetail
};
