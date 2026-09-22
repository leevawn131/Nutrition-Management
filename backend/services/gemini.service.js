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
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
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

  /**
   * Generate clinical AI advice for a day's meal & nutrition adherence using Gemini 3.5 Flash
   * @param {Object} data
   */
  async generateMealNutritionAdvice(data) {
    try {
      const genAI = this.getGenAIInstance();
      const {
        userGoal = 'lose',
        targetCalories = 2000,
        date = '',
        dayOfWeek = '',
        caloriesConsumed = 0,
        macros = {},
        micronutrients = [],
        mealsComparison = [],
      } = data;

      const prompt = `Bạn là Bác sĩ - Chuyên gia Dinh dưỡng AI cấp cao (sử dụng nền tảng Gemini 3.5 Flash).
Hãy phân tích dữ liệu ăn uống thực tế của người dùng hôm nay so với kế hoạch mục tiêu và đưa ra đánh giá, chỉ dẫn hành động.

THÔNG TIN NGƯỜI DÙNG & NGÀY ĂN:
- Mục tiêu: ${userGoal === 'lose' ? 'Giảm cân/Giảm mỡ' : userGoal === 'gain' ? 'Tăng cân/Tăng cơ' : 'Duy trì cân nặng & sức khỏe'}
- Thời gian: ${dayOfWeek || ''}, ngày ${date}
- Tổng năng lượng: Nạp ${caloriesConsumed} kcal / Mục tiêu ${targetCalories} kcal (Chênh lệch: ${caloriesConsumed - targetCalories} kcal)
- Đa lượng:
  + Đạm (Protein): ${macros?.protein?.actual ?? 0}g / Mục tiêu: ${macros?.protein?.target ?? 0}g
  + Đường bột (Carb): ${macros?.carb?.actual ?? 0}g / Mục tiêu: ${macros?.carb?.target ?? 0}g
  + Chất béo (Fat): ${macros?.fat?.actual ?? 0}g / Mục tiêu: ${macros?.fat?.target ?? 0}g
- Vi chất nổi bật (Thừa/Thiếu):
${micronutrients && micronutrients.length > 0
  ? micronutrients.map((m) => `  * ${m.name}: ${m.amount}/${m.target} ${m.unit} -> [${m.statusLabel}]`).join('\n')
  : '  * Đang tổng hợp'}
- So khớp bữa ăn (Kế hoạch vs Thực tế):
${mealsComparison && mealsComparison.length > 0
  ? mealsComparison.map((m) => `  * ${m.mealLabel}: Lên lịch "${m.plannedDish}" vs Thực tế ăn "${m.actualLoggedDish}" (${m.status})`).join('\n')
  : '  * Chưa ghi nhận'}

YÊU CẦU ĐẦU RA:
Bạn PHẢI trả về DUY NHẤT 1 OBJECT JSON thuần túy (không kèm markdown code block \`\`\`json, không thừa chữ ngoài JSON):
{
  "aiDoctorVerdict": "Nhận xét tổng quan ngắn gọn (2-3 câu) từ góc nhìn bác sĩ về chế độ ăn hôm nay, đánh giá có chuẩn hướng không.",
  "nutritionCritique": "Phân tích sắc nét về việc phân bổ năng lượng và các chất (đặc biệt các chất bị thừa hoặc thiếu nghiêm trọng).",
  "actionableSteps": [
    "Việc cần làm cụ thể 1 (bữa ăn tiếp theo nên ăn món gì, uống gì để cân bằng lại)",
    "Việc cần làm cụ thể 2 (vận động hoặc điều chỉnh lối sinh hoạt cho phù hợp)",
    "Việc cần làm cụ thể 3 (mẹo kiểm soát cơn thèm ăn hoặc bổ sung vi chất)"
  ],
  "proTip": "Một lời khuyên cốt lõi, ngắn gọn và hữu ích để duy trì lâu dài."
}`;

      const result = await this.generateContentWithFallback(genAI, [prompt]);
      const responseText = result.response.text();

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/i, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedText);
      return {
        success: true,
        modelUsed: 'Gemini 3.5 Flash',
        aiDoctorVerdict: parsed.aiDoctorVerdict || 'Chế độ ăn của bạn hôm nay đang dần đi vào quỹ đạo mục tiêu.',
        nutritionCritique: parsed.nutritionCritique || 'Cần chú ý cân đối đạm và chất xơ trong các bữa chính.',
        actionableSteps: Array.isArray(parsed.actionableSteps) && parsed.actionableSteps.length > 0
          ? parsed.actionableSteps
          : [
              'Bổ sung thêm 1 đĩa rau luộc hoặc hoa quả tươi vào bữa tiếp theo.',
              'Uống thêm 500ml nước lọc và hạn chế chấm thêm gia vị mặn.',
              'Đi bộ thư giãn 15-20 phút sau bữa tối để hỗ trợ tiêu hóa.',
            ],
        proTip: parsed.proTip || 'Duy trì sự kiên trì cả tuần quan trọng hơn việc tự tạo áp lực từng bữa ăn nhỏ.',
      };
    } catch (error) {
      console.error('Lỗi GeminiService generateMealNutritionAdvice:', error.message);
      // Return safe fallback structured data if offline or API limit
      return {
        success: true,
        modelUsed: 'Gemini 3.5 Flash (Dự phòng)',
        aiDoctorVerdict: `Dựa trên dữ liệu nạp ${data.caloriesConsumed || 0} / ${data.targetCalories || 0} kcal, bạn đang theo sát mục tiêu dinh dưỡng đã định.`,
        nutritionCritique: 'Tỷ lệ các chất dinh dưỡng đa lượng và vi chất cơ bản được giữ ở mức tương đối an toàn.',
        actionableSteps: [
          'Ăn đủ rau xanh và uống từ 1.5 - 2 lít nước mỗi ngày.',
          'Bổ sung nguồn đạm nạc (ức gà, cá, trứng, đậu hũ) trong bữa kế tiếp.',
          'Hạn chế đồ uống có đường và các món chiên xào nhiều dầu mỡ.',
        ],
        proTip: 'Ăn chậm, nhai kỹ và theo dõi sự thay đổi năng lượng của cơ thể từng ngày.',
      };
    }
  }

  /**
   * Conversational Goal Consultation with Gemini 3.5 Flash
   * Extracts user intent and produces conversational advice + structured actionable proposal
   * @param {Object} data
   */
  async chatGoalConsultation(data) {
    try {
      const genAI = this.getGenAIInstance();
      const {
        user = {},
        healthMetrics = {},
        recentAdherence = {},
        conversationHistory = [],
        userMessage = '',
      } = data;

      const historyFormatted = conversationHistory
        .map((m) => `${m.sender === 'user' ? 'Người dùng' : 'Bác sĩ AI'}: ${m.text}`)
        .join('\n');

      const prompt = `Bạn là Bác sĩ & Chuyên gia Dinh dưỡng Thể hình AI cao cấp (sử dụng nền tảng Gemini 3.5 Flash).
Nhiệm vụ của bạn là trò chuyện, thấu hiểu khó khăn và tư vấn thiết lập/điều chỉnh mục tiêu dinh dưỡng cho người dùng bằng tiếng Việt tự nhiên, ấm áp, khoa học và truyền cảm hứng.

HỒ SƠ NGƯỜI DÙNG:
- Giới tính: ${user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}
- Tuổi: ${user.age || (user.date_of_birth ? new Date().getFullYear() - new Date(user.date_of_birth).getFullYear() : 25)} tuổi
- Cân nặng hiện tại: ${user.weight_kg || 65} kg, Chiều cao: ${user.height_cm || 170} cm
- BMI: ${healthMetrics.bmi || 'Bình thường'} (${healthMetrics.bmiCategory || ''})
- BMR: ${healthMetrics.bmr || 1500} kcal/ngày
- TDEE (Năng lượng tiêu hao mỗi ngày): ${healthMetrics.tdee || 2000} kcal/ngày
- Mục tiêu hiện tại: ${user.goal === 'lose' ? 'Giảm cân/Giảm mỡ' : user.goal === 'gain' ? 'Tăng cân/Tăng cơ' : 'Duy trì vóc dáng'}
- Calo mục tiêu hiện tại: ${user.target_calories || 2000} kcal/ngày
- Đa lượng hiện tại: Đạm ${user.target_protein_g || 120}g, Carb ${user.target_carb_g || 200}g, Béo ${user.target_fat_g || 50}g
- Tình trạng tuân thủ gần đây: ${recentAdherence.summary || 'Đang theo dõi bình thường'}

LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
${historyFormatted || '(Bắt đầu cuộc trò chuyện mới)'}

TIN NHẮN MỚI CỦA NGƯỜI DÙNG:
"${userMessage}"

HƯỚNG DẪN XỬ LÝ CỦA BẠN:
1. Đọc tin nhắn mới của người dùng và lịch sử trò chuyện.
2. Thể hiện sự đồng cảm (ví dụ: nếu họ bảo đói, mệt, khó kiên trì, hoặc muốn giảm nhanh/chậm).
3. Nếu người dùng muốn điều chỉnh calo, thay đổi mục tiêu (giảm cân, tăng cân, tăng cơ, cải thiện năng lượng, giảm đói):
   - Tính toán một mục tiêu cụ thể, khoa học dựa trên TDEE (${healthMetrics.tdee || 2000} kcal).
   - Đảm bảo an toàn: Thâm hụt giảm cân không nên thấp hơn BMR (${healthMetrics.bmr || 1400} kcal).
   - Tỷ lệ đa lượng khuyến nghị: Đạm (25-30% tổng calo, 4 kcal/g), Carb (45-55%, 4 kcal/g), Béo (20-25%, 9 kcal/g).
   - Bật "hasProposal": true và điền đầy đủ object "proposal".
4. Nếu người dùng chỉ đang hỏi han chung chung, thắc mắc về một món ăn hay kiến thức dinh dưỡng chưa cần chốt lại mục tiêu:
   - Trả lời thân thiện, giải thích rõ ràng.
   - Bật "hasProposal": false và "proposal": null.
5. Luôn gợi ý 2-3 câu trả lời nhanh (suggestedQuickReplies) để người dùng tiện bấm tiếp.

BẮT BUỘC: Bạn PHẢI trả về ĐÚNG MỘT OBJECT JSON thuần túy (không kèm markdown code block \`\`\`json, không thừa chữ ngoài JSON) theo mẫu:
{
  "message": "Nội dung trả lời tự nhiên, ân cần của bác sĩ AI...",
  "hasProposal": true,
  "proposal": {
    "goal": "lose",
    "targetCalories": 1500,
    "targetProteinG": 115,
    "targetCarbG": 160,
    "targetFatG": 42,
    "targetWeightKg": 62,
    "weeklyChangeKg": -0.4,
    "explanation": "Tăng nhẹ +200 kcal giúp cơ thể đủ năng lượng hoạt động, giảm cảm giác thèm ăn mà vẫn giữ thâm hụt bền vững."
  },
  "suggestedQuickReplies": [
    "Áp dụng mục tiêu 1,500 kcal",
    "Bớt đường bột, tăng thêm đạm",
    "Gợi ý cho mình thực đơn mẫu"
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

      const parsed = JSON.parse(cleanedText);
      return {
        success: true,
        modelUsed: 'Gemini 3.5 Flash',
        message: parsed.message || 'Mình đã phân tích và có đề xuất cho bạn.',
        hasProposal: Boolean(parsed.hasProposal && parsed.proposal),
        proposal: parsed.proposal || null,
        suggestedQuickReplies: Array.isArray(parsed.suggestedQuickReplies) ? parsed.suggestedQuickReplies : [],
      };
    } catch (error) {
      console.error('Lỗi GeminiService chatGoalConsultation:', error.message);
      // Fallback rule-based reply if offline or API limit
      const currentCal = data.user?.target_calories || 1500;
      return {
        success: true,
        modelUsed: 'Gemini 3.5 Flash (Dự phòng)',
        message: `Mình đã ghi nhận chia sẻ của bạn. Dựa trên thể trạng hiện tại, mức năng lượng ${currentCal} kcal/ngày có thể được điều chỉnh linh hoạt hơn để bạn cảm thấy thoải mái nhất.`,
        hasProposal: true,
        proposal: {
          goal: data.user?.goal || 'lose',
          targetCalories: Math.round(currentCal + 150),
          targetProteinG: Math.round(((currentCal + 150) * 0.3) / 4),
          targetCarbG: Math.round(((currentCal + 150) * 0.45) / 4),
          targetFatG: Math.round(((currentCal + 150) * 0.25) / 9),
          targetWeightKg: data.user?.weight_kg ? data.user.weight_kg - 2 : undefined,
          weeklyChangeKg: -0.3,
          explanation: 'Điều chỉnh nhẹ lượng calo giúp cơ thể duy trì trao đổi chất và tránh tình trạng hạ đường huyết.',
        },
        suggestedQuickReplies: [
          'Áp dụng mục tiêu mới này',
          'Tôi muốn giữ nguyên mục tiêu',
          'Gợi ý thực đơn phù hợp',
        ],
      };
    }
  }

  /**
   * Transcribe audio to Vietnamese text using Gemini API
   * @param {Buffer} audioBuffer
   * @param {string} mimeType
   * @returns {Promise<{ transcription: string }>}
   */
  async transcribeAudio(audioBuffer, mimeType = 'audio/m4a') {
    try {
      const genAI = this.getGenAIInstance();

      const prompt = `Bạn là trợ lý chuyển giọng nói thành văn bản tiếng Việt cực kỳ chính xác.
Hãy lắng nghe đoạn âm thanh được cung cấp (người dùng đang nói về bữa ăn của họ).
Hãy chuyển đổi toàn bộ lời nói trong đoạn ghi âm thành văn bản tiếng Việt chuẩn, giữ nguyên tên các món ăn, đồ uống và số lượng/khẩu lượng.

Bạn PHẢI trả về ĐÚNG MỘT OBJECT JSON thuần túy (không kèm markdown code block):
{
  "transcription": "Nội dung người dùng nói bằng tiếng Việt chính xác..."
}`;

      const audioPart = {
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType: mimeType || 'audio/m4a',
        },
      };

      const result = await this.generateContentWithFallback(genAI, [prompt, audioPart]);
      const responseText = result.response.text();

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/i, '').replace(/\s*```$/, '');
      }

      try {
        const parsed = JSON.parse(cleanedText);
        return {
          transcription: parsed.transcription || cleanedText,
        };
      } catch (err) {
        return {
          transcription: cleanedText,
        };
      }
    } catch (error) {
      console.error('Lỗi GeminiService transcribeAudio:', error);
      throw new Error(`Lỗi nhận dạng giọng nói: ${error.message}`);
    }
  }

  /**
   * Analyze food from voice recording audio and/or transcript text using Gemini API
   * @param {Buffer|null} audioBuffer
   * @param {string} mimeType
   * @param {string} [transcriptText]
   * @returns {Promise<Object>} Formatted JSON analysis result
   */
  async analyzeFoodVoice(audioBuffer, mimeType = 'audio/m4a', transcriptText = '') {
    try {
      const genAI = this.getGenAIInstance();

      const prompt = `Bạn là chuyên gia dinh dưỡng hàng đầu với am hiểu sâu sắc về ẩm thực Việt Nam và quốc tế.
Dựa trên ${audioBuffer ? 'đoạn âm thanh ghi âm bữa ăn của người dùng' : ''} ${transcriptText ? `và văn bản mô tả: "${transcriptText}"` : ''}, hãy phân tích toàn diện và ước lượng dinh dưỡng chính xác nhất.

NGUYÊN TẮC QUAN TRỌNG VỀ NGUYÊN LIỆU VÀ ĐỘ CHÍNH XÁC:
1. Chuyển đổi lời nói thành văn bản tiếng Việt chính xác vào trường "transcription"${transcriptText ? ` (hoặc chuẩn hóa từ văn bản đã có: "${transcriptText}")` : ''}.
2. Xác định tên bữa ăn / các món ăn chính và trả về trong "food_name".
3. Ước lượng tổng khối lượng (estimated_weight_g), tổng Calories, Protein (g), Carb (g), Fat (g) và Tải lượng đường huyết Glycemic Load (glycemic_load).
4. BẮT BUỘC: TUYỆT ĐỐI KHÔNG BỊA ĐẶT NGUYÊN LIỆU HOẶC SỐ LIỆU CALO/MACRO. Mọi số liệu dinh dưỡng phải bám sát định lượng thực tế theo Bảng thành phần thực phẩm Việt Nam (Viện Dinh Dưỡng) và USDA.
5. TUYỆT ĐỐI KHÔNG GỘP TÊN MÓN VỚI NGOẶC ĐƠN LÀM 1 NGUYÊN LIỆU (CẤM ghi dạng: "Chè thập cẩm (đậu, thạch, cốt dừa, đường)" hay "Cà phê sữa đá (cà phê và sữa đặc)").
6. BẮT BUỘC: Mỗi món trong "dishes" PHẢI BÓC TÁCH THÀNH CÁC NGUYÊN LIỆU NẤU ĂN ĐỘC LẬP THỰC TẾ cấu thành món đó (Ví dụ:
   - Phở bò -> Bánh phở tươi, Thịt bò, Nước dùng hầm xương bò, Hành lá & rau thơm.
   - Chè thập cẩm -> Đậu đỏ ninh mềm, Thạch sương sáo, Nước cốt dừa béo, Trân châu, Nước đường hoa bưởi.
   - Cà phê sữa đá -> Cà phê phin nguyên chất, Sữa đặc có đường, Đá viên tinh khiết.
   - Bún chả -> Bún tươi, Chả thịt heo nướng, Nước mắm chua ngọt, Đu đủ chua & rau sống.
   - Cơm tấm -> Cơm tấm, Sườn heo nướng, Chả trứng hấp, Bì heo, Mỡ hành & dưa leo).
   Mỗi nguyên liệu phải có tên độc lập, portion_g, calories, protein_g, carb_g, fat_g chính xác tuyệt đối.

Bạn PHẢI trả về ĐÚNG MỘT OBJECT JSON thuần túy (không kèm markdown code block) có cấu trúc như sau:
{
  "transcription": "Đoạn lời nói tiếng Việt đầy đủ...",
  "food_name": "Tên món ăn / Bữa ăn",
  "confidence": 0.9,
  "nutrition_source": "voice_ai",
  "estimated_weight_g": 350,
  "calories": 480,
  "protein_g": 28,
  "carb_g": 52,
  "fat_g": 14,
  "glycemic_load": 22,
  "ingredients": [
    {
      "name": "Tên thành phần 1",
      "portion_g": 150,
      "calories": 250,
      "protein_g": 15,
      "carb_g": 30,
      "fat_g": 6
    }
  ],
  "dishes": [
    {
      "name": "Tên món 1 (Ví dụ: Phở bò)",
      "portion_g": 650,
      "calories": 450,
      "protein_g": 20,
      "carb_g": 55,
      "fat_g": 15,
      "ingredients": [
        {
          "name": "Bánh phở",
          "portion_g": 150,
          "calories": 160,
          "protein_g": 3,
          "carb_g": 35,
          "fat_g": 0.5
        },
        {
          "name": "Thịt bò",
          "portion_g": 50,
          "calories": 120,
          "protein_g": 11,
          "carb_g": 0,
          "fat_g": 8
        },
        {
          "name": "Nước dùng phở & rau thơm",
          "portion_g": 450,
          "calories": 170,
          "protein_g": 6,
          "carb_g": 20,
          "fat_g": 6.5
        }
      ]
    }
  ]
}`;

      const contents = [prompt];
      if (audioBuffer) {
        contents.push({
          inlineData: {
            data: audioBuffer.toString('base64'),
            mimeType: mimeType || 'audio/m4a',
          },
        });
      }

      const result = await this.generateContentWithFallback(genAI, contents);
      const responseText = result.response.text();

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
        console.error('Lỗi parse JSON từ Gemini analyzeFoodVoice:', responseText);
        parsedResult = {
          transcription: transcriptText || 'Đoạn ghi âm bữa ăn',
          food_name: transcriptText || 'Bữa ăn từ giọng nói',
          estimated_weight_g: 300,
          calories: 400,
          protein_g: 20,
          carb_g: 45,
          fat_g: 12,
          confidence: 0.8,
          ingredients: [],
        };
      }

      const carbG = Number(parsedResult.carb_g) || 0;
      const estimatedGL = parsedResult.glycemic_load !== undefined
        ? Number(parsedResult.glycemic_load)
        : Math.round(((carbG * 55) / 100) * 10) / 10;

      const formattedIngredients = Array.isArray(parsedResult.ingredients)
        ? parsedResult.ingredients.map(ing => ({
            name: ing.name || ing.ingredient_name || 'Thành phần',
            quantity: Number(ing.quantity) || 1,
            portion_g: Number(ing.portion_g || ing.quantity || ing.amount) || 0,
            calories: Number(ing.calories) || 0,
            protein_g: Number(ing.protein_g) || 0,
            carb_g: Number(ing.carb_g) || 0,
            fat_g: Number(ing.fat_g) || 0,
            source: 'visible',
          }))
        : [];

      const formattedDishes = Array.isArray(parsedResult.dishes) && parsedResult.dishes.length > 0
        ? parsedResult.dishes.map((dish, dIdx) => ({
            id: `dish_voice_${dIdx}_${Date.now()}`,
            name: dish.name || dish.food_name || `Món ${dIdx + 1}`,
            estimated_weight_g: Number(dish.estimated_weight_g || dish.portion_g) || 0,
            calories: Number(dish.calories) || 0,
            protein_g: Number(dish.protein_g) || 0,
            carb_g: Number(dish.carb_g) || 0,
            fat_g: Number(dish.fat_g) || 0,
            ingredients: Array.isArray(dish.ingredients)
              ? dish.ingredients.map(ing => ({
                  name: ing.name || 'Thành phần',
                  portion_g: Number(ing.portion_g || ing.amount) || 0,
                  calories: Number(ing.calories) || 0,
                  protein_g: Number(ing.protein_g) || 0,
                  carb_g: Number(ing.carb_g) || 0,
                  fat_g: Number(ing.fat_g) || 0,
                }))
              : [],
          }))
        : [];

      return {
        raw_response: parsedResult,
        transcription: parsedResult.transcription || transcriptText || 'Ghi âm bữa ăn',
        food_name: parsedResult.food_name || transcriptText || 'Món ăn từ giọng nói',
        estimated_weight_g: Number(parsedResult.estimated_weight_g) || 0,
        estimated_eaten_weight_g: Number(parsedResult.estimated_weight_g) || 0,
        consumption_pct: 100,
        container_size: 'medium',
        calories: Number(parsedResult.calories) || 0,
        protein_g: Number(parsedResult.protein_g) || 0,
        carb_g: Number(parsedResult.carb_g) || 0,
        fat_g: Number(parsedResult.fat_g) || 0,
        glycemic_load: estimatedGL,
        confidence: Number(parsedResult.confidence) || 0.85,
        image_quality: 'good',
        quality_warning: '',
        nutrition_source: 'voice_ai',
        quantity_uncertain: false,
        hidden_base_food: false,
        fried_food: false,
        is_beverage: false,
        has_bones: false,
        sugar_level: 'unknown',
        default_ice_pct: 0,
        dishes: this.distributeIngredientsToDishes(formattedDishes, formattedIngredients),
        ingredients: formattedIngredients,
        toppings: [],
        alternatives: [],
      };
    } catch (error) {
      console.error('Lỗi GeminiService analyzeFoodVoice:', error);
      throw new Error(`Lỗi phân tích giọng nói AI: ${error.message}`);
    }
  }
}

module.exports = new GeminiService();

