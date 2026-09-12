const Recipe = require('../models/recipe.model');
const RecipeComment = require('../models/recipe_comment.model');
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
    calories_per_serving: 210,
    protein_g: 8.0,
    carb_g: 38.0,
    fat_g: 3.5,
    avg_rating: 4.9,
    comment_count: 6,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Gạo tẻ & nếp', quantity: 100, unit: 'g' },
      { ingredient_name: 'Hạt sen tươi', quantity: 60, unit: 'g' },
      { ingredient_name: 'Nấm hương tươi', quantity: 50, unit: 'g' },
      { ingredient_name: 'Cà rốt', quantity: 30, unit: 'g' },
    ],
  },
];

let recipesInitialized = false;

class RecipeService {
  async ensureInitialRecipes() {
    if (recipesInitialized) return;
    try {
      const count = await Recipe.countDocuments();
      if (count < 3) {
        for (const item of INITIAL_RECIPES) {
          const exists = await Recipe.findOne({ title: item.title });
          if (!exists) {
            await Recipe.create(item);
          }
        }
      }
      recipesInitialized = true;
    } catch (e) {
      // Ignore background init error
    }
  }

  async getRecipes({ search = '', tab = 'recipes', userId = null, limit = 50, page = 1 } = {}) {
    if (!recipesInitialized) {
      await this.ensureInitialRecipes();
    }

    const query = { status: 'approved' };

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
      recipes: items,
      total,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    };
  }

  async getAllRecipes() {
    const res = await this.getRecipes({ limit: 100 });
    return res.items;
  }

  async getRecipeById(id) {
    const recipe = await Recipe.findById(id).lean();
    if (!recipe) return null;

    try {
      const comments = await RecipeComment.find({ recipe_id: id, status: 'visible' })
        .populate('user_id', 'full_name email avatar_url')
        .sort({ created_at: -1 })
        .lean();

      recipe.reviews = comments.map((c) => ({
        id: c._id,
        _id: c._id,
        user_id: c.user_id ? c.user_id._id : null,
        user_name: c.user_id ? c.user_id.full_name || c.user_id.email : 'Người dùng',
        user_avatar: c.user_id ? c.user_id.avatar_url : '',
        rating: c.rating || 5,
        comment: c.content,
        created_at: c.created_at,
      }));
    } catch (e) {
      recipe.reviews = [];
    }

    return recipe;
  }

  async getUserCollections(userId) {
    let collections = [];
    if (userId) {
      collections = await UserCollection.find({ user_id: userId }).lean();
    }
    if (!collections || collections.length === 0) {
      collections = await UserCollection.find().lean();
    }
    if (!collections || collections.length === 0) {
      return [];
    }

    const recipeIds = [];
    collections.forEach((col) => {
      if (col.items) {
        col.items.forEach((it) => {
          if (it.item_type === 'recipe' && it.item_id) {
            recipeIds.push(it.item_id);
          }
        });
      }
    });

    const recipes = await Recipe.find({ _id: { $in: recipeIds } }).lean();
    const recipeMap = new Map();
    recipes.forEach((r) => recipeMap.set(r._id.toString(), r));

    return collections.map((col) => ({
      ...col,
      populated_items: (col.items || [])
        .map((it) => (it.item_type === 'recipe' ? recipeMap.get(it.item_id.toString()) : null))
        .filter(Boolean),
    }));
  }

  async toggleSaveRecipe(userId, recipeId, collectionName = 'Món ăn yêu thích') {
    let collection = await UserCollection.findOne({
      user_id: userId,
      name: collectionName,
    });

    if (!collection) {
      collection = await UserCollection.create({
        user_id: userId,
        name: collectionName,
        is_default: true,
        items: [],
      });
    }

    const itemIndex = collection.items.findIndex(
      (item) => item.item_type === 'recipe' && item.item_id.toString() === recipeId.toString()
    );

    let isSaved = false;
    if (itemIndex > -1) {
      collection.items.splice(itemIndex, 1);
      isSaved = false;
    } else {
      collection.items.push({
        item_id: recipeId,
        item_type: 'recipe',
        added_at: new Date(),
      });
      isSaved = true;
    }

    await collection.save();
    return { isSaved, collection };
  }

  async checkRecipeSaved(userId, recipeId) {
    if (!userId || !recipeId) return false;
    const collection = await UserCollection.findOne({
      user_id: userId,
      'items.item_id': recipeId,
    }).lean();
    return Boolean(collection);
  }

  async addReview(recipeId, userId, rating, comment, quick_tags = []) {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) throw new Error('Không tìm thấy món ăn');

    const finalContent =
      quick_tags && quick_tags.length > 0 ? `${comment || ''} [Tags: ${quick_tags.join(', ')}]`.trim() : comment;

    const newComment = new RecipeComment({
      recipe_id: recipe._id,
      user_id: userId,
      rating: Number(rating) || 5,
      content: finalContent || 'Đánh giá món ăn',
      status: 'visible',
    });
    await newComment.save();

    const allComments = await RecipeComment.find({ recipe_id: recipe._id, status: 'visible' });
    const count = allComments.length;
    const ratedComments = allComments.filter((c) => c.rating);
    const totalRating = ratedComments.reduce((acc, c) => acc + c.rating, 0);
    const avgRating = ratedComments.length > 0 ? Number((totalRating / ratedComments.length).toFixed(1)) : 5.0;

    recipe.avg_rating = avgRating;
    recipe.comment_count = count;
    await recipe.save();

    return this.getRecipeById(recipe._id);
  }

  async createRecipe(userId, userName, userAvatar, payload) {
    const FoodItem = require('../models/food_item.model');
    const {
      title,
      description,
      prep_time_minutes,
      prep_time_min,
      cook_time_minutes,
      cook_time_min,
      servings = 1,
      image_url,
      cover_image_url,
      ingredients = [],
      steps = [],
    } = payload;

    const prepTime = Number(prep_time_minutes || prep_time_min) || 10;
    const cookTime = Number(cook_time_minutes || cook_time_min) || 15;
    const servingDivisor = Math.max(1, Number(servings) || 1);

    const imageUrl =
      (image_url || cover_image_url) &&
      !(image_url || cover_image_url).startsWith('file://') &&
      !(image_url || cover_image_url).startsWith('blob:')
        ? image_url || cover_image_url
        : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';

    const formattedIngredients = ingredients.map((ing) => ({
      ingredient_name: ing.ingredient_name || ing.name || 'Nguyên liệu',
      quantity: Number(ing.quantity || ing.amount) || 1,
      unit: ing.unit || 'g',
    }));

    const formattedSteps = steps.map((st, idx) => ({
      step_number: idx + 1,
      instruction: typeof st === 'string' ? st : st.instruction || st.description || `Bước ${idx + 1}`,
      image_url: typeof st === 'object' && (st.image_url || st.cover_image_url) ? st.image_url || st.cover_image_url : '',
    }));

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarb = 0;
    let totalFat = 0;
    let totalGL = 0;

    // Batch query all ingredients in a single roundtrip to eliminate N+1 loop queries
    const ingredientNames = formattedIngredients
      .map((ing) => ing.ingredient_name && ing.ingredient_name.trim())
      .filter(Boolean);

    let matchedFoods = [];
    if (ingredientNames.length > 0) {
      const orConditions = [];
      for (const name of ingredientNames) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        orConditions.push({ name: new RegExp(`^${escaped}$`, 'i') });
        orConditions.push({ aliases: new RegExp(`^${escaped}$`, 'i') });
      }
      try {
        matchedFoods = await FoodItem.find({ $or: orConditions }).lean();
      } catch (err) {
        // Fallback to empty if query error
        matchedFoods = [];
      }
    }

    for (const ing of formattedIngredients) {
      const amountGrams = ing.quantity || 50;
      const ingNameLower = (ing.ingredient_name || '').trim().toLowerCase();
      const foodDoc = matchedFoods.find(
        (f) =>
          (f.name && f.name.toLowerCase() === ingNameLower) ||
          (Array.isArray(f.aliases) && f.aliases.some((a) => typeof a === 'string' && a.toLowerCase() === ingNameLower))
      );

      if (foodDoc) {
        const ratio = amountGrams / 100;
        const ingCarb = (foodDoc.carb_per_100g || 0) * ratio;
        const ingGI = foodDoc.gi_index || 55;
        totalCalories += (foodDoc.calories_per_100g || 0) * ratio;
        totalProtein += (foodDoc.protein_per_100g || 0) * ratio;
        totalCarb += ingCarb;
        totalFat += (foodDoc.fat_per_100g || 0) * ratio;
        totalGL += (ingGI * ingCarb) / 100;
      } else {
        const ratio = amountGrams / 100;
        const ingCarb = 10 * ratio;
        totalCalories += 100 * ratio;
        totalProtein += 5 * ratio;
        totalCarb += ingCarb;
        totalFat += 3 * ratio;
        totalGL += (50 * ingCarb) / 100;
      }
    }

    const caloriesPerServing = Math.round(totalCalories / servingDivisor);
    const proteinG = Number((totalProtein / servingDivisor).toFixed(1));
    const carbG = Number((totalCarb / servingDivisor).toFixed(1));
    const fatG = Number((totalFat / servingDivisor).toFixed(1));
    const glycemicLoad = Math.max(1, Math.round(totalGL / servingDivisor));

    const newRecipe = new Recipe({
      title,
      description: description || '',
      image_url: imageUrl,
      prep_time_minutes: prepTime,
      cook_time_minutes: cookTime,
      servings: servingDivisor,
      calories_per_serving: caloriesPerServing || 150,
      protein_g: proteinG || 10,
      carb_g: carbG || 15,
      fat_g: fatG || 5,
      avg_rating: 5.0,
      comment_count: 0,
      source_type: 'community',
      created_by_user_id: userId || null,
      status: 'approved',
      ingredients: formattedIngredients,
      steps: formattedSteps,
      nutrition_facts: {
        energy_kcal: caloriesPerServing || 150,
        protein_g: proteinG || 10,
        carbohydrate_g: carbG || 15,
        fat_g: fatG || 5,
        glycemic_load: glycemicLoad || 4,
        saturated_fat_g: Number((fatG * 0.3).toFixed(1)),
        trans_fat_g: 0,
        unsaturated_fat_g: Number((fatG * 0.7).toFixed(1)),
        fiber_g: Number((carbG * 0.1).toFixed(1)),
        cholesterol_mg: Math.round(proteinG * 2.5),
        sodium_mg: Math.round(caloriesPerServing * 0.8),
        vitamin_a_mcg: 12,
        vitamin_c_mg: 5,
        calcium_mg: 35,
        iron_mg: 1.2,
      },
    });

    await newRecipe.save();
    return this.getRecipeById(newRecipe._id);
  }

  async updateRecipe(recipeId, userId, payload) {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new Error('Không tìm thấy món ăn');
    }

    if (recipe.created_by_user_id && userId) {
      if (recipe.created_by_user_id.toString() !== userId.toString()) {
        throw new Error('Bạn không có quyền chỉnh sửa công thức này');
      }
    }

    const {
      title,
      description,
      prep_time_minutes,
      prep_time_min,
      cook_time_minutes,
      cook_time_min,
      servings,
      image_url,
      cover_image_url,
      ingredients,
      steps,
    } = payload;

    if (title) recipe.title = title;
    if (description !== undefined) recipe.description = description;
    if (prep_time_minutes || prep_time_min) recipe.prep_time_minutes = Number(prep_time_minutes || prep_time_min);
    if (cook_time_minutes || cook_time_min) recipe.cook_time_minutes = Number(cook_time_minutes || cook_time_min);
    if (servings) recipe.servings = Number(servings);
    if (image_url || cover_image_url) {
      const img = image_url || cover_image_url;
      if (!img.startsWith('file://') && !img.startsWith('blob:')) {
        recipe.image_url = img;
      }
    }

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      recipe.ingredients = ingredients.map((ing) => ({
        ingredient_name: ing.ingredient_name || ing.name || 'Nguyên liệu',
        quantity: Number(ing.quantity || ing.amount) || 1,
        unit: ing.unit || 'g',
      }));
    }

    if (Array.isArray(steps) && steps.length > 0) {
      recipe.steps = steps.map((st, idx) => ({
        step_number: idx + 1,
        instruction: typeof st === 'string' ? st : st.instruction || st.description || `Bước ${idx + 1}`,
        image_url: typeof st === 'object' && (st.image_url || st.cover_image_url) ? st.image_url || st.cover_image_url : '',
      }));
    }

    await recipe.save();
    return this.getRecipeById(recipe._id);
  }

  async deleteRecipe(recipeId, userId) {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new Error('Không tìm thấy món ăn');
    }

    if (recipe.created_by_user_id && userId) {
      if (recipe.created_by_user_id.toString() !== userId.toString()) {
        throw new Error('Bạn không có quyền xóa công thức này');
      }
    }

    await RecipeComment.deleteMany({ recipe_id: recipeId });
    await Recipe.findByIdAndDelete(recipeId);
    return { success: true, message: 'Đã xóa công thức thành công' };
  }
}

module.exports = new RecipeService();
