require('dotenv').config();
const visionService = require('./services/vision.service');

async function test() {
  try {
    console.log("Testing getIngredientDetail for 'Thịt bò'...");
    const result = await visionService.getIngredientDetail('Thịt bò');
    console.log("AI Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("AI Error:", error);
  }
}

test();
