require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./models/recipe.model');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    // Lấy công thức mới nhất
    const recipe = await Recipe.findOne().sort({ created_at: -1 });
    if (!recipe) {
      console.log("No recipes found.");
    } else {
      console.log("Latest Recipe Title:", recipe.title);
      console.log("Ingredients:", recipe.ingredients);
      if (recipe.nutrition_facts) {
        console.log("Nutrition Facts:", JSON.stringify(recipe.nutrition_facts, null, 2));
      } else {
        console.log("Nutrition Facts: NULL");
        console.log("Testing AI Call...");
        const visionService = require('./services/vision.service');
        try {
          const aiNutrition = await visionService.analyzeRecipeNutrition(recipe.ingredients, recipe.servings || 1);
          console.log("AI Result:", JSON.stringify(aiNutrition, null, 2));
        } catch(e) {
          console.error("AI Error:", e);
        }
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}

test();
