const adminRecipeService = require("../../services/admin.recipe.service");

class RecipeAdminController {
  async listRecipes(req, res) {
    try {
      const { page, limit, search, source_type, status } = req.query;
      const result = await adminRecipeService.listRecipes({
        page,
        limit,
        search,
        source_type,
        status,
      });

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách công thức thành công.",
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách công thức:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi lấy danh sách công thức.",
      });
    }
  }

  async getRecipeById(req, res) {
    try {
      const { id } = req.params;
      const recipe = await adminRecipeService.getRecipeById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết công thức thành công.",
        data: { recipe },
      });
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết công thức:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi lấy chi tiết công thức.",
      });
    }
  }

  async createRecipe(req, res) {
    try {
      const adminId = req.user.id;
      const recipe = await adminRecipeService.createRecipe(req.body, adminId);

      return res.status(201).json({
        success: true,
        message: "Tạo công thức món ăn mới thành công.",
        data: { recipe },
      });
    } catch (error) {
      console.error("Lỗi khi tạo công thức:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi tạo công thức.",
      });
    }
  }

  async updateRecipe(req, res) {
    try {
      const { id } = req.params;
      const updatedRecipe = await adminRecipeService.updateRecipe(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Cập nhật công thức món ăn thành công.",
        data: { recipe: updatedRecipe },
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật công thức:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi cập nhật công thức.",
      });
    }
  }

  async updateRecipeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Trường status là bắt buộc (approved hoặc rejected).",
        });
      }

      const updatedRecipe = await adminRecipeService.updateRecipeStatus(
        id,
        status,
      );

      return res.status(200).json({
        success: true,
        message: `Đã ${status === "approved" ? "phê duyệt" : "từ chối"} công thức thành công.`,
        data: { recipe: updatedRecipe },
      });
    } catch (error) {
      console.error("Lỗi khi duyệt công thức:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi duyệt công thức.",
      });
    }
  }

  async deleteRecipe(req, res) {
    try {
      const { id } = req.params;
      const result = await adminRecipeService.deleteRecipe(id);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Lỗi khi xóa công thức:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi xóa công thức.",
      });
    }
  }
}

module.exports = new RecipeAdminController();
