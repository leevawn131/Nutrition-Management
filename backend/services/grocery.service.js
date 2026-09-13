const GroceryItem = require('../models/grocery.model');

class GroceryService {
  async addFromRecipe(userId, recipeId, servings = 1, ingredients = []) {
    if (!ingredients || ingredients.length === 0) {
      throw new Error('Danh sách nguyên liệu rỗng');
    }

    const createdItems = [];
    for (const item of ingredients) {
      const groceryItem = await GroceryItem.create({
        user_id: userId,
        recipe_id: recipeId,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        checked: false,
      });
      createdItems.push(groceryItem);
    }

    return createdItems;
  }

  async getUserGroceryItems(userId) {
    return GroceryItem.find({ user_id: userId }).sort({ created_at: -1 });
  }
}

module.exports = new GroceryService();
