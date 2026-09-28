const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function calculateGoalProposal(userText, userProfile = {}) {
  const isMale = /\b(nam|male)\b/i.test(userText) || userProfile.gender === 'male';
  const ageMatch = userText.match(/(\d{1,2})\s*(?:tuổi|t|yo)\b/i) || userText.match(/(?:^|\s)(\d{1,2})(?:\s|$)/);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : 24;

  const heightMatch = userText.match(/(\d{2,3})\s*cm\b/i);
  const height = heightMatch ? parseInt(heightMatch[1], 10) : 168;

  const weightMatches = [...userText.matchAll(/(\d{2,3}(?:[.,]\d+)?)\s*kg\b/gi)];
  let currentWeight = 65;
  let targetWeight = 60;
  if (weightMatches.length >= 2) {
    currentWeight = parseFloat(weightMatches[0][1].replace(',', '.'));
    targetWeight = parseFloat(weightMatches[1][1].replace(',', '.'));
  } else if (weightMatches.length === 1) {
    currentWeight = parseFloat(weightMatches[0][1].replace(',', '.'));
    targetWeight = currentWeight - 5;
  }

  const durationMatch = userText.match(/(\d+)\s*(?:tuần|tháng)\b/i);
  const durationWeeks = durationMatch
    ? (durationMatch[0].includes('tháng') ? parseInt(durationMatch[1], 10) * 4 : parseInt(durationMatch[1], 10))
    : 8;

  // BMR Mifflin-St Jeor
  const bmr = isMale
    ? Math.round(10 * currentWeight + 6.25 * height - 5 * age + 5)
    : Math.round(10 * currentWeight + 6.25 * height - 5 * age - 161);

  const tdee = Math.round(bmr * 1.375);
  const diff = targetWeight - currentWeight;
  let goalType = 'MAINTAIN';
  let targetCalories = tdee;
  let weeklyPaceKg = 0.5;

  if (diff < -0.5) {
    goalType = 'LOSE_WEIGHT';
    weeklyPaceKg = Math.min(1.0, Math.max(0.3, Math.round((Math.abs(diff) / Math.max(1, durationWeeks)) * 10) / 10));
    targetCalories = Math.max(bmr, tdee - Math.round((weeklyPaceKg * 7700) / 7));
    if (targetCalories < (isMale ? 1400 : 1200)) {
      targetCalories = isMale ? 1400 : 1200;
    }
  } else if (diff > 0.5) {
    goalType = 'GAIN_MUSCLE';
    weeklyPaceKg = Math.min(0.5, Math.max(0.2, Math.round((diff / Math.max(1, durationWeeks)) * 10) / 10));
    targetCalories = tdee + 300;
  }

  const proteinG = Math.round(currentWeight * (goalType === 'GAIN_MUSCLE' ? 2.0 : 1.8));
  const fatCalories = Math.round(targetCalories * 0.25);
  const fatG = Math.round(fatCalories / 9);
  const carbCalories = Math.max(0, targetCalories - (proteinG * 4 + fatCalories));
  const carbG = Math.round(carbCalories / 4);

  return {
    readyToApply: true,
    goalType,
    targetWeightKg: targetWeight,
    weeklyPaceKg,
    tdee,
    targetCalories,
    macros: {
      protein: proteinG,
      carb: carbG,
      fat: fatG,
    },
    waterIntakeMl: Math.round(currentWeight * 35),
    recommendationSummary:
      goalType === 'LOSE_WEIGHT'
        ? `Lộ trình giảm ${Math.abs(diff)}kg trong ${durationWeeks} tuần (≈${weeklyPaceKg}kg/tuần), mức thâm hụt ${tdee - targetCalories} kcal/ngày.`
        : 'Kế hoạch dinh dưỡng cá nhân hóa tối ưu cho thể trạng của bạn.',
  };
}

