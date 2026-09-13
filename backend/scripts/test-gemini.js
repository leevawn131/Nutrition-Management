const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const geminiService = require('../services/gemini.service');

async function testImageAnalysis() {
  console.log('Testing geminiService.analyzeFoodImage...');
  // 1x1 transparent GIF buffer
  const sampleImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  try {
    const res = await geminiService.analyzeFoodImage(sampleImageBuffer, 'image/gif');
    console.log('✅ Image Analysis Success:', res);
  } catch (err) {
    console.error('❌ Image Analysis Failed:', err);
  }
}

testImageAnalysis();
