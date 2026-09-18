const adminActivityService = require("../../services/admin/admin.activity.service");

class ActivityAdminController {
  async listActivities(req, res) {
    try {
      const { page, limit, search, category } = req.query;
      const result = await adminActivityService.listActivities({
        page,
        limit,
        search,
        category,
      });

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách hoạt động thể chất thành công",
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách hoạt động:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi lấy danh sách hoạt động",
      });
    }
  }

  async getActivityById(req, res) {
    try {
      const { id } = req.params;
      const activity = await adminActivityService.getActivityById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết hoạt động thành công",
        data: { activity },
      });
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết hoạt động:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi lấy chi tiết hoạt động",
      });
    }
  }

  async createActivity(req, res) {
    try {
      const adminId = req.user.id;
      const activity = await adminActivityService.createActivity(req.body, adminId);

      return res.status(201).json({
        success: true,
        message: "Tạo hoạt động thể chất mới thành công",
        data: { activity },
      });
    } catch (error) {
      console.error("Lỗi khi tạo hoạt động:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi tạo hoạt động",
      });
    }
  }

  async updateActivity(req, res) {
    try {
      const { id } = req.params;
      const activity = await adminActivityService.updateActivity(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Cập nhật hoạt động thể chất thành công",
        data: { activity },
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật hoạt động:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi cập nhật hoạt động",
      });
    }
  }

  async deleteActivity(req, res) {
    try {
      const { id } = req.params;
      const result = await adminActivityService.deleteActivity(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Lỗi khi xóa hoạt động:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ khi xóa hoạt động",
      });
    }
  }
}

module.exports = new ActivityAdminController();
