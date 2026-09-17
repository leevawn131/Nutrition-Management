const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getStandardDishRecipe, expandCompoundIngredient } = require('./standardRecipes');

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
    const userModel = process.env.GEMINI_MODEL;
    const defaultModels = [
      'gemini-2.5-flash',
      'gemini-3.6-flash',
      'gemini-1.5-flash',
    ];
    const modelsToTry = Array.from(new Set([userModel, ...defaultModels])).filter(Boolean);

    let lastError = null;
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(contents);
        return result;
      } catch (err) {
        lastError = err;
        console.warn(`Thử model ${modelName} thất bại:`, err.message);
      }
    }

    throw new Error(`Tất cả model Gemini đều thất bại: ${lastError ? lastError.message : 'Unknown error'}`);
  }

  /**
   * Distribute flat ingredients list into dishes when Gemini leaves dish.ingredients empty
   * Uses authentic culinary standard recipes from National Institute of Nutrition & USDA
   * @param {Array} dishes
   * @param {Array} allIngredients
   * @returns {Array} dishes with enriched authentic ingredients
   */
  distributeIngredientsToDishes(dishes, allIngredients) {
    if (!Array.isArray(dishes) || dishes.length === 0) return [];

    // Step 1: Expand any compound parenthetical strings in allIngredients
    const expandedAllIngredients = [];
    (allIngredients || []).forEach(ing => {
      const expanded = expandCompoundIngredient(ing.name, ing.portion_g || 100);
      if (expanded && expanded.length > 0) {
        expandedAllIngredients.push(...expanded);
      } else {
        expandedAllIngredients.push(ing);
      }
    });

    // Step 2: Clone dishes and expand any compound ingredients inside dishes
    const resultDishes = dishes.map(d => {
      const currentIngs = Array.isArray(d.ingredients) ? [...d.ingredients] : [];
      const expandedIngs = [];
      currentIngs.forEach(ing => {
        const expanded = expandCompoundIngredient(ing.name, ing.portion_g || 100);
        if (expanded && expanded.length > 0) {
          expandedIngs.push(...expanded);
        } else {
          expandedIngs.push(ing);
        }
      });
      return {
        ...d,
        ingredients: expandedIngs,
      };
    });

    // If only 1 dish and it has no ingredients, take all expanded ingredients
    if (resultDishes.length === 1 && resultDishes[0].ingredients.length === 0) {
      resultDishes[0].ingredients = [...expandedAllIngredients];
    } else if (resultDishes.length > 1) {
      const normalize = s =>
        (s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ')
          .trim();

      const unassignedIngs = [];

      expandedAllIngredients.forEach(ing => {
        const alreadyInDish = resultDishes.some(d =>
          d.ingredients.some(existing => (existing.name || '').toLowerCase() === (ing.name || '').toLowerCase())
        );
        if (alreadyInDish) return;

        const normIng = normalize(ing.name);
        let bestIdx = -1;
        let bestScore = 0;

        resultDishes.forEach((dish, dIdx) => {
          const normDish = normalize(dish.name);
          const dishWords = normDish.split(/\s+/).filter(w => w.length > 1);
          const ingWords = normIng.split(/\s+/).filter(w => w.length > 1);

          let score = 0;
          if (normIng.includes(normDish) || normDish.includes(normIng)) score += 10;
          dishWords.forEach(dw => {
            if (normIng.includes(dw)) score += 3;
          });
          ingWords.forEach(iw => {
            if (normDish.includes(iw)) score += 3;
          });

          if (score > bestScore) {
            bestScore = score;
            bestIdx = dIdx;
          }
        });

        if (bestScore > 0 && bestIdx >= 0) {
          resultDishes[bestIdx].ingredients.push(ing);
        } else {
          unassignedIngs.push(ing);
        }
      });

      resultDishes.forEach(d => {
        if (d.ingredients.length === 0 && unassignedIngs.length > 0) {
          d.ingredients.push(unassignedIngs.shift());
        }
      });
    }

    // Step 3: For dishes that have 0 ingredients or only generic single-dish-name ingredient,
    // look up the authentic culinary standard recipe
    return resultDishes.map(dish => {
      const weightG = dish.estimated_weight_g || dish.portion_g || 150;
      const hasGenericOnly = dish.ingredients.length === 1 && (
        dish.ingredients[0].name.includes('(Phần chính)') ||
        dish.ingredients[0].name.toLowerCase().trim() === dish.name.toLowerCase().trim()
      );

      if (dish.ingredients.length === 0 || hasGenericOnly) {
        const standardRecipe = getStandardDishRecipe(dish.name, weightG);
        if (standardRecipe && standardRecipe.length > 0) {
          return {
            ...dish,
            ingredients: standardRecipe,
          };
        }
      }

      // If still 0 ingredients and no standard recipe, create clean authentic primary ingredient (NO fake labels)
      if (dish.ingredients.length === 0) {
        return {
          ...dish,
          ingredients: [
            {
              name: dish.name,
              portion_g: weightG,
              calories: dish.calories || 0,
              protein_g: dish.protein_g || 0,
              carb_g: dish.carb_g || 0,
              fat_g: dish.fat_g || 0,
              source: 'visible',
            },
          ],
        };
      }
      return dish;
    });
  }

  /**
   * Analyze food image(s) using Gemini API
   * @param {Buffer|Array<{buffer: Buffer, mimeType: string}>} imageInput - Single image buffer or array of image objects
   * @param {string} [mimeType='image/jpeg'] - Image mime type
   * @param {string} [descriptionText=''] - Optional text description from user
   * @returns {Promise<Object>} Formatted JSON analysis result
   */
  async analyzeFoodImage(imageInput, mimeType = 'image/jpeg', descriptionText = '') {
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
18. Phân tích nhiều ảnh: Nếu người dùng tải lên nhiều ảnh (ví dụ: ảnh các món khác nhau trong cùng bữa ăn, ảnh chụp góc khác, ảnh đồ uống đi kèm), hãy xem xét TẤT CẢ các ảnh đó, tổng hợp toàn bộ các món ăn xuất hiện trên tất cả các ảnh thành một bữa ăn thống nhất, bóc tách chi tiết từng món vào "dishes" và "ingredients", cộng dồn tổng Calo, Protein, Carb, Fat chính xác.
19. TUYỆT ĐỐI KHÔNG BỊA ĐẶT NGUYÊN LIỆU VÀ SỐ LIỆU: Mọi số liệu dinh dưỡng phải bám sát định lượng thực tế theo Bảng thành phần thực phẩm Việt Nam (Viện Dinh Dưỡng) và USDA.
20. TUYỆT ĐỐI KHÔNG GỘP TÊN MÓN VỚI NGOẶC ĐƠN LÀM 1 NGUYÊN LIỆU: CẤM ghi dạng "Chè thập cẩm (đậu, thạch, cốt dừa)". Bắt buộc bóc tách từng món trong "dishes" thành các nguyên liệu nấu ăn độc lập có tên riêng, portion_g, calories, protein_g, carb_g, fat_g chính xác.

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
  "dishes": [
    {
      "name": "Tên món 1 (Ví dụ: Phở bò)",
      "estimated_weight_g": 650,
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
          "fat_g": 0.5,
          "source": "visible"
        },
        {
          "name": "Thịt bò",
          "portion_g": 50,
          "calories": 120,
          "protein_g": 11,
          "carb_g": 0,
          "fat_g": 8,
          "source": "visible"
        },
        {
          "name": "Nước dùng phở & rau thơm",
          "portion_g": 450,
          "calories": 170,
          "protein_g": 6,
          "carb_g": 20,
          "fat_g": 6.5,
          "source": "inferred"
        }
      ]
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

      let imageParts = [];
      if (Array.isArray(imageInput)) {
        imageParts = imageInput.map((item) => ({
          inlineData: {
            data: (item.buffer || item).toString('base64'),
            mimeType: item.mimeType || mimeType || 'image/jpeg',
          },
        }));
      } else {
        imageParts = [
          {
            inlineData: {
              data: imageInput.toString('base64'),
              mimeType: mimeType || 'image/jpeg',
            },
          },
        ];
      }

      let finalPrompt = prompt;
      if (descriptionText && descriptionText.trim()) {
        finalPrompt += `\n\nLƯU Ý THÊM TỪ NGƯỜI DÙNG: "${descriptionText.trim()}". Hãy ưu tiên thông tin này khi ước tính khẩu phần và tên món.`;
      }
      if (imageParts.length > 1) {
        finalPrompt += `\n\nLƯU Ý VỀ NHIỀU ẢNH: Người dùng đã tải lên ${imageParts.length} ảnh khác nhau về bữa ăn của họ (các đĩa khác nhau, góc chụp khác nhau hoặc đồ uống đi kèm). Hãy quan sát TẤT CẢ các ảnh, bóc tách từng món ăn vào "dishes" và "ingredients", và tính tổng dinh dưỡng cho toàn bộ bữa ăn.`;
      }

      const result = await this.generateContentWithFallback(genAI, [finalPrompt, ...imageParts]);
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
        dishes: this.distributeIngredientsToDishes(formattedDishes, formattedIngredients),
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
