const adminReportService = require("../../services/admin.report.service");

class ReportAdminController {
  async getOverview(req, res) {
    try {
      const data = await adminReportService.getOverview();
      return res.status(200).json({
        success: true,
        message: "Lấy số liệu tổng quan hệ thống thành công.",
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo tổng quan:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi lấy báo cáo tổng quan.",
      });
    }
  }

  async getUserReports(req, res) {
    try {
      const { timeframe = "30d" } = req.query;
      const data = await adminReportService.getUserReports(timeframe);
      return res.status(200).json({
        success: true,
        message: "Lấy báo cáo phân tích người dùng thành công.",
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo người dùng:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi lấy báo cáo người dùng.",
      });
    }
  }

  async getFoodReports(req, res) {
    try {
      const data = await adminReportService.getFoodReports();
      return res.status(200).json({
        success: true,
        message: "Lấy báo cáo cơ sở dữ liệu thực phẩm thành công.",
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo thực phẩm:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi lấy báo cáo thực phẩm.",
      });
    }
  }

  async getRecipeReports(req, res) {
    try {
      const data = await adminReportService.getRecipeReports();
      return res.status(200).json({
        success: true,
        message: "Lấy báo cáo công thức & thực đơn mẫu thành công.",
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo công thức & thực đơn:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Lỗi hệ thống khi lấy báo cáo công thức & thực đơn.",
      });
    }
  }
}

module.exports = new ReportAdminController();
