const Recipe = require('../models/recipe.model');
const visionService = require('../services/vision.service');

/**
 * Xử lý tạo mới một recipe (món ăn của user)
 */
const createRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, 
      description, 
      image_base64, 
      prep_time_minutes, 
      cook_time_minutes, 
      is_public, 
      servings, 
      ingredients,
      steps 
    } = req.body;

    if (!title || !servings) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (title, servings)' });
    }

    // Nếu sau này có Cloudinary, sẽ upload image_base64 lên và lấy URL.
    // Hiện tại tạm thời lưu chuỗi base64 vào image_url (sẽ rất nặng cho DB nhưng tạm thời chấp nhận)
    // Thực tế có thể lưu URL ảnh tạm thời hoặc upload
    let imageUrl = image_base64 || null; 
    
    // Nếu image_base64 trống, có thể lấy image_url từ req.body
    if (!imageUrl && req.body.image_url) {
      imageUrl = req.body.image_url;
    }

    let finalIngredients = ingredients || [];
    let nutritionFacts = null;
    let caloriesPerServing = null;
    let proteinG = null;
    let carbG = null;
    let fatG = null;

    // Gọi AI để tự động tính toán dinh dưỡng nếu có nguyên liệu
    if (finalIngredients.length > 0) {
      try {
        const aiNutrition = await visionService.analyzeRecipeNutrition(finalIngredients, servings);
        nutritionFacts = aiNutrition; // Sẽ chứa cả total_nutrition_per_serving và ingredients_breakdown
        
        if (aiNutrition.total_nutrition_per_serving) {
          caloriesPerServing = aiNutrition.total_nutrition_per_serving.energy_kcal;
          proteinG = aiNutrition.total_nutrition_per_serving.protein_g;
          carbG = aiNutrition.total_nutrition_per_serving.carbohydrate_g;
          fatG = aiNutrition.total_nutrition_per_serving.fat_g;
        }
      } catch (aiError) {
        console.error('Không thể phân tích dinh dưỡng công thức bằng AI:', aiError);
        require('fs').appendFileSync('ai-error.log', new Date().toISOString() + ': ' + aiError.message + '\n' + aiError.stack + '\n');
        // Lỗi AI không chặn quá trình tạo recipe (Fallback)
      }
    }

    const newRecipe = new Recipe({
      title,
      description,
      image_url: imageUrl,
      prep_time_minutes: prep_time_minutes || null,
      cook_time_minutes: cook_time_minutes || null,
      servings,
      source_type: 'community',
      created_by_user_id: userId,
      status: is_public ? 'approved' : 'pending',
      ingredients: finalIngredients,
      steps: steps || [],
      calories_per_serving: caloriesPerServing,
      protein_g: proteinG,
      carb_g: carbG,
      fat_g: fatG,
      nutrition_facts: nutritionFacts
    });

    const savedRecipe = await newRecipe.save();

    res.status(201).json({
      message: 'Lưu công thức thành công',
      recipe: savedRecipe
    });

  } catch (error) {
    console.error('createRecipe error:', error);
    res.status(500).json({ error: 'Lỗi khi lưu công thức' });
  }
};

/**
 * Lấy danh sách công thức của user hiện tại
 */
const getMyRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipes = await Recipe.find({ created_by_user_id: userId }).sort({ created_at: -1 });
    
    res.status(200).json({
      success: true,
      count: recipes.length,
      recipes
    });
  } catch (error) {
    console.error('getMyRecipes error:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách công thức' });
  }
};

/**
 * Lấy chi tiết một công thức theo ID
 */
const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findById(id).populate('created_by_user_id', 'full_name avatar_url');
    
    if (!recipe) {
      return res.status(404).json({ error: 'Không tìm thấy công thức' });
    }

    res.status(200).json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('getRecipeById error:', error);
    res.status(500).json({ error: 'Lỗi khi tải chi tiết công thức' });
  }
};

/**
 * Lấy thông tin chi tiết của 1 nguyên liệu và các công thức gợi ý
 */
