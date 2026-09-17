/**
 * Groq AI Text Service (Standardized for Chatbot)
 * Model: process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-20b'
 * Provider: Groq (https://api.groq.com/openai/v1)
 */

class GroqService {
  constructor() {
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.defaultModel = 'openai/gpt-oss-20b';
  }

  /**
   * Get configured model name from env or default
   */
  getModel() {
    return process.env.GROQ_CHAT_MODEL || this.defaultModel;
  }

  /**
   * Get Groq API key from env
   */
  getApiKey() {
    return process.env.GROQ_API_KEY || null;
  }

  async generateChatResponse(userMessage, history = [], context = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const messages = [
      {
        role: 'system',
        content: `Bạn là Tri, AI Assistant của The Nutri. Hãy trò chuyện tự nhiên bằng tiếng Việt như một trợ lý thật sự.
- Trả lời đúng câu hỏi hiện tại và dựa trên lịch sử, không lặp lại lời chào hoặc ép người dùng vào một workflow.
- Với câu hỏi dinh dưỡng/sức khỏe, giải thích ngắn gọn, thực tế, có lưu ý an toàn khi cần.
- Nếu câu hỏi có các lựa chọn rõ ràng, trả về choices tối đa 4 mục để giao diện tạo nút bấm.
- Nếu không cần lựa chọn, trả choices là [].
- Chỉ trả JSON hợp lệ theo dạng: {"reply":"...","choices":[{"label":"...","value":"..."}]}.
Ngữ cảnh hiện tại: ${JSON.stringify(context)}`,
      },
      ...history.slice(-12).map((item) => ({
        role: item.role === 'assistant' || item.sender === 'ai' ? 'assistant' : 'user',
        content: String(item.content || item.text || ''),
      })),
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages,
          temperature: 0.7,
          max_tokens: 700,
        }),
      });

      if (!response.ok) {
        console.warn(`[GroqService] conversational call failed (${response.status})`);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) return null;

      const normalized = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(normalized);
      } catch {
        const start = normalized.indexOf('{');
        const end = normalized.lastIndexOf('}');
        parsed = start >= 0 && end > start ? JSON.parse(normalized.slice(start, end + 1)) : null;
      }

      const reply = parsed?.reply || content;
      const choices = Array.isArray(parsed?.choices)
        ? parsed.choices
            .filter((choice) => choice?.label && choice?.value)
            .slice(0, 4)
            .map((choice) => ({ label: String(choice.label), value: String(choice.value) }))
        : [];

      return { reply: String(reply).trim(), choices };
    } catch (error) {
      console.warn('[GroqService] conversational response failed:', error.message);
      return null;
    }
  }

  /**
   * Resolve user natural language input into structured intent and parameters.
   * Uses Groq GPT-OSS 20B with JSON Object output.
   *
   * @param {string} userMessage - Natural language input from user
   * @param {Object} context - Compact conversation context { current_flow, current_step, user_profile }
   * @returns {Promise<Object>} Structured intent & parameters
   */
  async resolveIntentAndParameters(userMessage, context = {}) {
    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return this.getFallbackResolution('', context);
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      // Safe fallback when key is not yet configured in environment
      return this.getFallbackResolution(userMessage, context);
    }

    // Token optimization: send only essential context tokens
    const compactContext = {
      flow: context.current_flow || 'general',
      step: context.current_step || 'entry',
      user: context.user_profile
        ? {
            gender: context.user_profile.gender,
            goal: context.user_profile.goal,
            target_cal: context.user_profile.target_calories,
          }
        : null,
    };

    const systemPrompt = `Bạn là bộ xử lý phân tích ý định (Intent & Parameter Parser) cho chatbot dinh dưỡng và thể chất.
Nhiệm vụ của bạn là đọc tin nhắn người dùng và ngữ cảnh hội thoại, sau đó trích xuất ý định và tham số dưới dạng JSON DUY NHẤT theo schema sau:

{
  "intent": "search_recipe" | "meal_planning" | "set_goal" | "exercise_guide" | "general_qa" | "unknown",
  "target_flow": "recipe" | "meal_plan" | "goal" | "exercise" | "general",
  "parameters": {
    "meal_type": "breakfast" | "lunch" | "dinner" | "snack" | null,
    "high_protein": boolean | null,
    "low_calorie": boolean | null,
    "low_carb": boolean | null,
    "vegetarian": boolean | null,
    "keyword": string | null,
    "days_count": number | null,
    "meals_per_day": number | null
  },
  "natural_response": string | null
}

Quy tắc quan trọng:
1. Nếu người dùng đang ở trong flow 'recipe' (flow = "recipe") và nói về bữa ăn hoặc món ăn (ví dụ "bữa trưa", "món gà"), target_flow PHẢI LÀ "recipe" và intent là "search_recipe" (không được đổi sang meal_plan).
2. "natural_response": chỉ cung cấp câu trả lời ngắn gọn (1-2 câu) khi intent là "general_qa" hoặc câu chào hỏi thân thiện. Các trường hợp khác để null để backend hiển thị thẻ UI tương ứng.
3. parameters.keyword: từ khóa món ăn cụ thể nếu có (ví dụ "gà", "trứng", "yến mạch", "bò"), tối đa 30 ký tự.
4. Chỉ trả về JSON hợp lệ, không bọc trong markdown code block, không thêm văn bản giải thích.`;

    const userPrompt = `Ngữ cảnh hiện tại: ${JSON.stringify(compactContext)}
Tin nhắn người dùng: "${userMessage.trim()}"`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[GroqService] API call failed (${response.status}): ${errText}`);
        return this.getFallbackResolution(userMessage, context);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content?.trim();
      if (!rawContent) {
        return this.getFallbackResolution(userMessage, context);
      }

      const parsed = JSON.parse(rawContent);
      return this.validateAndNormalizeOutput(parsed, userMessage, context);
    } catch (error) {
      console.warn('[GroqService] Error in resolveIntentAndParameters, falling back safely:', error.message);
      return this.getFallbackResolution(userMessage, context);
    }
  }

  /**
   * Validate and sanitize structured output from LLM
   */
  validateAndNormalizeOutput(parsed, userMessage, context) {
    const validIntents = ['search_recipe', 'meal_planning', 'set_goal', 'exercise_guide', 'general_qa', 'unknown'];
    const validFlows = ['recipe', 'meal_plan', 'goal', 'exercise', 'general'];
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    let intent = typeof parsed.intent === 'string' && validIntents.includes(parsed.intent) ? parsed.intent : 'unknown';
    let target_flow = typeof parsed.target_flow === 'string' && validFlows.includes(parsed.target_flow) ? parsed.target_flow : 'general';

    // State priority rule: If currently in recipe flow and user is refining meal_type
    if (context.current_flow === 'recipe' && intent !== 'unknown') {
      target_flow = 'recipe';
      intent = 'search_recipe';
    }

    const rawParams = parsed.parameters || {};
    const meal_type = validMealTypes.includes(rawParams.meal_type) ? rawParams.meal_type : null;
    const high_protein = typeof rawParams.high_protein === 'boolean' ? rawParams.high_protein : null;
    const low_calorie = typeof rawParams.low_calorie === 'boolean' ? rawParams.low_calorie : null;
    const low_carb = typeof rawParams.low_carb === 'boolean' ? rawParams.low_carb : null;
    const vegetarian = typeof rawParams.vegetarian === 'boolean' ? rawParams.vegetarian : null;

    let keyword = null;
    if (typeof rawParams.keyword === 'string' && rawParams.keyword.trim().length > 0) {
      keyword = rawParams.keyword.trim().slice(0, 50);
    }

    let days_count = null;
    if (typeof rawParams.days_count === 'number' && rawParams.days_count > 0 && rawParams.days_count <= 14) {
      days_count = Math.round(rawParams.days_count);
    }

    let meals_per_day = null;
    if (typeof rawParams.meals_per_day === 'number' && rawParams.meals_per_day >= 2 && rawParams.meals_per_day <= 5) {
      meals_per_day = Math.round(rawParams.meals_per_day);
    }

    return {
      intent,
      target_flow,
      parameters: {
        meal_type,
        high_protein,
        low_calorie,
        low_carb,
        vegetarian,
        keyword,
        days_count,
        meals_per_day,
      },
      natural_response: typeof parsed.natural_response === 'string' ? parsed.natural_response.trim() : null,
      is_fallback: false,
    };
  }

  /**
   * Deterministic rule-based fallback when Groq API is offline or key is missing.
   * Ensures the chatbot never crashes.
   */
  getFallbackResolution(userMessage, context = {}) {
    const text = (userMessage || '').toLowerCase().trim();
    const currentFlow = context.current_flow || 'general';

    // 1. Recipe indicators
    const isRecipeKeyword =
      text.includes('công thức') ||
      text.includes('món') ||
      text.includes('nấu') ||
      text.includes('ăn gì') ||
      text.includes('bữa tối') ||
      text.includes('bữa trưa') ||
      text.includes('bữa sáng') ||
      text.includes('recipe');

    // 2. Meal Plan indicators
    const isMealPlanKeyword =
      text.includes('thực đơn') ||
      text.includes('kế hoạch bữa ăn') ||
      text.includes('lên thực đơn') ||
      text.includes('meal plan');

    // 3. Goal indicators
    const isGoalKeyword =
      text.includes('mục tiêu') ||
      text.includes('tính calo') ||
      text.includes('bmr') ||
      text.includes('tdee') ||
      text.includes('macro');

    // 4. Exercise indicators
    const isExerciseKeyword =
      text.includes('luyện tập') ||
      text.includes('tập luyện') ||
      text.includes('vận động') ||
      text.includes('bài tập') ||
      text.includes('workout');

    let intent = 'unknown';
    let target_flow = currentFlow;

    // State priority rule
    if (currentFlow === 'recipe') {
      intent = 'search_recipe';
      target_flow = 'recipe';
    } else if (currentFlow === 'meal_plan') {
      intent = 'meal_planning';
      target_flow = 'meal_plan';
    } else if (isRecipeKeyword) {
      intent = 'search_recipe';
      target_flow = 'recipe';
    } else if (isMealPlanKeyword) {
      intent = 'meal_planning';
      target_flow = 'meal_plan';
    } else if (isGoalKeyword) {
      intent = 'set_goal';
      target_flow = 'goal';
    } else if (isExerciseKeyword) {
      intent = 'exercise_guide';
      target_flow = 'exercise';
    } else if (text.length > 5 && (text.includes('không') || text.includes('sao') || text.includes('gì'))) {
      intent = 'general_qa';
      target_flow = 'general';
    }

    // Extract basic parameters
    let meal_type = null;
    if (text.includes('sáng') || text.includes('breakfast')) meal_type = 'breakfast';
    else if (text.includes('trưa') || text.includes('lunch')) meal_type = 'lunch';
    else if (text.includes('tối') || text.includes('dinner')) meal_type = 'dinner';
    else if (text.includes('phụ') || text.includes('snack')) meal_type = 'snack';

    const high_protein = text.includes('đạm') || text.includes('protein');
    const low_calorie = text.includes('ít calo') || text.includes('giảm cân') || text.includes('low cal');
    const low_carb = text.includes('ít tinh bột') || text.includes('low carb') || text.includes('keto');
    const vegetarian = text.includes('chay') || text.includes('vegetarian');

    let days_count = null;
    if (text.includes('3 ngày')) days_count = 3;
    else if (text.includes('7 ngày') || text.includes('1 tuần')) days_count = 7;

    return {
      intent,
      target_flow,
      parameters: {
        meal_type,
        high_protein: high_protein ? true : null,
        low_calorie: low_calorie ? true : null,
        low_carb: low_carb ? true : null,
        vegetarian: vegetarian ? true : null,
        keyword: null,
        days_count,
        meals_per_day: null,
      },
      natural_response: null,
      is_fallback: true,
    };
  }

  /**
   * Legacy & Free-form Q&A support using Groq GPT-OSS 20B
   */
  async getNutritionAdvice(userProfile = {}, userPlan = {}, question) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return 'Trợ lý dinh dưỡng AI hiện chưa được cấu hình GROQ_API_KEY trong file .env. Vui lòng cấu hình để kích hoạt phản hồi thông minh từ Groq GPT-OSS 20B.';
    }

    const systemPrompt = `Bạn là chuyên gia dinh dưỡng giàu kinh nghiệm và tận tâm. Hãy đưa ra lời khuyên ngắn gọn, khoa học, an toàn dựa trên hồ sơ người dùng sau:
- Tuổi: ${userProfile.age || 'Không rõ'}
- Giới tính: ${userProfile.gender || 'Không rõ'}
- Chiều cao: ${userProfile.height_cm || userProfile.height || 'Không rõ'} cm
- Cân nặng: ${userProfile.weight_kg || userProfile.weight || 'Không rõ'} kg
- Mục tiêu: ${userProfile.goal || 'Không rõ'}
- Mức độ hoạt động: ${userProfile.activity_level || userProfile.activityLevel || 'Không rõ'}
- Calo mục tiêu: ${userProfile.target_calories || userPlan.dailyCalories || 2000} kcal

Hãy trả lời trực tiếp, rõ ràng bằng tiếng Việt, tránh lan man.`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
          temperature: 0.6,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[GroqService] Error in getNutritionAdvice (${response.status}): ${errText}`);
        return 'Hiện tại kết nối tới Groq AI đang gián đoạn. Bạn vui lòng thử lại sau giây lát nhé!';
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'Không nhận được câu trả lời từ AI.';
    } catch (error) {
      console.error('[GroqService] Error in getNutritionAdvice:', error);
      return `Có lỗi xảy ra khi kết nối với Groq AI: ${error.message}`;
    }
  }
}

module.exports = new GroqService();
