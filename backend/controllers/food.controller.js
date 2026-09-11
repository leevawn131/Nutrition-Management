const foodService = require('../services/food.service');

/**
 * GET /api/foods
 * Get food items / ingredients list with search & filtering
 */
const getFoodItems = async (req, res) => {
  try {
    const { search, q, query, category, limit, page } = req.query;
    const result = await foodService.getFoodItems({
      search: search || q || query,
      category,
      limit,
      page,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách món ăn thành công',
      data: result.items,
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error in getFoodItems:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách thực phẩm/nguyên liệu',
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
      message: 'Lấy thông tin chi tiết món ăn thành công',
      data: item,
      item,
    });
  } catch (error) {
    console.error('Error in getFoodItemById:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy chi tiết thực phẩm/nguyên liệu',
    });
  }
};

module.exports = {
  getFoodItems,
  getFoodItemById,
  getFoods: getFoodItems,
  getFoodById: getFoodItemById,
};
