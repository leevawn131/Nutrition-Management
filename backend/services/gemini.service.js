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
}

module.exports = new GeminiService();
