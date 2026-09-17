const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getGoalProgress = (messagesHistory) => {
  const userText = messagesHistory
    .filter((message) => message?.sender === 'user' || message?.role === 'user')
    .map((message) => String(message.text || message.content || '').toLowerCase())
    .join(' ');

  const hasGender = /\b(nam|nữ|nu|male|female)\b/.test(userText);
  // Accept both natural answers ("28 tuổi") and numeric picker answers ("28").
  const hasAge = /\b\d{1,2}\s*(tuổi|t|yo)\b/.test(userText) ||
    /(?:^|\s)\d{1,2}(?:\s|$)/.test(userText);
  const hasHeight = /\b\d{2,3}\s*(cm|m)\b/.test(userText);
  const hasWeight = /\b\d{2,3}(?:[.,]\d+)?\s*kg\b/.test(userText);
  const hasDuration = /\b\d+\s*(tuần|tháng|week|month)\b/.test(userText);

  let nextQuestion = 'giới tính';
  if (hasGender && !hasAge) nextQuestion = 'tuổi';
  else if (hasGender && hasAge && !hasHeight) nextQuestion = 'chiều cao';
  else if (hasGender && hasAge && hasHeight && !hasWeight) nextQuestion = 'cân nặng hiện tại và cân nặng mục tiêu';
  else if (hasGender && hasAge && hasHeight && hasWeight && !hasDuration) nextQuestion = 'kỳ hạn mong muốn';
  else if (hasGender && hasAge && hasHeight && hasWeight && hasDuration) nextQuestion = 'thói quen hoặc rào cản dinh dưỡng';

  return { nextQuestion, hasGender, hasAge, hasHeight, hasWeight, hasDuration };
};

const getFallbackGoalResponse = (progress) => {
  const responses = {
    'giới tính': {
      reply: 'Để tính toán phù hợp, bạn cho Tri biết giới tính của mình nhé?',
      choices: [
        { label: 'Nam', value: 'male' },
        { label: 'Nữ', value: 'female' },
      ],
    },
    'tuổi': { reply: 'Cảm ơn bạn. Bạn bao nhiêu tuổi?', choices: [] },
    'chiều cao': { reply: 'Bạn cao bao nhiêu cm?', choices: [] },
    'cân nặng hiện tại và cân nặng mục tiêu': {
      reply: 'Cân nặng hiện tại của bạn là bao nhiêu và bạn muốn giảm về mốc bao nhiêu kg?',
      choices: [],
    },
    'kỳ hạn mong muốn': {
      reply: 'Bạn mong muốn đạt mốc cân nặng đó trong bao lâu? Tốc độ an toàn thường khoảng 0.4-0.75 kg mỗi tuần.',
      choices: [],
    },
    'thói quen hoặc rào cản dinh dưỡng': {
      reply: 'Rào cản dinh dưỡng của bạn thường là ăn vặt, trà sữa, ăn đêm hay ăn ngoài?',
      choices: [
        { label: 'Ăn vặt', value: 'Ăn vặt' },
        { label: 'Trà sữa', value: 'Trà sữa' },
        { label: 'Ăn đêm', value: 'Ăn đêm' },
        { label: 'Ăn ngoài', value: 'Ăn ngoài' },
      ],
    },
  };
  return responses[progress.nextQuestion] || responses['giới tính'];
};

