const recipeService = require('../services/recipe.service');

const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.getRecipeById(id);
    return res.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Lỗi getRecipeById:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Không thể lấy thông tin món ăn',
    });
  }
};

const getAllRecipes = async (req, res) => {
  try {
    const recipes = await recipeService.getAllRecipes();
    return res.json({
      success: true,
      data: recipes,
    });
  } catch (error) {
    console.error('Lỗi getAllRecipes:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi tải danh sách món ăn',
    });
  }
};

const addRecipeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const { rating, comment, content, quick_tags, tags } = req.body;
    const finalComment = comment || content || '';
    const finalTags = quick_tags || tags || [];

    const recipe = await recipeService.addReview(
      id,
      userId,
      rating,
      finalComment,
      finalTags
    );

    return res.json({
      success: true,
      message: 'Đã gửi đánh giá thành công',
      data: recipe,
    });
  } catch (error) {
    console.error('Lỗi addRecipeReview:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Không thể gửi đánh giá',
    });
  }
};

const createRecipe = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.full_name || req.user.email : 'Người dùng';
    const userAvatar = req.user ? req.user.avatar_url : '';

    const newRecipe = await recipeService.createRecipe(userId, userName, userAvatar, req.body);

    return res.status(201).json({
      success: true,
      message: 'Tạo công thức món ăn thành công',
      data: newRecipe,
    });
  } catch (error) {
    console.error('Lỗi createRecipe:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo công thức món ăn',
    });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const updatedRecipe = await recipeService.updateRecipe(id, userId, req.body);

    return res.json({
      success: true,
      message: 'Cập nhật công thức thành công',
      data: updatedRecipe,
    });
  } catch (error) {
    console.error('Lỗi updateRecipe:', error);
    return res.status(error.message.includes('quyền') ? 403 : 500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật công thức món ăn',
    });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const result = await recipeService.deleteRecipe(id, userId);

    return res.json({
      success: true,
      message: result.message || 'Đã xóa công thức món ăn',
    });
  } catch (error) {
    console.error('Lỗi deleteRecipe:', error);
    return res.status(error.message.includes('quyền') ? 403 : 500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa công thức món ăn',
    });
  }
};

module.exports = {
  getRecipeById,
  getAllRecipes,
  addRecipeReview,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
