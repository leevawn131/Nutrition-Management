const recipeService = require('../services/recipe.service');

/**
 * GET /api/recipes
 * Get recipes list with search & collections filtering
 */
const getRecipes = async (req, res) => {
  try {
    const { search, tab, limit, page } = req.query;
    const userId = req.user ? req.user.id : null;
    const result = await recipeService.getRecipes({ search, tab, userId, limit, page });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getRecipes:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công thức',
    });
  }
};

/**
 * GET /api/recipes/:id
 * Get single recipe details
 */
const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.getRecipeById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức',
      });
    }

    return res.status(200).json({
      success: true,
      data: { recipe },
    });
  } catch (error) {
    console.error('Error in getRecipeById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết công thức',
    });
  }
};

const User = require('../models/user.model');

const getEffectiveUserId = async (req) => {
  if (req.user && req.user.id) {
    const userExists = await User.findById(req.user.id).lean();
    if (userExists) {
      return req.user.id;
    }
  }
  const firstUser = await User.findOne({ role: 'user' }).lean();
  return firstUser ? firstUser._id.toString() : null;
};

/**
 * GET /api/recipes/collections/my
 * Get current user collections
 */
const getUserCollections = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    const collections = await recipeService.getUserCollections(userId);

    return res.status(200).json({
      success: true,
      data: { collections },
    });
  } catch (error) {
    console.error('Error in getUserCollections:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy bộ sưu tập',
    });
  }
};

/**
 * POST /api/recipes/:id/toggle-save
 * Toggle save recipe into user collection
 */
const toggleSaveRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { collectionName } = req.body;
    const userId = await getEffectiveUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy người dùng hợp lệ để lưu món ăn',
      });
    }

    const result = await recipeService.toggleSaveRecipe(userId, id, collectionName);

    return res.status(200).json({
      success: true,
      message: result.isSaved ? 'Đã lưu công thức vào bộ sưu tập' : 'Đã bỏ lưu công thức',
      data: result,
    });
  } catch (error) {
    console.error('Error in toggleSaveRecipe:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật bộ sưu tập',
    });
  }
};

/**
 * GET /api/recipes/:id/is-saved
 * Check if recipe is saved in user collection
 */
const checkRecipeSaved = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getEffectiveUserId(req);
    const isSaved = await recipeService.checkRecipeSaved(userId, id);

    return res.status(200).json({
      success: true,
      data: { isSaved },
    });
  } catch (error) {
    console.error('Error in checkRecipeSaved:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái lưu',
    });
  }
};

module.exports = {
  getRecipes,
  getRecipeById,
  getUserCollections,
  toggleSaveRecipe,
  checkRecipeSaved,
};
