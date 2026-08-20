const foodService = require('../services/food.service');

/**
 * GET /api/foods
 * Get food items / ingredients list with search & filtering
 */
const getFoodItems = async (req, res) => {
  try {
    const { search, category, limit, page } = req.query;
    const result = await foodService.getFoodItems({ search, category, limit, page });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getFoodItems:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thực phẩm/nguyên liệu',
    });
  }
};

/**
 * GET /api/foods/:id
 * Get single food item details
 */
const getFoodItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await foodService.getFoodItemById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thực phẩm/nguyên liệu',
      });
    }

    return res.status(200).json({
      success: true,
      data: { item },
    });
  } catch (error) {
    console.error('Error in getFoodItemById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết thực phẩm/nguyên liệu',
    });
  }
};

module.exports = {
  getFoodItems,
  getFoodItemById,
};
