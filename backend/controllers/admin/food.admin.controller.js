const adminFoodService = require('../../services/admin.food.service');

class FoodAdminController {
  async listFoods(req, res) {
    try {
      const { page, limit, search, category, is_verified } = req.query;
      const result = await adminFoodService.listFoods({ page, limit, search, category, is_verified });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách món ăn thành công.',
        data: result,
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách món ăn:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi lấy danh sách món ăn.',
      });
    }
  }

  async getFoodById(req, res) {
    try {
      const { id } = req.params;
      const food = await adminFoodService.getFoodById(id);

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết món ăn thành công.',
        data: { food },
      });
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết món ăn:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi lấy chi tiết món ăn.',
      });
    }
  }

  async createFood(req, res) {
    try {
      const adminId = req.user.id;
      const food = await adminFoodService.createFood(req.body, adminId);

      return res.status(201).json({
        success: true,
        message: 'Tạo món ăn mới thành công.',
        data: { food },
      });
    } catch (error) {
      console.error('Lỗi khi tạo món ăn:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi tạo món ăn.',
      });
    }
  }

  async updateFood(req, res) {
    try {
      const { id } = req.params;
      const updatedFood = await adminFoodService.updateFood(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật món ăn thành công.',
        data: { food: updatedFood },
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật món ăn:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi cập nhật món ăn.',
      });
    }
  }

  async deleteFood(req, res) {
    try {
      const { id } = req.params;
      const result = await adminFoodService.deleteFood(id);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Lỗi khi xóa món ăn:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi xóa món ăn.',
      });
    }
  }
}

module.exports = new FoodAdminController();