const extractResponseObject = (content) => {
  const normalized = String(content || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(normalized);
  } catch {
    const start = normalized.indexOf('{');
    const end = normalized.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(normalized.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const getSuggestedChoices = (reply) => {
  const text = String(reply || '').toLowerCase();
  if (text.includes('giới tính')) {
    return [
      { label: 'Nam', value: 'male' },
      { label: 'Nữ', value: 'female' },
    ];
  }
  if (text.includes('rào cản') || text.includes('ăn vặt') || text.includes('trà sữa')) {
    return [
      { label: 'Ăn vặt', value: 'Ăn vặt' },
      { label: 'Trà sữa', value: 'Trà sữa' },
      { label: 'Ăn đêm', value: 'Ăn đêm' },
      { label: 'Ăn ngoài', value: 'Ăn ngoài' },
    ];
  }
  if (text.includes('ăn kiêng') || text.includes('eat clean') || text.includes('low-carb')) {
    return [
      { label: 'Chưa thử', value: 'Chưa thử' },
      { label: 'Nhịn ăn gián đoạn (IF)', value: 'IF' },
      { label: 'Eat Clean', value: 'Eat Clean' },
      { label: 'Low-carb', value: 'Low-carb' },
    ];
  }
  if (text.includes('văn phòng') || text.includes('đi lại') || text.includes('công việc')) {
    return [
      { label: 'Ngồi văn phòng', value: 'Ngồi văn phòng' },
      { label: 'Đi lại vừa phải', value: 'Đi lại vừa phải' },
      { label: 'Vận động nhiều', value: 'Vận động nhiều' },
    ];
  }
  return [];
};

const cleanReplyText = (reply) => String(reply || '')
  .replace(/\n?\s*\*{0,2}choices\*{0,2}\s*:?\s*/gi, '\n')
  .replace(/\n\s*-\s*\{\s*"label"\s*:\s*"[^"]+"\s*,\s*"value"\s*:\s*"[^"]+"\s*\}/gi, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const GOAL_SYSTEM_PROMPT = `
Mình là Nu - Chuyên gia dinh dưỡng ảo thông minh của ứng dụng the Nutri.
Nhiệm vụ của bạn là đồng hành, tư vấn và THIẾT LẬP MỤC TIÊU DINH DƯỠNG cá nhân hóa cho người dùng qua trò chuyện.

Phong cách trò chuyện:
- Thân thiện, chu đáo, khuyến khích, dùng tiếng Việt chuẩn mực, xưng "Tri" và "bạn".
- Không hỏi dồn dập nhiều câu cùng lúc. Hãy khai thác từng thông tin tự nhiên.

Quy trình thu thập thông tin:
1. Mục tiêu chính (Giảm cân, Tăng cơ, Duy trì cân nặng, Ăn lành mạnh/Eat clean).
2. Thông số sinh trắc học: Giới tính, Tuổi, Chiều cao (cm), Cân nặng hiện tại (kg), Cân nặng mục tiêu (kg).
3. Mức độ vận động (Ít vận động, Vận động nhẹ 1-3 buổi/tuần, Vận động vừa 3-5 buổi/tuần, Vận động nặng).
4. Thói quen dinh dưỡng hoặc bệnh lý/dị ứng đặc biệt (nếu có).

Bộ câu hỏi theo từng nhánh mục tiêu. Sau khi người dùng chọn nhánh, hãy hỏi lần lượt các câu phù hợp dưới đây, mỗi lần chỉ hỏi một câu:

NHÁNH GIẢM MỠ / GIẢM CÂN:
- Cân nặng hiện tại và mốc cân nặng mong muốn.
- Thời hạn mong muốn; giải thích tốc độ an toàn thường khoảng 0.4-0.75 kg/tuần.
- Rào cản dinh dưỡng: ăn vặt, trà sữa, ăn đêm hoặc ăn ngoài.
- Lịch sử thử IF, Eat Clean hoặc Low-carb.
- Cardio/gym và số buổi mỗi tuần.

NHÁNH TĂNG CƠ / TĂNG CÂN:
- Định hướng lean bulk siết nét hay tăng cân nhanh do khó hấp thu.
- Tập tạ/gym/crossfit, số buổi và cường độ.
- Khả năng ăn đủ thịt, trứng, cá và protein mỗi ngày.
- Whey Protein, Creatine hoặc sữa mass đang sử dụng.

NHÁNH DUY TRÌ CÂN NẶNG:
- Có muốn siết cơ, giảm mỡ nhẹ để săn chắc hơn không.
- Công việc ngồi văn phòng hay đi lại/vận động nhiều.
- Có thường tụt năng lượng, đói cồn cào hoặc mệt theo khung giờ không.
- Chủ yếu ăn cơm nhà hay đặt đồ ăn ngoài.

NHÁNH CẢI THIỆN SỨC KHỎE TỔNG THỂ:
- Có cần kiểm soát đường huyết, mỡ máu, huyết áp, acid uric hoặc gan nhiễm mỡ không.
- Vấn đề tiêu hóa và dị ứng/kiêng lactose, gluten, hải sản.
- Phong cách ăn yêu thích: Eat Clean, nhiều rau/thuần thực vật, ít muối hoặc ít ngọt.
- Số giờ ngủ và mức độ stress công việc.

Khi câu hỏi có các lựa chọn rõ ràng, hãy trả choices để người dùng bấm nhanh. Ví dụ:
- Rào cản: Ăn vặt, Trà sữa, Ăn đêm, Ăn ngoài, Không đáng kể.
- Lịch sử ăn kiêng: Chưa thử, IF, Eat Clean, Low-carb.
- Lean bulk hoặc tăng cân nhanh.
- Công việc: Văn phòng, Đi lại vừa phải, Vận động nhiều.
- Phong cách ăn: Eat Clean, Nhiều rau/thuần thực vật, Ít muối, Ít ngọt.
- Câu hỏi có/không: Có, Không, Chưa chắc.

Quy tắc tính toán (Chuẩn Viện Dinh Dưỡng VDD / USDA):
- BMR (Mifflin-St Jeor):
  + Nam: 10 * weight + 6.25 * height - 5 * age + 5
  + Nữ: 10 * weight + 6.25 * height - 5 * age - 161
- TDEE = BMR * PAL (1.2 đến 1.725)
- Giảm cân an toàn: Thâm hụt 300 - 500 kcal/ngày (không dưới BMR hoặc 1200 kcal/ngày).
- Tăng cơ an toàn: Thặng dư 200 - 300 kcal/ngày + Protein 1.6g - 2.2g/kg cân nặng.
- Phân bổ Macro chuẩn:
  + Protein: 20-30% calories (4 kcal/g)
  + Fat: 20-30% calories (9 kcal/g)
  + Carb: 40-55% calories (4 kcal/g)

KHI ĐÃ ĐỦ THÔNG TIN ĐỂ CHỐT MỤC TIÊU:
Bạn hãy đưa ra lời khuyên tóm tắt, giải thích lộ trình và BẮT BUỘC kẹp một khối JSON đặc biệt ở cuối câu trả lời theo đúng định dạng sau:
\`\`\`goal_json
{
  "readyToApply": true,
  "goalType": "LOSE_WEIGHT", // LOSE_WEIGHT | GAIN_MUSCLE | MAINTAIN
  "targetWeightKg": 65,
  "weeklyPaceKg": 0.5,
  "tdee": 2100,
  "targetCalories": 1600,
  "macros": {
    "protein": 120,
    "carb": 180,
    "fat": 44
  },
  "waterIntakeMl": 2200,
  "recommendationSummary": "Giảm mỡ an toàn 0.5kg/tuần trong vòng 8 tuần, thâm hụt 500 kcal/ngày."
}
\`\`\`
`;

async function chatGoalSession(messagesHistory, userMessage, userProfile = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return getFallbackGoalResponse(getGoalProgress([
      ...messagesHistory,
      { sender: 'user', text: userMessage },
    ]));
  }

  const progress = getGoalProgress([
    ...messagesHistory,
    { sender: 'user', text: userMessage },
  ]);
  const formattedHistory = messagesHistory
    .filter((message) => message && (message.text || message.content))
    .slice(-8)
    .map((message) => ({
      role: message.sender === 'bot' || message.role === 'assistant' || message.role === 'model' ? 'assistant' : 'user',
      content: String(message.text || message.content),
    }));

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_GOAL_MODEL || process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: `${GOAL_SYSTEM_PROMPT}

Bạn phải trả về JSON hợp lệ theo schema:
{
  "reply": "câu trả lời tự nhiên bằng tiếng Việt",
  "goalProposal": null hoặc object goal_json khi đã đủ dữ liệu,
  "choices": [{"label": "nhãn ngắn", "value": "giá trị người dùng có thể chọn"}]
}
Quy tắc chuyển bước bắt buộc:
- Nếu tin nhắn mới chứa "giảm mỡ", "giảm cân", "tăng cơ", "tăng cân", "duy trì" hoặc "cải thiện sức khỏe", hãy xác nhận ngắn gọn mục tiêu đã chọn và hỏi giới tính. Không hỏi lại mục tiêu.
- Khi hỏi giới tính, choices phải là [{"label":"Nam","value":"male"},{"label":"Nữ","value":"female"}].
- Sau giới tính hãy lần lượt hỏi tuổi, chiều cao, cân nặng hiện tại, cân nặng mục tiêu (nếu cần), mức vận động và dị ứng/thói quen. Mỗi lần chỉ hỏi một thông tin.
- Sau khi hoàn tất thông tin nền, phải hỏi tiếp đầy đủ các câu hỏi của đúng nhánh mục tiêu đã chọn ở trên; không chuyển sang nhánh khác và không tự kết thúc sớm.
- Có thể gộp cân nặng hiện tại và cân nặng mục tiêu trong một câu, nhưng phải hỏi đủ cả hai. Các câu về kỳ hạn, rào cản, lịch sử ăn kiêng, tập luyện, giấc ngủ hoặc bệnh lý phải được ghi nhận trước khi chốt đề xuất.
- Khi đã đủ dữ liệu, trả goalProposal với số liệu tính toán và choices gồm "Áp dụng mục tiêu" hoặc "Điều chỉnh lại".
Không bọc JSON trong markdown. choices chỉ dùng khi cần hỏi lựa chọn nhanh, tối đa 4 lựa chọn.`,
        },
        ...formattedHistory,
        {
          role: 'user',
          content: `Hồ sơ hiện có: ${JSON.stringify(userProfile)}\nTiến trình bắt buộc: đã thu thập ${JSON.stringify(progress)}.\nTin nhắn mới: ${userMessage}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 550,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GoalChatbot] Groq API failed (${response.status}): ${errorText}`);
    return {
      ...getFallbackGoalResponse(progress),
      goalProposal: null,
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { ...getFallbackGoalResponse(progress), goalProposal: null };
  }

  const parsed = extractResponseObject(content);
  if (!parsed) {
    return { ...getFallbackGoalResponse(progress), goalProposal: null };
  }
  const reply = cleanReplyText(
    typeof parsed.reply === 'string' ? parsed.reply : String(content)
  );
  const choices = Array.isArray(parsed.choices) && parsed.choices.length > 0
    ? parsed.choices
        .filter((choice) => choice && choice.label && choice.value)
        .slice(0, 4)
        .map((choice) => ({ label: String(choice.label), value: String(choice.value) }))
    : getSuggestedChoices(reply);

  return {
    reply: reply || 'Mình cần thêm một chút thông tin để tư vấn chính xác hơn.',
    goalProposal: parsed.goalProposal && typeof parsed.goalProposal === 'object' ? parsed.goalProposal : null,
    choices,
  };
}

module.exports = {
  chatGoalSession,
};