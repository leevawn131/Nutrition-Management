const foodService = require('../services/food.service');

/**
 * Food Controller handling Food Catalog requests
 */
const foodController = {
  /**
   * GET /api/foods
   * Search food items with query & pagination
   */
  async getFoods(req, res) {
    try {
      const { q, query, category, page, limit } = req.query;
      const searchQuery = q || query || '';

      const result = await foodService.searchFoods({
        query: searchQuery,
        category,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách món ăn thành công',
        data: result.foods,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Lỗi controller getFoods:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi lấy danh sách món ăn',
      });
    }
  },

  /**
   * GET /api/foods/:id
   * Get detail of a specific food item
   */
  async getFoodById(req, res) {
    try {
      const { id } = req.params;
      const food = await foodService.getFoodById(id);

      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin chi tiết món ăn thành công',
        data: food,
      });
    } catch (error) {
      console.error('Lỗi controller getFoodById:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi lấy thông tin món ăn',
      });
    }
  },
};

// Aliases for develop branch compatibility
foodController.getFoodItems = foodController.getFoods;
foodController.getFoodItemById = foodController.getFoodById;

module.exports = foodController;
