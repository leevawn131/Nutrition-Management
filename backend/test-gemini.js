const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('Fetching models...');
    // We can fetch models by hitting the REST endpoint directly because the SDK doesn't natively expose listModels easily in v0.x without specific methods
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log('Available Models that support generateContent:');
      data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log('Error fetching models:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

listModels();
