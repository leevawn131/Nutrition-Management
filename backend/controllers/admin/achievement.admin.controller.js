const adminAchievementService = require("../../services/admin/admin.achievement.service");

class AchievementAdminController {
  async listAchievements(req, res) {
    try {
      const { page, limit, search, condition_type } = req.query;
      const result = await adminAchievementService.listAchievements({
        page,
        limit,
        search,
        condition_type,
      });

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách danh hiệu thành công",
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách danh hiệu:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi lấy danh sách danh hiệu",
      });
    }
  }

  async getAchievementById(req, res) {
    try {
      const { id } = req.params;
      const achievement = await adminAchievementService.getAchievementById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết danh hiệu thành công",
        data: { achievement },
      });
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết danh hiệu:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi lấy chi tiết danh hiệu",
      });
    }
  }

  async createAchievement(req, res) {
    try {
      const achievement = await adminAchievementService.createAchievement(req.body);

      return res.status(201).json({
        success: true,
        message: "Tạo danh hiệu mới thành công",
        data: { achievement },
      });
    } catch (error) {
      console.error("Lỗi khi tạo danh hiệu:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi tạo danh hiệu",
      });
    }
  }

  async updateAchievement(req, res) {
    try {
      const { id } = req.params;
      const achievement = await adminAchievementService.updateAchievement(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Cập nhật danh hiệu thành công",
        data: { achievement },
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật danh hiệu:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi cập nhật danh hiệu",
      });
    }
  }

  async deleteAchievement(req, res) {
    try {
      const { id } = req.params;
      const result = await adminAchievementService.deleteAchievement(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Lỗi khi xóa danh hiệu:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi xóa danh hiệu",
      });
    }
  }
}

module.exports = new AchievementAdminController();
