const adminMealPlanTemplateService = require('../../services/admin.meal_plan_template.service');

class MealPlanTemplateAdminController {
  async listTemplates(req, res) {
    try {
      const { page, limit, search } = req.query;
      const result = await adminMealPlanTemplateService.listTemplates({ page, limit, search });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách thực đơn mẫu thành công.',
        data: result,
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thực đơn mẫu:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi lấy danh sách thực đơn mẫu.',
      });
    }
  }

  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await adminMealPlanTemplateService.getTemplateById(id);

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết thực đơn mẫu thành công.',
        data: { template },
      });
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết thực đơn mẫu:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi lấy chi tiết thực đơn mẫu.',
      });
    }
  }

  async createTemplate(req, res) {
    try {
      const adminId = req.user.id;
      const template = await adminMealPlanTemplateService.createTemplate(req.body, adminId);

      return res.status(201).json({
        success: true,
        message: 'Tạo thực đơn mẫu mới thành công.',
        data: { template },
      });
    } catch (error) {
      console.error('Lỗi khi tạo thực đơn mẫu:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi tạo thực đơn mẫu.',
      });
    }
  }

  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updatedTemplate = await adminMealPlanTemplateService.updateTemplate(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thực đơn mẫu thành công.',
        data: { template: updatedTemplate },
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật thực đơn mẫu:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi cập nhật thực đơn mẫu.',
      });
    }
  }

  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const result = await adminMealPlanTemplateService.deleteTemplate(id);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Lỗi khi xóa thực đơn mẫu:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi xóa thực đơn mẫu.',
      });
    }
  }
}

module.exports = new MealPlanTemplateAdminController();
