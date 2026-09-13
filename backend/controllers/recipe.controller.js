const recipeService = require('../services/recipe.service');
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
      items: result.items,
    });
  } catch (error) {
    console.error('Error in getRecipes:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách công thức',
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
      data: recipe,
      recipe,
    });
  } catch (error) {
    console.error('Error in getRecipeById:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy chi tiết công thức',
    });
  }
};

/**
 * GET /api/recipes/collections/my or /collections
 */
const getUserCollections = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    const collections = await recipeService.getUserCollections(userId);

    return res.status(200).json({
      success: true,
      message: 'Lấy bộ sưu tập công thức thành công',
      data: collections,
      collections,
    });
  } catch (error) {
    console.error('Error in getUserCollections:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy bộ sưu tập',
    });
  }
};

/**
 * POST /api/recipes/:id/toggle-save or /save
 */
const toggleSaveRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { collectionName } = req.body || {};
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

/**
 * POST /api/recipes/:id/reviews
 */
const addRecipeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getEffectiveUserId(req);
    const { rating, comment, content, quick_tags, tags } = req.body || {};
    const finalComment = comment || content || '';
    const finalTags = quick_tags || tags || [];

    const recipe = await recipeService.addReview(id, userId, rating, finalComment, finalTags);

    return res.status(200).json({
      success: true,
      message: 'Đã gửi đánh giá thành công',
      data: recipe,
    });
  } catch (error) {
    console.error('Error in addRecipeReview:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Không thể gửi đánh giá',
    });
  }
};

/**
 * POST /api/recipes
 */
const createRecipe = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    const userName = req.user ? req.user.full_name || req.user.email : 'Người dùng';
    const userAvatar = req.user ? req.user.avatar_url : '';

    const newRecipe = await recipeService.createRecipe(userId, userName, userAvatar, req.body);

    return res.status(201).json({
      success: true,
      message: 'Tạo công thức món ăn thành công',
      data: newRecipe,
    });
  } catch (error) {
    console.error('Error in createRecipe:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo công thức món ăn',
    });
  }
};

/**
 * PUT /api/recipes/:id
 */
const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getEffectiveUserId(req);
    const updatedRecipe = await recipeService.updateRecipe(id, userId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật công thức thành công',
      data: updatedRecipe,
    });
  } catch (error) {
    console.error('Error in updateRecipe:', error.message);
    return res.status(error.message && error.message.includes('quyền') ? 403 : 500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật công thức món ăn',
    });
  }
};

/**
 * DELETE /api/recipes/:id
 */
const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getEffectiveUserId(req);
    const result = await recipeService.deleteRecipe(id, userId);

    return res.status(200).json({
      success: true,
      message: result.message || 'Đã xóa công thức món ăn',
    });
  } catch (error) {
    console.error('Error in deleteRecipe:', error.message);
    return res.status(error.message && error.message.includes('quyền') ? 403 : 500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa công thức món ăn',
    });
  }
};

module.exports = {
  getRecipes,
  getAllRecipes: getRecipes,
  getRecipeById,
  getUserCollections,
  toggleSaveRecipe,
  checkRecipeSaved,
  addRecipeReview,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
