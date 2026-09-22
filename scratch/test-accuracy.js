const {
  STANDARD_DISH_RECIPES,
  getStandardDishRecipe,
  expandCompoundIngredient,
} = require('../backend/services/standardRecipes');
const geminiService = require('../backend/services/gemini.service');

console.log('=== TEST 1: Authentic Recipe Lookup ===');
const pho = getStandardDishRecipe('Bát phở bò tái nạm', 650);
console.log('Phở bò:', pho ? pho.map(i => `${i.name} (${i.portion_g}g - ${i.calories}kcal - P:${i.protein_g} C:${i.carb_g} F:${i.fat_g})`) : 'NOT FOUND');

const che = getStandardDishRecipe('Một cốc chè thập cẩm', 300);
console.log('Chè thập cẩm:', che ? che.map(i => `${i.name} (${i.portion_g}g - ${i.calories}kcal - P:${i.protein_g} C:${i.carb_g} F:${i.fat_g})`) : 'NOT FOUND');

const caphe = getStandardDishRecipe('Cà phê sữa đá', 250);
console.log('Cà phê sữa đá:', caphe ? caphe.map(i => `${i.name} (${i.portion_g}g - ${i.calories}kcal - P:${i.protein_g} C:${i.carb_g} F:${i.fat_g})`) : 'NOT FOUND');

console.log('\n=== TEST 2: Compound String Expansion ===');
const compoundChe = expandCompoundIngredient('Chè thập cẩm (đậu, thạch, cốt dừa, đường)', 300);
console.log('Expanded Chè thập cẩm compound:', compoundChe ? compoundChe.map(i => i.name) : 'FAILED');

const compoundCaphe = expandCompoundIngredient('Cà phê sữa đá (cà phê và sữa đặc)', 250);
console.log('Expanded Cà phê sữa đá compound:', compoundCaphe ? compoundCaphe.map(i => i.name) : 'FAILED');

console.log('\n=== TEST 3: Backend distributeIngredientsToDishes with Multi-Dish Meal ===');
const mockDishes = [
  { name: 'Phở bò', estimated_weight_g: 650, calories: 450, ingredients: [] },
  { name: 'Chè thập cẩm', estimated_weight_g: 300, calories: 350, ingredients: [{ name: 'Chè thập cẩm (đậu, thạch, cốt dừa)', portion_g: 300 }] },
  { name: 'Cà phê sữa đá', estimated_weight_g: 200, calories: 150, ingredients: [] },
];

const processedDishes = geminiService.distributeIngredientsToDishes(mockDishes, []);
processedDishes.forEach(d => {
  console.log(`\nMón: ${d.name} (${d.estimated_weight_g}g)`);
  d.ingredients.forEach(ing => {
    console.log(`  - ${ing.name}: ${ing.portion_g}g | ${ing.calories} kcal | P:${ing.protein_g}g C:${ing.carb_g}g F:${ing.fat_g}g`);
  });
});
