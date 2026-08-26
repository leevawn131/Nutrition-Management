const OpenAI = require('openai');

// Cấu hình Groq API (OpenAI-compatible)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

async function getNutritionAdvice(userProfile, userPlan, question) {
  try {
    const systemPrompt = `Bạn là chuyên gia dinh dưỡng giàu kinh nghiệm. Hãy tư vấn dựa trên thông tin người dùng sau:
- Tuổi: ${userProfile.age || 'Không rõ'}
- Giới tính: ${userProfile.gender || 'Không rõ'}
- Chiều cao: ${userProfile.height ? userProfile.height + ' cm' : 'Không rõ'}
- Cân nặng: ${userProfile.weight ? userProfile.weight + ' kg' : 'Không rõ'}
- Mục tiêu: ${userProfile.goal || 'Không rõ'}
- Sở thích ăn uống: ${userProfile.dietaryPreferences?.join(', ') || 'Không có'}
- Dị ứng: ${userProfile.allergies?.join(', ') || 'Không có'}
- Mức độ hoạt động: ${userProfile.activityLevel || 'Không rõ'}
- Kế hoạch calories hàng ngày: ${userPlan.dailyCalories || 2000} kcal
- Tỷ lệ macro: Protein ${userPlan.macroSplit?.protein || 25}%, Carbs ${userPlan.macroSplit?.carbs || 50}%, Fat ${userPlan.macroSplit?.fat || 25}%

Hãy trả lời câu hỏi của người dùng một cách chi tiết, bao gồm gợi ý món ăn, công thức nấu ăn (nếu phù hợp) và thông tin dinh dưỡng. Đưa ra lời khuyên an toàn, khoa học.`;

    const response = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant', // hoặc 'llama-3.1-8b-instant' nếu muốn nhanh
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Groq API error:', error);
    return `Có lỗi xảy ra khi kết nối với Groq AI: ${error.message}`;
  }
}

module.exports = { getNutritionAdvice };