const Recipe = require('../models/recipe.model');
const UserCollection = require('../models/user_collection.model');

const INITIAL_RECIPES = [
  {
    title: 'Mắm Kho Chay',
    description: 'Món mắm kho chay thanh đạm từ chao, nấm và cà tím, đậm đà đưa cơm.',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    prep_time_minutes: 20,
    cook_time_minutes: 30,
    servings: 3,
    calories_per_serving: 260,
    protein_g: 14.5,
    carb_g: 28.0,
    fat_g: 8.5,
    avg_rating: 4.8,
    comment_count: 9,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Đậu hũ chiên', quantity: 200, unit: 'g' },
      { ingredient_name: 'Cà tím', quantity: 1, unit: 'trái' },
      { ingredient_name: 'Nấm đùi gà', quantity: 100, unit: 'g' },
      { ingredient_name: 'Chao trắng', quantity: 2, unit: 'viên' },
      { ingredient_name: 'Sả băm', quantity: 2, unit: 'muỗng canh' },
      { ingredient_name: 'Ớt sừng', quantity: 1, unit: 'trái' },
      { ingredient_name: 'Nước dừa tươi', quantity: 150, unit: 'ml' },
      { ingredient_name: 'Hành boaro', quantity: 1, unit: 'cây' },
      { ingredient_name: 'Gia vị chay', quantity: 1, unit: 'muỗng cà phê' },
    ],
  },
  {
    title: 'Cơm cuối tháng.😳',
    description: 'Bữa cơm đạm bạc nhanh gọn thơm ngon tiết kiệm chi phí mà vẫn đủ chất.',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    servings: 1,
    calories_per_serving: 480,
    protein_g: 22.0,
    carb_g: 65.0,
    fat_g: 12.0,
    avg_rating: 4.5,
    comment_count: 14,
    source_type: 'community',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Cơm trắng', quantity: 150, unit: 'g' },
      { ingredient_name: 'Thịt kho trứng cút', quantity: 100, unit: 'g' },
      { ingredient_name: 'Rau muống luộc', quantity: 100, unit: 'g' },
      { ingredient_name: 'Dưa leo thái lát', quantity: 50, unit: 'g' },
    ],
  },
  {
    title: 'Cháo nấm hạt sen dưỡng tâm',
    description: 'Cháo nấm thơm lừng kết hợp hạt sen bùi béo, thanh lọc cơ thể và dễ tiêu hoá.',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554',
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 2,
    calories_per_serving: 230,
    protein_g: 9.0,
    carb_g: 44.0,
    fat_g: 2.5,
    avg_rating: 4.9,
    comment_count: 7,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Gạo tẻ & nếp', quantity: 80, unit: 'g' },
      { ingredient_name: 'Hạt sen tươi', quantity: 50, unit: 'g' },
      { ingredient_name: 'Nấm rơm & nấm hương', quantity: 80, unit: 'g' },
      { ingredient_name: 'Hành lá, ngò rí', quantity: 20, unit: 'g' },
      { ingredient_name: 'Tiêu xay', quantity: 0.5, unit: 'muỗng cà phê' },
      { ingredient_name: 'Hạt nêm nấm', quantity: 1, unit: 'muỗng cà phê' },
    ],
  },
  {
    title: 'Canh súp cua măng tây tuyết nhĩ',
    description: 'Súp cua thanh mát, thơm ngon bổ dưỡng giàu canxi và collagen.',
    image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab',
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    servings: 2,
    calories_per_serving: 195,
    protein_g: 16.0,
    carb_g: 18.0,
    fat_g: 4.0,
    avg_rating: 4.7,
    comment_count: 11,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Thịt cua biển', quantity: 100, unit: 'g' },
      { ingredient_name: 'Măng tây xanh', quantity: 80, unit: 'g' },
      { ingredient_name: 'Nấm tuyết nhĩ', quantity: 20, unit: 'g' },
      { ingredient_name: 'Trứng gà', quantity: 1, unit: 'quả' },
      { ingredient_name: 'Bột năng', quantity: 15, unit: 'g' },
      { ingredient_name: 'Nước dùng gà', quantity: 400, unit: 'ml' },
      { ingredient_name: 'Dầu mè', quantity: 1, unit: 'muỗng cà phê' },
    ],
  },
];

/**
 * Service to manage recipes and recipe collections
 */
class RecipeService {
  /**
   * Ensure initial recipes exist
   */
  async ensureInitialRecipes() {
    try {
      const count = await Recipe.countDocuments();
      if (count < 8) {
        for (const item of INITIAL_RECIPES) {
          const exists = await Recipe.findOne({ title: item.title });
          if (!exists) {
            await Recipe.create(item);
          }
        }
      }
    } catch (e) {
      // Ignore background init error
    }
  }

  /**
   * Get list of recipes with optional search and collection filtering
   * @param {Object} queryOptions
   * @returns {Promise<Object>}
   */
  async getRecipes({ search = '', tab = 'recipes', userId = null, limit = 50, page = 1 } = {}) {
    await this.ensureInitialRecipes();

    const query = { status: 'approved' };

    // If tab is 'collections', fetch recipe IDs from user's collections
    if (tab === 'collections' && userId) {
      const collections = await UserCollection.find({ user_id: userId }).lean();
      const recipeIds = [];
      collections.forEach((col) => {
        if (col.items) {
          col.items.forEach((item) => {
            if (item.item_type === 'recipe' && item.item_id) {
              recipeIds.push(item.item_id);
            }
          });
        }
      });
      query._id = { $in: recipeIds };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'ingredients.ingredient_name': searchRegex },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const items = await Recipe.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10) || 50)
      .lean();

    const total = await Recipe.countDocuments(query);

    return {
      items,
      total,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    };
  }

  /**
   * Get single recipe by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getRecipeById(id) {
    return await Recipe.findById(id).lean();
  }

  /**
   * Get user collections containing recipes
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserCollections(userId) {
    if (!userId) return [];
    return await UserCollection.find({ user_id: userId }).lean();
  }
}

module.exports = new RecipeService();
