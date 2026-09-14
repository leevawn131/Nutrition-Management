/**
 * Standardized AI Text Service (Legacy Wrapper)
 * Redirects all chatbot text requests to Groq Service (openai/gpt-oss-20b)
 */
const groqService = require('./groq.service');

/**
 * Legacy compatibility method for POST /api/chatbot/ask
 */
async function getNutritionAdvice(userProfile = {}, userPlan = {}, question) {
  return groqService.getNutritionAdvice(userProfile, userPlan, question);
}

module.exports = {
  getNutritionAdvice,
  groqService,
};

