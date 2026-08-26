require('dotenv').config();
const mongoose = require('mongoose');
const { analyzeRecipeNutrition } = require('./backend/services/vision.service');

async function test() {
  const ingredients = [
    { ingredient_name: 'Thịt bò', quantity: 500, unit: 'g' },
    { ingredient_name: 'Cà rốt', quantity: 200, unit: 'g' }
  ];
  
  try {
    console.log("Calling AI...");
    const res = await analyzeRecipeNutrition(ingredients, 4);
    console.log("AI Response:", JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  }
}

test();