const getIngredientInfo = async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Thiếu tên nguyên liệu' });
    }

    // 1. Gọi AI để lấy thông tin chi tiết
    let aiDetail = null;
    try {
      aiDetail = await visionService.getIngredientDetail(name);
    } catch (error) {
      console.error('Lỗi khi gọi AI lấy chi tiết nguyên liệu:', error);
      // Fallback nếu AI lỗi
      aiDetail = {
        name: name,
        description: 'Không thể tải thông tin chi tiết lúc này.',
        nutrition_per_100g: {
          energy_kcal: 0,
          protein_g: 0,
          fat_g: 0,
          calcium_mg: 0,
          phosphorus_mg: 0,
          iron_mg: 0,
          vitamin_d_ug: 0
        }
      };
    }

    // 2. Tìm các công thức có chứa nguyên liệu này
    const relatedRecipes = await Recipe.find({
      'ingredients.ingredient_name': { $regex: name, $options: 'i' }
    }).limit(10).select('title image_url prep_time_minutes cook_time_minutes calories_per_serving');

    res.status(200).json({
      success: true,
      data: {
        ingredient: aiDetail,
        related_recipes: relatedRecipes
      }
    });

  } catch (error) {
    console.error('getIngredientInfo error:', error);
    res.status(500).json({ error: 'Lỗi khi tải thông tin nguyên liệu' });
  }
};

/**
 * Chỉnh sửa công thức (Yêu cầu phải là tác giả)
 */
const updateRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const { 
      title, 
      description, 
      image_base64, 
      prep_time_minutes, 
      cook_time_minutes, 
      is_public, 
      servings, 
      ingredients,
      steps 
    } = req.body;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Không tìm thấy công thức' });
    }

    if (recipe.created_by_user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa công thức này' });
    }

    // Cập nhật thông tin cơ bản
    recipe.title = title || recipe.title;
    recipe.description = description !== undefined ? description : recipe.description;
    recipe.prep_time_minutes = prep_time_minutes !== undefined ? prep_time_minutes : recipe.prep_time_minutes;
    recipe.cook_time_minutes = cook_time_minutes !== undefined ? cook_time_minutes : recipe.cook_time_minutes;
    
    if (is_public !== undefined) {
      recipe.status = is_public ? 'pending' : 'approved'; // Giả lập logic công khai/cá nhân
    }
    
    if (image_base64 && image_base64.startsWith('data:image')) {
      recipe.image_url = image_base64;
    }

    let shouldRecalculateNutrition = false;
    let finalIngredients = recipe.ingredients;

    if (ingredients && Array.isArray(ingredients)) {
      recipe.ingredients = ingredients;
      finalIngredients = ingredients;
      shouldRecalculateNutrition = true;
    }
    
    if (servings && servings !== recipe.servings) {
      recipe.servings = servings;
      shouldRecalculateNutrition = true;
    }

    if (steps && Array.isArray(steps)) {
      recipe.steps = steps;
    }

    // Gọi AI tính lại dinh dưỡng nếu nguyên liệu hoặc khẩu phần thay đổi
    if (shouldRecalculateNutrition && finalIngredients.length > 0) {
      try {
        const aiNutrition = await visionService.analyzeRecipeNutrition(finalIngredients, recipe.servings);
        recipe.nutrition_facts = aiNutrition;
        if (aiNutrition.total_nutrition_per_serving) {
          recipe.calories_per_serving = aiNutrition.total_nutrition_per_serving.energy_kcal;
          recipe.protein_g = aiNutrition.total_nutrition_per_serving.protein_g;
          recipe.carb_g = aiNutrition.total_nutrition_per_serving.carbohydrate_g;
          recipe.fat_g = aiNutrition.total_nutrition_per_serving.fat_g;
        }
      } catch (aiError) {
        console.error('Không thể cập nhật dinh dưỡng bằng AI:', aiError);
      }
    }

    await recipe.save();
    res.status(200).json({ success: true, message: 'Cập nhật công thức thành công', recipe });

  } catch (error) {
    console.error('Lỗi khi updateRecipe:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật công thức' });
  }
};

/**
 * Xóa công thức (Yêu cầu phải là tác giả)
 */
const deleteRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Không tìm thấy công thức' });
    }

    if (recipe.created_by_user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa công thức này' });
    }

    await Recipe.findByIdAndDelete(recipeId);
    res.status(200).json({ success: true, message: 'Đã xóa công thức thành công' });

  } catch (error) {
    console.error('Lỗi khi deleteRecipe:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa công thức' });
  }
};

module.exports = {
  createRecipe,
  getMyRecipes,
  getRecipeById,
  getIngredientInfo,
  updateRecipe,
  deleteRecipe
};
