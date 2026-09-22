require('dotenv').config({ path: './backend/.env' });
const { GoogleGenerativeAI } = require('./backend/node_modules/@google/generative-ai');

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key present?', Boolean(apiKey), 'Length:', apiKey ? apiKey.length : 0);

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash',
    'gemini-1.0-pro',
  ];

  for (const m of modelsToTest) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent('Xin chào, hãy trả lời bằng 1 từ: OK');
      console.log(`✅ SUCCESS [${m}]:`, res.response.text().trim());
    } catch (err) {
      console.log(`❌ FAILED [${m}]:`, err.message);
    }
  }
}

testModels().catch(console.error);
