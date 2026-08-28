const adminUnidentifiedFoodService = require("../../services/admin.unidentified_food.service");

class UnidentifiedFoodAdminController {
  async getUnidentifiedFoods(req, res) {
    try {
      const { status = "all", search = "", page = 1, limit = 10 } = req.query;
      const result = await adminUnidentifiedFoodService.listUnidentifiedFoods({
        status,
        search,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách món ăn chưa xác định thành công.",
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách món ăn chưa xác định:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          "Lỗi hệ thống khi lấy danh sách món ăn chưa xác định.",
      });
    }
  }

  async getUnidentifiedFoodById(req, res) {
    try {
      const { id } = req.params;
      const item =
        await adminUnidentifiedFoodService.getUnidentifiedFoodById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết món ăn chưa xác định thành công.",
        data: { item },
      });
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết món ăn chưa xác định:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          "Lỗi hệ thống khi lấy chi tiết món ăn chưa xác định.",
      });
    }
  }

  async resolveUnidentifiedFood(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { food_item_id, new_food } = req.body || {};

      const updatedItem =
        await adminUnidentifiedFoodService.resolveUnidentifiedFood(
          id,
          { food_item_id, new_food },
          adminId,
        );

      return res.status(200).json({
        success: true,
        message: "Chuẩn hóa món ăn chưa xác định thành công.",
        data: { item: updatedItem },
      });
    } catch (error) {
      console.error("Lỗi khi chuẩn hóa món ăn chưa xác định:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Lỗi hệ thống khi chuẩn hóa món ăn chưa xác định.",
      });
    }
  }

  async deleteUnidentifiedFood(req, res) {
    try {
      const { id } = req.params;
      const result =
        await adminUnidentifiedFoodService.deleteUnidentifiedFood(id);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Lỗi khi xóa bản ghi món ăn chưa xác định:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Lỗi hệ thống khi xóa bản ghi món ăn chưa xác định.",
      });
    }
  }
}

module.exports = new UnidentifiedFoodAdminController();
