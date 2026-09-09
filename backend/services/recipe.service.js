const Recipe = require('../models/recipe.model');
const RecipeComment = require('../models/recipe_comment.model');

class RecipeService {
  async getRecipeById(id) {
    const idStr = id ? String(id) : '';

    let recipe = null;
    if (idStr && idStr.match(/^[0-9a-fA-F]{24}$/)) {
      recipe = await Recipe.findById(idStr).populate('created_by_user_id', 'full_name avatar_url email');
    }

    if (!recipe) {
      recipe = await Recipe.findOne().populate('created_by_user_id', 'full_name avatar_url email');
    }

    if (!recipe) {
      return null;
    }

    // Fetch comments for this recipe
    const commentsDoc = await RecipeComment.find({ recipe_id: recipe._id, status: 'visible' })
      .populate('user_id', 'full_name avatar_url email')
      .sort({ created_at: -1 });

    const recipeObj = recipe.toObject();

    // Attach mapped reviews for frontend compatibility
    recipeObj.reviews = commentsDoc.map(c => ({
      _id: c._id,
      user_id: c.user_id ? c.user_id._id : null,
      user_name: c.user_id ? (c.user_id.full_name || c.user_id.email) : 'Người dùng',
      user_avatar: c.user_id ? c.user_id.avatar_url : '',
      rating: c.rating || 5,
      comment: c.content,
      created_at: c.created_at,
    }));

    return recipeObj;
  }

  async getAllRecipes() {
    let recipes = await Recipe.find()
      .populate('created_by_user_id', 'full_name avatar_url email')
      .sort({ created_at: -1 });

    return recipes;
  }

  async addReview(recipeId, userId, rating, content, quickTags = []) {
    let recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new Error('Không tìm thấy món ăn');
    }

    let finalContent = (content || '').trim();
    if (!finalContent) {
      if (Array.isArray(quickTags) && quickTags.length > 0) {
        finalContent = quickTags.join(', ');
      } else {
        finalContent = `Đánh giá ${rating || 5} sao`;
      }
    }

    const comment = new RecipeComment({
      recipe_id: recipe._id,
      user_id: userId,
      rating: Number(rating) || 5,
      content: finalContent,
      status: 'visible',
    });
    await comment.save();

    // Recalculate avg_rating & comment_count
    const allComments = await RecipeComment.find({ recipe_id: recipe._id, status: 'visible' });
    const count = allComments.length;
    const ratedComments = allComments.filter(c => c.rating);
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

    // Formatted ingredients according to schema
    const formattedIngredients = ingredients.map(ing => ({
      ingredient_name: ing.ingredient_name || ing.name || 'Nguyên liệu',
      quantity: Number(ing.quantity || ing.amount) || 1,
      unit: ing.unit || 'g',
    }));

    // Formatted steps according to schema
    const formattedSteps = steps.map((st, idx) => ({
      step_number: idx + 1,
      instruction: typeof st === 'string' ? st : st.instruction || st.description || `Bước ${idx + 1}`,
      image_url: typeof st === 'object' && (st.image_url || st.cover_image_url) ? (st.image_url || st.cover_image_url) : '',
    }));

    // Calculate Nutrition Facts
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarb = 0;
    let totalFat = 0;
    let totalGL = 0;

    for (const ing of formattedIngredients) {
      const amountGrams = ing.quantity || 50;
      let foodDoc = null;

      if (ing.ingredient_name) {
        foodDoc = await FoodItem.findOne({
          $or: [
            { name: new RegExp(ing.ingredient_name.trim(), 'i') },
            { aliases: new RegExp(ing.ingredient_name.trim(), 'i') },
          ],
        }).lean();
      }

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
      recipe.ingredients = ingredients.map(ing => ({
        ingredient_name: ing.ingredient_name || ing.name || 'Nguyên liệu',
        quantity: Number(ing.quantity || ing.amount) || 1,
        unit: ing.unit || 'g',
      }));
    }

    if (Array.isArray(steps) && steps.length > 0) {
      recipe.steps = steps.map((st, idx) => ({
        step_number: idx + 1,
        instruction: typeof st === 'string' ? st : st.instruction || st.description || `Bước ${idx + 1}`,
        image_url: typeof st === 'object' && (st.image_url || st.cover_image_url) ? (st.image_url || st.cover_image_url) : '',
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