const getGoalProgress = (messagesHistory) => {
  const userText = messagesHistory
    .filter((message) => message?.sender === 'user' || message?.role === 'user')
    .map((message) => String(message.text || message.content || '').toLowerCase())
    .join(' ');

  const botText = messagesHistory
    .filter((message) => message?.sender === 'bot' || message?.role === 'assistant' || message?.role === 'model')
    .map((message) => String(message.text || message.content || '').toLowerCase())
    .join(' ');

  const hasGender = /\b(nam|nữ|nu|male|female)\b/.test(userText);
  // Accept both natural answers ("28 tuổi") and numeric picker answers ("28").
  const hasAge = /\b\d{1,2}\s*(tuổi|t|yo)\b/.test(userText) ||
    /(?:^|\s)\d{1,2}(?:\s|$)/.test(userText);
  const hasHeight = /\b\d{2,3}\s*(cm|m)\b/.test(userText);
  const hasWeight = /\b\d{2,3}(?:[.,]\d+)?\s*kg\b/.test(userText);
  const hasDuration = /\b\d+\s*(tuần|tháng|week|month)\b/.test(userText);
  const hasBarrier = /\b(ăn vặt|trà sữa|ăn đêm|ăn ngoài|an vat|tra sua|an dem|an ngoai)\b/i.test(userText) ||
    (/rào cản|ăn vặt/i.test(botText) && messagesHistory.length >= 10);
  const hasDietOrActivity = /\b(chưa thử|chua thu|if|eat clean|low-carb|low carb|keto|gym|vận động|văn phòng|cardio|tập tạ)\b/i.test(userText) ||
    (/ăn kiêng|tập luyện/i.test(botText) && messagesHistory.length >= 12);

  let nextQuestion = 'giới tính';
  if (!hasGender) nextQuestion = 'giới tính';
  else if (!hasAge) nextQuestion = 'tuổi';
  else if (!hasHeight) nextQuestion = 'chiều cao';
  else if (!hasWeight) nextQuestion = 'cân nặng hiện tại và cân nặng mục tiêu';
  else if (!hasDuration) nextQuestion = 'kỳ hạn mong muốn';
  else if (!hasBarrier) nextQuestion = 'thói quen hoặc rào cản dinh dưỡng';
  else if (!hasDietOrActivity) nextQuestion = 'lịch sử ăn kiêng hoặc tập luyện';
  else nextQuestion = 'chốt mục tiêu';

  return { nextQuestion, hasGender, hasAge, hasHeight, hasWeight, hasDuration, hasBarrier, hasDietOrActivity, userText };
};

const getFallbackGoalResponse = (progress, userProfile = {}) => {
  const responses = {
    'giới tính': {
      reply: 'Để tính toán phù hợp, bạn cho Tri biết giới tính của mình nhé?',
      choices: [
        { label: 'Nam', value: 'male' },
        { label: 'Nữ', value: 'female' },
      ],
    },
    'tuổi': {
      reply: 'Cảm ơn bạn. Bạn bao nhiêu tuổi?',
      choices: [],
      picker: { type: 'age', min: 14, max: 90, default: 24, unit: 'tuổi' },
    },
    'chiều cao': {
      reply: 'Bạn cao bao nhiêu cm?',
      choices: [],
      picker: { type: 'height', min: 120, max: 220, default: 168, unit: 'cm' },
    },
    'cân nặng hiện tại và cân nặng mục tiêu': {
      reply: 'Cân nặng hiện tại của bạn là bao nhiêu và bạn muốn đạt mốc bao nhiêu kg?',
      choices: [],
      picker: {
        type: 'dual_weight',
        min: 35,
        max: 180,
        default: 65,
        defaultTarget: 60,
        unit: 'kg',
      },
    },
    'kỳ hạn mong muốn': {
      reply: 'Bạn mong muốn đạt mốc cân nặng đó trong bao lâu? Tốc độ an toàn thường khoảng 0.4-0.75 kg mỗi tuần.',
      choices: [
        { label: '4-6 tuần', value: '4-6 tuần' },
        { label: '8-12 tuần (Khuyên dùng)', value: '8-12 tuần' },
        { label: '16 tuần (~4 tháng)', value: '16 tuần' },
        { label: '24 tuần (~6 tháng)', value: '24 tuần' },
      ],
      picker: { type: 'duration', min: 2, max: 52, default: 8, unit: 'tuần' },
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
    'lịch sử ăn kiêng hoặc tập luyện': {
      reply: 'Bạn đã từng thử qua phương pháp ăn kiêng nào (như IF, Eat Clean, Low-carb) hoặc có thói quen tập luyện thể thao không?',
      choices: [
        { label: 'Chưa thử / Mới bắt đầu', value: 'Chưa thử' },
        { label: 'Nhịn ăn gián đoạn (IF)', value: 'IF' },
        { label: 'Eat Clean', value: 'Eat Clean' },
        { label: 'Tập Gym / Cardio', value: 'Tập Gym' },
      ],
    },
    'chốt mục tiêu': {
      reply: 'Tuyệt vời! Dựa trên các chỉ số thể trạng và mục tiêu của bạn, Tri đã phân tích và thiết lập kế hoạch dinh dưỡng tối ưu nhất:',
      choices: [
        { label: 'Áp dụng mục tiêu này', value: 'Áp dụng mục tiêu' },
        { label: 'Điều chỉnh lại', value: 'Điều chỉnh lại' },
      ],
      goalProposal: calculateGoalProposal(progress.userText || '', userProfile),
    },
  };
  return responses[progress.nextQuestion] || responses['chốt mục tiêu'];
};

function isQuestionRepeating(replyText, progress) {
  const t = String(replyText || '').toLowerCase();
  if (progress.hasGender && (/giới tính/i.test(t) || /nam hay nữ/i.test(t) || /bạn là nam/i.test(t))) return true;
  if (progress.hasAge && (/\b(bao nhiêu tuổi|độ tuổi của bạn)\b/i.test(t))) return true;
  if (progress.hasHeight && (/\b(chiều cao|cao bao nhiêu|bao nhiêu cm)\b/i.test(t))) return true;
  if (progress.hasWeight && (/\b(cân nặng hiện tại|nặng bao nhiêu kg|giảm về mốc bao nhiêu)\b/i.test(t))) return true;
  if (progress.hasDuration && (/\b(trong bao lâu|kỳ hạn|thời hạn|mấy tuần)\b/i.test(t))) return true;
  if (progress.hasBarrier && (/\b(rào cản dinh dưỡng|ăn vặt.*trà sữa|ăn đêm hay ăn ngoài)\b/i.test(t))) return true;
  return false;
}

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
  if (
    text.includes('bao lâu') ||
    text.includes('thời hạn') ||
    text.includes('kỳ hạn') ||
    text.includes('mỗi tuần') ||
    text.includes('mấy tuần') ||
    text.includes('mấy tháng')
  ) {
    return [
      { label: '4-6 tuần', value: '4-6 tuần' },
      { label: '8-12 tuần (Khuyên dùng)', value: '8-12 tuần' },
      { label: '16 tuần (~4 tháng)', value: '16 tuần' },
      { label: '24 tuần (~6 tháng)', value: '24 tuần' },
    ];
  }
  return [];
};

