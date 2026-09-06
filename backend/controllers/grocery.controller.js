const groceryService = require('../services/grocery.service');

const addFromRecipe = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.body.user_id;
    const { recipe_id, servings, ingredients } = req.body;

    const items = await groceryService.addFromRecipe(userId, recipe_id, servings, ingredients);

    return res.json({
      success: true,
      message: `Đã thêm ${items.length} nguyên liệu vào danh sách mua sắm!`,
      data: items,
    });
  } catch (error) {
    console.error('Lỗi addFromRecipe:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Không thể thêm vào danh sách mua sắm',
    });
  }
};

module.exports = {
  addFromRecipe,
};
