const Recipe = require('../models/recipe.model');

const SAMPLE_THIT_NAC_RIM = {
  title: 'Thịt nạc rim',
  subtitle: 'Khám phá công thức mới này!',
  category: 'Món chính',
  cover_image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
  author: {
    name: 'Kiều Trang',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  prep_time_min: 10,
  cook_time_min: 15,
  servings: 1,
  rating: 5.0,
  rating_count: 2,
  saved_count: 19,
  ingredients: [
    { name: 'Thịt lợn nạc', amount: 70, unit: 'g', icon_url: '🥩' },
    { name: 'Hành lá', amount: 10, unit: 'g', icon_url: '🌿' },
    { name: 'Nước mắm', amount: 7, unit: 'g', icon_url: '🍾' },
    { name: 'Đường kính', amount: 5, unit: 'g', icon_url: '🍚' },
    { name: 'Tỏi ta', amount: 1, unit: 'tép', icon_url: '🧄' },
    { name: 'Dầu ăn', amount: 5, unit: 'g', icon_url: '🫗' },
    { name: 'Nước', amount: 30, unit: 'g', icon_url: '💧' },
  ],
  steps: [
    { step_number: 1, title: 'Sơ chế thịt', description: 'Thịt lợn rửa sạch, thái miếng vừa ăn chừng 0.5cm.' },
    { step_number: 2, title: 'Ướp gia vị', description: 'Ướp thịt với tỏi băm, nước mắm, đường và dầu ăn trong 10 phút.' },
    { step_number: 3, title: 'Rim thịt', description: 'Bắc chảo lên bếp, cho thịt vào đảo đều cho săn lại. Thêm 30g nước lọc, đun lửa nhỏ cho đến khi nước sốt sánh mịn.' },
    { step_number: 4, title: 'Hoàn thiện', description: 'Rắc hành lá thái nhỏ lên trên, tắt bếp và trình bày ra đĩa.' },
  ],
  nutrition_facts: {
    calories: 170,
    protein_g: 14.1,
    carb_g: 6.3,
    fat_g: 9.9,
    glycemic_load: 5,
    saturated_fat_g: 2.0,
    trans_fat_g: 0.1,
    unsaturated_fat_g: 5.5,
    fiber_g: 0.2,
    cholesterol_mg: 47,
    sodium_mg: 141,
    vitamin_a_ug: 13,
    vitamin_e_mg: 1,
    vitamin_k_ug: 0,
    vitamin_c_mg: 7,
    folic_acid_ug: 4,
    vitamin_b12_ug: 1,
    calcium_mg: 42,
    iron_mg: 1,
    zinc_mg: 2,
    magnesium_mg: 25,
    potassium_mg: 264,
    phosphorus_mg: 160,
  },
  reviews: [
    {
      user_name: 'Minh Anh',
      user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      rating: 5,
      quick_tags: ['Ngon xuất sắc', 'Dễ làm', 'Mềm ẩm'],
      comment: 'Món ăn rất vừa vị, rim mặn ngọt đậm đà chuẩn vị cơm nhà!',
      created_at: new Date('2026-08-20'),
    },
    {
      user_name: 'Hoàng Nam',
      user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      rating: 5,
      quick_tags: ['Phù hợp cho trẻ em', 'Làm dưới 30 phút'],
      comment: 'Thịt rim mềm không bị khô, bé nhà mình thích ăn lắm!',
      created_at: new Date('2026-08-22'),
    },
  ],
};

class RecipeService {
  async getRecipeById(id) {
    const idStr = id ? String(id) : '';
    if (idStr === 'thit-nac-rim' || idStr === 'sample' || !idStr) {
      let recipe = await Recipe.findOne({ title: 'Thịt nạc rim' });
      if (!recipe) {
        recipe = await Recipe.create(SAMPLE_THIT_NAC_RIM);
      }
      return recipe;
    }

    let recipe;
    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      recipe = await Recipe.findById(idStr);
    }

    if (!recipe) {
      recipe = await Recipe.findOne({ title: 'Thịt nạc rim' });
      if (!recipe) {
        recipe = await Recipe.create(SAMPLE_THIT_NAC_RIM);
      }
    }

    return recipe;
  }

  async getAllRecipes() {
    let recipes = await Recipe.find().sort({ created_at: -1 });
    if (recipes.length === 0) {
      const sample = await Recipe.create(SAMPLE_THIT_NAC_RIM);
      recipes = [sample];
    }
    return recipes;
  }

  async addReview(recipeId, userId, userName, userAvatar, rating, quickTags, comment) {
    const recipe = await this.getRecipeById(recipeId);
    if (!recipe) {
      throw new Error('Không tìm thấy món ăn');
    }

    const newReview = {
      user_id: userId,
      user_name: userName || 'Người dùng',
      user_avatar: userAvatar || '',
      rating: Number(rating) || 5,
      quick_tags: quickTags || [],
      comment: comment || '',
      created_at: new Date(),
    };

    recipe.reviews.unshift(newReview);
    recipe.rating_count = recipe.reviews.length;
    const totalStars = recipe.reviews.reduce((sum, r) => sum + r.rating, 0);
    recipe.rating = Number((totalStars / recipe.rating_count).toFixed(1));

    await recipe.save();
    return recipe;
  }

  async createRecipe(userId, userName, userAvatar, payload) {
    const FoodItem = require('../models/food_item.model');

    const {
      title,
      description,
      prep_time_min = 10,
      cook_time_min = 15,
      servings = 1,
      is_private = false,
      cover_image_url,
      ingredients = [],
      steps = [],
    } = payload;

    // Calculate Nutrition Facts & Glycemic Load (GL) from FoodItem database
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarb = 0;
    let totalFat = 0;
    let totalGL = 0;

    for (const ing of ingredients) {
      const amountGrams = Number(ing.amount) || 50;
      let foodDoc = null;

      if (ing.food_item_id && ing.food_item_id.match(/^[0-9a-fA-F]{24}$/)) {
        foodDoc = await FoodItem.findById(ing.food_item_id).lean();
      }

      if (!foodDoc && ing.name) {
        foodDoc = await FoodItem.findOne({
          $or: [
            { name: new RegExp(ing.name.trim(), 'i') },
            { aliases: new RegExp(ing.name.trim(), 'i') },
          ],
        }).lean();
      }

      if (foodDoc) {
        const ratio = amountGrams / 100;
        const ingCarb = (foodDoc.carb_per_100g || 0) * ratio;
        const ingGI = foodDoc.gi_index || foodDoc.gi || 55; // Default average GI

        totalCalories += (foodDoc.calories_per_100g || 0) * ratio;
        totalProtein += (foodDoc.protein_per_100g || 0) * ratio;
        totalCarb += ingCarb;
        totalFat += (foodDoc.fat_per_100g || 0) * ratio;
        totalGL += (ingGI * ingCarb) / 100;
      } else {
        // Fallback default nutrition estimate per amountGrams
        const ratio = amountGrams / 100;
        const ingCarb = 10 * ratio;
        totalCalories += 100 * ratio;
        totalProtein += 5 * ratio;
        totalCarb += ingCarb;
        totalFat += 3 * ratio;
        totalGL += (50 * ingCarb) / 100;
      }
    }

    const servingDivisor = Math.max(1, Number(servings) || 1);
    const calories = Math.round(totalCalories / servingDivisor);
    const protein_g = Number((totalProtein / servingDivisor).toFixed(1));
    const carb_g = Number((totalCarb / servingDivisor).toFixed(1));
    const fat_g = Number((totalFat / servingDivisor).toFixed(1));
    const glycemic_load = Math.max(1, Math.round(totalGL / servingDivisor));

    const newRecipe = new Recipe({
      title,
      description,
      prep_time_min: Number(prep_time_min) || 10,
      cook_time_min: Number(cook_time_min) || 15,
      servings: servingDivisor,
      is_private: Boolean(is_private),
      cover_image_url:
        cover_image_url &&
        !cover_image_url.startsWith('file://') &&
        !cover_image_url.startsWith('blob:')
          ? cover_image_url
          : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
      author: {
        user_id: userId,
        name: userName || 'Người dùng',
        avatar_url: userAvatar || '',
      },
      ingredients: ingredients.map(ing => ({
        name: ing.name,
        amount: Number(ing.amount) || 1,
        unit: ing.unit || 'g',
        icon_url: ing.icon_url || '🥗',
      })),
      steps: steps.map((st, idx) => ({
        step_number: idx + 1,
        title: st.title || `Bước ${idx + 1}`,
        description: st.description || st,
      })),
      nutrition_facts: {
        calories: calories || 150,
        protein_g: protein_g || 10,
        carb_g: carb_g || 15,
        fat_g: fat_g || 5,
        glycemic_load: glycemic_load || 4,
        saturated_fat_g: Number((fat_g * 0.3).toFixed(1)),
        trans_fat_g: 0,
        unsaturated_fat_g: Number((fat_g * 0.7).toFixed(1)),
        fiber_g: Number((carb_g * 0.1).toFixed(1)),
        cholesterol_mg: Math.round(protein_g * 2.5),
        sodium_mg: Math.round(calories * 0.8),
        vitamin_a_ug: 12,
        vitamin_c_mg: 5,
        calcium_mg: 35,
        iron_mg: 1.2,
      },
      rating: 5.0,
      rating_count: 1,
      saved_count: 0,
    });

    await newRecipe.save();
    return newRecipe;
  }

  async updateRecipe(recipeId, userId, payload) {
    const FoodItem = require('../models/food_item.model');

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new Error('Không tìm thấy món ăn');
    }

    // Check ownership if author exists
    if (recipe.author && recipe.author.user_id && userId) {
      if (recipe.author.user_id.toString() !== userId.toString()) {
        throw new Error('Bạn không có quyền chỉnh sửa công thức này');
      }
    }

    const {
      title,
      description,
      prep_time_min,
      cook_time_min,
      servings,
      is_private,
      cover_image_url,
      ingredients,
      steps,
    } = payload;

    if (title) recipe.title = title;
    if (description !== undefined) recipe.description = description;
    if (prep_time_min) recipe.prep_time_min = Number(prep_time_min);
    if (cook_time_min) recipe.cook_time_min = Number(cook_time_min);
    if (servings) recipe.servings = Number(servings);
    if (is_private !== undefined) recipe.is_private = Boolean(is_private);
    if (cover_image_url && !cover_image_url.startsWith('file://') && !cover_image_url.startsWith('blob:')) {
      recipe.cover_image_url = cover_image_url;
    }

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      recipe.ingredients = ingredients.map(ing => ({
        name: ing.name,
        amount: Number(ing.amount) || 1,
        unit: ing.unit || 'g',
        icon_url: ing.icon_url || '🥗',
      }));

      // Recalculate Nutrition Facts
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarb = 0;
      let totalFat = 0;
      let totalGL = 0;

      for (const ing of ingredients) {
        const amountGrams = Number(ing.amount) || 50;
        let foodDoc = null;

        if (ing.food_item_id && ing.food_item_id.match(/^[0-9a-fA-F]{24}$/)) {
          foodDoc = await FoodItem.findById(ing.food_item_id).lean();
        }

        if (!foodDoc && ing.name) {
          foodDoc = await FoodItem.findOne({
            $or: [
              { name: new RegExp(ing.name.trim(), 'i') },
              { aliases: new RegExp(ing.name.trim(), 'i') },
            ],
          }).lean();
        }

        if (foodDoc) {
          const ratio = amountGrams / 100;
          const ingCarb = (foodDoc.carb_per_100g || 0) * ratio;
          const ingGI = foodDoc.gi_index || foodDoc.gi || 55;

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

      const servingDivisor = Math.max(1, Number(recipe.servings) || 1);
      const calories = Math.round(totalCalories / servingDivisor);
      const protein_g = Number((totalProtein / servingDivisor).toFixed(1));
      const carb_g = Number((totalCarb / servingDivisor).toFixed(1));
      const fat_g = Number((totalFat / servingDivisor).toFixed(1));
      const glycemic_load = Math.max(1, Math.round(totalGL / servingDivisor));

      recipe.nutrition_facts = {
        ...(recipe.nutrition_facts || {}),
        calories: calories || 150,
        protein_g: protein_g || 10,
        carb_g: carb_g || 15,
        fat_g: fat_g || 5,
        glycemic_load: glycemic_load || 4,
        saturated_fat_g: Number((fat_g * 0.3).toFixed(1)),
        trans_fat_g: 0,
        unsaturated_fat_g: Number((fat_g * 0.7).toFixed(1)),
        fiber_g: Number((carb_g * 0.1).toFixed(1)),
        cholesterol_mg: Math.round(protein_g * 2.5),
        sodium_mg: Math.round(calories * 0.8),
      };
    }

    if (Array.isArray(steps) && steps.length > 0) {
      recipe.steps = steps.map((st, idx) => ({
        step_number: idx + 1,
        title: st.title || `Bước ${idx + 1}`,
        description: st.description || st,
      }));
    }

    await recipe.save();
    return recipe;
  }

  async deleteRecipe(recipeId, userId) {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new Error('Không tìm thấy món ăn');
    }

    // Check ownership if author exists
    if (recipe.author && recipe.author.user_id && userId) {
      if (recipe.author.user_id.toString() !== userId.toString()) {
        throw new Error('Bạn không có quyền xóa công thức này');
      }
    }

    await Recipe.findByIdAndDelete(recipeId);
    return { success: true, message: 'Đã xóa công thức thành công' };
  }

  async seedSampleRecipe() {
    let recipe = await Recipe.findOne({ title: 'Thịt nạc rim' });
    if (!recipe) {
      recipe = await Recipe.create(SAMPLE_THIT_NAC_RIM);
    }
    return recipe;
  }
}

module.exports = new RecipeService();
