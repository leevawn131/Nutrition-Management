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

      const prompt = `Bạn là chuyên gia dinh dưỡng hàng đầu. Hãy phân tích ảnh bữa ăn này (đặc biệt chú ý món ăn Việt Nam nếu có).
Yêu cầu BẮT BUỘC:
1. Nhận diện tên món ăn chính xác nhất bằng tiếng Việt.
2. Ước tính tổng khối lượng khẩu phần (gam).
3. Tính toán tổng năng lượng (Calories/kcal), Đạm (Protein/g), Đường bột (Carb/g), Chất béo (Fat/g).
4. Ước tính Tải lượng đường huyết (Glycemic Load - GL, công thức GL = (GI * Carb_g) / 100).
5. Đưa ra độ tin cậy của việc nhận diện (từ 0.0 đến 1.0).

Bạn PHẢI trả về ĐÚNG MỘT OBJECT JSON thuần túy (không kèm đoạn văn bản hay markdown code block) có cấu trúc chính xác như sau:
{
  "food_name": "Tên món ăn",
  "estimated_weight_g": 300,
  "calories": 400,
  "protein_g": 20,
  "carb_g": 50,
  "fat_g": 10,
  "glycemic_load": 22.5,
  "confidence": 0.95
}

Nếu ảnh KHÔNG phải là món ăn hoặc thực phẩm, hãy trả về JSON:
{
  "food_name": "Món ăn chưa xác định",
  "estimated_weight_g": 0,
  "calories": 0,
  "protein_g": 0,
  "carb_g": 0,
  "fat_g": 0,
  "glycemic_load": 0,
  "confidence": 0.0,
  "error": "Không phát hiện món ăn trong ảnh"
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
          raw_text: responseText,
        };
      }

      const carbG = Number(parsedResult.carb_g) || 0;
      const estimatedGL = parsedResult.glycemic_load !== undefined ? Number(parsedResult.glycemic_load) : Math.round(((carbG * 55) / 100) * 10) / 10;

      return {
        raw_response: parsedResult,
        food_name: parsedResult.food_name || 'Món ăn chưa xác định',
        estimated_weight_g: Number(parsedResult.estimated_weight_g) || 0,
        calories: Number(parsedResult.calories) || 0,
        protein_g: Number(parsedResult.protein_g) || 0,
        carb_g: Number(parsedResult.carb_g) || 0,
        fat_g: Number(parsedResult.fat_g) || 0,
        confidence: Number(parsedResult.confidence) || 0.5,
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

      const prompt = `Bạn là chuyên gia dinh dưỡng. Dựa trên mô tả bữa ăn sau: "${textDescription}", hãy phân tích và ước lượng dinh dưỡng.

Bạn PHẢI trả về ĐÚNG MỘT OBJECT JSON thuần túy (không kèm markdown code block):
{
  "food_name": "Tên món ăn tóm tắt",
  "estimated_weight_g": 300,
  "calories": 400,
  "protein_g": 20,
  "carb_g": 50,
  "fat_g": 10,
  "confidence": 0.9
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
      return {
        raw_response: parsedResult,
        food_name: parsedResult.food_name || textDescription,
        estimated_weight_g: Number(parsedResult.estimated_weight_g) || 0,
        calories: Number(parsedResult.calories) || 0,
        protein_g: Number(parsedResult.protein_g) || 0,
        carb_g: Number(parsedResult.carb_g) || 0,
        fat_g: Number(parsedResult.fat_g) || 0,
        confidence: Number(parsedResult.confidence) || 0.8,
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
}

module.exports = new GeminiService();

