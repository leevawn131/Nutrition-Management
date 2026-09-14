const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Helper to ensure GenAI instance is ready
   */
  getGenAIInstance() {
    if (!this.genAI) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Chưa cấu hình GEMINI_API_KEY trong tệp .env');
      }
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return this.genAI;
  }

  /**
   * Helper to generate content with fallback model names
   */
  async generateContentWithFallback(genAI, contents) {
    const defaultModels = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-flash-latest',
      'gemini-2.5-pro',
    ];
    const userModel = process.env.GEMINI_MODEL;
    const rawList = userModel ? [userModel, ...defaultModels] : defaultModels;
    const modelsToTry = Array.from(new Set(rawList)).filter(Boolean);

    let lastError;
    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini AI] Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(contents);
        return result;
      } catch (err) {
        lastError = err;
        const errMsg = err.message || err.toString();
        console.warn(`[Gemini AI] Model ${modelName} failed (${errMsg}). Trying next fallback model...`);
        continue;
      }
    }
    throw lastError;
  }

  /**
   * Analyze food image using Gemini API
   * @param {Buffer} imageBuffer - Image binary buffer
   * @param {string} mimeType - Image mime type (e.g. image/jpeg, image/png)
   * @returns {Promise<Object>} Formatted JSON analysis result
   */
  async analyzeFoodImage(imageBuffer, mimeType = 'image/jpeg') {
    try {
      const genAI = this.getGenAIInstance();

      const prompt = `Bạn là chuyên gia dinh dưỡng hàng đầu thế giới với am hiểu sâu sắc về ẩm thực Việt Nam và quốc tế. Hãy phân tích ảnh bữa ăn này một cách toàn diện và chính xác tuyệt đối.

NGUYÊN TẮC QUAN TRỌNG NHẤT: BỘ 3 MỨC ĐỘ TIN CẬY (KHÔNG ĐOÁN BỪA)
🟢 Mức 1 - Nhìn thấy rõ (visible): Tính toán trực tiếp dựa trên hình ảnh.
🟡 Mức 2 - Suy luận hợp lý (inferred): Không nhìn thấy trực tiếp nhưng có căn cứ ẩm thực rõ ràng (VD: bánh mì kẹp có nhân pate, phở có bánh phở bên dưới) -> Ước lượng + đánh dấu source: "inferred".
🔴 Mức 3 - Không đủ thông tin (uncertain): Ảnh quá mờ, bị che khuất >50%, hoặc ánh sáng biến đổi màu -> Không tự bịa con số chắc chắn -> Hạ confidence (<0.5), đặt image_quality: "poor", thêm quality_warning và danh sách alternatives.

BỘ 20 QUY TẮC PHÂN TÍCH CHUYÊN SÂU:
1. Món che khuất một phần: Đánh dấu quantity_uncertain: true nếu bị che >30%.
2. Món bị bẻ/ăn dở (Pizza ăn 2 miếng, phở còn 30%): Trả về consumption_pct (tỷ lệ %, VD 70) và estimated_eaten_weight_g thực tế đã/sắp ăn.
3. Nhiều món giống nhau (5 cái nem, 6 miếng sushi): Đưa quantity cụ thể vào từng món trong ingredients.
4. Món nhiều lớp (Bánh mì, Pizza, Cơm trộn): Phân biệt rõ từng thành phần với source: "visible" hoặc "inferred".
5. Gia vị & Nguồn calo ẩn: Ưu tiên phát hiện đường, dầu mỡ, bơ, sốt béo, mật ong vì ảnh hưởng lớn đến kcal.
6. Món chiên không thấy dầu (Gà rán, chả giò): Phát hiện phương pháp chế biến qua bề mặt và đặt fried_food: true.
7. Món nướng/luộc/kho/chiên hình dáng giống nhau: Quan sát độ xém cháy, màu sắc, bóng mỡ để phân biệt. Nếu không chắc chắn -> đưa vào quality_warning.
8. Tinh bột bị che (hidden_base_food): Cơm dưới thịt, bún dưới topping, mì dưới nước dùng -> Đặt hidden_base_food: true và tính lượng tinh bột bên dưới dựa trên container_size.
9. Kích thước bát/đĩa (container_size): Tìm kiếm vật thể đối chiếu (đũa, thìa, tay) để phân loại container_size: "small" | "medium" | "large" | "extra_large".
10. Biến thể theo quán/vùng miền: Nếu món có nhiều loại (bánh mì pate vs bánh mì xíu mại) mà không chắc -> hạ confidence và đưa tên nhóm món.
11. Biến đổi thể tích nấu chín: Lấy trọng lượng món ĐÃ NẤU CHÍN (cooked weight) để tính kcal, không lấy trọng lượng tươi sống.
12. Đồ uống có Topping & Đá: Đặt is_beverage: true, default_ice_pct: 50 (trừ thể tích đá), và liệt kê toppings (trân châu, pudding, cheese foam) kèm kcal.
13. Mức đường đồ uống: Đặt sugar_level: "unknown" | "30%" | "50%" | "70%" | "100%" nếu không nhìn thấy nhãn.
14. Nhãn dinh dưỡng/Bao bì đóng gói: Nếu ảnh có nhãn sản phẩm đóng gói (chai nước, hộp mì), đọc nhãn và đặt nutrition_source: "label".
15. Món ăn phân vân (Steak vs Bánh Chocolate): Trả về alternatives gồm các đáp án ứng viên kèm confidence riêng.
16. Ảnh kém chất lượng (tối, mờ, quá xa, quá sáng): Đặt image_quality: "poor" và quality_warning nhắc người dùng chụp lại.
17. Bàn ăn / Mâm cơm nhiều món: Nếu ảnh chụp toàn bộ mâm cơm hoặc bàn ăn gồm nhiều đĩa/bát khác nhau (VD: Cơm + Canh + Thịt kho + Rau xào), hãy phân tích tổng thể bàn ăn thành food_name (VD: "Mâm cơm gia đình: Cơm, Thịt kho, Canh, Rau") và bóc tách TỪNG MÓN ĂN TRÊN BÀN ĂN thành các mục chi tiết trong mảng ingredients (kèm tên món, khối lượng g, calories, đạm, béo, tinh bột).

Bạn PHẢI trả về ĐÚNG MỘT OBJECT JSON thuần túy (không kèm đoạn văn bản hay markdown code block) có cấu trúc chính xác như sau:
{
  "food_name": "Tên bữa ăn / món ăn",
  "confidence": 0.85,
  "image_quality": "good",
  "quality_warning": "",
  "nutrition_source": "ai_vision",
  "quantity_uncertain": false,
  "consumption_pct": 100,
  "estimated_weight_g": 350,
  "estimated_eaten_weight_g": 350,
  "container_size": "medium",
  "hidden_base_food": false,
  "fried_food": false,
  "has_bones": false,
  "is_beverage": false,
  "sugar_level": "unknown",
  "default_ice_pct": 0,
  "calories": 450,
  "protein_g": 25,
  "carb_g": 55,
  "fat_g": 12,
  "glycemic_load": 24,
  "ingredients": [
    {
      "name": "Bánh mì",
      "quantity": 1,
      "portion_g": 100,
      "calories": 250,
      "protein_g": 8,
      "carb_g": 45,
      "fat_g": 3,
      "source": "visible"
    },
    {
      "name": "Pâté & Thịt nguội",
      "quantity": 1,
      "portion_g": 50,
      "calories": 150,
      "protein_g": 12,
      "carb_g": 2,
      "fat_g": 10,
      "source": "inferred"
    }
  ],
  "toppings": [],
  "alternatives": []
}

Nếu ảnh KHÔNG phải là món ăn hoặc thực phẩm, hãy trả về JSON:
{
  "food_name": "Món ăn chưa xác định",
  "confidence": 0.0,
  "image_quality": "poor",
  "quality_warning": "Không phát hiện món ăn trong ảnh",
  "nutrition_source": "ai_vision",
  "quantity_uncertain": true,
  "consumption_pct": 0,
  "estimated_weight_g": 0,
  "estimated_eaten_weight_g": 0,
  "container_size": "medium",
  "hidden_base_food": false,
  "fried_food": false,
  "has_bones": false,
  "is_beverage": false,
  "sugar_level": "unknown",
  "default_ice_pct": 0,
  "calories": 0,
  "protein_g": 0,
  "carb_g": 0,
  "fat_g": 0,
  "glycemic_load": 0,
  "ingredients": [],
  "toppings": [],
  "alternatives": []
}`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg',
        },
      };

      const result = await this.generateContentWithFallback(genAI, [prompt, imagePart]);
      const responseText = result.response.text();

      // Clean markdown code blocks if any
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/i, '').replace(/\s*```$/, '');
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Lỗi parse JSON từ kết quả Gemini:', responseText);
        parsedResult = {
          food_name: 'Món ăn nhận diện từ ảnh',
          estimated_weight_g: 250,
          calories: 350,
          protein_g: 15,
          carb_g: 40,
          fat_g: 10,
          glycemic_load: 22.0,
          confidence: 0.7,
          quality_warning: '',
          ingredients: [],
          raw_text: responseText,
        };
      }

      const carbG = Number(parsedResult.carb_g) || 0;
      const estimatedGL = parsedResult.glycemic_load !== undefined ? Number(parsedResult.glycemic_load) : Math.round(((carbG * 55) / 100) * 10) / 10;

      const formattedIngredients = Array.isArray(parsedResult.ingredients)
        ? parsedResult.ingredients.map(ing => ({
            name: ing.name || ing.ingredient_name || 'Thành phần món ăn',
            quantity: Number(ing.quantity) || 1,
            portion_g: Number(ing.portion_g || ing.quantity || ing.amount) || 0,
            calories: Number(ing.calories) || 0,
            protein_g: Number(ing.protein_g) || 0,
            carb_g: Number(ing.carb_g) || 0,
            fat_g: Number(ing.fat_g) || 0,
            source: ing.source === 'inferred' ? 'inferred' : 'visible',
          }))
        : [];

      const formattedToppings = Array.isArray(parsedResult.toppings)
        ? parsedResult.toppings.map(top => ({
            name: typeof top === 'string' ? top : top.name || 'Topping',
            calories: typeof top === 'object' ? Number(top.calories) || 0 : 0,
          }))
        : [];

      const formattedAlternatives = Array.isArray(parsedResult.alternatives)
        ? parsedResult.alternatives.map(alt => ({
            name: alt.name || 'Món ứng viên',
            confidence: Number(alt.confidence) || 0.5,
          }))
        : [];

      const formattedDishes = Array.isArray(parsedResult.dishes) && parsedResult.dishes.length > 0
        ? parsedResult.dishes.map((dish, dIdx) => ({
            id: `dish_${dIdx}_${Date.now()}`,
            name: dish.name || dish.food_name || `Món ${dIdx + 1}`,
            estimated_weight_g: Number(dish.estimated_weight_g || dish.portion_g) || 0,
            calories: Number(dish.calories) || 0,
            protein_g: Number(dish.protein_g) || 0,
            carb_g: Number(dish.carb_g) || 0,
            fat_g: Number(dish.fat_g) || 0,
            ingredients: Array.isArray(dish.ingredients)
              ? dish.ingredients.map(ing => ({
                  name: ing.name || ing.ingredient_name || 'Thành phần',
                  portion_g: Number(ing.portion_g || ing.quantity || ing.amount) || 0,
                  calories: Number(ing.calories) || 0,
                  protein_g: Number(ing.protein_g) || 0,
                  carb_g: Number(ing.carb_g) || 0,
                  fat_g: Number(ing.fat_g) || 0,
                  source: ing.source === 'inferred' ? 'inferred' : 'visible',
                }))
              : [],
          }))
        : [];

      return {
        raw_response: parsedResult,
        food_name: parsedResult.food_name || 'Món ăn chưa xác định',
        estimated_weight_g: Number(parsedResult.estimated_weight_g) || 0,
        estimated_eaten_weight_g: Number(parsedResult.estimated_eaten_weight_g || parsedResult.estimated_weight_g) || 0,
        consumption_pct: Number(parsedResult.consumption_pct) || 100,
        container_size: parsedResult.container_size || 'medium',
        calories: Number(parsedResult.calories) || 0,
        protein_g: Number(parsedResult.protein_g) || 0,
        carb_g: Number(parsedResult.carb_g) || 0,
        fat_g: Number(parsedResult.fat_g) || 0,
        glycemic_load: estimatedGL,
        confidence: Number(parsedResult.confidence) || 0.5,
        image_quality: parsedResult.image_quality || 'good',
        quality_warning: parsedResult.quality_warning || '',
        nutrition_source: parsedResult.nutrition_source || 'ai_vision',
        quantity_uncertain: Boolean(parsedResult.quantity_uncertain),
        hidden_base_food: Boolean(parsedResult.hidden_base_food),
        fried_food: Boolean(parsedResult.fried_food),
        is_beverage: Boolean(parsedResult.is_beverage),
        has_bones: Boolean(parsedResult.has_bones),
        sugar_level: parsedResult.sugar_level || 'unknown',
        default_ice_pct: Number(parsedResult.default_ice_pct) || 0,
        dishes: formattedDishes,
        ingredients: formattedIngredients,
        toppings: formattedToppings,
        alternatives: formattedAlternatives,
      };
    } catch (error) {
      console.error('Lỗi GeminiService analyzeFoodImage:', error);
      throw new Error(`Lỗi nhận diện AI Vision: ${error.message}`);
    }
  }

  /**
   * Analyze food text description using Gemini API
   * @param {string} textDescription
   */
  async analyzeFoodText(textDescription) {
    try {
      const genAI = this.getGenAIInstance();

      const prompt = `Bạn là chuyên gia dinh dưỡng. Dựa trên mô tả bữa ăn sau: "${textDescription}", hãy phân tích và ước lượng dinh dưỡng chi tiết.

Yêu cầu BẮT BUỘC:
1. Phân tích mô tả (kể cả bữa ăn có nhiều món).
2. Trả về chi tiết các nguyên liệu / món thành phần trong mảng "ingredients" kèm Calo, Protein, Carb, Fat.

Bạn PHẢI trả về ĐÚNG MỘT OBJECT JSON thuần túy (không kèm markdown code block):
{
  "food_name": "Tên món ăn / bữa ăn tóm tắt",
  "estimated_weight_g": 300,
  "calories": 400,
  "protein_g": 20,
  "carb_g": 50,
  "fat_g": 10,
  "confidence": 0.9,
  "ingredients": [
    {
      "name": "Nguyên liệu / Món thành phần 1",
      "portion_g": 150,
      "calories": 200,
      "protein_g": 10,
      "carb_g": 30,
      "fat_g": 5
    }
  ]
}`;

      const result = await this.generateContentWithFallback(genAI, [prompt]);
      const responseText = result.response.text();

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/i, '').replace(/\s*```$/, '');
      }

      const parsedResult = JSON.parse(cleanedText);

      const formattedIngredients = Array.isArray(parsedResult.ingredients)
        ? parsedResult.ingredients.map(ing => ({
            name: ing.name || ing.ingredient_name || 'Thành phần món ăn',
            portion_g: Number(ing.portion_g || ing.quantity || ing.amount) || 0,
            calories: Number(ing.calories) || 0,
            protein_g: Number(ing.protein_g) || 0,
            carb_g: Number(ing.carb_g) || 0,
            fat_g: Number(ing.fat_g) || 0,
          }))
        : [];

      return {
        raw_response: parsedResult,
        food_name: parsedResult.food_name || textDescription,
        estimated_weight_g: Number(parsedResult.estimated_weight_g) || 0,
        calories: Number(parsedResult.calories) || 0,
        protein_g: Number(parsedResult.protein_g) || 0,
        carb_g: Number(parsedResult.carb_g) || 0,
        fat_g: Number(parsedResult.fat_g) || 0,
        confidence: Number(parsedResult.confidence) || 0.8,
        ingredients: formattedIngredients,
      };
    } catch (error) {
      console.error('Lỗi GeminiService analyzeFoodText:', error);
      throw new Error(`Lỗi phân tích mô tả AI: ${error.message}`);
    }
  }
}

module.exports = new GeminiService();