const cleanReplyText = (reply) => String(reply || '')
  .replace(/\n?\s*\*{0,2}choices\*{0,2}\s*:?\s*/gi, '\n')
  .replace(/\n\s*-\s*\[?\s*\{[\s\S]*?\}\s*\]?/gi, '')
  .replace(/\n?\s*\[\s*\{[\s\S]*?\}\s*\]/gi, '')
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
    return getFallbackGoalResponse(
      getGoalProgress([
        ...messagesHistory,
        { sender: 'user', text: userMessage },
      ]),
      userProfile
    );
  }

  const progress = getGoalProgress([
    ...messagesHistory,
    { sender: 'user', text: userMessage },
  ]);
  const formattedHistory = messagesHistory
    .filter((message) => message && (message.text || message.content))
    .slice(-30)
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
Quy tắc chuyển bước bắt buộc & CHỐNG LẶP CÂU HỎI:
- TUYỆT ĐỐI KHÔNG HỎI LẠI bất kỳ thông tin nào người dùng hoặc bot đã đề cập trong lịch sử trò chuyện.
- Nếu lịch sử đã có giới tính -> KHÔNG HỎI LẠI giới tính.
- Nếu lịch sử đã có tuổi -> KHÔNG HỎI LẠI tuổi.
- Nếu lịch sử đã có chiều cao -> KHÔNG HỎI LẠI chiều cao.
- Nếu lịch sử đã có cân nặng hiện tại & mục tiêu -> KHÔNG HỎI LẠI cân nặng.
- Nếu lịch sử đã có kỳ hạn/thời hạn -> KHÔNG HỎI LẠI thời hạn.
- Nếu lịch sử đã có rào cản ăn uống -> KHÔNG HỎI LẠI rào cản ăn uống.
- Khi đã có đủ các thông tin nền và thói quen, BẮT BUỘC DỪNG HỎI và chốt mục tiêu ngay bằng goalProposal (gồm calo, macro, nước, tdee, đề xuất). Không hỏi lan man thêm.
Không bọc JSON trong markdown. choices chỉ dùng khi cần hỏi lựa chọn nhanh, tối đa 4 lựa chọn.`,
        },
        ...formattedHistory,
        {
          role: 'user',
          content: `Hồ sơ hiện có: ${JSON.stringify(userProfile)}\nTiến trình bắt buộc: đã thu thập ${JSON.stringify(progress)}.\nTin nhắn mới: ${userMessage}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GoalChatbot] Groq API failed (${response.status}): ${errorText}`);
    return {
      ...getFallbackGoalResponse(progress, userProfile),
      goalProposal: null,
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { ...getFallbackGoalResponse(progress, userProfile), goalProposal: null };
  }

  let parsed = extractResponseObject(content);
  let goalProposal = parsed?.goalProposal || null;
  let replyText = (typeof parsed?.reply === 'string' ? parsed.reply : content) || '';

  if (!goalProposal && typeof content === 'string') {
    const goalJsonMatch = content.match(/```(?:goal_json|json)?\s*([\s\S]*?)\s*```/);
    if (goalJsonMatch) {
      try {
        const candidate = JSON.parse(goalJsonMatch[1]);
        if (candidate && (candidate.readyToApply || candidate.targetCalories || candidate.targetWeightKg)) {
          goalProposal = candidate;
          replyText = content.replace(goalJsonMatch[0], '').trim();
        }
      } catch {
        // ignore
      }
    }
  }

  if (!parsed && typeof content === 'string' && content.trim()) {
    parsed = {
      reply: replyText.trim(),
      goalProposal,
      choices: getSuggestedChoices(replyText),
    };
  }
  if (!parsed) {
    return { ...getFallbackGoalResponse(progress, userProfile), goalProposal: null };
  }
  const reply = cleanReplyText(
    typeof parsed.reply === 'string' ? parsed.reply : String(content)
  );

  // Anti-repetition guard: if LLM re-asks an already answered question, override with next step
  if (isQuestionRepeating(reply, progress)) {
    console.log(`[GoalChatbot] Detected repetitive question from LLM: "${reply.slice(0, 50)}...". Overriding with next step.`);
    const fallback = getFallbackGoalResponse(progress, userProfile);
    return {
      reply: fallback.reply,
      goalProposal: fallback.goalProposal || goalProposal,
      choices: fallback.choices || [],
      picker: fallback.picker || null,
    };
  }

  // If reached goal proposal step and LLM did not include goalProposal, generate proposal
  if (progress.nextQuestion === 'chốt mục tiêu' && !goalProposal) {
    goalProposal = calculateGoalProposal(progress.userText || '', userProfile);
  }

  const choices = Array.isArray(parsed.choices) && parsed.choices.length > 0
    ? parsed.choices
        .filter((choice) => choice && choice.label && choice.value)
        .slice(0, 4)
        .map((choice) => ({ label: String(choice.label), value: String(choice.value) }))
    : getSuggestedChoices(reply);

  let picker = parsed.picker || null;
  if (!picker && reply) {
    const textLower = reply.toLowerCase();
    const isDuration = /\b(trong bao lâu|bao lâu|thời hạn|kỳ hạn|mấy tuần|mấy tháng|bao nhiêu tuần|bao nhiêu tháng)\b/i.test(textLower);
    if (/\b(tuổi|bao nhiêu tuổi|độ tuổi|năm sinh)\b/i.test(textLower)) {
      picker = { type: 'age', min: 14, max: 90, default: 24, unit: 'tuổi' };
    } else if (/\b(chiều cao|bao nhiêu cm|cao bao nhiêu)\b/i.test(textLower)) {
      picker = { type: 'height', min: 120, max: 220, default: 168, unit: 'cm' };
    } else if (isDuration) {
      picker = { type: 'duration', min: 2, max: 52, default: 8, unit: 'tuần' };
    } else if (
      !isDuration &&
      /cân nặng|nặng bao nhiêu|bao nhiêu kg/i.test(textLower) &&
      (/hiện tại/i.test(textLower) || textLower.includes('của bạn')) &&
      (/mục tiêu|muốn giảm|muốn tăng|đạt mốc|về mốc/i.test(textLower) || textLower.includes('giảm'))
    ) {
      picker = {
        type: 'dual_weight',
        min: 35,
        max: 180,
        default: 65,
        defaultTarget: 60,
        unit: 'kg',
      };
    } else if (!isDuration && /cân nặng|nặng bao nhiêu|bao nhiêu kg/i.test(textLower)) {
      picker = { type: 'weight', min: 35, max: 180, default: 60, unit: 'kg' };
    }
  }

  return {
    reply: reply || 'Tuyệt vời! Dưới đây là mục tiêu dinh dưỡng cá nhân hóa dành riêng cho bạn:',
    goalProposal: goalProposal && typeof goalProposal === 'object' ? goalProposal : null,
    choices,
    picker,
  };
}

module.exports = {
  chatGoalSession,
};