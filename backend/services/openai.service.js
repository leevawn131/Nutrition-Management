let OpenAI;
try {
  OpenAI = require('openai');
} catch (e) {
  OpenAI = null;
}

// Cấu hình Groq API (OpenAI-compatible) hoặc OpenAI
const getClient = () => {
  if (!OpenAI) return null;
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined,
  });
};

async function getNutritionAdvice(userProfile = {}, userPlan = {}, question) {
  try {
    const client = getClient();
    if (!client) {
      // Fallback nếu chưa cài package openai hoặc chưa cấu hình key
      return 'Trợ lý dinh dưỡng AI hiện chưa được cấu hình API Key (GROQ_API_KEY hoặc OPENAI_API_KEY). Vui lòng cấu hình trong file .env';
    }

    const systemPrompt = `Bạn là chuyên gia dinh dưỡng giàu kinh nghiệm. Hãy tư vấn dựa trên thông tin người dùng sau:
- Tuổi: ${userProfile.age || 'Không rõ'}
- Giới tính: ${userProfile.gender || 'Không rõ'}
- Chiều cao: ${userProfile.height_cm || userProfile.height || 'Không rõ'} cm
- Cân nặng: ${userProfile.weight_kg || userProfile.weight || 'Không rõ'} kg
- Mục tiêu: ${userProfile.goal || 'Không rõ'}
- Mức độ hoạt động: ${userProfile.activity_level || userProfile.activityLevel || 'Không rõ'}
- Calo mục tiêu: ${userProfile.target_calories || userPlan.dailyCalories || 2000} kcal

Hãy trả lời câu hỏi của người dùng một cách chi tiết, đưa ra lời khuyên an toàn, khoa học và hữu ích.`;

    const model = process.env.GROQ_API_KEY ? 'llama-3.1-8b-instant' : 'gpt-3.5-turbo';

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content?.trim() || 'Không nhận được câu trả lời từ AI.';
  } catch (error) {
    console.error('Chatbot AI error:', error);
    return `Có lỗi xảy ra khi kết nối với AI: ${error.message}`;
  }
}

module.exports = { getNutritionAdvice };
