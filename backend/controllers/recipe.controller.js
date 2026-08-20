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

/**
 * GET /api/recipes/collections/my
 * Get current user collections
 */
const getUserCollections = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
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

module.exports = {
  getRecipes,
  getRecipeById,
  getUserCollections,
};
